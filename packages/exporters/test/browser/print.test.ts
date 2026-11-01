/**
 * A Document's print HTML, printed by Chromium (the test's only use of a browser: Elements writes the HTML without
 * one): one sheet of the Document's paper per page, whatever its content, and each page's header and footer on it.
 */
import { chromium, type Browser } from "playwright";
import { renderTemplate } from "../../src";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

const text = (...children: unknown[]) => ({ type: "Text", children });

async function print(html: string): Promise<{ sheets: Array<[number, number]>; pdf: string }> {
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString("latin1");
  await page.close();
  // Each page object's MediaBox, in points.
  const sheets = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Math.round(Number(m[1])), Math.round(Number(m[2]))] as [number, number]);
  return { sheets, pdf };
}

describe("a Document printed in Chromium", () => {
  it("prints one sheet of its paper per page, landscape too", async () => {
    const long = Array.from({ length: 40 }, (_, i) => text(`Line ${i + 1} of a page that is full to its bottom margin and no further.`));
    const html = renderTemplate({
      root: {
        type: "Document",
        props: { size: "Letter", orientation: "landscape", margin: [36, 48] },
        children: [
          { type: "PageHeader", children: [text("Header")] },
          text("Cover"),
          { type: "PageBreak" },
          { type: "DocumentPage", children: long.slice(0, 12) },
          text("Back"),
          { type: "PageFooter", children: [text({ type: "PageNumber" }, " of ", { type: "PageNumber", props: { total: true } })] },
        ],
      },
    }).html;
    const { sheets } = await print(html);
    // Letter landscape: 11in × 8.5in, 792 × 612 points.
    expect(sheets).toEqual([
      [792, 612],
      [792, 612],
      [792, 612],
    ]);
  });

  it("prints A4 portrait by default, a page that holds more than fits cut at its bottom margin rather than spilling onto a sheet of its own", async () => {
    const many = Array.from({ length: 80 }, (_, i) => text(`Line ${i + 1}`));
    const { sheets } = await print(renderTemplate({ root: { type: "Document", children: many } }).html);
    expect(sheets).toEqual([[595, 842]]);
  });
});
