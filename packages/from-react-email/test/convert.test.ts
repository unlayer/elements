import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToJson } from "@unlayer/react-elements";
import { Column, Row, Section, Tailwind, Text } from "@react-email/components";
import { convertReactEmail, convertSource, expand, verifyConversion } from "../src/index";
import { color } from "../src/styles";

const fixtures = path.join(import.meta.dirname, "fixtures");
const TEMPLATES = ["welcome", "receipt", "weekly-digest"];

describe.each(TEMPLATES)("%s", (name) => {
  it("runtime mode: TSX and design JSON", async () => {
    const { default: Template } = await import(path.join(fixtures, `${name}.tsx`));
    const conversion = await convertReactEmail(Template);
    expect(conversion.report.nativeRatio).toBe(1);
    await expect(await conversion.tsx()).toMatchFileSnapshot(`__snapshots__/${name}.runtime.tsx.snap`);
    await expect(JSON.stringify(conversion.design(), null, 2)).toMatchFileSnapshot(`__snapshots__/${name}.runtime.design.json.snap`);
  });

  it("codemod mode: TSX that renders with the template's own props", async () => {
    const result = await convertSource(fs.readFileSync(path.join(fixtures, `${name}.tsx`), "utf8"), { fileName: `${name}.tsx` });
    expect(result.report.nativeRatio).toBe(1);
    expect(result.code).toContain('from "@unlayer/react-elements"');
    expect(result.code).not.toContain("@react-email/components");
    await expect(result.code).toMatchFileSnapshot(`__snapshots__/${name}.codemod.tsx.snap`);

    // The migrated component still takes the template's props.
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      const file = path.join(dir, `${name}.tsx`);
      fs.writeFileSync(file, result.code);
      const { default: Migrated } = await import(file);
      const design = renderToJson(Migrated(Migrated.PreviewProps));
      expect(design.body.rows.length).toBeGreaterThan(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("codemod keeps logic", () => {
  it("converts JSX inside loops and conditions, keeping keys", async () => {
    const result = await convertSource(fs.readFileSync(path.join(fixtures, "receipt.tsx"), "utf8"));
    expect(result.code).toContain("{items.map((item) => (");
    expect(result.code).toContain("<Row key={item.name}");
    expect(result.code).toMatch(/\{item\.description \? \(\s*<Paragraph/);
    expect(result.code).toContain("ReceiptEmail.PreviewProps");
  });

  it("inlines same-file components, and keeps what it can't map as HTML, reported", async () => {
    const source = `
      import { Html, Body, Container, Text } from "@react-email/components";
      import { useMemo } from "react";
      const Badge = ({ label }: { label: string }) => <span>{label}</span>;
      const Stamp = ({ label }: { label: string }) => {
        const upper = useMemo(() => label.toUpperCase(), [label]);
        return <div style={{ border: "1px solid red" }}>{upper}</div>;
      };
      export default function T({ name }: { name: string }) {
        return (
          <Html><Body><Container>
            <Text>Hi {name} <Badge label="new" /></Text>
            <Stamp label="paid" />
          </Container></Body></Html>
        );
      }`;
    const result = await convertSource(source);
    // Badge returns plain JSX: inlined. Stamp uses a hook: kept, rendered to HTML.
    expect(result.report.info).toContainEqual({ reason: "local component inlined where it's used", detail: "Badge" });
    expect(result.report.fallbacks).toEqual([{ reason: "custom component", detail: "Stamp" }]);
    expect(result.code).toMatch(/renderToStaticMarkup\(\s*<div style=\{\{ fontSize: "medium" \}\}>\s*<Stamp label="paid" \/>/);
    expect(result.code).toMatch(/<span>\$\{escapeHtml\(String\("new"\)\)\}<\/span>|<span>new<\/span>/);
    expect(result.code).not.toContain("const Badge");
  });
});

describe("runtime details", () => {
  it("keeps Sections, Rows and Columns through <Tailwind>", async () => {
    const nodes = await expand(
      React.createElement(
        Tailwind,
        null,
        React.createElement(Section, { className: "bg-white" }, React.createElement(Row, null, React.createElement(Column, { className: "w-1/2" }, React.createElement(Text, { className: "text-red-500" }, "x"))))
      )
    );
    const section = nodes[0] as any;
    expect(section.name).toBe("Section");
    expect(section.props.style.backgroundColor).toMatch(/255/);
    expect(section.children[0].name).toBe("Row");
    expect(section.children[0].children[0].name).toBe("Column");
  });

  it("writes colors as hex (the exporters mangle rgb())", () => {
    expect(color("rgb(255,255,255)")).toBe("#ffffff");
    expect(color("rgb(54 65 83)")).toBe("#364153");
    expect(color("rgba(0, 0, 0, 0.5)")).toBe("rgba(0, 0, 0, 0.5)");
    expect(color("#abc")).toBe("#abc");
  });
});

describe("react-email package", () => {
  it("imports kept blocks from the package the template imported them from, types as types", async () => {
    const source = `import { Html, Body, Img, Text, pixelBasedPreset, type TailwindConfig } from "react-email";
const config: TailwindConfig = { presets: [pixelBasedPreset] };
export default function Template() {
  return <Html><Body><Text>Your receipt</Text><Img src="https://example.com/logo.png" alt="Logo" /></Body></Html>;
}`;
    const result = await convertSource(source);
    expect(result.code).toContain('from "react-email"');
    expect(result.code).not.toContain("@react-email/components");
    expect(result.code).toMatch(/import \{ Img, type TailwindConfig, pixelBasedPreset \} from "react-email";/);
  });

  it("resolves classes with the template's own <Tailwind>", async () => {
    const source = `import { Html, Body, Tailwind, Text } from "react-email";
export default function Template() {
  return <Html><Tailwind><Body><Text className="brand">Hello</Text></Body></Tailwind></Html>;
}`;
    // A stand-in for the template's Tailwind: it inlines .brand as red.
    const Tailwind = ({ children }: { children: React.ReactElement[] }) =>
      children.map((child) => (child.props as { className?: string }).className === "brand" ? React.cloneElement(child, { className: undefined, style: { color: "#ff0000" } } as object) : child);
    const result = await convertSource(source, { tailwind: Tailwind });
    expect(result.code).toContain('color="#ff0000"');
  });
});

describe("computed styles", () => {
  it("evaluates conditions it can know, and lists the values it can't", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
const level = "h2";
export default function Template({ tone }: { tone: string }) {
  return <Html><Body>
    <Text style={{ fontSize: level === "h1" ? 24 : 20, lineHeight: undefined ? "14px" : "26px" }}>Known</Text>
    <Text style={{ color: tone, margin: 0 }}>Computed</Text>
  </Body></Html>;
}`;
    const result = await convertSource(source);
    expect(result.code).toContain('fontSize="20px"');
    expect(result.code).toContain('lineHeight="26px"');
    expect(result.report.lostStyles).toEqual(["line 6: color: tone"]);
  });

  it("treats a spread of undefined (an optional style prop left out) as nothing", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Template() {
  return <Html><Body><Text style={{ fontSize: 18, ...(undefined), ...null }}>Hello</Text></Body></Html>;
}`;
    const result = await convertSource(source);
    expect(result.report.lostStyles).toBeUndefined();
    expect(result.code).toContain('fontSize="18px"');
  });
});

describe("head <style> rules", () => {
  // Text sets 14px inline, so the rule's 24px doesn't apply; its color does, and so does the !important phone size.
  const css = `.copy { color: #fff; font-size: 24px } @media (max-width: 600px) { .copy { font-size: 18px !important } } .note > a { color: red }`;
  const source = `import { Html, Head, Body, Text } from "@react-email/components";
export default function Template() {
  return <Html><Head><style>{\`${css}\`}</style></Head><Body style={{ backgroundColor: "#000000" }}><Text className="copy" style={{ margin: 0 }}>Code 482913</Text></Body></Html>;
}`;

  it("codemod: applies rules on a class where they'd win, phone rules too, and reports the rest", async () => {
    const result = await convertSource(source);
    expect(result.code).toMatch(/color="#fff(fff)?"/);
    expect(result.code).toContain('fontSize="14px"');
    expect(result.code).toMatch(/mobile=\{\{[^}]*fontSize: "18px"/);
    expect(result.report.notes).toContainEqual({ reason: "head style rule not converted", detail: ".note > a" });
  });

  it("runtime: the same", async () => {
    const { Html, Head, Body, Text } = await import("@react-email/components");
    const h = React.createElement;
    const Template = () =>
      h(Html, null, h(Head, null, h("style", null, css)), h(Body, { style: { backgroundColor: "#000000" } }, h(Text, { className: "copy", style: { margin: 0 } }, "Code 482913")));
    const conversion = await convertReactEmail(Template);
    const paragraph = JSON.stringify(conversion.tree);
    expect(paragraph).toContain('"fontSize":"14px"');
    expect(paragraph).toContain('"fontSize":"18px"');
    expect(paragraph).toMatch(/"color":"#fff(fff)?"/);
    expect(conversion.report.notes).toContainEqual({ reason: "head style rule not converted", detail: ".note > a" });
  });
});

describe("image height", () => {
  it("reports a height it can't keep", async () => {
    const source = `import { Html, Body, Img } from "@react-email/components";
export default function Template() { return <Html><Body><Img src="https://example.com/square.png" width={80} height={20} alt="Strip" /></Body></Html>; }`;
    const result = await convertSource(source);
    expect(result.report.notes).toContainEqual({ reason: "image height not kept (the image keeps its file's aspect ratio)", detail: "80×20px" });
  });
});

describe("visibility: hidden", () => {
  const source = `import { Html, Body, Text } from "@react-email/components";
export default function Template() {
  return <Html><Body><Text>Shown</Text><Text style={{ visibility: "hidden" }}>Secret</Text></Body></Html>;
}`;

  it("stays hidden in both modes", async () => {
    const codemod = await convertSource(source);
    expect(codemod.report.fallbacks).toContainEqual({ reason: "hidden element" });
    expect(codemod.code).toMatch(/visibility(:|: )"?hidden/);
    const { Html, Body, Text } = await import("@react-email/components");
    const h = React.createElement;
    const Template = () => h(Html, null, h(Body, null, h(Text, null, "Shown"), h(Text, { style: { visibility: "hidden" } }, "Secret")));
    const html = (await convertReactEmail(Template)).html();
    expect(html).toMatch(/visibility:\s*hidden[^>]*>Secret/);
  });
});

describe("image max-width", () => {
  it("shows a percent-wide image at its max-width", async () => {
    const source = `import { Html, Body, Img } from "@react-email/components";
export default function Template() { return <Html><Body><Img src="https://example.com/a.png" width="100%" style={{ maxWidth: "300px" }} alt="A" /></Body></Html>; }`;
    const result = await convertSource(source);
    expect(result.code).toContain('width="300px"');
  });
});

describe("phone rules", () => {
  it("reads every way of writing a phone media query", async () => {
    const { isPhoneQuery, phoneStyles } = await import("../src/tailwind");
    for (const query of ["(max-width: 600px)", "(480px>=width)", "(width <= 480px)", "(width<30rem)", "only screen and (max-device-width: 480px)"]) expect(isPhoneQuery(query), query).toBe(true);
    for (const query of ["(min-width: 481px)", "(width >= 481px)", "(481px<=width)", "(320px <= width <= 480px)", "print"]) expect(isPhoneQuery(query), query).toBe(false);
    expect(phoneStyles("@media (480px>=width){.mobile_text-14px{font-size:14px!important}}").get("mobile_text-14px")).toEqual({ fontSize: "14px" });
    expect(phoneStyles("@media (max-width: 600px) { /* phones */ .small { font-size: 12px } }").get("small")).toEqual({ fontSize: "12px" });
  });

  const css = "@media (max-width: 600px) { .phone-only { display: block !important } }";
  const source = `import { Html, Head, Body, Section, Text } from "@react-email/components";
export default function Template() {
  return <Html><Head><style>{"${css}"}</style></Head><Body>
    <Text>Everywhere</Text>
    <Text className="phone-only" style={{ display: "none" }}>Phones only</Text>
    <Section className="phone-only" style={{ display: "none" }}><Text>Phone section</Text></Section>
  </Body></Html>;
}`;

  it("codemod: content a phone rule shows becomes a block hidden on desktop; a box is reported", async () => {
    const result = await convertSource(source);
    expect(result.code).toMatch(/hideOnDesktop[\s\S]{0,200}Phones only|Phones only[\s\S]{0,40}/);
    expect(result.code).toMatch(/<Paragraph[^>]*hideOnDesktop[^>]*>\s*Phones only/);
    expect(result.report.notes).toContainEqual({ reason: "content shown only on phones stays hidden there", detail: "Section" });
  });

  it("runtime: the same", async () => {
    const { Html, Head, Body, Section, Text } = await import("@react-email/components");
    const h = React.createElement;
    const Template = () => h(Html, null, h(Head, null, h("style", null, css)), h(Body, null,
      h(Text, null, "Everywhere"),
      h(Text, { className: "phone-only", style: { display: "none" } }, "Phones only"),
      h(Section, { className: "phone-only", style: { display: "none" } }, h(Text, null, "Phone section"))));
    const conversion = await convertReactEmail(Template);
    expect(JSON.stringify(conversion.tree)).toMatch(/"hideOnDesktop":true[^}]*/);
    expect(conversion.report.notes).toContainEqual({ reason: "content shown only on phones stays hidden there", detail: "Section" });
  });
});

describe("HTML block text size", () => {
  it("shows <code> at the browser's monospace size, as the original does", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Template({ code }: { code: string }) {
  return <Html><Body><Text>Your code:</Text><code style={{ display: "inline-block", padding: "16px" }}>{code}</code></Body></Html>;
}
Template.PreviewProps = { code: "SPARO-NDIGO-AMURT-SECAN" };`;
    const result = await convertSource(source);
    expect(result.code).toMatch(/fontSize="13px"\s*html=\{`<code/);
  });
});

describe("tables kept as HTML", () => {
  // A raw <table> isn't converted: it's kept, inside a box that sets the text color.
  const source = `import { Html, Body, Section } from "@react-email/components";
export default function Template() {
  return <Html><Body><Section style={{ color: "#333333", fontSize: "12px" }}>
    <table><tbody><tr><td>18 Jan 2023</td></tr></tbody></table>
  </Section></Body></Html>;
}`;

  it("keep the color around them over the email's `table, td` color (both modes)", async () => {
    const { renderToHtml } = await import("@unlayer/react-elements");
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-tables-"));
    try {
      const file = path.join(dir, "migrated.tsx");
      fs.writeFileSync(file, (await convertSource(source)).code);
      const { default: Migrated } = await import(file);
      const codemod = renderToHtml(React.createElement(Migrated));
      expect(codemod).toMatch(/<table style="color:#333333"/);
      expect(codemod).toMatch(/<td style="color:#333333">18 Jan 2023/);
      const original = path.join(dir, "original.tsx");
      fs.writeFileSync(original, source);
      const { default: Original } = await import(original);
      const runtime = (await convertReactEmail(Original)).html();
      expect(runtime).toMatch(/<td style="color:#333333">18 Jan 2023/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("head <style> rules and React Email's inline styles", () => {
  it("lets the component's own inline style win, unless the rule is !important", async () => {
    const source = `import { Html, Head, Body, Text } from "@react-email/components";
export default function Template() {
  return <Html><Head><style>{".copy { font-size: 24px; color: #ff0000; margin: 0 20px } .big { font-size: 30px !important }"}</style></Head><Body>
    <Text className="copy">Inline wins</Text>
    <Text className="big">Important wins</Text>
  </Body></Html>;
}`;
    const result = await convertSource(source);
    const inlineWins = /<Paragraph([^>]*)>\s*Inline wins/.exec(result.code)?.[1] ?? "";
    expect(inlineWins).toContain('fontSize="14px"');
    expect(inlineWins).toContain('color="#ff0000"');
    expect(result.code).toMatch(/<Paragraph[^>]*fontSize="30px"[^>]*>\s*Important wins/);
  });
});

describe("names the migrated file no longer reads", () => {
  it("removes constants, components and imports whose values were written in, and keeps the rest", async () => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      fs.writeFileSync(path.join(dir, "theme.ts"), `export const brand = "#0055ff";\n`);
      const source = `import { Html, Body, Container, Text, Heading as EmailHeading } from "@react-email/components";
import { brand } from "./theme";
const paragraphStyle = { fontSize: "16px", color: brand };
const main = { backgroundColor: "#ffffff" };
const neverRead = { color: "red" };
const started = Date.now();
const defaultName = "Ada";
function Footer() {
  return <Text style={paragraphStyle}>The team</Text>;
}
const Heading = ({ children }: { children: string }) => <EmailHeading as="h2">{children}</EmailHeading>;
export default function Template({ name = defaultName }: { name?: string }) {
  return (<Html><Body style={main}><Container>
    <Heading>Welcome</Heading>
    <Text style={paragraphStyle}>Hi {name}</Text>
    <Footer />
  </Container></Body></Html>);
}
console.log(started);`;
      const file = path.join(dir, "template.tsx");
      const result = await convertSource(source, { fileName: file });
      // Written into the props: gone, with the import only they read.
      expect(result.code).not.toMatch(/const paragraphStyle|const main\b|function Footer|const Heading|from "\.\/theme"/);
      // Never read by the template, a value with side effects, or still read: kept.
      expect(result.code).toContain("const neverRead");
      expect(result.code).toContain("const started = Date.now()");
      expect(result.code).toContain('const defaultName = "Ada"');
      // The migrated file still renders.
      fs.writeFileSync(file, result.code);
      const { default: Migrated } = await import(file);
      expect(JSON.stringify(renderToJson(Migrated({ name: "Ada" })))).toContain("The team");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("loops", () => {
  // The gaps between content blocks, top to bottom, in a migrated template's design.
  const gaps = async (source: string) => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      const file = path.join(dir, "template.tsx");
      fs.writeFileSync(file, (await convertSource(source, { fileName: file })).code);
      const { default: Migrated } = await import(file);
      const design = renderToJson(Migrated({}));
      const blocks = design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => [
        { padding: column.values.padding ?? "0px" },
        ...column.contents.map((content: any) => ({ padding: content.values.containerPadding ?? "0px", text: content.values.text })),
      ]));
      const px = (css: string, side: number) => { const v = css.split(/\s+/).map((x) => parseFloat(x) || 0); return [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]][side]; };
      const out: number[] = [];
      let space = 0;
      for (const block of blocks) {
        if (block.text === undefined) { space += px(block.padding, 0); continue; }
        out.push(space + px(block.padding, 0));
        space = px(block.padding, 2);
      }
      return [...out, space];
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
  const template = (items: string) => `import { Html, Body, Container, Heading, Text } from "@react-email/components";
const items = ["One", "Two", "Three"];
export default function Template() {
  return (<Html><Body><Container>
    <Heading as="h2" style={{ margin: "0" }}>Title</Heading>
    ${items}
    <Text>After</Text>
  </Container></Body></Html>);
}`;

  it.each([
    ["margins like <Text>'s", `style={{ margin: "16px 0" }}`],
    ["a larger bottom margin", `style={{ marginBottom: "40px" }}`],
  ])("spaces items like the same blocks written out (%s)", async (_, style) => {
    const loop = await gaps(template(`{items.map((item) => <Text key={item} ${style}>{item}</Text>)}`));
    const written = await gaps(template(`<Text ${style}>One</Text><Text ${style}>Two</Text><Text ${style}>Three</Text>`));
    expect(loop).toEqual(written);
  });

  it("spaces a loop first in its section like the blocks written out", async () => {
    const first = (items: string) => template(items).replace(`<Heading as="h2" style={{ margin: "0" }}>Title</Heading>`, "");
    const loop = await gaps(first(`{items.map((item) => <Text key={item} style={{ marginBottom: "40px" }}>{item}</Text>)}`));
    const written = await gaps(first(`<Text style={{ marginBottom: "40px" }}>One</Text><Text style={{ marginBottom: "40px" }}>Two</Text><Text style={{ marginBottom: "40px" }}>Three</Text>`));
    expect(loop).toEqual(written);
  });

  it("spaces a loop first in a column like the blocks written out", async () => {
    const inColumn = (items: string) =>
      template(items)
        .replace(`<Heading as="h2" style={{ margin: "0" }}>Title</Heading>`, "")
        .replace("Html, Body, Container,", "Html, Body, Container, Row, Column,")
        .replace(`    ${items}\n`, `    <Row><Column>${items}</Column><Column><Text>Side</Text></Column></Row>\n`);
    const loop = await gaps(inColumn(`{items.map((item) => <Text key={item}>{item}</Text>)}`));
    const written = await gaps(inColumn(`<Text>One</Text><Text>Two</Text><Text>Three</Text>`));
    expect(loop).toEqual(written);
  });
});

describe("padding that isn't in px", () => {
  const source = `import { Html, Body, Container, Section, Text } from "@react-email/components";
export default function Template() {
  return (<Html><Body><Container style={{ padding: "0 10%" }}>
    <Text style={{ fontSize: "12px", padding: "0 2em" }}>Twelve</Text>
    <Section style={{ padding: "1em" }}><Text>Inside</Text></Section>
  </Container></Body></Html>);
}`;

  it("codemod: takes em at the element's own font size, and reports % and an em it can't size", async () => {
    const result = await convertSource(source);
    expect(result.code).toMatch(/containerPadding="0px 24px 0px 24px"[^>]*>\s*Twelve/);
    const notes = result.report.notes.map((n) => n.detail);
    expect(notes).toContain("padding: 0 10% (Container)");
    expect(notes).toContain("padding: 1em (at 16px per em) (Section)");
    expect(notes.join(" ")).not.toContain("0 2em");
  });

  it("runtime: the same", async () => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      const file = path.join(dir, "template.tsx");
      fs.writeFileSync(file, source.replace("<Text>Inside</Text>", `<Text style={{ padding: "1em" }}>Inside</Text>`));
      const { default: Template } = await import(file);
      const conversion = await convertReactEmail(Template);
      const notes = conversion.report.notes.map((n) => n.detail);
      expect(notes).toContain("padding: 0 10% (Container)");
      expect(notes).toContain("padding: 1em (at 16px per em) (text)");
      expect(JSON.stringify(conversion.design())).toContain('"containerPadding":"0px 24px 0px 24px"');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("lost style lines", () => {
  it("are the lines of the template as written, with components inlined above them", async () => {
    const source = `import { Html, Body, Section, Text } from "@react-email/components";
const Card = ({ title, tone }: { title: string; tone: string }) => (
  <Section>
    <Text style={{ color: tone }}>{title}</Text>
  </Section>
);
export default function Template({ tone = "red", size = "14px" }: { tone?: string; size?: string }) {
  return (
    <Html>
      <Body>
        <Card title="One" tone={tone} />
        <Text style={{ fontSize: size }}>Hi</Text>
      </Body>
    </Html>
  );
}`;
    const result = await convertSource(source);
    // Inside the component: where it's used. In the template: its own line.
    expect(result.report.lostStyles).toEqual([expect.stringMatching(/^line 11: color/), "line 12: fontSize: size"]);
  });
});

describe("namespace imports and templates that render nothing", () => {
  const migrate = async (source: string) => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    fs.writeFileSync(path.join(dir, "original.tsx"), source);
    const file = path.join(dir, "migrated.tsx");
    const result = await convertSource(source, { fileName: file });
    fs.writeFileSync(file, result.code);
    const { default: Original } = await import(path.join(dir, "original.tsx"));
    const { default: Migrated } = await import(file);
    fs.rmSync(dir, { recursive: true, force: true });
    return { result, Original, Migrated };
  };

  it("converts `import * as Email` like named imports", async () => {
    const { result, Original, Migrated } = await migrate(`import * as Email from "@react-email/components";
const Text = "Signed, the team";
export default function Template({ name = "Ada" }: { name?: string }) {
  const style: Email.TextProps["style"] = { color: "#333333" };
  return (<Email.Html><Email.Body><Email.Container>
    <Email.Heading as="h2">Hi {name}</Email.Heading>
    <Email.Text style={style}>{Text}</Email.Text>
  </Email.Container></Email.Body></Email.Html>);
}`);
    expect(result.report.nativeRatio).toBe(1);
    expect(result.code).not.toMatch(/Email\.|@react-email/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
  });

  it("checks a template that renders nothing for some props", async () => {
    const { Original, Migrated } = await migrate(`import { Html, Body, Text } from "@react-email/components";
export default function Template({ show = true, name = "Ada" }: { show?: boolean; name?: string }) {
  if (!show) return null;
  return (<Html><Body><Text>Hi {name}</Text></Body></Html>);
}
Template.PreviewProps = { show: true, name: "Ada" };`);
    expect((await verifyConversion(Original, Migrated)).variants).toEqual([]);
    // A migration that renders nothing where the original shows text fails.
    const Always = (props: Record<string, unknown>) => Original({ ...props, show: true });
    Always.PreviewProps = Original.PreviewProps;
    const variants = (await verifyConversion(Always, Migrated)).variants;
    expect(variants).toEqual([expect.objectContaining({ change: "show: false", missing: ["Hi", "Ada"] })]);
  });
});
