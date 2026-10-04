/**
 * Templates that once converted wrong, run through both modes. Each one
 * must keep every word (checked against the original's HTML) and come out
 * in the right shape.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToJson } from "@unlayer/react-elements";
import { compareText, convertReactEmail, convertSource, verifyConversion } from "../src/index";

const IMPORTS = `import { Body, Button, Column, Container, Html, Img, Preview, Row, Section, Text } from "@react-email/components";\n`;

/** Convert `source` both ways and render the results. */
async function convertBoth(source: string, name: string) {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  try {
    const originalFile = path.join(dir, `${name}.tsx`);
    fs.writeFileSync(originalFile, source);
    const { default: Original } = await import(originalFile);
    const runtime = await convertReactEmail(Original);
    const codemod = await convertSource(source, { fileName: `${name}.tsx` });
    const migratedFile = path.join(dir, `${name}.migrated.tsx`);
    fs.writeFileSync(migratedFile, codemod.code);
    const { default: Migrated } = await import(migratedFile);
    const check = await verifyConversion(Original, Migrated);
    return {
      runtime,
      runtimeDesign: runtime.design(),
      codemod,
      check,
      codemodDesign: renderToJson(Migrated(Migrated.PreviewProps ?? {})) as any,
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Each row's columns, as the text each column holds. */
function columnsText(design: any): string[][] {
  return design.body.rows.map((row: any) =>
    row.columns.map((column: any) =>
      column.contents.map((content: any) => String(content.values.text ?? content.values.html ?? "").replace(/<[^>]+>/g, "")).join(" | ")
    )
  );
}

describe("component prop defaults", () => {
  it("preserves defaults for undefined and omitted props, and keeps supplied URLs", async () => {
    const source = `${IMPORTS}
      function CTA({ href = "https://example.com/pay" }: { href?: string }) { return <Button href={href}>Pay invoice</Button>; }
      export default function T({ href }: { href?: string }) {
        return <Html><Body><Container>
          <CTA href={href}/><CTA href={undefined}/><CTA/><CTA href="https://example.com/custom"/>
          <Button href="https://example.com/pay">Help</Button>
        </Container></Body></Html>;
      }
      T.PreviewProps = { href: undefined };`;
    const { check } = await convertBoth(source, "prop-defaults");
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    expect(check.designWarnings).toEqual([]);
    const links = [...check.convertedHtml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
      .filter(([, , text]) => text.replace(/<[^>]*>/g, "").trim() === "Pay invoice")
      .map(([, attrs]) => /href="([^"]*)"/.exec(attrs)?.[1]);
    expect(links).toEqual(["https://example.com/pay", "https://example.com/pay", "https://example.com/pay", "https://example.com/custom"]);
  });
});

describe("content placed directly in a Row (not in a Column)", () => {
  const source = `${IMPORTS}
    export default function T() {
      return (
        <Html><Body><Container>
          <Section><Row>
            <Text>First paragraph here</Text>
            <Text>Second paragraph here</Text>
            <Button href="https://example.com">Click me</Button>
          </Row></Section>
        </Container></Body></Html>
      );
    }`;

  it("stacks it, as browsers do, in both modes", async () => {
    const { runtime, runtimeDesign, check, codemodDesign } = await convertBoth(source, "row-content");
    expect(runtime.report.missingText).toEqual([]);
    expect(check.missing).toEqual([]);
    for (const design of [runtimeDesign, codemodDesign]) {
      const rows = columnsText(design);
      // One column holding all three blocks, not three columns side by side.
      expect(rows).toEqual([[expect.stringMatching(/First paragraph here \| Second paragraph here/)]]);
    }
  });
});

describe("JSX kept in local constants and combined in fragments", () => {
  const source = `${IMPORTS}
    const features = [
      { title: "Serum", left: true },
      { title: "Cream", left: false },
    ];
    export default function T() {
      return (
        <Html><Body><Container>
          {features.map((feature, i) => {
            const image = (
              <Column key="img" style={{ width: "200px" }}>
                <Img src="https://example.com/a.png" width={200} alt="" />
              </Column>
            );
            const text = (
              <Column key="txt">
                <Text>{feature.title} description</Text>
              </Column>
            );
            return (
              <Section key={i}>
                <Row>{feature.left ? (<>{image} {text}</>) : (<>{text} {image}</>)}</Row>
              </Section>
            );
          })}
        </Container></Body></Html>
      );
    }`;

  it("codemod: inlines them where they're used, so nothing is dropped", async () => {
    const { codemod, check, codemodDesign } = await convertBoth(source, "local-jsx");
    expect(check.missing).toEqual([]);
    expect(codemod.code).not.toContain("const image");
    // Each branch keeps its own column widths.
    expect(codemod.code).toMatch(/cells=\{feature\.left \? \[\d+, \d+\] : \[\d+, \d+\]\}/);
    const rows = columnsText(codemodDesign);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["", "Serum description"]);
    expect(rows[1]).toEqual(["Cream description", ""]);
  });

  it("runtime: two rows of two columns", async () => {
    const { runtime, runtimeDesign } = await convertBoth(source, "local-jsx-runtime");
    expect(runtime.report.missingText).toEqual([]);
    expect(columnsText(runtimeDesign)).toEqual([
      ["", "Serum description"],
      ["Cream description", ""],
    ]);
  });
});

describe("code the codemod can't place", () => {
  it("keeps a fragment holding code as HTML rather than dropping it", async () => {
    const source = `${IMPORTS}
      export default function T({ extra = <Text>Extra line</Text> }: { extra?: React.ReactNode }) {
        return (
          <Html><Body><Container>
            <Section>{extra !== null && (<>{extra}<Text>Static line</Text></>)}</Section>
          </Container></Body></Html>
        );
      }`;
    const { codemod, check } = await convertBoth(source, "fragment-code");
    expect(check.missing).toEqual([]);
    expect(codemod.report.fallbacks).toContainEqual({ reason: "code that couldn't be converted" });
  });

  it("inlines a Row's same-file cell components; keeps one it can't inline whole", async () => {
    const inlined = `${IMPORTS}
      const Cell = ({ label }: { label: string }) => (
        <Column><Text>{label}</Text></Column>
      );
      export default function T() {
        return (
          <Html><Body><Container>
            <Section><Row><Cell label="One" /><Cell label="Two" /></Row></Section>
          </Container></Body></Html>
        );
      }`;
    const first = await convertBoth(inlined, "inlined-cells");
    expect(first.check.missing).toEqual([]);
    expect(first.codemod.report.fallbacks).toEqual([]);
    expect(columnsText(first.codemodDesign)).toEqual([["One", "Two"]]);

    const kept = `${IMPORTS}
      const Cell = (props: { label: string }) => {
        const [text] = [props.label];
        return <Column {...props}><Text>{text}</Text></Column>;
      };
      export default function T() {
        return (
          <Html><Body><Container>
            <Section><Row><Cell label="One" /><Cell label="Two" /></Row></Section>
          </Container></Body></Html>
        );
      }`;
    const second = await convertBoth(kept, "kept-cells");
    expect(second.check.missing).toEqual([]);
    expect(second.codemod.report.fallbacks).toContainEqual({ reason: "unsupported component", detail: "Row" });
  });
});

describe("Preview inside Body", () => {
  it("keeps the preview text in both modes", async () => {
    const source = `${IMPORTS}
      export default function T() {
        return (
          <Html><Body>
            <Preview>Your order shipped</Preview>
            <Container><Text>Body text</Text></Container>
          </Body></Html>
        );
      }`;
    const { runtime, check, codemod } = await convertBoth(source, "preview");
    expect(runtime.report.missingText).toEqual([]);
    expect(check.missing).toEqual([]);
    expect(codemod.code).toContain('previewText="Your order shipped"');
  });
});

describe("verifyConversion", () => {
  it("flips boolean props to reach branches the preview props don't take", async () => {
    const { Body, Container, Html, Text } = await import("@react-email/components");
    const { Email, Row, Column, Paragraph } = await import("@unlayer/react-elements");
    const React = await import("react");
    const h = React.createElement;
    const Original = Object.assign(
      ({ trial }: { trial: boolean }) => h(Html, null, h(Body, null, h(Container, null, h(Text, null, "Welcome"), trial ? h(Text, null, "Your trial ends soon") : null))),
      { PreviewProps: { trial: false } }
    );
    // A migration that forgot the trial branch: the preview props alone can't tell.
    const Broken = () => h(Email, null, h(Row, null, h(Column, null, h(Paragraph, null, "Welcome"))));
    const check = await verifyConversion(Original, Broken);
    expect(check.missing).toEqual([]);
    expect(check.variants).toEqual([{ change: "trial: true", missing: ["your", "trial", "ends", "soon"], missingAttributes: [] }]);
  });
});

describe("inline images side by side (rating stars), from code and written out", () => {
  const source = `${IMPORTS}
    const stars = ["https://example.com/a.gif", "https://example.com/b.gif", "https://example.com/c.gif"];
    export default function T() {
      return (
        <Html><Body><Container>
          <Section><Row>
            <Column style={{ width: "200px" }}><Text>Left</Text></Column>
            <Column>
              {stars.map((src, i) => <Img key={i} src={src} alt="Star" style={{ display: "inline-block" }} />)}
            </Column>
          </Row></Section>
          <Section>
            <Img src="https://example.com/x.png" width={20} height={20} alt="X" style={{ display: "inline-block" }} />
            <Img src="https://example.com/y.png" width={20} height={20} alt="Y" style={{ display: "inline-block" }} />
          </Section>
        </Container></Body></Html>
      );
    }`;

  it("keeps them on one line, in one block, in both modes", async () => {
    const { runtime, runtimeDesign, check, codemodDesign } = await convertBoth(source, "inline-images");
    expect(runtime.report.missingAttributes).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    for (const design of [runtimeDesign, codemodDesign]) {
      const contents = design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents));
      const holding = (src: string) => contents.filter((c: any) => JSON.stringify(c.values).includes(src));
      // All three stars in one block, and both icons in one block.
      expect(holding("a.gif")).toHaveLength(1);
      expect(holding("a.gif")[0]).toBe(holding("c.gif")[0]);
      expect(holding("x.png")[0]).toBe(holding("y.png")[0]);
    }
  });
});

describe("buttons, nested one-column rows and imported fonts", () => {
  const source = `${IMPORTS}
    export default function T() {
      return (
        <Html>
          <head><style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');" }} /></head>
          <Body style={{ fontFamily: "Inter, Arial, sans-serif" }}><Container>
            <Section><Row>
              <Column><Row><Column style={{ width: "32px" }}><Img src="https://example.com/logo.png" width={23} alt="Logo" /></Column></Row></Column>
              <Column><Text>Brand</Text></Column>
            </Row></Section>
            <Section><Button href="https://example.com" style={{ display: "block", width: "210px", backgroundColor: "#007ee6", padding: "14px 7px" }}>Reset</Button></Section>
          </Container></Body>
        </Html>
      );
    }`;

  it("keeps a block button's px width, flattens a Row of one Column, and links an imported stylesheet", async () => {
    const { runtime, runtimeDesign, codemod, check, codemodDesign } = await convertBoth(source, "button-row-fonts");
    expect(check.missing).toEqual([]);
    expect(runtime.report.fallbacks).toEqual([]);
    expect(codemod.report.fallbacks).toEqual([]);
    for (const design of [runtimeDesign, codemodDesign]) {
      const contents = design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents));
      const button = contents.find((c: any) => c.type === "button");
      expect(button.values.size).toMatchObject({ autoWidth: false, width: "210px" });
      expect(button.values.textAlign).toBe("left");
      expect(contents.some((c: any) => c.type === "image")).toBe(true);
    }
    expect(runtime.fonts).toContainEqual({ url: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" });
    expect(codemod.code).toContain("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap");
  });
});

describe("merge tags (runtime mode)", () => {
  it.each(["toUpperCase", "toLowerCase"])("detects %s even when the sample already has that case", async (method) => {
    const sample = method === "toUpperCase" ? "VIP" : "vip";
    const source = `${IMPORTS}
      export default function T({ code, name }: { code: string; name: string }) {
        return <Html><Body><Container><Text>Hello {name}</Text><Button href={"https://example.com/coupon/" + code.${method}()}>Redeem</Button></Container></Body></Html>;
      }
      T.PreviewProps = { code: "${sample}", name: "Alex" };`;
    const { runtime } = await convertBoth(source, `merge-${method}`);
    expect(runtime.html()).toContain(`https://example.com/coupon/${sample}`);
    expect(runtime.html()).not.toContain("{{code}}");
    expect(runtime.html()).toContain("{{name}}");
    expect(runtime.report.info).toContainEqual({ reason: "text prop kept as its sample value (the template changes or tests it)", detail: "code" });
  });

  const source = `${IMPORTS}
    export default function T({ name, plan, logo, url }: { name: string; plan: string; logo: string; url: string }) {
      return (
        <Html><Body><Container>
          <Preview>{\`Welcome, \${name}\`}</Preview>
          <Img src={logo} width={120} alt="Logo" />
          <Text>Hi {name}, thanks for joining.</Text>
          <Text>Your plan: {plan.toUpperCase()}</Text>
          <Button href={url}>Open</Button>
        </Container></Body></Html>
      );
    }
    T.PreviewProps = { name: "Alex", plan: "pro", logo: "https://example.com/logo.png", url: "https://example.com/app" };`;

  it("turns text props shown as given into merge tags, keeps changed ones and image sources", async () => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      fs.writeFileSync(path.join(dir, "t.tsx"), source);
      const { default: T } = await import(path.join(dir, "t.tsx"));
      const tagged = await convertReactEmail(T);
      const html = tagged.html();
      expect(html).toContain("Hi {{name}}, thanks for joining.");
      expect(html).toContain('href="{{url}}"');
      expect(html).toContain("Welcome, {{name}}");
      expect(html).toContain("https://example.com/logo.png");
      expect(html).toContain("PRO");
      expect(tagged.report.info).toContainEqual({ reason: "text props became merge tags", detail: "name, url" });
      expect(tagged.report.info).toContainEqual({ reason: "text prop kept as its sample value (the template changes or tests it)", detail: "plan" });
      expect(tagged.report.missingText).toEqual([]);
      const plain = (await convertReactEmail(T, { mergeTags: false })).html();
      expect(plain).toContain("Hi Alex, thanks for joining.");
      expect(plain).not.toContain("{{");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("compareText", () => {
  it("finds words a conversion dropped", () => {
    expect(compareText("<p>Hello there</p><p>Second block</p>", "<p>Hello there</p>").missing).toEqual(["second", "block"]);
  });

  it("finds links and images a conversion dropped", () => {
    const check = compareText('<a href="https://a.test/x?y=1&amp;z=2">Go</a><img src="/logo.png" alt="Acme">', '<a href="https://a.test/x?y=1&z=2">Go</a>');
    expect(check.missingAttributes).toEqual(["src /logo.png", "alt Acme"]);
  });

  it("reads text the way the page shows it", () => {
    // React's <!-- --> separators and inline tags don't split words; block tags do.
    expect(compareText("<p>Alex<!-- -->&#x27;s <b>re</b>view</p>", "<td>Alex's review</td>").missing).toEqual([]);
    expect(compareText("<head><title>Hidden</title></head><p>Shown</p>", "<p>Shown</p>").missing).toEqual([]);
  });
});
