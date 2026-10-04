/**
 * Templates that once converted wrong, run through both modes. Each one
 * must keep every word (checked against the original's HTML) and come out
 * in the right shape.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToJson } from "@unlayer/react-elements";
import {
  compareText,
  convertReactEmail,
  convertSource,
  mergeTagDesign,
  verifyConversion,
} from "../src/index";

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
      Original,
      Migrated,
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

describe("returns that render nothing", () => {
  it("converts a template with an early `return null` or a `cond ? <Html> : null` root, leaving the empty return as written", async () => {
    const early = `${IMPORTS}
      export default function T({ name }: { name?: string }) {
        if (!name) return null;
        return <Html><Body><Container><Text>Hi {name}</Text></Container></Body></Html>;
      }
      T.PreviewProps = { name: "Alex" };`;
    const ternary = `${IMPORTS}
      export default function T({ name }: { name?: string }) {
        return name ? <Html><Body><Container><Text>Hi {name}</Text></Container></Body></Html> : null;
      }
      T.PreviewProps = { name: "Alex" };`;
    for (const [source, name] of [[early, "early-null"], [ternary, "ternary-null"]] as const) {
      const { codemod, check } = await convertBoth(source, name);
      expect(codemod.code).toContain("null");
      expect(codemod.code).toContain('from "@unlayer/react-elements"');
      expect(check.missing).toEqual([]);
    }
  });
});

describe("merge tags in a migrated template's design JSON", () => {
  it("tags the preview text (preheaderText) as well as the body", async () => {
    const { Email, Row, Column, Paragraph } = await import("@unlayer/react-elements");
    const React = (await import("react")).default;
    const h = React.createElement;
    const Migrated = ({ name }: { name: string }) =>
      h(Email, { previewText: `Welcome, ${name}` }, h(Row, null, h(Column, null, h(Paragraph, null, `Hi ${name}`))));
    const props = { name: "Alex" };
    const { design } = await mergeTagDesign(Migrated, props, renderToJson(Migrated(props)) as unknown as Record<string, unknown>);
    const text = JSON.stringify(design);
    expect(text).toContain('"preheaderText":"Welcome, {{name}}"');
    expect(text).toContain("Hi {{name}}");
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

describe("migration review regressions", () => {
  it("evaluates a helper's initializer and prop arguments once", async () => {
    const source = `${IMPORTS}
      function Label({ next }: { next: () => string }) {
        const first = next();
        return <Text>{first}:{first}</Text>;
      }
      function Pair({ value }: { value: string }) { return <Text>{value}:{value}</Text>; }
      export default function T({ sequence = ["A", "A"] }: { sequence?: string[] }) {
        const ids = [...sequence];
        const next = () => ids.shift() ?? "";
        return <Html><Body><Label next={next}/><Pair value={next()}/></Body></Html>;
      }
      T.PreviewProps = { sequence: ["A", "A"] };`;
    const { Original, Migrated, codemod } = await convertBoth(
      source,
      "evaluate-once",
    );
    expect(codemod.code).toContain("const first = next()");
    expect(codemod.code.match(/next\(\)/g)).toHaveLength(2);
    const same = await verifyConversion(Original, Migrated, { props: { sequence: ["A", "A", "A"] } });
    expect(same.missing).toEqual([]);
    expect(same.designWarnings).toEqual([]);
    // Label's render consumes the template's sequence, which React's purity
    // rule forbids: the kept components render in another order, and the
    // values that changed places fail the check.
    const distinct = await verifyConversion(Original, Migrated, { props: { sequence: ["A", "B", "C"] } });
    expect(distinct.missing).not.toEqual([]);
  });

  it("converts early returns, including nested switch branches, but leaves helper returns alone", async () => {
    const source = `${IMPORTS}
      function label() { return "Special"; }
      export default function T({ special = false, other = false }) {
        if (special) { switch (other) { case true: return <Html><Body><Text>Other offer</Text></Body></Html>;
          default: return <Html><Body><Text>{label()} offer</Text></Body></Html>; } }
        return <Html><Body><Text>Normal offer</Text></Body></Html>;
      }
      T.PreviewProps = { special: false, other: false };`;
    const { check, Original, Migrated, codemod } = await convertBoth(
      source,
      "early-returns",
    );
    expect(check.variants).toEqual([]);
    expect(codemod.code).not.toContain("<Body>");
    for (const props of [
      { special: true, other: false },
      { special: true, other: true },
    ]) {
      const variant = await verifyConversion(Original, Migrated, { props });
      expect(variant.missing).toEqual([]);
      expect(variant.designWarnings).toEqual([]);
      expect(JSON.stringify(variant.design)).toContain("offer");
    }
  });

  it("checks the design exporter on boolean variants even when their HTML agrees", async () => {
    const source = `${IMPORTS}
      export default function T({ special = false }) { return <Html><Body><Text>{special ? "Special" : "Normal"} offer</Text></Body></Html>; }
      T.PreviewProps = { special: false };`;
    const { Original, Migrated } = await convertBoth(source, "variant-design");
    const wrong = (props: any) =>
      props.special ? Original(props) : Migrated(props);
    const check = await verifyConversion(Original, wrong);
    expect(check.variants).toEqual([
      expect.objectContaining({
        change: "special: true",
        error: expect.any(String),
      }),
    ]);
  });

  it("keeps complete named entities as characters in codemod output", async () => {
    const source = `${IMPORTS}
      export default function T() { return <Html><Body><Text>Total: 10 &euro; &frac12; &NotEqualTilde;</Text></Body></Html>; }`;
    const { check } = await convertBoth(source, "complete-entities");
    expect(check.missing).toEqual([]);
    expect(check.convertedHtml).toContain("10 € ½ &amp;NotEqualTilde;");
    expect(check.convertedHtml).not.toContain("&amp;euro;");
  });

  it("tags text and links, retaining CSS and inline image sources in both output modes", async () => {
    const source = `${IMPORTS}
      export default function T({ name, color, image, url }: { name: string; color: string; image: string; url: string }) {
        return <Html><Body><Text style={{ color }}>Hello {name}</Text>
          <Text><Img src={image} style={{ display: "inline-block" }} alt={name}/><Img src={image} style={{ display: "inline-block" }} alt="Logo"/></Text>
          <Button href={url}>Open</Button></Body></Html>;
      }
      T.PreviewProps = { name: "Alex", color: "#ff0000", image: "https://example.com/logo.png", url: "https://example.com/open?a=1&b=2" };`;
    const { runtime, Migrated, check } = await convertBoth(
      source,
      "tag-contexts",
    );
    const tagged = await mergeTagDesign(
      Migrated,
      Migrated.PreviewProps,
      check.design,
    );
    for (const text of [runtime.html(), JSON.stringify(tagged.design)]) {
      expect(text).toContain("{{name}}");
      expect(text).toContain("{{url}}");
      expect(text).not.toContain("{{color}}");
      expect(text).not.toContain("{{image}}");
      expect(text).toContain("https://example.com/logo.png");
    }
    expect(runtime.html()).toMatch(/color:\s*#ff0000/);
  });
});

describe("evaluation order and conditional roots", () => {
  it("may reorder render-time calls, and the check catches a template that depends on their order", async () => {
    // Mutating module state while rendering breaks React's purity rule, so
    // inlining is free to move these calls; the content check refuses the file.
    const source = `${IMPORTS}
      let n = 0;
      const next = () => String(++n);
      function Pair({ a, b }) { return <Text>{b}:{a}</Text>; }
      function Later({ value }) { return <Text>{n}:{value}</Text>; }
      export default function T() { n = 0; return <Html><Body><Pair a={next()} b={next()}/><Later value={next()}/></Body></Html>; }`;
    const { codemod, check } = await convertBoth(source, "argument-order");
    expect(codemod.code).not.toContain("<Pair");
    expect(codemod.code.match(/next\(\)/g)).toHaveLength(3);
    expect(check.missing).toEqual(expect.arrayContaining(["2:1", "3:3"]));
  });

  it("inlines a layout whose arguments and body call functions, each evaluated once", async () => {
    const source = `${IMPORTS}
      const LANGUAGES = [{ key: "ar", dir: "rtl" }];
      const t = (key: string) => key.toUpperCase();
      const Layout = ({ preview, language, children }) => (
        <Html lang={language} dir={LANGUAGES.find(({ key }) => key === language)?.dir ?? "ltr"}>
          <Preview>{preview}</Preview>
          <Body>{children}</Body>
        </Html>
      );
      function Footer() { const year = new Date().getFullYear(); return <Text>© {year} Acme</Text>; }
      export default function T(props: { language: string }) {
        return <Layout preview={t("preview")} language={props.language}><Text>{t("body")}</Text><Footer /></Layout>;
      }
      T.PreviewProps = { language: "en" };`;
    const { codemod, check } = await convertBoth(source, "layout-calls");
    expect(codemod.code).not.toMatch(/<Layout|<Footer/);
    expect(codemod.code.match(/t\("preview"\)/g)).toHaveLength(1);
    expect(codemod.code.match(/new Date\(\)/g)).toHaveLength(1);
    expect(check.missing).toEqual([]);
  });

  it("keeps a component whose argument would run twice, in a callback, or behind a condition", async () => {
    const cases = {
      twice: `function C({ v }) { return <Text>{v}{v}</Text>; }`,
      callback: `function C({ v }) { return <Text>{[1].map(() => v)}</Text>; }`,
      condition: `function C({ v, on = false }) { return <Text>{on && v}</Text>; }`,
      constTwice: `function C({ v }) { const w = v; return <Text>{w}{w}</Text>; }`,
    };
    for (const [name, helper] of Object.entries(cases)) {
      const source = `${IMPORTS}
        const make = () => "x";
        ${helper}
        export default function T() { return <Html><Body><C v={make()} /></Body></Html>; }`;
      const codemod = await convertSource(source, { fileName: `${name}.tsx` });
      expect(codemod.code, name).toMatch(/<C\b/);
    }
  });

  it("keeps a component whose argument or body writes state", async () => {
    for (const [name, body] of Object.entries({
      argument: [`function C({ v }) { return <Text>{v}</Text>; }`, `<C v={(count += 1)} />`],
      body: [`function C({ v }) { return <Text>{(count = 2)}{v}</Text>; }`, `<C v="a" />`],
      iife: [`function C({ v }) { return <Text>{v}</Text>; }`, `<C v={(() => { count++; return "a"; })()} />`],
    })) {
      const source = `${IMPORTS}
        let count = 0;
        ${body[0]}
        export default function T() { return <Html><Body>${body[1]}</Body></Html>; }`;
      const codemod = await convertSource(source, { fileName: `${name}.tsx` });
      expect(codemod.code, name).toMatch(/<C\b/);
    }
  });

  it("keeps captured identifier values when a helper's JSX mutates their source binding", async () => {
    const source = `${IMPORTS}
      function Label({ value, next }) { const saved = value; return <Text>{next()}:{saved}:{saved}</Text>; }
      export default function T() { let n = 0; const next = () => String(++n); return <Html><Body><Label value={n} next={next}/></Body></Html>; }`;
    const { check } = await convertBoth(source, "captured-identifier");
    expect(check.missing).toEqual([]);
    expect(check.convertedHtml).toContain("1:0:0");
  });

  it("converts both branches of a conditional root", async () => {
    const source = `${IMPORTS}
      const T = ({ special = false }) => special ? <Html><Body><Text>Special offer</Text></Body></Html> : <Html><Body><Text>Normal offer</Text></Body></Html>;
      T.PreviewProps = { special: false };
      export default T;`;
    const { check, codemod } = await convertBoth(source, "conditional-root");
    expect(check.missing).toEqual([]);
    expect(check.variants).toEqual([]);
    expect(codemod.code).not.toContain("<Html>");
  });

  it("allows escaped text samples to become tags without changing embedded styles", async () => {
    const source = `${IMPORTS}
      export default function T({ name, color }) { return <Html><Body><Text><strong>{name}</strong><span style={{ color }}> welcome</span></Text></Body></Html>; }
      T.PreviewProps = { name: '<Alex> & "Co"', color: "#ff0000" };`;
    const { runtime, check, Migrated } = await convertBoth(
      source,
      "escaped-tags",
    );
    expect(runtime.html()).toContain("<strong>{{name}}</strong>");
    expect(runtime.html()).not.toContain("{{color}}");
    const tagged = await mergeTagDesign(
      Migrated,
      Migrated.PreviewProps,
      check.design,
    );
    expect(JSON.stringify(tagged.design)).toContain("{{name}}");
    expect(JSON.stringify(tagged.design)).not.toContain("{{color}}");
  });
});
