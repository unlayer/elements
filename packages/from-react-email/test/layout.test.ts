/**
 * The layout engine, through small templates: how CSS boxes become Elements
 * rows. Runtime mode (no code holes) shows the layout most directly.
 */

import { describe, expect, it } from "vitest";
import React from "react";
import { Body, Column, Container, Head, Html, Img, Row, Section, Tailwind, Text } from "@react-email/components";
import { convertElement, convertSource } from "../src/index";

const h = React.createElement;

/** The Email's rows, as their props and their columns' props and texts. */
async function rows(...children: React.ReactNode[]) {
  const { tree, report } = await convertElement(h(Html, null, h(Body, null, ...children)));
  const shape = (tree.children as any[]).map((row) => ({
    ...row.props,
    columns: (row.children as any[]).map((col) => ({
      ...col.props,
      text: (col.children ?? []).map((b: any) => (b.children ?? []).join("") || b.props?.html || "").join(" | "),
    })),
  }));
  return { shape, report };
}

describe("boxes", () => {
  it("paints a full-width box on the row's content box", async () => {
    const { shape } = await rows(h(Container, { style: { backgroundColor: "#ffffff" } }, h(Section, { style: { backgroundColor: "#eeeeee" } }, h(Text, { style: { margin: 0 } }, "Inside"))));
    expect(shape).toEqual([{ columnsBackgroundColor: "#eeeeee", columns: [{ text: "Inside" }] }]);
  });

  it("insets a card inside a padded box: spacer columns, its look on the column inside", async () => {
    const card = { backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "24px" };
    const { shape } = await rows(
      h(Container, { style: { backgroundColor: "#ffffff", padding: "0 32px" } }, h(Section, { style: card }, h(Text, { style: { margin: 0 } }, "Card")))
    );
    expect(shape).toHaveLength(1);
    expect(shape[0].cells).toEqual([32, 536, 32]);
    expect(shape[0].columnsBackgroundColor).toBe("#ffffff");
    const [left, inside, right] = shape[0].columns;
    expect(left).toEqual({ text: "" });
    expect(right).toEqual({ text: "" });
    expect(inside).toMatchObject({ backgroundColor: "#f0f9ff", padding: "24px 24px 24px 24px", borderRadius: "8px 8px 8px 8px", text: "Card" });
    expect(inside.border).toMatchObject({ borderTopWidth: "1px", borderLeftColor: "#bae6fd", borderBottomStyle: "solid" });
  });

  it("keeps a box's outline around columns side by side, which stay side by side on phones", async () => {
    const box = h(Section, { style: { border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fafafa" } }, h(Row, null, h(Column, null, h(Text, null, "A")), h(Column, null, h(Text, null, "B"))));
    const { shape } = await rows(h(Container, null, box));
    expect(shape[0].noStackMobile).toBe(true);
    const [a, b] = shape[0].columns;
    expect(a.borderRadius).toBe("8px 0px 0px 8px");
    expect(b.borderRadius).toBe("0px 8px 8px 0px");
    expect(Object.keys(a.border)).toEqual(expect.arrayContaining(["borderLeftWidth", "borderTopWidth", "borderBottomWidth"]));
    expect(a.border.borderRightWidth).toBeUndefined();
    expect(b.border.borderRightWidth).toBe("1px");
  });

  it("paints a section outside the container across the full width", async () => {
    const { shape } = await rows(h(Section, { style: { backgroundColor: "#111111" } }, h(Text, { style: { margin: 0 } }, "Band")));
    expect(shape[0]).toMatchObject({ backgroundColor: "#111111" });
    expect(shape[0].columnsBackgroundColor).toBeUndefined();
  });

  it("centers a narrower Section as React Email's table does (align=\"center\"), unless told otherwise", async () => {
    const narrow = (props: Record<string, unknown>) => h(Section, { ...props, style: { maxWidth: "400px", ...(props.style as object) } }, h(Text, { style: { margin: 0 } }, "Narrow"));
    const { shape } = await rows(h(Container, null, narrow({}), narrow({ align: "left" }), narrow({ style: { margin: 0 } })));
    // The space around each box is padding on its column (the box takes the phone's full width,
    // and padding has a phone value). The two left-aligned boxes sit alike: one row holds both.
    expect(shape.map((r: any) => r.columns.map((c: any) => c.padding))).toEqual([["0px 100px 0px 100px"], ["0px 200px 0px 0px"]]);
    expect(shape.map((r: any) => r.columns[0].mobile?.padding)).toEqual(["0px 0px 0px 0px", "0px 0px 0px 0px"]);
    expect(shape[1].columns[0].text).toBe("Narrow | Narrow");
  });

  it("centers a narrow box with spacer columns", async () => {
    const { shape } = await rows(h(Container, null, h(Section, { style: { width: "240px", margin: "0 auto" } }, h(Text, { style: { margin: 0 } }, "Narrow"))));
    expect(shape[0].cells).toEqual([180, 240, 180]);
    expect(shape[0].columns.map((c: any) => c.text)).toEqual(["", "Narrow", ""]);
  });
});

describe("phones", () => {
  it("stacks a row only where the template makes its columns full width on phones", async () => {
    const two = (className?: string) => h(Row, null, h(Column, { className }, h(Text, null, "A")), h(Column, { className }, h(Text, null, "B")));
    const { tree } = await convertElement(h(Tailwind, null, h(Html, null, h(Head), h(Body, null, two("max-sm:block max-sm:w-full"), two()))));
    const [marked, plain] = tree.children as any[];
    expect(marked.props.noStackMobile).toBeUndefined();
    expect(plain.props.noStackMobile).toBe(true);
  });

  it("keeps a padded box's inset as padding around a narrow text, so it stays on phones", async () => {
    const { shape } = await rows(h(Container, { style: { padding: "0 40px" } }, h(Text, { style: { maxWidth: "310px", margin: 0 } }, "Narrow")));
    expect(shape[0].cells).toBeUndefined();
    expect(shape[0].noStackMobile).toBeUndefined();
    // 40 inset + 310 text + 250 to the right; on phones only the box's 40px inset stays.
    expect(shape[0].columns[0]).toMatchObject({ padding: "0px 250px 0px 40px", mobile: { padding: "0px 40px 0px 40px" }, text: "Narrow" });
  });

  it("keeps a card's spacers on phones", async () => {
    const card = { backgroundColor: "#f0f9ff", padding: "24px" };
    const { shape } = await rows(h(Container, { style: { backgroundColor: "#ffffff", padding: "0 32px" } }, h(Section, { style: card }, h(Text, { style: { margin: 0 } }, "Card"))));
    expect(shape[0].noStackMobile).toBe(true);
  });
});

describe("phones: more", () => {
  it("stacks the rows of a box that only has a divider line, keeping the line on a row of its own", async () => {
    const footer = h(Section, { style: { borderTop: "1px solid #dddddd", padding: "0 40px" } }, h(Text, { style: { maxWidth: "320px", margin: 0 } }, "Footer"));
    const { shape } = await rows(h(Container, null, footer));
    const text = shape.find((r: any) => r.columns.some((c: any) => c.text === "Footer"));
    expect(text.noStackMobile).toBeUndefined();
    expect(shape[0].columns.some((c: any) => c.border?.borderTopWidth === "1px")).toBe(true);
  });

  it("puts the space above a row that stacks on phones in a row of its own (each column would repeat it)", async () => {
    const two = h(Row, null, h(Column, { className: "max-sm:block" }, h(Text, null, "A")), h(Column, { className: "max-sm:block" }, h(Text, null, "B")));
    const { tree } = await convertElement(h(Tailwind, null, h(Html, null, h(Head), h(Body, null, h(Section, { style: { marginTop: "40px" } }, two)))));
    const [spacer, row] = tree.children as any[];
    expect(spacer.children).toHaveLength(1);
    expect(spacer.children[0].props.padding).toBe("40px 0px 0px 0px");
    expect(row.children.every((c: any) => !String(c.props?.padding ?? "").startsWith("40px"))).toBe(true);
  });

  it("moves an icon's gap into spacer columns when it would leave the icon no room on a phone", async () => {
    const icon = (n: number) => h(Column, { style: { width: "20px", paddingRight: "32px" } }, h(Img, { src: `https://example.com/${n}.png`, width: 20, height: 20, alt: `${n}` }));
    const { shape } = await rows(h(Container, null, h(Section, { align: "left", style: { width: "156px" } }, h(Row, null, icon(1), icon(2), icon(3)))));
    expect(shape[0].noStackMobile).toBe(true);
    expect(shape[0].cells.slice(0, 6)).toEqual([20, 32, 20, 32, 20, 32]);
  });

  it("lays a bordered card's inside out within its border, so text keeps its width", async () => {
    const card = { border: "1px solid #dddddd", backgroundColor: "#ffffff" };
    const { shape } = await rows(h(Container, { style: { padding: "0 16px" } }, h(Section, { style: card }, h(Section, { style: { padding: "0 40px" } }, h(Text, { style: { maxWidth: "479px", margin: 0 } }, "Text")))));
    const row = shape.find((r: any) => r.columns.some((c: any) => c.text === "Text"));
    // 16 spacer | 1 border + 40 padding + 479 text + 47 padding + 1 border | 16 spacer
    expect(row.cells).toEqual([16, 568, 16]);
    expect(row.columns[1].padding).toBe("0px 47px 0px 40px");
  });

  it("grows a narrow box to fit the fixed widths inside it, as a table does", async () => {
    const cell = h(Column, { style: { width: "60px" } }, h(Text, null, "x"));
    const { shape } = await rows(h(Container, null, h(Section, { align: "left", style: { width: "100px" } }, h(Row, null, cell, cell, cell))));
    expect(shape[0].cells.slice(0, 3)).toEqual([60, 60, 60]);
  });
});

describe("the report", () => {
  it("names styles Elements can't express, and column vertical alignment", async () => {
    const box = { boxShadow: "0 1px 2px #000", backgroundImage: "linear-gradient(#fff, #000)" };
    const cols = h(Row, null, h(Column, { style: { verticalAlign: "middle" } }, h(Text, null, "A")), h(Column, null, h(Text, { style: { textShadow: "0 0 1px red" } }, "B")));
    const { report } = await rows(h(Container, null, h(Section, { style: box }, cols)));
    const details = report.notes.filter((n) => n.reason === "style not converted").map((n) => n.detail);
    expect(details).toEqual(expect.arrayContaining(["box-shadow (Section)", "background gradient (Section)", "text-shadow (text)"]));
    expect(report.notes).toContainEqual({ reason: "column vertical alignment (Elements email columns align to the top)", detail: "middle" });
  });
});

describe("text with a box of its own", () => {
  it("gives a text with a background its own card (a code box)", async () => {
    const { shape } = await rows(h(Container, { style: { padding: "0 20px" } }, h(Text, { style: { backgroundColor: "#f5f5f5", padding: "16px", borderRadius: "8px", margin: 0 } }, "482913")));
    expect(shape[0].cells).toEqual([20, 560, 20]);
    expect(shape[0].columns[1]).toMatchObject({ backgroundColor: "#f5f5f5", padding: "16px 16px 16px 16px", text: "482913" });
  });

  it("narrows a text with a max-width, so it wraps where the original does", async () => {
    const { shape } = await rows(h(Container, null, h(Text, { style: { maxWidth: "380px", margin: "0 auto" } }, "Narrow text")));
    expect(shape[0].cells).toBeUndefined();
    expect(shape[0].columns[0]).toMatchObject({ padding: "0px 110px 0px 110px", mobile: { padding: "0px 0px 0px 0px" } });
  });
});

describe("vertical space", () => {
  it("collapses sibling margins like CSS, and merges rows that differ only in padding", async () => {
    const { shape } = await rows(
      h(Container, { style: { backgroundColor: "#ffffff" } }, h(Section, { style: { marginBottom: "24px" } }, h(Text, { style: { margin: 0 } }, "One")), h(Section, { style: { marginTop: "40px" } }, h(Text, { style: { margin: 0 } }, "Two")))
    );
    // One row: the 40px gap (the larger margin) between the two blocks.
    expect(shape).toHaveLength(1);
    expect(shape[0].columns[0].text).toBe("One | Two");
  });

  it("paints the space above a card like the box around it, not like the card", async () => {
    const { shape } = await rows(
      h(Container, { style: { backgroundColor: "#ffffff", padding: "0 24px" } }, h(Text, { style: { margin: 0 } }, "Before"), h(Section, { style: { marginTop: "20px", backgroundColor: "#eeeeee" } }, h(Text, { style: { margin: 0 } }, "Card")))
    );
    const card = shape.find((r: any) => r.columns.some((c: any) => c.text === "Card"));
    const gapAboveCard = shape[shape.indexOf(card) - 1];
    expect(card.columns[1].backgroundColor).toBe("#eeeeee");
    expect(gapAboveCard.columns.every((c: any) => c.backgroundColor !== "#eeeeee")).toBe(true);
  });
});

describe("codemod preparation", () => {
  it("splits a conditional className into one element per class list", async () => {
    const source = `
      import { Html, Body, Container, Section, Text, Tailwind } from "@react-email/components";
      export default function T({ highlighted }: { highlighted: boolean }) {
        return (
          <Html><Tailwind><Body><Container>
            <Section className={highlighted ? "bg-indigo-50 p-4" : "bg-white p-4"}><Text>Plan</Text></Section>
          </Container></Body></Tailwind></Html>
        );
      }`;
    const { code, report } = await convertSource(source);
    expect(code).toMatch(/highlighted \?/);
    expect(code).toContain('"#eef2ff"');
    expect(code).toContain('"#ffffff"');
    expect(report.notes.filter((n) => n.reason === "dynamic className")).toEqual([]);
  });

  it("only splits when the inlinable classes differ (mobile: variants can't be inlined anyway)", async () => {
    const source = `
      import { Html, Body, Container, Section, Text, Tailwind } from "@react-email/components";
      export default function T({ wide }: { wide: boolean }) {
        return (
          <Html><Tailwind><Body><Container>
            <Section className={wide ? "p-4 mobile:p-2" : "p-4"}><Text>Same</Text></Section>
          </Container></Body></Tailwind></Html>
        );
      }`;
    const { code } = await convertSource(source);
    expect(code).not.toMatch(/wide \?/);
  });

  it("inlines a component that renders a tag passed as a prop, keeping the tag a plain name", async () => {
    const source = `
      import { Html, Body, Container, Text, Tailwind } from "@react-email/components";
      const Shell = ({ Wrapper, children }: { Wrapper: any; children: any }) => <Wrapper><Html><Body><Container>{children}</Container></Body></Html></Wrapper>;
      export default function T() {
        return <Shell Wrapper={Tailwind}><Text>Hello</Text></Shell>;
      }`;
    const { code } = await convertSource(source);
    expect(code).toContain("Hello");
    expect(code).not.toContain("(Tailwind)");
  });
});
