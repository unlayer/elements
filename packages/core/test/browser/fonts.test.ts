/**
 * Web fonts in Chromium: for the root's fonts, the browser fetches the face
 * that matches each text's weight and style (the 700 file for bold text, the
 * italic file for italic), in the Page and in the Email; without the email's
 * <style> (Gmail drops it for some accounts), it fetches none and the text
 * keeps its stack's next font.
 */
import { chromium, type Browser } from "playwright";
import { parseDocument, resolveDocument } from "../../src";
import { renderEmail, renderPage } from "../../src/writers";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

const FONTS = [
  { family: "Brand Sans", src: "https://fonts.test/brand-400.woff2", weight: 400 },
  { family: "Brand Sans", src: "https://fonts.test/brand-700.woff2", weight: 700 },
  { family: "Brand Sans", src: "https://fonts.test/brand-italic.woff2", weight: 400, style: "italic" },
  { family: "Unused", src: "https://fonts.test/unused.woff2" },
];

const template = (root: "Page" | "Email") =>
  resolveDocument(
    parseDocument({
      root: {
        type: root,
        props: { width: 600, fonts: FONTS },
        style: { fontFamily: "'Brand Sans', Arial, sans-serif" },
        children: [
          { type: "Text", children: ["regular"] },
          { type: "Text", style: { fontWeight: 700 }, children: ["bold"] },
          { type: "Text", style: { fontStyle: "italic" }, children: ["italic"] },
        ],
      },
    })
  );

async function fetched(html: string, { style = true } = {}): Promise<string[]> {
  const page = await browser.newPage();
  const urls: string[] = [];
  await page.route("https://fonts.test/**", (route) => {
    urls.push(route.request().url());
    return route.abort();
  });
  // Without the stylesheet as a client that strips it shows the email: gone before the page loads.
  await page.setContent(style ? html : html.replace(/<style>[\s\S]*?<\/style>/g, ""));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  await page.close();
  return [...new Set(urls)].sort();
}

for (const [name, html] of [
  ["Page", renderPage(template("Page")).html],
  ["Email", renderEmail(template("Email")).html],
] as const) {
  it(`fetches the face each text's weight and style needs, and no other (${name})`, async () => {
    expect(await fetched(html)).toEqual(["https://fonts.test/brand-400.woff2", "https://fonts.test/brand-700.woff2", "https://fonts.test/brand-italic.woff2"]);
  });
}

it("fetches no font without the email's stylesheet, and keeps each stack's next font", async () => {
  const html = renderEmail(template("Email")).html;
  expect(await fetched(html, { style: false })).toEqual([]);
  expect(html).toContain("font-family:&#39;Brand Sans&#39;, Arial, sans-serif");
});
