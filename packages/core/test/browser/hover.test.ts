/**
 * Hover in Chromium: a Button's text and background, and a Link's color,
 * change to their hover styles, in the Page and in the Email. (Hover needs the
 * stylesheet; clients that drop it keep the inline colors.)
 */
import { chromium, type Browser } from "playwright";
import { parseDocument, resolveDocument } from "../../src";
import { renderEmail, renderPage } from "../../src/writers";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

const template = (root: "Page" | "Email") =>
  resolveDocument(
    parseDocument({
      root: {
        type: root,
        props: { width: 600 },
        children: [
          { type: "Button", props: { href: "https://example.com/button" }, style: { color: "#ffffff", backgroundColor: "#0879a1" }, hover: { color: "#ff0000", backgroundColor: "#000000" }, children: ["Go"] },
          { type: "Paragraph", children: [{ type: "Link", props: { href: "https://example.com/link" }, style: { color: "#0000ee" }, hover: { color: "#00aa00" }, children: ["read"] }] },
        ],
      },
    })
  );

/** The link's text color, and the background behind it (its own, else its cell's). */
async function colors(html: string, href: string, hover: boolean) {
  const page = await browser.newPage();
  await page.setContent(html);
  if (hover) await page.hover(`a[href="${href}"]`);
  const out = await page.evaluate((href) => {
    const link = document.querySelector(`a[href="${href}"]`)!;
    const own = getComputedStyle(link).backgroundColor;
    const behind = own !== "rgba(0, 0, 0, 0)" ? own : getComputedStyle(link.closest("td") ?? link).backgroundColor;
    return { color: getComputedStyle(link).color, background: behind };
  }, href);
  await page.close();
  return out;
}

for (const [name, html] of [
  ["Page", renderPage(template("Page")).html],
  ["Email", renderEmail(template("Email")).html],
] as const) {
  it(`changes a Button's text and background on hover (${name})`, async () => {
    expect(await colors(html, "https://example.com/button", false)).toEqual({ color: "rgb(255, 255, 255)", background: "rgb(8, 121, 161)" });
    expect(await colors(html, "https://example.com/button", true)).toEqual({ color: "rgb(255, 0, 0)", background: "rgb(0, 0, 0)" });
  });

  it(`changes a Link's color on hover (${name})`, async () => {
    expect((await colors(html, "https://example.com/link", false)).color).toBe("rgb(0, 0, 238)");
    expect((await colors(html, "https://example.com/link", true)).color).toBe("rgb(0, 170, 0)");
  });
}
