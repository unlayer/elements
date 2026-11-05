/**
 * Indented HTML (`pretty`) lays out as the compact HTML does in Chromium:
 * every box of the shared template at the same place and width, in the Page
 * and the Email.
 */
import { chromium, type Browser } from "playwright";
import { renderTemplate } from "../../src/writers";
import { template } from "./fixture";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

async function boxes(html: string) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.setContent(html);
  const out = await page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll("[id]")].map((e) => { const r = e.getBoundingClientRect(); return [e.id, [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]]; }))
  );
  await page.close();
  return out;
}

for (const root of ["Page", "Email"] as const) {
  it(`lays out the same, pretty or compact (${root})`, async () => {
    const compact = await boxes(renderTemplate(template(root)).html);
    expect(Object.keys(compact).length).toBeGreaterThan(20);
    expect(await boxes(renderTemplate(template(root), { pretty: true }).html)).toEqual(compact);
  });
}
