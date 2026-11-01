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

const CASES: Array<[string, unknown[], Record<string, unknown>?, Record<string, unknown>?]> = [
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
  ["room left in a Row kept side by side", [column({ width: 100 }), column({ width: 200 })], {}, { stackOnMobile: false }],
  ["room left in a Row kept side by side, at its end", [column({ width: 100 }), column({ width: 200 })], { justifyContent: "end" }, { stackOnMobile: false }],
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

describe("gaps beside hidden children in Chromium", () => {
  // A child hidden on desktop takes no width there, and no gap: the others keep the resolver's widths side by side.
  const CHILDREN = [{ ...column(), hidden: { desktop: true } }, column(), column()];
  for (const props of [{}, { stackOnMobile: false }]) {
    it(`keeps the shown children side by side at the resolver's widths${props.stackOnMobile === false ? " (kept side by side on phones)" : ""}`, async () => {
      const ids = CHILDREN.map((_, index) => `c${index}`);
      const template = (root: "Page" | "Email") =>
        resolveDocument(parseDocument({ root: { type: root, props: { width: 600 }, children: [{ type: "Row", style: { gap: 20 }, props, children: CHILDREN.map((child, index) => ({ ...child, id: ids[index] })) }] } }));
      const expected = (template("Email").root.children[0] as ResolvedNode).children.map((child) => (child as ResolvedNode).width);
      for (const [html, style] of [[renderPage(template("Page")).html, true], [renderEmail(template("Email")).html, true], [renderEmail(template("Email")).html, false]] as const) {
        const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
        await page.setContent(html);
        if (!style) await page.evaluate(() => document.querySelectorAll("style").forEach((element) => element.remove()));
        const boxes = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ width, top }) => ({ width: Math.round(width), top })), ids.slice(1));
        await page.close();
        expect(boxes.map((box) => box.width)).toEqual(expected.slice(1));
        expect(boxes[1].top).toBe(boxes[0].top);
      }
    });
  }

  it("keeps the children beside one hidden on desktop in the middle side by side, at the resolver's widths", async () => {
    for (const props of [{}, { stackOnMobile: false }]) {
      const children = [column(), { ...column(), hidden: { desktop: true } }, column()].map((child, index) => ({ ...child, id: `m${index}` }));
      const resolved = resolveDocument(parseDocument({ root: { type: "Email", props: { width: 600 }, children: [{ type: "Row", style: { gap: 20 }, props, children }] } }));
      const expected = (resolved.root.children[0] as ResolvedNode).children.map((child) => (child as ResolvedNode).width);
      const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
      await page.setContent(renderEmail(resolved).html);
      const [a, c] = await page.evaluate(() => ["m0", "m2"].map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ width, top }) => ({ width: Math.round(width), top })));
      await page.close();
      expect([a.width, c.width]).toEqual([expected[0], expected[2]]);
      expect(c.top).toBe(a.top);
    }
  });

  it("leaves no gap beside a child hidden on phones: under a stacking Row's last, between a side-by-side Row's neighbours", async () => {
    const measure = async (props: Record<string, unknown>, count: number, hidden: number, ids: string[]) => {
      const children = Array.from({ length: count }, (_, index) => ({ ...column(), id: `p${index}`, hidden: index === hidden ? { mobile: true } : undefined }));
      const html = renderEmail(resolveDocument(parseDocument({ root: { type: "Email", props: { width: 600 }, children: [{ type: "Row", id: "row", style: { gap: 20 }, props, children }] } }))).html;
      const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
      await page.setContent(html);
      const boxes = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ left, right, bottom }) => ({ left, right, bottom })), ids);
      await page.close();
      return boxes;
    };
    const [first, row] = await measure({}, 2, 1, ["p0", "row"]);
    expect(Math.round(row.bottom - first.bottom)).toBe(0);
    const [a, c] = await measure({ stackOnMobile: false }, 3, 1, ["p0", "p2"]);
    expect(Math.round(c.left - a.right)).toBe(20);
  });

  it("puts the phone gap between a child shown only on phones and the next, where the Row stacks", async () => {
    const ids = CHILDREN.map((_, index) => `c${index}`);
    const html = renderEmail(resolveDocument(parseDocument({ root: { type: "Email", props: { width: 600 }, children: [{ type: "Row", style: { gap: 20 }, children: CHILDREN.map((child, index) => ({ ...child, id: ids[index] })) }] } }))).html;
    const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
    await page.setContent(html);
    const [phoneOnly, first] = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ top, bottom }) => ({ top, bottom })), ids);
    await page.close();
    expect(Math.round(first.top - phoneOnly.bottom)).toBe(20);
  });
});

describe("Row widths in Chromium", () => {
  for (const [name, children, style, props] of CASES) {
    it(`gives each child the resolver's width: ${name}`, async () => {
      const ids = children.map((_, index) => `c${index}`);
      const template = (root: "Page" | "Email") =>
        resolveDocument(parseDocument({ root: { type: root, props: { width: 600 }, children: [{ type: "Row", style, props, children: children.map((child, index) => ({ ...(child as object), id: ids[index] })) }] } }));
      const expected = (template("Email").root.children[0] as ResolvedNode).children.map((child) => (child as ResolvedNode).width);
      expect(await measure(renderPage(template("Page")).html, ids)).toEqual(expected);
      expect(await measure(renderEmail(template("Email")).html, ids)).toEqual(expected);
      expect(await measure(renderEmail(template("Email")).html, ids, { style: false })).toEqual(expected);
    });
  }
});

describe("children of their own size in Chromium", () => {
  // Links whose width only the client knows, packed at the Row's start, center or end: where the Page's flexbox puts
  // each one, the Email's table puts it too.
  const WORDS = ["Docs", "Blog", "Careers"];
  for (const justifyContent of ["start", "center", "end"]) {
    it(`packs them at the ${justifyContent}, as the page does`, async () => {
      const ids = WORDS.map((_, index) => `l${index}`);
      const template = (root: "Page" | "Email") =>
        resolveDocument(
          parseDocument({
            root: {
              type: root,
              props: { width: 600 },
              children: [
                {
                  type: "Row",
                  props: { stackOnMobile: false },
                  style: { gap: 30, justifyContent },
                  children: WORDS.map((word, index) => ({ type: "Link", id: ids[index], props: { href: "#" }, style: { flex: "none" }, children: [word] })),
                },
              ],
            },
          })
        );
      const boxes = async (html: string, style = true) => {
        const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
        await page.setContent(html);
        if (!style) await page.evaluate(() => document.querySelectorAll("style").forEach((element) => element.remove()));
        const found = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ x, width }) => [Math.round(x), Math.round(width)]), ids);
        await page.close();
        return found;
      };
      const expected = await boxes(renderPage(template("Page")).html);
      expect(await boxes(renderEmail(template("Email")).html)).toEqual(expected);
      expect(await boxes(renderEmail(template("Email")).html, false)).toEqual(expected);
    });
  }
});
