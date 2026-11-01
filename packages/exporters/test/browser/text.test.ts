/**
 * Raised and lowered text in Chromium: a superscript or subscript doesn't push
 * its line apart (a paragraph with one is as tall as one without), in the Page
 * and the Email.
 */
import { chromium, type Browser } from "playwright";
import { renderTemplate } from "../../src";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

const template = (root: "Page" | "Email") => ({
  version: 1,
  root: {
    type: root,
    props: { width: 600 },
    children: [
      { type: "Paragraph", id: "plain", children: ["Brand name and words"] },
      { type: "Paragraph", id: "raised", children: ["Brand", { type: "Span", style: { verticalAlign: "super" }, children: ["®"] }, " name and words"] },
      { type: "Paragraph", id: "lowered", children: ["H", { type: "Span", style: { verticalAlign: "sub" }, children: ["2"] }, "O and words"] },
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
