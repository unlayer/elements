import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertReactEmail, convertSource, verifyConversion } from "../src/index";
import { replaceMarkers } from "../src/merge-tags";

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
