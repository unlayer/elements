import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToJson, renderToHtml } from "@unlayer/react-elements";
import { convertReactEmail, convertSource, verifyConversion } from "../src/index";
import { phoneStyles } from "../src/tailwind";
import { handledPhoneClass, phoneSides, withPhoneStyles } from "../src/phone-styles";
import { htmlText, unbreakableWords } from "../src/text-width";

async function convertBoth(source: string) {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-phone-"));
  try {
    const file = path.join(dir, "phone.tsx");
    fs.writeFileSync(file, source);
    const { default: Original } = await import(file);
    const runtime = await convertReactEmail(Original, { mergeTags: false });
    const codemod = await convertSource(source, { fileName: "phone.tsx" });
    const migrated = path.join(dir, "migrated.tsx");
    fs.writeFileSync(migrated, codemod.code);
    const { default: Migrated } = await import(migrated);
    const check = await verifyConversion(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    expect(check.designWarnings).toEqual([]);
    return { runtime, codemod, html: [runtime.html(), renderToHtml(Migrated({}))], designs: [runtime.design(), renderToJson(Migrated({}))] as any[] };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const imports = `import { Html, Head, Body, Container, Section, Row, Column, Text, Img, Button, Tailwind } from "@react-email/components";`;

describe("phone styles", () => {
  it("cascades in stylesheet order and preserves unspecified desktop sides", () => {
    const rules = phoneStyles(`.px{@media(max-width:600px){padding-left:16px!important;padding-right:16px!important}} .left{@media(max-width:600px){padding-left:8px!important}}`);
    const desktop = { padding: "20px 32px" };
    const style = withPhoneStyles(desktop, ["left", "px"], rules);
    expect(phoneSides(style, "padding", { top: 20, right: 32, bottom: 20, left: 32 })).toEqual({ top: 20, right: 16, bottom: 20, left: 8 });
    expect(desktop).toEqual({ padding: "20px 32px" });
  });

  it("retains notes for partially supported typography and unsupported owners", () => {
    const rules = new Map([ ["full", { width: "100%" }], ["font", { fontSize: "24px", letterSpacing: "1px" }], ["size", { fontSize: "24px" }] ]);
    expect(handledPhoneClass("full", rules, "Img")).toBe(true);
    expect(handledPhoneClass("full", rules, "Text")).toBe(false);
    expect(handledPhoneClass("font", rules, "Text")).toBe(false);
    expect(handledPhoneClass("size", rules, "Text")).toBe(true);
  });

  it("both modes keep phone padding, typography, image sizing, margins and hiding", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body style={{ margin: 0 }}><Container style={{ maxWidth: 600 }}>
        <Section className="px-8 max-sm:px-4 py-6 max-sm:py-2">
          <Row>
            <Column className="max-sm:block max-sm:w-full">
              <Text className="m-0 text-[20px] max-sm:text-[14px] leading-[1.5] max-sm:leading-[1.2] text-left max-sm:text-center max-sm:px-2">First phone text</Text>
              <Text className="m-0 mt-8 max-sm:mt-2 mb-6 max-sm:mb-1">Second phone text</Text>
              <Img width={80} src="https://example.com/image.png" alt="Landscape" className="max-sm:w-full max-sm:max-w-full"/>
              <Button href="https://example.com" className="px-6 py-4 max-sm:px-2 max-sm:py-1">Open</Button>
            </Column>
            <Column className="max-sm:block max-sm:w-full"><Text className="m-0">Other stacked column</Text></Column>
            <Column style={{ width: 24 }} className="max-sm:hidden"/>
          </Row>
          <Text className="m-0 max-sm:hidden hover:text-red-500">Desktop only</Text>
        </Section>
      </Container></Body></Html></Tailwind>; }`;
    const { codemod, designs, html } = await convertBoth(source);
    for (const output of html) expect(output).toContain(".v-src-max-width { max-width: 100% !important; }");
    expect(codemod.code).toContain("mobile={{");
    expect(codemod.code).toContain("hideOnMobile={true}");
    expect(codemod.report.notes.filter(n => n.reason === "tailwind class not inlined").map(n => n.detail)).toEqual([expect.stringContaining("hover")]);
    for (const design of designs) {
      const rows = design.body.rows;
      const stacked = rows.find((r: any) => r.columns.some((c: any) => c.contents.some((item: any) => item.values.text?.includes("First phone text"))));
      for (const col of stacked.columns.slice(0, 2)) expect(col.values._override.mobile.padding).toContain("16px");
      // The editor can't hide a column: the empty spacer stacks with no height instead.
      expect(stacked.columns[2].contents).toEqual([]);
      expect(stacked.columns[2].values._override?.mobile?.hideMobile).toBeUndefined();
      const items = rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents));
      const first = items.find((c: any) => c.values.text?.includes("First phone text"));
      expect(first.values._override.mobile).toMatchObject({ fontSize: "14px", lineHeight: "1.2", textAlign: "center", containerPadding: "0px 8px 0px 8px" });
      const second = items.find((c: any) => c.values.text?.includes("Second phone text"));
      expect(second.values._override.mobile.containerPadding).toBe("8px 0px 4px 0px");
      expect(items.find((c: any) => c.type === "image").values._override.mobile.src.autoWidth).toBe(true);
      expect(items.find((c: any) => c.type === "button").values._override.mobile.padding).toBe("4px 8px 4px 8px");
      expect(items.find((c: any) => c.values.text?.includes("Desktop only")).values._override.mobile.hideMobile).toBe(true);
    }
  });

  it("never hides a column (the editor can't): a narrow box in a card widens on phones through its padding", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body style={{ margin: 0 }}><Container style={{ maxWidth: 640, padding: "0 16px" }}>
        <Section style={{ backgroundColor: "#ffffff", border: "1px solid #dddddd", borderRadius: 8 }}>
          <Section className="px-10 max-sm:px-6"><Text style={{ maxWidth: 310, margin: 0 }}>Narrow text in a card</Text></Section>
        </Section>
      </Container></Body></Html></Tailwind>; }`;
    const { designs, codemod } = await convertBoth(source);
    expect(codemod.code).not.toMatch(/<Column[^>]*hideOnMobile/);
    expect(codemod.report.notes.map((n) => n.reason)).not.toContain("narrow box inside a card keeps its share of the width on phones (wraps more there)");
    for (const design of designs) {
      const cols = design.body.rows.flatMap((r: any) => r.columns);
      expect(cols.every((c: any) => !c.values._override?.mobile?.hideMobile && !c.values._override?.desktop?.hideDesktop)).toBe(true);
      const content = cols.find((c: any) => c.contents.some((i: any) => i.values.text?.includes("Narrow text")));
      // The space around the narrow text is padding on its column, with a phone value.
      expect(content.values.padding).toMatch(/^0px \d+px 0px 40px$/);
      expect(content.values._override.mobile.padding).toBeDefined();
    }
  });

  it("keeps phone classes in a className chosen by a condition, per branch", async () => {
    // The layout swaps columns with one condition; the classNames pick their phone spacing with
    // the same condition under another name (`const isLeft = …`). Each branch gets its own classes.
    const source = `${imports}
      const items = [{ side: "left", title: "First" }, { side: "right", title: "Second" }];
      export default function T() { return <Tailwind><Html><Head/><Body><Container>
        {items.map((item) => {
          const isLeft = item.side === "left";
          const img = <Column key="img" className={\`max-sm:!block max-sm:!w-full w-[200px] align-top\${isLeft ? "" : " max-sm:pt-8"}\`}><Img width={200} src="https://example.com/a.png" alt="A"/></Column>;
          const txt = <Column key="txt" className={\`max-sm:!block max-sm:!w-full align-top\${isLeft ? " max-sm:pt-8" : ""}\`}><Text className="m-0">{item.title}</Text></Column>;
          return <Row key={item.title}>{item.side === "left" ? <>{img}{txt}</> : <>{txt}{img}</>}</Row>;
        })}
      </Container></Body></Html></Tailwind>; }`;
    const { codemod } = await convertBoth(source);
    // Both columns stack on phones (\`max-sm:!block\` survives), and the one stacked second gets 32px above.
    expect(codemod.code).not.toContain("noStackMobile");
    expect(codemod.code.match(/mobile=\{\{ padding: "32px/g)?.length).toBe(2);
  });

  it("keeps a card's edge on rows that stack, and the gaps a column's phone margin makes", async () => {
    // Inside a gray card on a white box, the side-by-side rows keep white spacers on phones;
    // the stacking row gets a white phone border instead (the editor can't pad a row's sides
    // in email). Each item but the last has a phone margin below it (\`isLast ? "" : …\`).
    const source = `${imports}
      function Item({ isLast, label }: { isLast?: boolean; label: string }) {
        return <Column className={\`max-sm:!block max-sm:!w-full w-1/2 align-top\${isLast ? "" : " max-sm:mb-8"}\`}><Text className="m-0">{label}</Text></Column>;
      }
      export default function T() { return <Tailwind><Html><Head/><Body><Container style={{ backgroundColor: "#ffffff", padding: "0 24px", maxWidth: 640 }}>
        <Section style={{ backgroundColor: "#f3f4f6", padding: "24px" }}>
          <Text className="m-0">Intro</Text>
          <Row><Item label="One"/><Item isLast label="Two"/></Row>
        </Section>
      </Container></Body></Html></Tailwind>; }`;
    const { codemod } = await convertBoth(source);
    expect(codemod.code).toContain('borderLeftColor: "#ffffff"');
    expect(codemod.code.match(/borderLeftWidth: "\d+px"/g)?.length).toBe(2);
    // 32px below the first item only.
    const paddings = [...codemod.code.matchAll(/mobile=\{\{\s*padding: "([^"]+)"/g)].map((m) => m[1].split(" ")[2]);
    expect(paddings).toContain("32px");
    expect(paddings.filter((p) => p === "32px")).toHaveLength(1);
  });

  it("shrinks text on phones when its longest word can't fit a column side by side", async () => {
    // A receipt total: on a 375px phone the 90px column is 51px wide, too narrow for "$14.99"
    // at 16px with 20px of padding, so the word would break in the middle.
    const source = `${imports}
      export default function T() { return <Html><Head/><Body><Container style={{ width: 660, maxWidth: 660 }}>
        <Section><Row>
          <Column style={{ width: 285 }}><Text style={{ margin: 0, fontSize: 10 }}>TOTAL</Text></Column>
          <Column style={{ width: 285 }}><Text style={{ margin: 0, fontSize: 16 }}>Paid</Text></Column>
          <Column style={{ width: 90 }}><Text style={{ margin: 0, fontSize: 16, fontWeight: 600, paddingRight: 20 }}>$14.99</Text></Column>
        </Row></Section>
      </Container></Body></Html>; }`;
    const { codemod, designs } = await convertBoth(source);
    // Padding shrinks with the row (20px × 375 / 660), then the text size makes up the rest.
    expect(codemod.code).toMatch(/mobile=\{\{ containerPadding: "0px 11px 0px 0px", fontSize: "1[0-3]px" \}\}/);
    expect(codemod.code.match(/fontSize: "/g)).toHaveLength(1);
    for (const design of designs) {
      const items = JSON.stringify(design);
      expect(items.match(/"mobile":\{[^}]*"fontSize"/g)).toHaveLength(1);
    }
  });

  it("reads the words a browser can't wrap inside", () => {
    expect(unbreakableWords(htmlText("Ana&#x27;s <a href=\"x\">well-known</a>&nbsp;demo, see https://example.com"))).toEqual(["Ana's", "well-", "known\u00a0demo,", "see"]);
    expect(htmlText('<span style="text-transform:uppercase">Total</span>')).toBe("TOTAL");
  });

  it("gives matching labels in the other columns the same phone size", async () => {
    const source = `${imports}
      export default function T() { return <Html><Head/><Body><Container style={{ width: 600, maxWidth: 600 }}>
        <Section><Row>
          {["documents", "links", "views"].map((label) => <Column key={label} style={{ width: 200, padding: "0 16px" }}><Text style={{ margin: 0, fontSize: 24 }}>{label}</Text></Column>)}
        </Row></Section>
      </Container></Body></Html>; }`;
    const { runtime } = await convertBoth(source);
    const sizes = [...JSON.stringify(runtime.design()).matchAll(/"mobile":\{[^}]*"fontSize":"(\d+)px"/g)].map((m) => Number(m[1]));
    expect(sizes).toHaveLength(3);
    expect(new Set(sizes).size).toBe(1);
    expect(sizes[0]).toBeLessThan(24);
  });

  it("both modes carry phone-only row padding and hiding through nested sections", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body><Container>
        <Row className="max-sm:px-4 max-sm:hidden"><Column><Text className="m-0">Hidden row</Text></Column></Row>
        <Row><Column style={{ width: 300 }}><Section className="p-8 max-sm:p-2"><Text className="m-0">Nested section</Text></Section></Column><Column style={{ width: 300 }}><Text className="m-0">Neighbour</Text></Column></Row>
      </Container></Body></Html></Tailwind>; }`;
    const { designs } = await convertBoth(source);
    for (const design of designs) {
      const row = design.body.rows.find((r: any) => r.columns.some((c: any) => c.contents.some((i: any) => i.values.text?.includes("Hidden row"))));
      expect(row.values._override.mobile.hideMobile).toBe(true);
      expect(row.columns[0].values._override.mobile.padding).toBe("0px 16px 0px 16px");
      const nested = design.body.rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents)).find((i: any) => i.values.text?.includes("Nested section"));
      const column = design.body.rows.flatMap((r: any) => r.columns).find((c: any) => c.contents.includes(nested));
      expect(column.values.padding).toBe("32px 32px 32px 32px");
      expect(column.values._override.mobile.padding).toBe("8px 8px 8px 8px");
    }
  });
});
