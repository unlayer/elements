/**
 * Row widths with minimum and maximum widths, padding, gaps, children that
 * don't fit and room left over: what Chromium lays out for the Page (flexbox) and for the
 * Email (tables and inline-blocks, with and without its <style>) must be what
 * the resolver worked out, child by child.
 */
import { chromium, type Browser } from "playwright";
import { parseDocument, resolveDocument, type ResolvedNode } from "../../src";
import { renderEmail, renderPage, renderTemplate } from "../../src/writers";

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
  ["a Row that wraps, each child on a line of its own", [column({ width: 400 }), column({ width: 400 })], { flexWrap: "wrap" }, { stackOnMobile: false }],
  ["a Row that wraps, two children on a line and one on the next", [column({ width: 200 }), column({ width: 200 }), column({ width: 400 })], { flexWrap: "wrap", gap: 10 }, { stackOnMobile: false }],
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

describe("a Row kept side by side, on phones", () => {
  it("keeps each child's share of the width, as the page does, whatever their words", async () => {
    const text = (words: string) => ({ type: "Text", children: [words] });
    const children = [
      { type: "Column", id: "s0", children: [text("Write anything: docs, notes and wikis that feel effortless to create.")] },
      { type: "Column", id: "s1", style: { flex: 2 }, children: [text("Plan.")] },
      { type: "Column", id: "s2", children: [text("Find it fast.")] },
    ];
    const template = (root: "Page" | "Email") =>
      resolveDocument(parseDocument({ root: { type: root, props: { width: 600 }, children: [{ type: "Row", props: { stackOnMobile: false }, style: { gap: 24 }, children }] } }));
    const boxes = async (html: string) => {
      const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
      await page.setContent(html);
      const found = await page.evaluate(() => ["s0", "s1", "s2"].map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ x, width }) => [Math.round(x), Math.round(width)]));
      await page.close();
      return found;
    };
    expect(await boxes(renderEmail(template("Email")).html)).toEqual(await boxes(renderPage(template("Page")).html));
  });
});

describe("a Grid kept side by side, on phones", () => {
  it("keeps the last row's cells as wide as the others, in the email and on the page", async () => {
    const children = ["a", "b", "c"].map((words, index) => ({ type: "Text", id: `g${index}`, children: [words] }));
    const template = (root: "Page" | "Email") =>
      resolveDocument(parseDocument({ root: { type: root, props: { width: 600 }, children: [{ type: "Grid", props: { stackOnMobile: false }, children }] } }));
    for (const html of [renderEmail(template("Email")).html, renderPage(template("Page")).html]) {
      const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
      await page.setContent(html);
      const widths = await page.evaluate(() => ["g0", "g1", "g2"].map((id) => Math.round(document.getElementById(id)!.getBoundingClientRect().width)));
      await page.close();
      expect(widths).toEqual([widths[0], widths[0], widths[0]]);
    }
  });
});

describe("a Grid stacked on phones", () => {
  it("puts its gap between every two of its children, with a rowGap of its own between its rows on desktop", async () => {
    const children = ["a", "b", "c", "d", "e"].map((words, index) => ({ type: "Text", id: `s${index}`, children: [words] }));
    for (const [style, mobile, expected] of [
      [{ gap: 10, rowGap: 30 }, undefined, 10],
      [{ rowGap: 30 }, undefined, 0],
      [{ gap: 10, rowGap: 30 }, { gap: 4 }, 4],
    ] as const) {
      const template = (root: "Page" | "Email") =>
        resolveDocument(parseDocument({ root: { type: root, props: { width: 600 }, children: [{ type: "Grid", style, ...(mobile ? { mobile } : {}), children }] } }));
      for (const html of [renderEmail(template("Email")).html, renderPage(template("Page")).html]) {
        const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
        await page.setContent(html);
        const boxes = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ top, bottom }) => ({ top, bottom })), children.map((child) => child.id));
        await page.close();
        const gaps = boxes.slice(1).map((box, index) => Math.round(box.top - boxes[index].bottom));
        expect([JSON.stringify(style), gaps]).toEqual([JSON.stringify(style), gaps.map(() => expected)]);
      }
    }
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
  // A Button and Links whose width only the client knows, packed at the Row's start, center or end: where the Page's
  // flexbox puts each one, the Email's table puts it too, each on one line however many words it has.
  const CHILDREN = [
    { type: "Button", props: { href: "#" }, children: ["Get started today"] },
    { type: "Link", props: { href: "#" }, children: ["Read the docs"] },
    { type: "Link", props: { href: "#" }, children: ["Careers"] },
  ];
  for (const justifyContent of ["start", "center", "end"]) {
    it(`packs them at the ${justifyContent}, as the page does`, async () => {
      const ids = CHILDREN.map((_, index) => `l${index}`);
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
                  children: CHILDREN.map((child, index) => ({ ...child, id: ids[index], style: { flex: "none" } })),
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

describe("an Html block in a stack with a gap, in Chromium", () => {
  it("keeps the gap around the block, not between what's in it, as the email does", async () => {
    const html = (root: "Page" | "Email") =>
      renderTemplate({ root: { type: root, props: { width: 600 }, children: [{ type: "Column", style: { gap: 24 }, children: [{ type: "Html", props: { html: '<div id="a">a</div><div id="b">b</div>' } }, { type: "Text", id: "c", children: ["c"] }] }] } }).html;
    const tops = async (markup: string) => {
      const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
      await page.setContent(markup);
      const found = await page.evaluate(() => ["a", "b", "c"].map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ top, bottom }) => [top, bottom]));
      await page.close();
      return { inside: found[1][0] - found[0][1], around: found[2][0] - found[1][1] };
    };
    expect(await tops(html("Page"))).toEqual({ inside: 0, around: 24 });
    expect(await tops(html("Email"))).toEqual({ inside: 0, around: 24 });
  });
});

describe("a template written right to left, in Chromium", () => {
  // Its text starts on the right: a Button and an Image where the text aligns them (and one aligned left), and a List's
  // items with their markers in the indent on the right, inside the List. Where the email puts each, the page does.
  it("places each box where the email does, from the right", async () => {
    const ids = ["b0", "i0", "b1", "li0", "li1"];
    const template = (root: "Page" | "Email") =>
      resolveDocument(
        parseDocument({
          root: {
            type: root,
            props: { width: 600, dir: "rtl", lang: "ar" },
            style: { gap: 16 },
            children: [
              { type: "Button", id: "b0", props: { href: "#" }, children: ["تتبع الطلب"] },
              { type: "Image", id: "i0", props: { src: { src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 120 }, alt: "" } },
              { type: "Column", style: { textAlign: "left" }, children: [{ type: "Button", id: "b1", props: { href: "#" }, children: ["يسار"] }] },
              { type: "List", props: { type: "number" }, style: { indent: 32 }, children: [{ type: "ListItem", id: "li0", children: ["نجهز الطلب"] }, { type: "ListItem", id: "li1", children: ["نرسله إليك"] }] },
            ],
          },
        })
      );
    const boxes = async (html: string) => {
      const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
      await page.setContent(html);
      const found = await page.evaluate((ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect()).map(({ x, width }) => [Math.round(x), Math.round(width)]), ids);
      await page.close();
      return found;
    };
    const page = await boxes(renderPage(template("Page")).html);
    expect(page).toEqual(await boxes(renderEmail(template("Email")).html));
    // The page's content runs from 200 to 800: the first Button and the Image end at its right, the other Button starts
    // at its left, and each item ends the indent in from its right.
    expect(page[0][0] + page[0][1]).toBe(800);
    expect(page[1][0] + page[1][1]).toBe(800);
    expect(page[2][0]).toBe(200);
    expect(page[3][0] + page[3][1]).toBe(800 - 32);
  });
});

describe("a Menu in Chromium", () => {
  const LINKS = ["Home", "Products", "Pricing", "Customers", "Documentation", "Contact us"].map((text) => ({ text, href: `https://example.com/${text}` }));
  const render = (root: "Email" | "Page", props: Record<string, unknown>) =>
    renderTemplate({ root: { type: root, props: { width: 600 }, children: [{ type: "Menu", props }] } }).html;
  /** Where each word is on screen: its text's box, by its words. */
  const words = async (html: string, viewport: number, style = true) => {
    const page = await browser.newPage({ viewport: { width: viewport, height: 800 } });
    await page.setContent(html);
    if (!style) await page.evaluate(() => document.querySelectorAll("style").forEach((element) => element.remove()));
    const found = await page.evaluate(() => {
      const out: Array<{ text: string; left: number; right: number; top: number }> = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const box = range.getBoundingClientRect();
        if (node.textContent!.trim() && box.width > 0) out.push({ text: node.textContent!.trim(), left: box.left, right: box.right, top: box.top });
      }
      return { out, scroll: document.documentElement.scrollWidth };
    });
    await page.close();
    return found;
  };

  for (const root of ["Email", "Page"] as const) {
    it(`puts a link's padding either side of a separator, as between links without one (${root})`, async () => {
      const [docs, bar, blog] = (await words(render(root, { items: LINKS.slice(0, 2), separator: "|" }), 1000)).out;
      expect([docs.text, bar.text, blog.text]).toEqual(["Home", "|", "Products"]);
      expect([Math.round(bar.left - docs.right), Math.round(blog.left - bar.right)]).toEqual([15, 15]);
      const [a, b] = (await words(render(root, { items: LINKS.slice(0, 2) }), 1000)).out;
      expect(Math.round(b.left - a.right)).toBe(30);
    });

    it(`keeps a long Menu on one line where it fits, and wraps its links onto more lines where it doesn't (${root})`, async () => {
      for (const style of root === "Email" ? [true, false] : [true]) {
        const desktop = await words(render(root, { items: LINKS, separator: "|" }), 1000, style);
        expect(new Set(desktop.out.map((word) => Math.round(word.top))).size).toBe(1);
        const phone = await words(render(root, { items: LINKS, separator: "|" }), 375, style);
        // Inside the screen, on more than one line: nothing to scroll sideways to.
        expect(phone.scroll).toBeLessThanOrEqual(375);
        expect(new Set(phone.out.map((word) => Math.round(word.top))).size).toBeGreaterThan(1);
        for (const word of phone.out) expect([word.text, word.right <= 375.5]).toEqual([word.text, true]);
      }
    });
  }
});
