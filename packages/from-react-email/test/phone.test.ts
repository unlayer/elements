import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { designOf, htmlOf } from "./elements";
import { convertReactEmail, convertSource, verifyNewComponents } from "../src/index";
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
    const check = await verifyNewComponents(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    expect(check.designWarnings).toEqual([]);
    return { runtime, codemod, codes: [runtime.code, codemod.code], html: [await runtime.html(), await htmlOf(Migrated({}))], designs: [runtime.design(), designOf(Migrated({}))] as any[] };
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
    const { codemod, codes, html } = await convertBoth(source);
    // The image's own phone rule, not its row's stacking.
    for (const output of html) expect(output).toMatch(/\.\w+\{width:100%!important;max-width:80px!important\}/);
    expect(codemod.code).toContain("hidden={{ mobile: true }}");
    // Named as the template writes it, not as <Tailwind> renames it (`hover_text-red-500`).
    expect(codemod.report.notes.filter(n => n.reason === "tailwind class not inlined").map(n => n.detail)).toEqual(["hover:text-red-500"]);
    for (const code of codes) {
      // The stacked columns' phone padding.
      expect(code.match(/<Column[^>]*mobile=\{\{ padding: "[^"]*16px[^"]*" \}\}/g)?.length).toBeGreaterThanOrEqual(2);
      // The editor can't hide a column: the spacer stacks with no height instead, holding only an invisible divider.
      expect(code).toMatch(/<Column[^>]*>\s*<Divider style=\{\{ borderTop: "0px solid #BBBBBB", padding: 0 \}\} \/>\s*<\/Column>/);
      expect(code).not.toMatch(/<Column[^>]*hidden=/);
      expect(code).toMatch(/mobile=\{\{\s*padding: "0px 8px 0px 8px",\s*fontSize: 14,\s*lineHeight: 1\.2,\s*textAlign: "center",?\s*\}\}\s*>\s*First phone text/);
      expect(code).toMatch(/mobile=\{\{ padding: "8px 0px 4px 0px" \}\}\s*>\s*Second phone text/);
      expect(code).toMatch(/alt="Landscape"[^>]*mobile=\{\{ width: "100%"/);
      expect(code).toMatch(/mobile=\{\{ padding: "4px 8px 4px 8px" \}\}\s*>\s*Open/);
      expect(code).toMatch(/hidden=\{\{ mobile: true \}\}\s*>\s*Desktop only/);
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
    expect(codemod.intermediate).toContain('borderLeftColor: "#ffffff"');
    // The stacking row's two columns get the phone edge; the Intro row's spacers became a
    // white border, as wide on phones as they were there (24/640 of the row).
    expect(codemod.intermediate.match(/borderLeftWidth: "14px"/g)?.length).toBe(2);
    expect(codemod.intermediate).toContain('borderLeftWidth: "3.75vw"');
    // 32px below the first item only.
    const paddings = [...codemod.intermediate.matchAll(/mobile=\{\{\s*padding: "([^"]+)"/g)].map((m) => m[1].split(" ")[2]);
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
    expect(codemod.intermediate).toMatch(/mobile=\{\{ containerPadding: "0px 11px 0px 0px", fontSize: "1[0-3]px" \}\}/);
    expect(codemod.intermediate.match(/fontSize: "/g)).toHaveLength(1);
    expect(codemod.code).toMatch(/mobile=\{\{ padding: "0px 11px 0px 0px", fontSize: 1[0-3] \}\}/);
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

  it("makes a button a phone rule shows as a block fill the column on phones, in both modes", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body><Container>
        <Text className="m-0">Ready?</Text>
        <Button href="https://example.com/start" className="bg-indigo-600 px-[20px] py-[12px] text-white max-sm:block max-sm:text-center">Start planning</Button>
      </Container></Body></Html></Tailwind>; }`;
    const { codemod, codes } = await convertBoth(source);
    for (const code of codes) expect(code).toMatch(/mobile=\{\{[^}]*width: "100%"[^}]*\}\}\s*>\s*Start planning/);
    expect(codemod.report.notes.filter((n) => n.reason === "tailwind class not inlined")).toEqual([]);
  });

  it("both modes carry phone-only row padding and hiding through nested sections", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body><Container>
        <Row className="max-sm:px-4 max-sm:hidden"><Column><Text className="m-0">Hidden row</Text></Column></Row>
        <Row><Column style={{ width: 300 }}><Section className="p-8 max-sm:p-2"><Text className="m-0">Nested section</Text></Section></Column><Column style={{ width: 300 }}><Text className="m-0">Neighbour</Text></Column></Row>
      </Container></Body></Html></Tailwind>; }`;
    const { codes, designs } = await convertBoth(source);
    for (const code of codes) {
      expect(code).toMatch(/<Section hidden=\{\{ mobile: true \}\}>\s*<Column mobile=\{\{ padding: "0px 16px 0px 16px" \}\}>/);
      expect(code).toMatch(/padding: "32px 32px 32px 32px" \}\}\s*mobile=\{\{ padding: "8px 8px 8px 8px" \}\}\s*>\s*<Paragraph[^>]*>\s*Nested section/);
    }
    // The visual editor hides the row on phones too.
    for (const design of designs) {
      const row = design.body.rows.find((r: any) => r.columns.some((c: any) => c.contents.some((i: any) => i.values.text?.includes("Hidden row"))));
      expect(row.values._override.mobile.hideMobile).toBe(true);
    }
  });
});
