import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertReactEmail, convertSource, htmlWords, mergeTagDesign, verifyConversion } from "../src/index";
import { replaceMarkers } from "../src/merge-tags";
import ts from "typescript";
import React from "react";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

async function templates(source: string) {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  const original = path.join(dir, "original.tsx");
  fs.writeFileSync(original, source);
  const { default: Original } = await import(original);
  const conversion = await convertSource(source, { fileName: original });
  const migrated = path.join(dir, "migrated.tsx");
  fs.writeFileSync(migrated, conversion.code);
  const { default: Migrated } = await import(migrated);
  return { Original, Migrated, conversion };
}

const imports = `import { Html, Body, Text, Button, Img } from "@react-email/components";`;

describe("lexical bindings", () => {
  it("keeps props, local variables and loop parameters that shadow module constants dynamic", async () => {
    const { Original, Migrated } = await templates(`${imports}
      const name = "Alex", url = "https://example.com/alex", item = "Alex", local = "Alex";
      export default function T({ name, url, items }: { name: string; url: string; items: string[] }) {
        const local = name;
        return <Html><Body><Text>Hello {name} {local}</Text>
          {items.map(item => <Text key={item}>{item}</Text>)}
          <Button href={url}>Profile</Button></Body></Html>;
      }
      T.PreviewProps = { name: "Alex", url: "https://example.com/alex", items: ["Alex"] };`);
    for (const props of [Original.PreviewProps, { name: "Jordan", url: "https://example.com/jordan", items: ["Sam", "Taylor"] }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect(check.missing).toEqual([]);
      expect(check.added).toEqual([]);
      expect(check.missingAttributes).toEqual([]);
      expect(check.designWarnings).toEqual([]);
    }
  });

  it("still evaluates unshadowed module style constants", async () => {
    const { conversion } = await templates(`${imports}
      const look = { color: "#123456" };
      export default function T() { return <Html><Body><Text style={look}>Hello</Text></Body></Html>; }`);
    expect(conversion.code).toContain('color="#123456"');
  });
});

describe("spread props", () => {
  it("keeps dynamic values in object literal spreads and their override order", async () => {
    const { Original, Migrated } = await templates(`${imports}
      const staticProps = { href: "https://example.com/static" };
      export default function T({ url }: { url: string }) {
        return <Html><Body><Button href="https://example.com/old" {...{ href: url }}>Profile</Button>
          <Button {...{ href: "https://example.com/old", ...{ href: url } }}>Nested</Button>
          <Button {...{ href: url }} href="https://example.com/last">Last</Button>
          <Button {...staticProps}>Static</Button><Button href={url}>Help</Button></Body></Html>;
      }
      T.PreviewProps = { url: "https://example.com/profile" };`);
    const check = await verifyConversion(Original, Migrated, { props: { url: "https://example.com/jordan" } });
    expect(check.missingAttributes).toEqual([]);
    const links = [...check.convertedHtml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    expect(links.map(([, attrs]) => /href="([^"]*)"/.exec(attrs)?.[1])).toEqual([
      "https://example.com/jordan", "https://example.com/jordan", "https://example.com/last",
      "https://example.com/static", "https://example.com/jordan",
    ]);
  });

  it("keeps an opaque spread as HTML, including children supplied as a prop", async () => {
    const { Original, Migrated, conversion } = await templates(`${imports}
      export default function T({ props }: { props: { href: string; children: string } }) {
        return <Html><Body><Button {...props}/></Body></Html>;
      }
      T.PreviewProps = { props: { href: "https://example.com/profile", children: "Profile" } };`);
    const check = await verifyConversion(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    expect(conversion.report.fallbacks).not.toEqual([]);
  });

  it("preserves inline links and columns with opaque spread props", async () => {
    const { Original, Migrated } = await templates(`${imports}
      import { Link, Row, Column } from "@react-email/components";
      export default function T({ link, cell }: { link: object; cell: object }) {
        return <Html><Body><Text>Open <Link {...link}>Profile</Link></Text>
          <Row><Column {...cell}/><Column><Text>Help</Text></Column></Row></Body></Html>;
      }
      T.PreviewProps = { link: { href: "https://example.com/profile" }, cell: { children: "Kept cell" } };`);
    const check = await verifyConversion(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
  });

  it("fails document spreads that cannot be kept in an HTML content block", async () => {
    await expect(convertSource(`${imports}
      export default function T({ props }: { props: object }) { return <Html><Body {...props}><Text>Hello</Text></Body></Html>; }`))
      .rejects.toThrow("Can't safely convert Body");
  });
});

describe("merge tags in HTML image sources", () => {
  it("keeps unsized and inline image URLs while still tagging text and links", async () => {
    const { Original } = await templates(`${imports}
      export default function T({ avatar, name, url }: { avatar: string; name: string; url: string }) {
        return <Html><Body><Img src={avatar} alt="Avatar"/>
          <Text>Hello {name} <Img src={avatar} alt="Inline avatar" width={20}/></Text>
          <Button href={url}>Profile</Button></Body></Html>;
      }
      T.PreviewProps = { avatar: "https://example.com/avatar.png?a=1&b=2", name: "Alex", url: "https://example.com/profile" };`);
    const result = await convertReactEmail(Original);
    expect(result.html()).toContain('src="https://example.com/avatar.png?a=1&amp;b=2"');
    expect(result.html()).not.toContain("{{avatar}}");
    expect(JSON.stringify(result.design())).not.toContain("{{avatar}}");
    expect(result.html()).toContain("Hello {{name}}");
    expect(result.html()).toContain('href="{{url}}"');
  });

  it("protects HTML source sets, background attributes and CSS URLs, with safe escaping", () => {
    const marker = "\uE000uNlAyEr0\uE001";
    const sample = 'https://example.com/image.png?a=1&label="A"';
    const output = { html: `<img srcset="${marker} 1x, ${marker} 2x"><table background='${marker}' style="background-image:url('${marker}')">${marker}</table><a href="${marker}">Link</a>` };
    const html = replaceMarkers(output, [{ path: "asset", value: sample }], () => "{{asset}}").html;
    expect(html).toContain('srcset="https://example.com/image.png?a=1&amp;label=&quot;A&quot; 1x');
    expect(html).toContain("background-image:url('https://example.com/image.png?a=1&amp;label=&quot;A&quot;')");
    expect(html).toContain(">{{asset}}</table>");
    expect(html).toContain('href="{{asset}}"');
  });
});

describe("buttons", () => {
  const html = async (Template: any) => {
    const { renderToHtml } = await import("@unlayer/react-elements");
    const React = (await import("react")).default;
    return renderToHtml(React.createElement(Template, Template.PreviewProps ?? {}));
  };

  it.each([
    ["named Button", `import { Button } from "./button";`],
    ["imported as Button", `import { BrandButton as Button } from "./button";`],
  ])("keeps a project's own button (%s) with its styles, as it isn't React Email's", async (_, importLine) => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    dirs.push(dir);
    const button = `import * as React from "react";
import { Button as EmailButton } from "@react-email/components";
export function Button(props: { href: string; children: React.ReactNode }) {
  return <EmailButton {...props} style={{ backgroundColor: "#5b21b6", color: "#ffffff", padding: "12px 20px" }} />;
}
export const BrandButton = Button;`;
    fs.writeFileSync(path.join(dir, "button.tsx"), button);
    const source = `import { Html, Body, Text } from "@react-email/components";
${importLine}
export default function T({ url }: { url: string }) {
  return <Html><Body><Text>Your order shipped.</Text><Button href={url}>Track your order</Button></Body></Html>;
}
T.PreviewProps = { url: "https://example.com/track" };`;
    const original = path.join(dir, "original.tsx");
    fs.writeFileSync(original, source);
    const { default: Original } = await import(original);
    const conversion = await convertSource(source, { fileName: original });
    const migrated = path.join(dir, "migrated.tsx");
    fs.writeFileSync(migrated, conversion.code);
    const { default: Migrated } = await import(migrated);
    const out = await html(Migrated);
    expect(out).toContain("background-color:#5b21b6");
    expect(out).toContain("Track your order");
    // The link the original renders, with its colors (not a transparent, link-blue Elements button).
    expect(out).toMatch(/<a[^>]*background-color:#5b21b6[^>]*>(?:(?!<\/a>)[\s\S])*Track your order/);
    expect((await verifyConversion(Original, Migrated, { props: Original.PreviewProps })).missing).toEqual([]);
  });

  it("keeps an uppercase button's text-transform, in both converters", async () => {
    const source = `${imports}
      export default function T() {
        return <Html><Body><Button href="https://example.com" style={{ textTransform: "uppercase", fontStyle: "italic", backgroundColor: "#000000", color: "#ffffff", padding: "12px 20px" }}>Track it</Button></Body></Html>;
      }`;
    const { Original, Migrated } = await templates(source);
    for (const out of [await html(Migrated), (await convertReactEmail(Original)).html()]) {
      expect(out).toMatch(/<span style="text-transform:uppercase;font-style:italic">Track it<\/span>/);
    }
  });
});

describe("links in text", () => {
  const html = async (Template: any, props: Record<string, unknown> = Template.PreviewProps ?? {}) => {
    const { renderToHtml } = await import("@unlayer/react-elements");
    return renderToHtml(Template(props));
  };

  it("keep a plain <a>'s target (none), while React Email's Link opens in a new tab", async () => {
    const { Original, Migrated } = await templates(`${imports}
      import { Link } from "@react-email/components";
      export default function T() {
        return <Html><Body><Text>Read <a href="https://example.com/a">the guide</a> or <Link href="https://example.com/b">the docs</Link> or <a href="https://example.com/c" target="_self">here</a>.</Text></Body></Html>;
      }`);
    const out = await html(Migrated);
    expect(out).toContain('<a href="https://example.com/a">the guide</a>');
    expect(out).toMatch(/<a href="https:\/\/example\.com\/b"[^>]*target="_blank"/);
    expect(out).toMatch(/<a href="https:\/\/example\.com\/c"[^>]*target="_self"/);
    expect((await verifyConversion(Original, Migrated)).styles).toEqual([]);
  });

  it("leave out an href whose URL prop is missing, as React does (not href=\"undefined\")", async () => {
    const { Original, Migrated } = await templates(`${imports}
      export default function T({ url, label }: { url?: string; label: string }) {
        return <Html><Body><Text>Go <a href={url}>{label}</a></Text></Body></Html>;
      }
      T.PreviewProps = { url: "https://example.com", label: "there" };`);
    expect(await html(Migrated, { label: "there" })).not.toContain('href="undefined"');
    expect(await html(Migrated, { label: "there" })).toMatch(/<a\s[^>]*>there<\/a>|<a>there<\/a>/);
    expect(await html(Migrated)).toContain('href="https://example.com"');
    expect((await verifyConversion(Original, Migrated, { props: { label: "there" } })).missingAttributes).toEqual([]);
  });
});

describe("styles the check now compares", () => {
  /** Both conversions of a template, each with the check's style differences. */
  const both = async (source: string) => {
    const { Original, Migrated } = await templates(source);
    const codemod = await verifyConversion(Original, Migrated);
    const runtime = await convertReactEmail(Original, { mergeTags: false });
    const { compareText } = await import("@unlayer/convert-core");
    const { render } = await import("@react-email/components");
    const React = (await import("react")).default;
    const runtimeCheck = compareText(await render(React.createElement(Original, Original.PreviewProps ?? {})), runtime.html());
    return { codemod, runtime: runtimeCheck };
  };

  it("keeps a box with a background or border inside a column of several as HTML, so it still shows", async () => {
    const { codemod, runtime } = await both(`import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
      export default function T() {
        return <Html><Body><Section><Row>
          <Column style={{ width: "50%" }}><Text>Left</Text><Section style={{ backgroundColor: "#fff4c8", padding: "20px", border: "1px solid #f4d247" }}><Text>Panel copy</Text></Section></Column>
          <Column style={{ width: "50%" }}><Text>Right</Text></Column>
        </Row></Section></Body></Html>;
      }`);
    for (const check of [codemod, runtime]) {
      expect(check.missing).toEqual([]);
      expect(check.styles).toEqual([]);
    }
  });

  it("gives a list the size around it (the browser's 16px), not Text's 14px", async () => {
    const { codemod, runtime } = await both(`import { Html, Body, Text } from "@react-email/components";
      export default function T() {
        return <Html><Body><Text>Steps:</Text><ul><li>Deploy your first project</li><li>Invite your team</li></ul></Body></Html>;
      }`);
    for (const check of [codemod, runtime]) expect(check.styles).toEqual([]);
  });

  it("keeps markup in a button's label (a bold word) in runtime mode too", async () => {
    const { codemod, runtime } = await both(`import { Html, Body, Button } from "@react-email/components";
      export default function T() {
        return <Html><Body><Button href="https://example.com" style={{ backgroundColor: "#2138c6", color: "#ffffff", padding: "12px" }}><strong>Learn More</strong></Button></Body></Html>;
      }`);
    for (const check of [codemod, runtime]) expect(check.styles).toEqual([]);
  });
});

describe("text styles from what's around", () => {
  /** The check's differences for both conversions of a template, with its preview props and each boolean flipped. */
  const differences = async (source: string) => {
    const { Original, Migrated } = await templates(source);
    const codemod = await verifyConversion(Original, Migrated);
    const runtime = await convertReactEmail(Original, { mergeTags: false });
    const { compareText } = await import("@unlayer/convert-core");
    const { render } = await import("@react-email/components");
    const React = (await import("react")).default;
    const runtimeCheck = compareText(await render(React.createElement(Original, Original.PreviewProps ?? {})), runtime.html());
    return {
      codemod: [...codemod.missing, ...codemod.added, ...codemod.styles.map((s) => `${s.property}: ${s.original} → ${s.converted}`), ...codemod.variants.map((v) => `${v.change}: ${[...v.missing, ...v.added].join(" ")}${v.error ?? ""}`)],
      runtime: [...runtimeCheck.missing, ...runtimeCheck.added, ...runtimeCheck.styles.map((s) => `${s.property}: ${s.original} → ${s.converted}`)],
      code: (await convertSource(source, { fileName: "t.tsx" })).code,
    };
  };

  it("keeps italics and letter case a container sets on the text and buttons in it", async () => {
    const result = await differences(`import { Html, Body, Section, Text, Button } from "@react-email/components";
      export default function T() {
        return <Html><Body><Section style={{ fontStyle: "italic", textTransform: "uppercase" }}><Text>Hello world</Text><Button href="https://example.com" style={{ backgroundColor: "#000000", color: "#ffffff", padding: "12px" }}>Buy now</Button></Section></Body></Html>;
      }`);
    expect([result.codemod, result.runtime]).toEqual([[], []]);
  });

  it("keeps a heading bold when the body sets a normal weight", async () => {
    const result = await differences(`import { Html, Body, Heading, Text } from "@react-email/components";
      export default function T() { return <Html><Body style={{ fontWeight: 400 }}><Heading>Reset your password</Heading><Text>Body copy</Text></Body></Html>; }`);
    expect([result.codemod, result.runtime]).toEqual([[], []]);
  });

  it("works out em and % sizes against the size around them, and a container's em width against its own size", async () => {
    const result = await differences(`import { Html, Body, Section, Heading, Text, Container } from "@react-email/components";
      export default function T() {
        return <Html><Body style={{ fontSize: "20px" }}><Section style={{ fontSize: "2em" }}><Heading>Big</Heading><Text style={{ fontSize: "75%" }}>Small</Text></Section></Body></Html>;
      }`);
    expect([result.codemod, result.runtime]).toEqual([[], []]);
    const container = await differences(`import { Html, Body, Container, Text } from "@react-email/components";
      export default function T() { return <Html><Body style={{ fontSize: "14px" }}><Container><Text>Hi</Text></Container></Body></Html>; }`);
    expect(container.code).toContain('contentWidth="525px"');
  });

  it("reads !important lengths (an inline style, Tailwind's !p-6) instead of dropping them", async () => {
    for (const source of [
      `import { Html, Body, Section, Text } from "@react-email/components";
      export default function T() { return <Html><Body><Section style={{ padding: "24px !important" }}><Text style={{ marginTop: "40px !important" }}>Spaced</Text></Section></Body></Html>; }`,
      `import { Html, Body, Section, Text, Tailwind } from "@react-email/components";
      export default function T() { return <Tailwind><Html><Body><Section className="!p-6"><Text className="!mt-10">Spaced</Text></Section></Body></Html></Tailwind>; }`,
    ]) {
      // The section's 24px on every side, and the text's 40px above it.
      expect((await convertSource(source, { fileName: "t.tsx" })).code).toContain('<Column padding="64px 24px 40px 24px">');
    }
  });

  it("keeps hidden text hidden: the hidden attribute (from props too) and a box that clips to nothing", async () => {
    const result = await differences(`import { Html, Body, Section, Text } from "@react-email/components";
      export default function T({ hideInternal }: { hideInternal: boolean }) {
        return <Html><Body><Text>Visible</Text><Text hidden={hideInternal}>Internal note</Text><Text hidden>Always hidden</Text>
          <Section style={{ maxHeight: 0, overflow: "hidden" }}><Text>Phones only</Text></Section></Body></Html>;
      }
      T.PreviewProps = { hideInternal: true };`);
    expect([result.codemod, result.runtime]).toEqual([[], []]);
  });
});

describe("images, links and backgrounds", () => {
  /** The migrated template's HTML and both converters' check differences. */
  const convert = async (source: string) => {
    const { Original, Migrated } = await templates(source);
    const codemod = await verifyConversion(Original, Migrated);
    const runtime = await convertReactEmail(Original, { mergeTags: false });
    const { compareText } = await import("@unlayer/convert-core");
    const { render } = await import("@react-email/components");
    const React = (await import("react")).default;
    const original = await render(React.createElement(Original, Original.PreviewProps ?? {}));
    const runtimeCheck = compareText(original, runtime.html());
    const issues = (c: { missing: string[]; added: string[]; missingAttributes: string[]; styles: Array<{ property: string; original: string; converted: string }> }) =>
      [...c.missing, ...c.added, ...c.missingAttributes, ...c.styles.map((s) => `${s.property}: ${s.original} → ${s.converted}`)];
    return { html: [codemod.convertedHtml, runtime.html()], issues: [issues(codemod), issues(runtimeCheck)] };
  };

  it("keeps an image with a border as HTML (Elements images have none)", async () => {
    const result = await convert(`import { Html, Body, Img, Text } from "@react-email/components";
      export default function T() { return <Html><Body><Text>Logo</Text><Img src="https://example.com/x.png" width={100} alt="Buy" style={{ border: "10px solid red" }} /></Body></Html>; }`);
    for (const html of result.html) expect(html).toMatch(/<img[^>]*border:\s*10px solid red/i);
    expect(result.issues).toEqual([[], []]);
  });

  it("gives a CSS width priority over the width attribute, and keeps a percent width", async () => {
    const result = await convert(`import { Html, Body, Img, Text } from "@react-email/components";
      export default function T() { return <Html><Body><Text>Images</Text><Img src="https://example.com/a.png" width="600" style={{ width: 120 }} alt="Small" /><Img src="https://example.com/b.png" width="50%" alt="Half" /></Body></Html>; }`);
    for (const html of result.html) {
      expect(html).toMatch(/<img[^>]*src="https:\/\/example\.com\/a\.png"[^>]*max-width: 120px/);
      expect(html).not.toMatch(/<img[^>]*src="https:\/\/example\.com\/b\.png"[^>]*max-width: 600px/);
    }
  });

  it("keeps a link's target on a linked image and on a button whose URL comes from props", async () => {
    const result = await convert(`import { Html, Body, Img, Button, Link, Text } from "@react-email/components";
      export default function T({ url }: { url: string }) {
        return <Html><Body><Text>Links</Text>
          <a href="https://example.com/self" target="_self"><Img src="https://example.com/a.png" width={100} alt="Self" /></a>
          <Link href="https://example.com/new"><Img src="https://example.com/b.png" width={100} alt="New tab" /></Link>
          <Button href={url} target="_self" style={{ backgroundColor: "#000000", color: "#ffffff", padding: "12px" }}>Open</Button></Body></Html>;
      }
      T.PreviewProps = { url: "https://example.com/button" };`);
    for (const html of result.html) {
      expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com\/self"[^>]*target="_self"/);
      expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com\/new"[^>]*target="_blank"/);
      expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com\/button"[^>]*target="_self"/);
    }
    expect(result.issues).toEqual([[], []]);
  });

  it("keeps a translucent background behind text (white text on 80% black stays readable)", async () => {
    const result = await convert(`import { Html, Body, Section, Text } from "@react-email/components";
      export default function T() { return <Html><Body><Section style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "24px" }}><Text style={{ color: "#ffffff" }}>Banner copy</Text></Section></Body></Html>; }`);
    expect(result.issues).toEqual([[], []]);
  });

  it("reads the color, repeat and position of a background shorthand", async () => {
    const source = `import { Html, Body, Section, Text } from "@react-email/components";
      export default function T() { return <Html><Body><Section style={{ background: "#f4f4f4 url(https://example.com/bg.png) no-repeat center", padding: "24px" }}><Text>Over the image</Text></Section></Body></Html>; }`;
    const code = (await convertSource(source, { fileName: "t.tsx" })).code;
    expect(code).toContain('"#f4f4f4"');
    expect(code).toMatch(/repeat: "no-repeat"/);
    expect(code).toMatch(/position: "center"/);
  });
});

describe("classes and head styles", () => {
  it("keeps a class list a condition picks, also against no class, and fails the check for one it can't follow", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Text, Tailwind } from "@react-email/components";
export default function T({ plan, vip }: { plan: string; vip: boolean }) {
  return <Html><Tailwind><Body>
    <Text className={plan === "pro" ? "font-bold text-red-600 uppercase" : undefined}>Your plan</Text>
    <Text className={vip && "font-bold"}>Vip</Text>
    <Text className={(true) ? undefined : "mb-9"}>Plain</Text>
  </Body></Tailwind></Html>;
}
T.PreviewProps = { plan: "free", vip: false };`);
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    expect(conversion.code).toContain('plan === "pro" ?');
    for (const props of [{ plan: "pro", vip: true }, { plan: "free", vip: false }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect(check.styles).toEqual([]);
    }
    const lookup = await templates(`import { Html, Body, Text, Tailwind } from "@react-email/components";
const tones: Record<string, string> = { info: "text-blue-600", danger: "text-red-600 font-bold" };
export default function T({ level }: { level: string }) { return <Html><Tailwind><Body><Text className={tones[level]}>Alert text</Text></Body></Tailwind></Html>; }
T.PreviewProps = { level: "unknown" };`);
    expect(lookup.conversion.report.lostStyles).toEqual(["line 3: className={tones[level]}"]);
  });

  /** Both converters' check issues for a template (styles included), with its preview props and each boolean flipped. */
  const issues = async (source: string, props?: Record<string, unknown>) => {
    const { Original, Migrated, conversion } = await templates(source);
    const codemod = await verifyConversion(Original, Migrated, props ? { props } : {});
    const runtime = await convertReactEmail(Original, { mergeTags: false, ...(props ? { props } : {}) });
    const { compareText } = await import("@unlayer/convert-core");
    const { render } = await import("@react-email/components");
    const React = (await import("react")).default;
    const runtimeCheck = compareText(await render(React.createElement(Original, props ?? Original.PreviewProps ?? {})), runtime.html());
    const list = (c: { missing: string[]; added: string[]; styles?: Array<{ property: string; original: string; converted: string }> }) => [...c.missing, ...c.added, ...(c.styles ?? []).map((s) => `${s.property}: ${s.original} → ${s.converted}`)];
    return { codemod: [...list(codemod), ...codemod.variants.flatMap((v) => list(v).map((i) => `${v.change}: ${i}`)), ...(conversion.report.lostStyles ?? [])], runtime: list(runtimeCheck), code: conversion.code };
  };
  const head = (css: string, body: string, extra = "") => `import { Html, Head, Body, Text, Section, Row, Column } from "@react-email/components";
    ${extra}
    export default function T() { return <Html><Head><style>{${JSON.stringify(css)}}</style></Head><Body>${body}</Body></Html>; }`;

  it("merges class rules in stylesheet order, not the class attribute's", async () => {
    const result = await issues(head(".muted{color:#888888} .alert{color:#e11d48} .hide{display:none} .show{display:block}", '<Text className="alert muted">Alert</Text><Text className="show hide">Shown</Text>'));
    expect([result.codemod, result.runtime]).toEqual([[], []]);
  });

  it("reads each class rule in a phone media query, whatever else the block holds, and stacks columns a head class stacks", async () => {
    const result = await issues(head("@media (max-width: 600px){ u + .body .gmail{color:red} .big{font-size:24px !important} .stack{display:block !important;width:100% !important} }",
      '<Section><Row><Column className="stack"><Text className="big">Left</Text></Column><Column className="stack"><Text>Right</Text></Column></Row></Section>'));
    expect(result.code).toMatch(/mobile=\{\{[^}]*fontSize: "24px"/);
    expect(result.code).not.toContain("noStackMobile");
  });

  it("keeps one return's head styles off another's elements", async () => {
    const source = `import { Html, Head, Body, Text } from "@react-email/components";
      export default function T({ alert }: { alert: boolean }) {
        if (alert) return <Html><Head><style>{".status{color:#ff0000;font-size:40px}"}</style></Head><Body><Text className="status">Account status</Text></Body></Html>;
        return <Html><Body><Text className="status">Account status</Text></Body></Html>;
      }
      T.PreviewProps = { alert: true };`;
    expect((await issues(source)).codemod).toEqual([]);
    expect((await issues(source, { alert: false })).codemod).toEqual([]);
  });

  it("refuses a head <style> it can't keep: CSS from code, or under a condition", async () => {
    await expect(convertSource(`import { Html, Head, Body, Text } from "@react-email/components";
      export default function T({ css }: { css: string }) { return <Html><Head><style>{css}</style></Head><Body><Text>Hi</Text></Body></Html>; }`, { fileName: "t.tsx" })).rejects.toThrow(/whose CSS comes from code/);
    await expect(convertSource(`import { Html, Head, Body, Text } from "@react-email/components";
      export default function T({ alert }: { alert: boolean }) { return <Html><Head>{alert && <style>{".a{color:red}"}</style>}</Head><Body><Text className="a">Hi</Text></Body></Html>; }`, { fileName: "t.tsx" })).rejects.toThrow(/under a condition/);
  });

  it("resolves a class list spread onto an element, and a class-list call's fixed classes (its picked ones are reported)", async () => {
    const tw = (body: string, extra = "") => `import { Html, Body, Text, Tailwind } from "@react-email/components";
      ${extra}
      export default function T({ active }: { active?: boolean }) { return <Tailwind><Html><Body>${body}</Body></Html></Tailwind>; }`;
    const spread = await issues(tw("<Text {...shared}>Spread</Text>", `const shared = { className: "text-red-600 font-bold text-2xl" };`));
    expect([spread.codemod, spread.runtime]).toEqual([[], []]);
    const fixed = await issues(tw('<Text className={cx("text-red-600", "font-bold")}>Fixed</Text>', `const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(" ");`));
    expect([fixed.codemod, fixed.runtime]).toEqual([[], []]);
    const picked = await issues(tw('<Text className={cx("text-red-600", active && "font-bold")}>Picked</Text>', `const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(" ");`));
    expect(picked.codemod.join("\n")).toMatch(/cx\("text-red-600", active && "font-bold"\)/);
  });

  it("refuses a Tailwind config built from props, and follows a change made through another name", async () => {
    await expect(convertSource(`import { Html, Body, Text, Tailwind } from "@react-email/components";
      export default function T({ brand }: { brand: string }) { return <Tailwind config={{ theme: { extend: { colors: { brand } } } }}><Html><Body><Text className="text-brand">Hi</Text></Body></Html></Tailwind>; }`, { fileName: "t.tsx" })).rejects.toThrow(/config built from props/);
    // A config written out in the component (with an imported preset) is fixed: it converts.
    await expect(convertSource(`import { Html, Body, Text, Tailwind, pixelBasedPreset } from "@react-email/components";
      export default function T() { return <Tailwind config={{ presets: [pixelBasedPreset], theme: { extend: { colors: { brand: "#2250f4" }, spacing: { 20: "20px" } } } }}><Html><Body><Text className="text-brand">Hi</Text></Body></Html></Tailwind>; }`, { fileName: "t.tsx" })).resolves.toBeTruthy();
    const result = await issues(`import { Html, Body, Text } from "@react-email/components";
      const style = { color: "#ff0000" };
      const alias = style;
      alias.color = "#0000ff";
      export default function T() { return <Html><Body><Text style={style}>Blue</Text></Body></Html>; }`);
    // The style isn't written in as its first value (red): it's reported, so the check fails.
    expect(result.codemod.join("\n")).toMatch(/line \d+: style=\{style\}/);
  });
});

describe("text props with markup", () => {
  const original = `${imports}
    export default function T({ user, items }: { user: { city: string }; items: Array<{ name: string }> }) {
      return <Html><Body><Text>From {user.city}</Text>{items.map((item) => <Text key={item.name}>{item.name}</Text>)}</Body></Html>;
    }
    T.PreviewProps = { user: { city: "Paris" }, items: [{ name: "Tea" }] };`;

  /** The original, and a migrated template written by hand (`body` renders the props). */
  async function pair(body: string) {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, "original.tsx"), original);
    fs.writeFileSync(path.join(dir, "migrated.tsx"), `import { Email, Row, Column, Html, Paragraph } from "@unlayer/react-elements";
export default function T({ user, items }: { user: { city: string }; items: Array<{ name: string }> }) {
  return <Email><Row><Column>${body}</Column></Row></Email>;
}`);
    const { default: Original } = await import(path.join(dir, "original.tsx"));
    const { default: Migrated } = await import(path.join(dir, "migrated.tsx"));
    return verifyConversion(Original, Migrated);
  }

  it("go into strings nested in objects and arrays: one written into HTML as is fails", async () => {
    const raw = await pair('<Html html={`<p>From ${user.city}</p>${items.map((item) => `<p>${item.name}</p>`).join("")}`} />');
    expect([raw.missing, raw.added]).toEqual([[], []]);
    expect(raw.variants).toEqual([expect.objectContaining({ change: "text props with markup" })]);
    // Shown as text, they pass.
    const text = await pair("<Paragraph>From {user.city}</Paragraph>{items.map((item) => <Paragraph key={item.name}>{item.name}</Paragraph>)}");
    expect([text.missing, text.added, text.variants]).toEqual([[], [], []]);
  });
});

describe("template shapes the codemod keeps or refuses", () => {
  it("keeps a column's width when it's shown under a condition next to others: the row's cells follow the condition", async () => {
    const { Migrated, conversion } = await templates(`import { Html, Body, Container, Section, Row, Column, Img, Text } from "@react-email/components";
export default function Card({ image, name = "Ada" }: { image?: string; name?: string }) {
  return <Html><Body><Container><Section><Row>
    {image && <Column style={{ width: "120px" }}><Img src={image} width="100" height="100" alt="" /></Column>}
    <Column><Text>Hello {name}, your order shipped.</Text></Column>
  </Row></Section></Container></Body></Html>;
}
Card.PreviewProps = { image: "https://example.com/a.png", name: "Ada" };`);
    expect(conversion.code).toMatch(/cells=\{image \? \[120, 480\] : \[600\]\}/);
    const { renderToJson } = await import("@unlayer/react-elements");
    const cells = (props: Record<string, unknown>) => (renderToJson(React.createElement(Migrated, props)) as any).body.rows[0].cells;
    const shown = cells({ image: "https://example.com/a.png" });
    expect(shown.length).toBe(2);
    expect(shown[0] / (shown[0] + shown[1])).toBeCloseTo(0.2);
    expect(cells({}).length).toBe(1);
    // Two columns under conditions: the widths aren't worked out, and the report says so.
    const two = await templates(`import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
export default function T({ a, b }: { a?: boolean; b?: boolean }) {
  return <Html><Body><Section><Row>
    {a && <Column style={{ width: "120px" }}><Text>A</Text></Column>}
    {b && <Column style={{ width: "120px" }}><Text>B</Text></Column>}
    <Column><Text>Always</Text></Column>
  </Row></Section></Body></Html>;
}
T.PreviewProps = { a: true, b: true };`);
    expect(two.conversion.report.notes).toContainEqual({ reason: "column widths dropped for a generated column list" });
  });

  const check = async (source: string, props?: Record<string, unknown>) => {
    const { Original, Migrated, conversion } = await templates(source);
    const result = await verifyConversion(Original, Migrated, props ? { props } : {});
    return { result, code: conversion.code, report: conversion.report, Migrated };
  };
  const clean = (r: Awaited<ReturnType<typeof check>>) => [...r.result.missing, ...r.result.added, ...r.result.missingAttributes, ...r.result.styles.map((s) => s.property), ...r.result.variants.map((v) => v.change), ...(r.report.lostStyles ?? [])];

  it("renders a component it can't convert inside text (an i18n <Trans>) instead of writing it as a tag", async () => {
    const r = await check(`import { Html, Body, Text, Button } from "@react-email/components";
      import { useState } from "react";
      function Trans({ children }: { children: string }) { const [text] = useState(children); return <>{text}</>; }
      export default function T() { return <Html><Body><Text>Hello! <Trans>Click below</Trans></Text><Button href="https://example.com"><Trans>Get started</Trans></Button></Body></Html>; }`);
    expect(r.result.convertedHtml).not.toMatch(/&lt;Trans|<Trans/);
    expect(clean(r)).toEqual([]);
  });

  it("refuses <Html> inside a component of the template's own (a provider would be dropped)", async () => {
    await expect(convertSource(`import { Html, Body, Text } from "@react-email/components";
      import { createContext } from "react";
      const Theme = createContext("#e11d48");
      export default function T() { return <Theme.Provider value="#e11d48"><Html><Body><Text>Hi</Text></Body></Html></Theme.Provider>; }`, { fileName: "t.tsx" })).rejects.toThrow(/inside <Theme\.Provider>/);
  });

  it("keeps a template's own text that looks like its internal markers (§13), entities in attributes, and ${ in a fixed URL", async () => {
    const r = await check(`import { Html, Body, Text, Button, Img } from "@react-email/components";
      export default function T({ legalRef, name }: { legalRef: string; name: string }) {
        return <Html><Body>{legalRef === "§13" ? <Text>Legal copy</Text> : <Text>Other copy</Text>}
          <Text>Hi {name}, <a href="https://example.com/?id=\${name}">open</a></Text>
          <Button href="https://example.com/?a=1&amp;b=2">Buy</Button>
          <Img src="https://example.com/x.png" width={100} alt="Tom &amp; Jerry" /></Body></Html>;
      }
      T.PreviewProps = { legalRef: "§13", name: "Ana" };`);
    expect(r.code).toContain('"§13"');
    expect(clean(r)).toEqual([]);
    const design = JSON.stringify(r.result.design);
    expect(design).toContain("https://example.com/?a=1&b=2");
    expect(design).toContain("Tom & Jerry");
    expect(design).not.toContain("&amp;");
    expect(r.result.convertedHtml).toContain("?id=${name}");
  });

  it("asks Google Fonts for a keyword weight as a number (bold is 700)", async () => {
    const r = await check(`import { Html, Head, Body, Text, Font } from "@react-email/components";
      export default function T() { return <Html><Head><Font fontFamily="Roboto" fallbackFontFamily="Arial" webFont={{ url: "https://fonts.gstatic.com/s/roboto/v27/x.woff2", format: "woff2" }} fontWeight="bold" fontStyle="normal" /></Head><Body><Text>Hi</Text></Body></Html>; }`);
    expect(r.code).toContain("wght@700");
    expect(r.code).not.toContain("wght@bold");
  });

  it("keeps an empty fragment return as nothing, not an empty email, and reports a heading margin from props", async () => {
    const empty = await check(`import { Html, Body, Text } from "@react-email/components";
      export default function T({ show }: { show: boolean }) { if (!show) return <></>; return <Html><Body><Text>Shown</Text></Body></Html>; }
      T.PreviewProps = { show: true };`);
    expect(clean(empty)).toEqual([]);
    expect(empty.Migrated({ show: false }).type).toBe((await import("react")).default.Fragment);
    const margin = await check(`import { Html, Body, Heading } from "@react-email/components";
      export default function T({ margin }: { margin: number }) { return <Html><Body><Heading m={margin}>Title</Heading></Body></Html>; }
      T.PreviewProps = { margin: 40 };`);
    expect((margin.report.lostStyles ?? []).join("\n")).toMatch(/m=\{margin\}/);
  });

  it("keeps JSX from a prop (`{banner}`) as it renders, and a component that walks its children one by one", async () => {
    const banner = await check(`import * as React from "react";
      import { Html, Body, Text, Section } from "@react-email/components";
      export default function T({ banner }: { banner: React.ReactElement }) { return <Html><Body>{banner}<Text>After</Text></Body></Html>; }
      T.PreviewProps = { banner: <Section style={{ backgroundColor: "#fef3c7", padding: "16px" }}><Text>Sale ends soon</Text></Section> };`);
    expect(clean(banner)).toEqual([]);
    expect(banner.code).not.toMatch(/<Paragraph[^>]*>\s*\{banner\}/);
    const columns = await check(`import * as React from "react";
      import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
      function Cols({ children }: { children: React.ReactNode }) { return <Row>{React.Children.map(children, (child) => <Column style={{ width: "50%" }}>{child}</Column>)}</Row>; }
      export default function T() { return <Html><Body><Section><Cols><Text>Left</Text><Text>Right</Text></Cols></Section></Body></Html>; }`);
    expect(clean(columns)).toEqual([]);
    // Not inlined with its children as one fragment (which made one column): the two stay side by side.
    expect((columns.result.convertedHtml.match(/>Left</g) ?? []).length).toBe(1);
    expect(columns.result.convertedHtml).toMatch(/Left[\s\S]*<\/td>[\s\S]*<td[\s\S]*Right/);
  });
});

describe("types an inlined component needs", () => {
  it("come along: an imported type, a type declared in its module, and an exported one", async () => {
    const files: Record<string, string> = {
      "/project/emails/types.ts": `export type Tone = "info" | "warn";\nexport interface Labels { info: string; warn: string }`,
      "/project/emails/badge.tsx": `import { Text } from "@react-email/components";
import type { Tone } from "./types";
type Size = "s" | "m";
const LABELS: Record<Tone, string> = { info: "Note", warn: "Careful" };
const SIZES: Record<Size, number> = { s: 12, m: 14 };
export function Badge({ tone }: { tone: Tone }) { return <Text style={{ fontSize: SIZES.m }}>{LABELS[tone]}</Text>; }`,
    };
    const loadModule = (specifier: string, from: string) => {
      const target = path.posix.join(path.posix.dirname(from), `${specifier.replace(/^\.\//, "")}`);
      for (const candidate of [target, `${target}.tsx`, `${target}.ts`]) if (files[candidate]) return { fileName: candidate, source: files[candidate] };
      return undefined;
    };
    const { code } = await convertSource(`import { Html, Body } from "@react-email/components";
import { Badge } from "./badge";
export default function Welcome() { return <Html><Body><Badge tone="info" /></Body></Html>; }`, { fileName: "/project/emails/welcome.tsx", loadModule });
    // Everything the copied constants name is declared or imported, so the migrated file type-checks.
    expect(code).toMatch(/import type \{ Tone \} from "\.\/types"/);
    expect(code).toMatch(/type Size = "s" \| "m"/);
    const program = ts.createProgram(["/project/emails/welcome.tsx"], { noEmit: true, jsx: ts.JsxEmit.ReactJSX, strict: true, noResolve: true, types: [] }, {
      ...ts.createCompilerHost({}),
      getSourceFile: (name, version) => (name === "/project/emails/welcome.tsx" ? ts.createSourceFile(name, code, version, true, ts.ScriptKind.TSX) : undefined),
      fileExists: (name) => name === "/project/emails/welcome.tsx",
    });
    const unknownNames = ts.getPreEmitDiagnostics(program).filter((d) => d.code === 2304).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    expect(unknownNames.filter((m) => /Tone|Size/.test(m))).toEqual([]);
  });
});

describe("merge tags", () => {
  it("only stand for props the template shows as given, not ones it cuts, splits or capitalizes", async () => {
    const { Original, Migrated } = await templates(`import { Html, Body, Text } from "@react-email/components";
      export default function T({ name, fullName, title, city }: { name: string; fullName: string; title: string; city: string }) {
        return <Html><Body>
          <Text>Hello {name.charAt(0).toUpperCase() + name.slice(1)}</Text>
          <Text>Hi {fullName.split(" ")[0]}</Text>
          <Text>Re: {title.slice(0, 40)}</Text>
          <Text>From {city}</Text>
        </Body></Html>;
      }
      T.PreviewProps = { name: "Alex", fullName: "Jordan", title: "Your order", city: "Lisbon" };`);
    const check = await verifyConversion(Original, Migrated);
    const tagged = await mergeTagDesign(Migrated, Original.PreviewProps, check.design);
    expect(tagged.used).toEqual(["city"]);
    const design = JSON.stringify(tagged.design);
    expect(design).toContain("{{city}}");
    for (const path of ["name", "fullName", "title"]) expect(design).not.toContain(`{{${path}}}`);
    // The runtime converter's design too.
    const runtime = JSON.stringify((await convertReactEmail(Original)).design());
    expect(runtime).toContain("{{city}}");
    for (const path of ["name", "fullName", "title"]) expect(runtime).not.toContain(`{{${path}}}`);
  });
});

describe("names the template already uses", () => {
  it("doesn't inline a component whose prop default reads a name the template uses for something else", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Text } from "@react-email/components";
const seats = 5;
const Note = ({ n = seats }: { n?: number }) => <Text>Every plan includes {n} free seats</Text>;
export default function T({ seats }: { seats: number }) {
  return <Html><Body><Text>You bought {seats} seats</Text><Note /></Body></Html>;
}
T.PreviewProps = { seats: 5 };`);
    expect(conversion.code).not.toContain("includes {seats}");
    const check = await verifyConversion(Original, Migrated, { props: { seats: 20 } });
    expect([check.missing, check.added]).toEqual([[], []]);
  });

  it("don't clash with the helpers and Elements components the migration adds", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Text, Link } from "@react-email/components";
      function escapeHtml(text: string) { return text; }
      function htmlText(text: string) { return text; }
      export default function T({ name, url, Paragraph = "unused" }: { name: string; url?: string; Paragraph?: string }) {
        const Button = escapeHtml(htmlText(name));
        return <Html><Body><Text>Hi {Button}, <Link href={url}>open</Link> {name}</Text></Body></Html>;
      }
      T.PreviewProps = { name: "Ana", url: "https://example.com" };`);
    expect(conversion.code).toMatch(/function _escapeHtml\(/);
    expect(conversion.code).toMatch(/Paragraph as UnlayerParagraph/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.styles, check.variants]).toEqual([[], [], [], []]);
  });

  it("keep a JSX constant from being written where a loop or catch variable of the same name would capture it", async () => {
    const { Original, Migrated } = await templates(`import { Html, Body, Section, Text } from "@react-email/components";
      export default function T({ items }: { items: string[] }) {
        const item = "Total";
        const label = <Text>{item}</Text>;
        const rows = [];
        for (const item of items) rows.push(<Section key={item}><Text>{item}</Text>{label}</Section>);
        try { JSON.parse("{"); } catch (item) { rows.push(<Section key="error">{label}</Section>); }
        return <Html><Body>{rows}{label}</Body></Html>;
      }
      T.PreviewProps = { items: ["One", "Two"] };`);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
  });
});

describe("backgrounds, text only screen readers get, and widths", () => {
  const head = `import { Html, Body, Container, Section, Heading, Text, Button } from "@react-email/components";`;
  const styles = (check: { styles: Array<{ property: string; original: string; converted: string }> }) => check.styles.map((d) => `${d.property}: ${d.original} → ${d.converted}`);

  it("fills a gradient section and a gradient button with their first color, so white text stays on it, in both modes", async () => {
    const { Original, Migrated, conversion } = await templates(`${head}
export default function T() {
  return <Html><Body style={{ backgroundColor: "#ffffff" }}><Container>
    <Section style={{ background: "linear-gradient(135deg,#1e3a8a,#312e81)", padding: "40px" }}><Heading style={{ color: "#fff" }}>Welcome aboard</Heading></Section>
    <Button href="https://example.com" style={{ background: "linear-gradient(#be123c,#9f1239)", color: "#fff", padding: "12px 20px" }}>Start now</Button>
  </Container></Body></Html>;
}`);
    expect(conversion.code).toContain("#1e3a8a");
    expect(conversion.code).toMatch(/<Button[^>]*backgroundColor="#be123c"/);
    expect(conversion.report.notes).toContainEqual({ reason: "style not converted", detail: "background gradient (filled with #1e3a8a) (Section)" });
    expect(styles(await verifyConversion(Original, Migrated))).toEqual([]);
    const runtime = await convertReactEmail(Original);
    expect(runtime.report.styleDifferences).toEqual([]);
    expect(runtime.html()).toContain("#1e3a8a");
  });

  it("fails the check when the image behind light text is lost with no color under it; passes when its color is kept", async () => {
    const page = (background: string) => `${head}
export default function T() { return <Html><Body style={{ ${background}, color: "#ffffff" }}><Container><Text>Night mode newsletter</Text></Container></Body></Html>; }`;
    const bare = await templates(page(`backgroundImage: "url(https://example.com/night.jpg)"`));
    expect(styles(await verifyConversion(bare.Original, bare.Migrated))).toEqual(["background: an image → #ffffff"]);
    expect((await convertReactEmail(bare.Original)).report.styleDifferences?.map((d) => d.original)).toEqual(["an image"]);
    const kept = await templates(page(`background: "#0b1020 url(https://example.com/night.jpg) repeat"`));
    expect(styles(await verifyConversion(kept.Original, kept.Migrated))).toEqual([]);
    expect(kept.conversion.report.notes).toContainEqual({ reason: "style not converted", detail: "background image (Body, its color #0b1020 shows)" });
  });

  it("writes only colors the browser reads: none, initial and a background shorthand's keywords aren't colors", async () => {
    const { conversion } = await templates(`${head}
export default function T() {
  return <Html><Body style={{ backgroundColor: "#111111" }}><Container>
    <Section style={{ background: "none", padding: "8px" }}><Text style={{ color: "#ffffff" }}>None</Text></Section>
    <Section style={{ backgroundColor: "initial", padding: "8px" }}><Text style={{ color: "#ffffff" }}>Initial</Text></Section>
    <Section style={{ background: "url(https://example.com/a.jpg) no-repeat center / cover #0b1f3a", padding: "8px" }}><Text style={{ color: "#ffffff", backgroundColor: "nonsense" }}>Shorthand</Text></Section>
  </Container></Body></Html>;
}`);
    expect(conversion.code).not.toMatch(/(?:olor|Color)="(none|initial|no|nonsense)"/);
    expect(conversion.code).toContain("#0b1f3a");
  });

  it("puts the page on <Html>'s background when the Body sets none, in both modes", async () => {
    const { Original, Migrated, conversion } = await templates(`${head}
export default function T() { return <Html style={{ backgroundColor: "#111111" }}><Body><Container><Text style={{ color: "#ffffff" }}>Dark html background</Text></Container></Body></Html>; }`);
    expect(conversion.code).toContain('backgroundColor="#111111"');
    expect(styles(await verifyConversion(Original, Migrated))).toEqual([]);
    expect((await convertReactEmail(Original)).design().body.values.backgroundColor).toBe("#111111");
  });

  it("keeps text only screen readers get hidden (sr-only, placed off the page), in both modes", async () => {
    const { Original, Migrated, conversion } = await templates(`${head}
export default function T() { return <Html><Body><Container>
  <Text>Visible line</Text>
  <Text style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Screen reader note</Text>
  <Text style={{ position: "absolute", left: "-9999px" }}>Offscreen filler</Text>
</Container></Body></Html>; }`);
    expect(conversion.code).not.toMatch(/<Paragraph[^>]*>\s*(Screen reader note|Offscreen filler)/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
    expect(htmlWords(check.convertedHtml)).toEqual(["Visible", "line"]);
    // Still in the HTML, for screen readers.
    expect(check.convertedHtml).toContain("Screen reader note");
    const runtime = (await convertReactEmail(Original)).html();
    expect(htmlWords(runtime)).toEqual(["Visible", "line"]);
    expect(runtime).toContain("Screen reader note");
  });

  it("says when a Container's width can't be kept (an email's content width is in px), in both modes", async () => {
    const source = `${head}
export default function T() { return <Html><Body><Container style={{ maxWidth: "100%" }}><Text>Wide</Text></Container></Body></Html>; }`;
    const { Original, conversion } = await templates(source);
    const note = { reason: "style not converted", detail: "Container width 100% (the email's content is 600px wide)" };
    expect(conversion.report.notes).toContainEqual(note);
    expect((await convertReactEmail(Original)).report.notes).toContainEqual(note);
    // 100% wide up to a width in px: that width, kept.
    const capped = await templates(`${head}
export default function T() { return <Html><Body><Container style={{ width: "100%", maxWidth: "640px" }}><Text>Wide</Text></Container></Body></Html>; }`);
    expect(capped.conversion.report.notes.filter((n) => String(n.detail).startsWith("Container width"))).toEqual([]);
  });
});

describe("style values from props", () => {
  it("can't add markup through the span that keeps a text style (runtime mode)", async () => {
    const { Original } = await templates(`import { Html, Body, Text } from "@react-email/components";
export default function T({ look = "uppercase" }: { look?: string }) { return <Html><Body><Text style={{ textTransform: look as any }}>Hello there</Text></Body></Html>; }
T.PreviewProps = { look: 'uppercase"><img src=x onerror=alert(1)>' };`);
    const conversion = await convertReactEmail(Original);
    expect(conversion.html()).not.toMatch(/<img[^>]*onerror/);
    expect(JSON.stringify(conversion.design())).not.toContain("onerror");
    const safe = await convertReactEmail(Original, { props: { look: "uppercase" } });
    expect(safe.html()).toContain("text-transform:uppercase");
  });
});

describe("props typed to hold JSX", () => {
  it("keeps a link passed in a ReactNode prop whose preview is text: rendered as React renders it", async () => {
    const { Migrated, conversion } = await templates(`import type { ReactNode } from "react";
import { Html, Body, Text } from "@react-email/components";
export default function T({ message }: { message: ReactNode }) { return <Html><Body><Text>{message}, soon.</Text></Body></Html>; }
T.PreviewProps = { message: "Track it here" };`);
    expect(conversion.code).toContain("htmlText(message)");
    const { renderToHtml } = await import("@unlayer/react-elements");
    const withLink = renderToHtml(React.createElement(Migrated, { message: React.createElement(React.Fragment, null, "Track it ", React.createElement("a", { href: "https://example.com/track" }, "here")) }));
    expect(withLink).toContain('<a href="https://example.com/track">here</a>');
    expect(renderToHtml(React.createElement(Migrated, { message: "Tom & <b>Jerry</b>" }))).toContain("Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;");
  });
});

describe("blocks an align attribute places", () => {
  it("centers a block link with a width of its own under <Column align=\"center\">, in both modes, and the check finds nothing moved", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Section, Row, Column, Link, Text } from "@react-email/components";
export default function T() {
  return <Html><Body><Section style={{ width: "600px" }}>
    <Row><Column><Text>Your order shipped</Text></Column></Row>
    <Row><Column align="center"><Link href="https://example.com" style={{ display: "block", width: "220px", textAlign: "center", padding: "10px 0", border: "1px solid #929292" }}>Order Status</Link></Column></Row>
  </Section></Body></Html>;
}`);
    expect(conversion.code).toMatch(/width:220px;[^"]*margin-left:auto;margin-right:auto/);
    const check = await verifyConversion(Original, Migrated);
    expect(check.layout).toEqual([]);
    const runtime = (await convertReactEmail(Original)).html();
    expect(runtime).toMatch(/width:220px;[^"]*margin-left:auto;margin-right:auto/);
  });
});

describe("raw HTML in runtime mode", () => {
  it("keeps what dangerouslySetInnerHTML gives a Text or a Heading", async () => {
    const { Original } = await templates(`import { Html, Body, Text, Heading } from "@react-email/components";
export default function T() { return <Html><Body><Text dangerouslySetInnerHTML={{ __html: "Raw <b>bold</b> copy" }} /><Heading dangerouslySetInnerHTML={{ __html: "Raw heading" }} /><Text>Plain</Text></Body></Html>; }`);
    const conversion = await convertReactEmail(Original);
    expect(conversion.report.missingText).toEqual([]);
    expect(conversion.html()).toContain("Raw <b>bold</b> copy");
  });
});

describe("two Tailwind configs", () => {
  it("refuse a template whose returns use different configs, and keep one used twice", async () => {
    const two = `import { Html, Body, Text, Tailwind } from "@react-email/components";
const brand = { theme: { extend: { colors: { brand: "#e11d48" } } } };
const other = { theme: { extend: { colors: { brand: "#2563eb" } } } };
export default function T({ alt }: { alt: boolean }) {
  if (alt) return <Html><Tailwind config={other}><Body><Text className="text-brand">Hi</Text></Body></Tailwind></Html>;
  return <Html><Tailwind config={brand}><Body><Text className="text-brand">Hi</Text></Body></Tailwind></Html>;
}`;
    await expect(convertSource(two)).rejects.toThrow(/different <Tailwind> configs/);
    await expect(convertSource(two.replace("config={other}", "config={brand}"))).resolves.toBeTruthy();
  });
});

describe("direction and alignment the migration can't keep", () => {
  it("reports a block's own dir, and fails the check for a column's align from props", async () => {
    const { Original, conversion } = await templates(`import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
export default function T({ side = "right" }: { side?: "left" | "right" }) { return <Html><Body>
  <Text dir="rtl">שלום עולם</Text>
  <Section><Row><Column align={side}><Text>Total</Text></Column></Row></Section>
</Body></Html>; }`);
    expect(conversion.report.notes).toContainEqual({ reason: "attribute not kept", detail: "dir (Text)" });
    expect(conversion.report.lostStyles).toEqual([expect.stringContaining("align={side}")]);
    expect((await convertReactEmail(Original)).report.notes).toContainEqual({ reason: "attribute not kept", detail: "dir (Text)" });
  });
});

describe("images placed by auto margins", () => {
  it("puts an image with only a left auto margin on the right, and one with only a right auto margin on the left, in both modes", async () => {
    const { Original, conversion } = await templates(`import { Html, Body, Img } from "@react-email/components";
export default function T() { return <Html><Body>
  <Img src="https://example.com/right.png" width="100" height="40" alt="Right" style={{ marginLeft: "auto", marginRight: 0 }} />
  <Img src="https://example.com/left.png" width="100" height="40" alt="Left" style={{ margin: "0 auto 0 0" }} />
  <Img src="https://example.com/center.png" width="100" height="40" alt="Center" style={{ margin: "0 auto" }} />
</Body></Html>; }`);
    const aligns = (code: string) => [...code.matchAll(/example\.com\/(\w+)\.png[\s\S]*?textAlign="(\w+)"/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(aligns(conversion.code)).toEqual(["right:right", "left:left", "center:center"]);
    const design = (await convertReactEmail(Original)).design();
    const images = design.body.rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents)).filter((c: any) => c.type === "image");
    expect(images.map((i: any) => i.values.textAlign)).toEqual(["right", "left", "center"]);
  });
});

describe("link targets from props", () => {
  it("keep a Button's and a linked image's target from props, and their default when it's left out", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Section, Button, Link, Img, Text } from "@react-email/components";
export default function T({ url = "https://example.com", target }: { url?: string; target?: string }) {
  return <Html><Body>
    <Button href={url} target={target} style={{ backgroundColor: "#111111", color: "#ffffff", padding: "12px 20px" }}>Open</Button>
    <Section><Link href={url} target={target}><Img src="https://example.com/a.png" width="100" height="40" alt="Linked" /></Link></Section>
    <Section><a href={url} target={target}><Img src="https://example.com/b.png" width="100" height="40" alt="Plain" /></a></Section>
    <Text>Read <Link href={url} target={target}>more</Link></Text>
  </Body></Html>;
}
T.PreviewProps = { url: "https://example.com", target: "_self" };`);
    expect(conversion.code).toContain('target: target ?? "_blank"');
    expect(conversion.code).toContain('target: target ?? "_self"');
    expect(conversion.code).toContain('htmlAttribute("target", target ?? "_blank")');
    const { renderToHtml } = await import("@unlayer/react-elements");
    const targets = (props: Record<string, unknown>) => [...renderToHtml(React.createElement(Migrated, props)).matchAll(/<a\b[^>]*target="([^"]*)"/g)].map((m) => m[1]);
    expect(targets({ target: "_self" })).toEqual(["_self", "_self", "_self", "_self"]);
    expect(targets({})).toEqual(["_blank", "_blank", "_self", "_blank"]);
    for (const target of ["_self", undefined]) {
      const check = await verifyConversion(Original, Migrated, { props: { url: "https://example.com", target } });
      expect(check.styles).toEqual([]);
    }
  });
});

describe("a flipped prop and the whole check", () => {
  it("fails a migration whose columns stack only when a boolean prop is flipped", async () => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, "original.tsx"), `import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
export default function T({ compact = false }: { compact?: boolean }) {
  return <Html><Body><Section style={{ width: "600px" }}><Row>
    <Column style={{ width: "300px" }}><Text>{compact ? "Short" : "Left"} column words</Text></Column>
    <Column style={{ width: "300px" }}><Text>Right column words</Text></Column>
  </Row></Section></Body></Html>;
}
T.PreviewProps = { compact: false };`);
    fs.writeFileSync(path.join(dir, "migrated.tsx"), `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
export default function T({ compact = false }: { compact?: boolean }) {
  if (compact) return <Email><Row><Column><Paragraph>Short column words</Paragraph></Column></Row><Row><Column><Paragraph>Right column words</Paragraph></Column></Row></Email>;
  return <Email><Row cells={[1, 1]}><Column><Paragraph>Left column words</Paragraph></Column><Column><Paragraph>Right column words</Paragraph></Column></Row></Email>;
}`);
    const { default: Original } = await import(path.join(dir, "original.tsx"));
    const { default: Migrated } = await import(path.join(dir, "migrated.tsx"));
    const check = await verifyConversion(Original, Migrated);
    expect(check.layout).toEqual([]);
    expect(check.variants).toEqual([expect.objectContaining({ change: "compact: true", layout: [expect.objectContaining({ items: ["Right", "column", "words"] })] })]);
  });
});

describe("an align attribute under a CSS text-align", () => {
  it("leaves blocks where the CSS puts them, in both modes", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Section, Row, Column, Img, Button, Text } from "@react-email/components";
export default function T() { return <Html><Body><Section style={{ width: "600px" }}><Row><Column align="center" style={{ textAlign: "left" }}>
  <Text>Your order is on its way to you</Text>
  <Img src="https://example.com/logo.png" width="100" height="40" alt="Logo" />
  <Button href="https://example.com/track" style={{ display: "block", width: "200px", backgroundColor: "#111111", color: "#ffffff", padding: "12px 0" }}>Track package</Button>
</Column></Row></Section></Body></Html>; }`);
    expect(conversion.code).not.toMatch(/textAlign="center"/);
    const check = await verifyConversion(Original, Migrated);
    expect(check.layout).toEqual([]);
    const design = (await convertReactEmail(Original)).design();
    const contents = design.body.rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents));
    expect(contents.filter((c: any) => c.type === "image" || c.type === "button").map((c: any) => c.values.textAlign)).not.toContain("center");
  });
});

describe("what preview props don't reach", () => {
  it("keeps a JSX constant shown under a condition, with its links, for the values the preview doesn't use", async () => {
    const { Migrated, conversion } = await templates(`import { Html, Body, Section, Text, Link, Heading } from "@react-email/components";
const legalFooter = (
  <Section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
    <Text style={{ fontSize: "12px", color: "#6b7280" }}>Acme Inc. · 1 Main St.</Text>
    <Link href="https://acme.com/unsubscribe" style={{ fontSize: "12px" }}>Unsubscribe</Link>
  </Section>
);
export default function Receipt({ name, channel }: { name: string; channel: "transactional" | "marketing" }) {
  return <Html><Body><Heading>Thanks, {name}</Heading><Text>Your order is confirmed.</Text>{channel === "marketing" && legalFooter}</Body></Html>;
}
Receipt.PreviewProps = { name: "Alex", channel: "transactional" } as const;`);
    const { renderToHtml } = await import("@unlayer/react-elements");
    expect(renderToHtml(Migrated({ name: "Bo", channel: "marketing" }))).toContain('href="https://acme.com/unsubscribe"');
    expect(renderToHtml(Migrated({ name: "Bo", channel: "transactional" }))).not.toContain("unsubscribe");
    expect(conversion.code).not.toMatch(/<Paragraph[^>]*>\s*\{channel === "marketing" && legalFooter\}/);
  });

  it("fails the check for a class list held in a value or returned by a helper that reads props", async () => {
    const { conversion } = await templates(`import { Html, Body, Section, Text, Tailwind } from "@react-email/components";
type Status = "shipped" | "delayed";
const noticeClass = (status: Status) => (status === "delayed" ? "bg-amber-100 font-semibold" : "");
export default function OrderStatus({ status, eta }: { status: Status; eta: string }) {
  const etaClass = status === "delayed" ? "text-red-600 font-bold" : "";
  return <Html><Tailwind><Body><Section className={noticeClass(status)}><Text>Current status: {status}</Text></Section><Text className={etaClass}>Estimated delivery: {eta}</Text></Body></Tailwind></Html>;
}
OrderStatus.PreviewProps = { status: "shipped", eta: "May 3" } as const;`);
    expect(conversion.report.lostStyles).toEqual([expect.stringContaining("noticeClass(status)"), expect.stringContaining("etaClass")]);
  });
});

describe("text set inline, and a <Font> on every element", () => {
  it("keeps pills a loop makes on one line, as the original shows them", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
export default function T({ places }: { places: string[] }) {
  return <Html><Body><Section style={{ width: "600px" }}><Row><Column align="center">
    {places.map((place) => <Text key={place} style={{ display: "inline-block", margin: "4px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#10b981", color: "#ffffff" }}>{place}</Text>)}
  </Column></Row></Section></Body></Html>;
}
T.PreviewProps = { places: ["United States", "United Kingdom", "Germany"] };`);
    expect(conversion.code).not.toMatch(/places\.map\([^]*?<Row/);
    const check = await verifyConversion(Original, Migrated);
    expect(check.styles).toEqual([]);
    expect(check.layout).toEqual([]);
  });

  it("gives a <Font>'s family to links in text that sets another, as its rule on every element does", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Head, Font, Body, Text, Link } from "@react-email/components";
export default function T() {
  return <Html><Head><Font fontFamily="Inter" fallbackFontFamily="Arial" /></Head><Body style={{ fontFamily: "Arial" }}>
    <Text style={{ fontFamily: "Arial" }}>Visit our <Link href="https://example.com/help">Help Center</Link> any time.</Text>
  </Body></Html>;
}`);
    expect(conversion.code).toMatch(/Help Center/);
    const check = await verifyConversion(Original, Migrated);
    expect(check.styles).toEqual([]);
  });
});

describe("several <Font>s", () => {
  it("give every element the last one's family, as their rules do", async () => {
    const { Original, Migrated, conversion } = await templates(`import { Html, Head, Font, Body, Text, Link } from "@react-email/components";
export default function T() {
  return <Html><Head><Font fontFamily="Georgia" fallbackFontFamily="serif" /><Font fontFamily="Verdana" fallbackFontFamily="sans-serif" /></Head><Body>
    <Text>Plain words in the body copy, long enough to wrap if the font were another one entirely.</Text>
    <Text>Visit our <Link href="https://example.com/help">Help Center</Link> any time.</Text>
  </Body></Html>;
}`);
    expect(conversion.code).toMatch(/fontFamily=\{\{ label: "Verdana"/);
    expect(conversion.code).not.toMatch(/Georgia/);
    const check = await verifyConversion(Original, Migrated);
    expect(check.styles).toEqual([]);
  });
});
