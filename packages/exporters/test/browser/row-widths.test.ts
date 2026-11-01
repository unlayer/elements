/**
 * Row widths with minimum and maximum widths, padding, gaps, children that
 * don't fit and room left over: what Chromium lays out for the Page (flexbox) and for the
 * Email (tables and inline-blocks, with and without its <style>) must be what
 * the resolver worked out, child by child.
 */
import { chromium, type Browser } from "playwright";
import { parseDocument, resolveDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { renderEmail, renderPage } from "../../src";

const column = (style: Record<string, unknown> = {}) => ({ type: "Column", style, children: [{ type: "Text", children: ["x"] }] });

const CASES: Array<[string, unknown[], Record<string, unknown>?]> = [
  ["a maximum", [column({ maxWidth: 100 }), column()]],
  ["a minimum", [column({ minWidth: 400 }), column()]],
  ["a maximum, with a gap", [column({ maxWidth: 100 }), column()], { gap: 20 }],
  ["a maximum beside a larger share", [column({ maxWidth: 100 }), column({ flex: 2 }), column()]],
  ["a minimum beside a fixed width", [column({ width: 200 }), column({ minWidth: 300 }), column()]],
  ["a minimum as a share, with a gap", [column({ minWidth: "50%" }), column(), column()], { gap: 10 }],
  ["padding on a sharing child", [column({ padding: [0, 30] }), column()]],
  ["fixed widths that don't fit", [column({ width: 400 }), column({ width: 300 })]],
  ["minimums that can't fit", [column({ minWidth: 400 }), column({ minWidth: 300 })]],
  ["a Divider with a % width", [{ type: "Divider", style: { width: "50%" } }, column()]],
  ["room left in a Row kept side by side", [column({ width: 100 }), column({ width: 200 })], { wrap: "none" }],
  ["room left in a Row kept side by side, at its end", [column({ width: 100 }), column({ width: 200 })], { wrap: "none", justify: "end" }],
];

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

async function measure(html: string, ids: string[], { style = true } = {}): Promise<number[]> {
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await page.setContent(html);
  if (!style) await page.evaluate(() => document.querySelectorAll("style").forEach((element) => element.remove()));
  const widths = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect().width), ids);
  await page.close();
  return widths.map(Math.round);
}

describe("Row widths in Chromium", () => {
  for (const [name, children, style] of CASES) {
    it(`gives each child the resolver's width: ${name}`, async () => {
      const ids = children.map((_, index) => `c${index}`);
      const template = (root: "Page" | "Email") =>
        resolveDocument(parseDocument({ version: 1, root: { type: root, props: { width: 600 }, children: [{ type: "Row", style, children: children.map((child, index) => ({ ...(child as object), id: ids[index] })) }] } }));
      const expected = (template("Email").root.children[0] as ResolvedNode).children.map((child) => (child as ResolvedNode).width);
      expect(await measure(renderPage(template("Page")).html, ids)).toEqual(expected);
      expect(await measure(renderEmail(template("Email")).html, ids)).toEqual(expected);
      expect(await measure(renderEmail(template("Email")).html, ids, { style: false })).toEqual(expected);
    });
  }
});
