/**
 * What Chromium lays out matches what the resolver worked out: every box's
 * width on desktop, stacking and hiding on phones. The resolver is what every
 * target reads (email needs its widths in px), so a difference here is a
 * difference between targets.
 */
import { chromium, type Browser, type Page } from "playwright";
import { resolveDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { template } from "./fixture";
import { renderPage } from "../../src";

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
