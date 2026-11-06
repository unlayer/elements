/**
 * Where a Row's rules for its children and a child's own phone styles set the
 * same property (a width), the child's win on phones, in both outputs: the
 * stylesheet writes them in that order whatever order they're made in.
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
          {
            type: "Row",
            children: [
              { type: "Column", id: "half", mobile: { width: "50%" }, children: [{ type: "Paragraph", children: ["half on phones"] }] },
              { type: "Column", id: "full", children: [{ type: "Paragraph", children: ["full on phones"] }] },
            ],
          },
        ],
      },
    })
  );

for (const [name, html] of [
  ["Page", renderPage(template("Page")).html],
  ["Email", renderEmail(template("Email")).html],
] as const) {
  it(`keeps a child's own phone width inside a Row that stacks it (${name})`, async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
    await page.setContent(html);
    const width = (id: string) => page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().width, id);
    expect(Math.round(await width("full"))).toBe(400);
    expect(Math.round(await width("half"))).toBe(200);
    await page.close();
  });
}
