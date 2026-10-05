import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToJson, renderToHtml } from "@unlayer/react-elements";
import { convertReactEmail, convertSource, verifyConversion } from "../src/index";
import { phoneStyles } from "../src/tailwind";
import { handledPhoneClass, phoneSides, withPhoneStyles } from "../src/phone-styles";

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
      expect(stacked.columns[2].contents).toEqual([]);
      expect(stacked.columns[2].values._override.mobile.hideMobile).toBe(true);
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

  it("keeps pixel padding when desktop spacer columns shrink and narrow text expands on phones", async () => {
    const source = `${imports}
      export default function T() { return <Tailwind><Html><Head/><Body style={{ margin: 0 }}><Container style={{ maxWidth: 640, padding: "0 16px" }}>
        <Section style={{ backgroundColor: "#ffffff", border: "1px solid #dddddd", borderRadius: 8 }}>
          <Section className="px-10 max-sm:px-6"><Text style={{ maxWidth: 310, margin: 0 }}>Narrow text in a card</Text></Section>
        </Section>
      </Container></Body></Html></Tailwind>; }`;
    const { designs } = await convertBoth(source);
    for (const design of designs) {
      const cols = design.body.rows.flatMap((r: any) => r.columns);
      expect(cols.some((c: any) => !c.contents.length && c.values._override?.mobile?.hideMobile)).toBe(true);
      const content = cols.find((c: any) => c.contents.some((i: any) => i.values.text?.includes("Narrow text")));
      expect(content.values._override.mobile.padding).toBe("0px calc(40px - 2.5vw) 0px calc(40px - 2.5vw)");
      expect(content.values.padding).toBe("0px 0px 0px 40px");
    }
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
