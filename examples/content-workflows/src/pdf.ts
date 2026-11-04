import { chromium } from "playwright";

// Run in a Node.js worker with Chromium installed, not in an edge runtime.
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
    // The Document's own `size` and `margin` lay out each page, so nothing here sets them.
    return await page.pdf({ preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}
