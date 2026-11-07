/**
 * Raised and lowered text in Chromium: a superscript or subscript doesn't push
 * its line apart (a paragraph with one is as tall as one without), in the Page
 * and the Email.
 */
import { chromium, type Browser } from "playwright";
import { renderTemplate } from "../../src/writers";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

const template = (root: "Page" | "Email") => ({
  root: {
    type: root,
    props: { width: 600 },
    children: [
      { type: "Text", id: "plain", children: ["Brand name and words"] },
      { type: "Text", id: "raised", children: ["Brand", { type: "Span", style: { verticalAlign: "super" }, children: ["®"] }, " name and words"] },
      { type: "Text", id: "lowered", children: ["H", { type: "Span", style: { verticalAlign: "sub" }, children: ["2"] }, "O and words"] },
    ],
  },
});

for (const root of ["Page", "Email"] as const) {
  it(`keeps a line with a superscript or subscript as tall as one without (${root})`, async () => {
    const page = await browser.newPage();
    await page.setContent(renderTemplate(template(root)).html);
    const [plain, raised, lowered] = await page.evaluate(() => ["plain", "raised", "lowered"].map((id) => document.getElementById(id)!.getBoundingClientRect().height));
    await page.close();
    expect(raised).toBe(plain);
    expect(lowered).toBe(plain);
  });
}

it("keeps what a stacking Row's child holds with no text size of its own readable: a Video's link, an Image's alternate text (Email)", async () => {
  const video = { type: "Video", id: "video", props: { src: "https://vimeo.com/76979871", title: "Our launch" } };
  const image = { type: "Image", id: "image", props: { src: "https://missing.test/photo.png", alt: "Our team" } };
  const email = {
    root: {
      type: "Email",
      props: { width: 600 },
      style: { fontSize: 18 },
      mobile: { fontSize: 15 },
      children: [{ type: "Row", children: [{ type: "Column", children: [video] }, { type: "Column", children: [image] }] }],
    },
  };
  const page = await browser.newPage();
  await page.setContent(renderTemplate(email).html);
  const sizes = () => page.evaluate(() => ["video", "image"].map((id) => getComputedStyle(document.getElementById(id)!).fontSize));
  const desktop = await sizes();
  const width = await page.evaluate(() => document.getElementById("video")!.getBoundingClientRect().width);
  await page.setViewportSize({ width: 400, height: 800 });
  const phone = await sizes();
  await page.close();
  expect(desktop).toEqual(["18px", "18px"]);
  expect(width).toBeGreaterThan(0);
  expect(phone).toEqual(["15px", "15px"]);
});

// A word wider than its column (a long link) breaks onto the next line: the column keeps its width and the window
// doesn't scroll sideways, on a phone and in a column of a desktop's Row.
for (const root of ["Page", "Email"] as const) {
  it(`breaks a word too long for its column onto the next line (${root})`, async () => {
    const word = "https://example.com/an/address/far/too/long/for/its/column/on/any/screen";
    const template = {
      root: {
        type: root,
        props: { width: 600 },
        children: [
          { type: "Row", props: { stackOnMobile: false }, children: [{ type: "Column", id: "column", children: [{ type: "Text", id: "text", children: [word] }] }, { type: "Column", children: [{ type: "Text", children: ["Beside it"] }] }] },
        ],
      },
    };
    for (const width of [375, 800]) {
      const page = await browser.newPage({ viewport: { width, height: 600 } });
      await page.setContent(renderTemplate(template).html);
      const { scroll, column, text, lines } = await page.evaluate(() => {
        const box = (id: string) => document.getElementById(id)!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(document.getElementById("text")!);
        return { scroll: document.scrollingElement!.scrollWidth - window.innerWidth, column: box("column").right, text: range.getBoundingClientRect().right, lines: range.getClientRects().length };
      });
      await page.close();
      expect(scroll).toBe(0);
      expect(text).toBeLessThanOrEqual(column + 0.5);
      expect(lines).toBeGreaterThan(1);
    }
  });
}
