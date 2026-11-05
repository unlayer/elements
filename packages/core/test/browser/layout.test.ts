/**
 * What Chromium lays out matches what the resolver worked out: every box's
 * width on desktop, stacking and hiding on phones. The resolver is what every
 * target reads (email needs its widths in px), so a difference here is a
 * difference between targets.
 */
import { chromium, type Browser, type Page } from "playwright";
import { parseDocument, resolveDocument, type ResolvedNode } from "../../src";
import { template } from "./fixture";
import { renderPage } from "../../src/writers";

const resolved = resolveDocument(template("Page"));
const { html } = renderPage(resolved);

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});
afterAll(async () => browser?.close());

async function widths(viewport: number): Promise<Record<string, { width: number; content: number; top: number; display: string }>> {
  await page.setViewportSize({ width: viewport, height: 900 });
  await page.setContent(html);
  return page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("[id]")].map((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const frame = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, key) => sum + parseFloat(style[key as "paddingLeft"]), 0);
        return [element.id, { width: box.width, content: box.width - frame, top: box.top, display: style.display }];
      })
    )
  );
}

function sized(node: ResolvedNode, into: ResolvedNode[] = []): ResolvedNode[] {
  if (node.width !== null && node.type !== "Page" && node.id) into.push(node);
  for (const child of node.children) if (typeof child !== "string") sized(child, into);
  return into;
}

describe("web layout in Chromium", () => {
  it("gives every box the width the resolver worked out, on desktop", async () => {
    expect(resolved.diagnostics).toEqual([]);
    const measured = await widths(1280);
    const expected = sized(resolved.root);
    expect(expected.length).toBeGreaterThan(10);
    for (const node of expected) {
      // A Section spans the window; what the resolver gives it is the width of its content column.
      const box = measured[node.id!];
      if (node.type === "Section") expect([node.id, Math.round(box.content)]).toEqual([node.id, node.contentWidth]);
      // A list's padding holds its markers too: its items' widths (listitem_*) are what it gives them.
      else if (node.type === "List") expect([node.id, Math.round(box.width)]).toEqual([node.id, node.width]);
      else expect([node.id, Math.round(box.width), Math.round(box.content)]).toEqual([node.id, node.width, node.contentWidth]);
    }
  });

  it("stacks Rows full-width and hides what's hidden on phones", async () => {
    const measured = await widths(375);
    expect(measured["desktop-only"].display).toBe("none");
    const row = measured.row_1;
    // The Row's content: 375 less its 10px padding each side; its children stack one under another.
    for (const id of ["column_1", "column_2"]) expect(Math.round(measured[id].width)).toBe(355);
    expect(measured.column_2.top).toBeGreaterThan(measured.column_1.top);
    expect(row.width).toBe(375);
    // A Section spans the window, its content inside its own padding.
    expect(measured.section_2.width).toBe(375);
    expect(measured.section_2.content).toBe(335);
  });

  it("shows the hidden-on-phones column on desktop, beside the others", async () => {
    const measured = await widths(1280);
    expect(measured["desktop-only"].display).toBe("flex");
    expect(measured["desktop-only"].top).toBe(measured.column_1.top);
  });
});

describe("an Svg in Chromium", () => {
  // Its drawing is the width and height it says; its padding and border are around it, as the resolver counts them.
  const svg = (style: Record<string, unknown> = {}) => ({ type: "Svg", id: "drawing", props: { width: 100, height: 50 }, style, children: [{ type: "Rect", props: { width: 100, height: 50 } }] });
  const CASES: Array<[string, Record<string, unknown>]> = [
    ["with padding and a border", { type: "Column", children: [svg({ padding: 20, border: "2px solid #000" })] }],
    ["in a stack that stretches its children", { type: "Column", style: { alignItems: "stretch" }, children: [svg({ padding: 10 })] }],
    ["in a Row, beside a Text", { type: "Row", style: { gap: 10 }, children: [svg({ padding: 10 }), { type: "Text", id: "beside", children: ["words"] }] }],
    ["wider than its room", { type: "Column", style: { width: 80 }, children: [svg()] }],
  ];
  for (const [name, child] of CASES) {
    it(`draws it as wide as the resolver says, its drawing as wide as it says: ${name}`, async () => {
      const resolved = resolveDocument(parseDocument({ root: { type: "Page", props: { width: 600 }, children: [child] } }));
      const expected: Record<string, number | null> = {};
      const collect = (node: ResolvedNode) => {
        if (node.id) expected[node.id] = node.width;
        for (const c of node.children) if (typeof c !== "string") collect(c);
      };
      collect(resolved.root);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.setContent(renderPage(resolved).html);
      const measured = await page.evaluate(() =>
        Object.fromEntries(
          ["drawing", "beside"].flatMap((id) => {
            const element = document.getElementById(id);
            if (!element) return [];
            const style = getComputedStyle(element);
            const frame = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, key) => sum + parseFloat(style[key as "paddingLeft"]), 0);
            const width = element.getBoundingClientRect().width;
            return [[id, Math.round(width)], [`${id}-content`, Math.round(width - frame)]];
          })
        )
      );
      expect(measured.drawing).toBe(expected.drawing);
      expect(measured["drawing-content"]).toBe(100);
      if (expected.beside !== undefined) expect(measured.beside).toBe(expected.beside);
    });
  }
});
