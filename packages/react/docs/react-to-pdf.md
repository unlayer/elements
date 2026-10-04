# Generate a React invoice PDF with Playwright

Use `@unlayer/react-elements` with Playwright for invoices, receipts, and reports that need a real PDF file. `renderToHtml(<Document>…</Document>)` produces print-ready HTML; `page.pdf()` in headless Chromium produces the PDF bytes. There is no `renderToPdf()` export in Elements.

## Install

In a Node.js 20+ project:

```bash
npm install @unlayer/react-elements react react-dom playwright
npm install --save-dev tsx typescript @types/node @types/react @types/react-dom
npm pkg set type=module
npx playwright install chromium
```

Linux CI may need `npx playwright install --with-deps chromium`. Chromium must be installed in the runtime image or environment that executes the worker.

## Generate the PDF

Use the complete [invoice template](./one-template-email-web-pdf.md#define-the-shared-react-template). This helper, [src/pdf.ts](../../../examples/content-workflows/src/pdf.ts), waits for fonts and images before printing and always closes the browser:

```ts
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
    return await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
  } finally {
    await browser.close();
  }
}
```

Save this as `src/render-pdf.ts` alongside `invoice.tsx` and `pdf.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { renderToHtml } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";

await mkdir("output", { recursive: true });
const html = renderToHtml(invoiceTemplate(sampleInvoice, "document"));
await writeFile("output/invoice.pdf", await htmlToPdf(html));
```

Run `npx tsx src/render-pdf.ts`. Expected: `output/invoice.pdf`, an A4 invoice for Ada Lovelace showing INV-1001 and $49.00. The checked-in example's `render:all` command also creates this PDF and its intermediate HTML:

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example exec playwright install chromium
pnpm --filter @unlayer/content-workflows-example render:all
```

## Print constraints

`preferCSSPageSize` honors the document's CSS page size; `format` is the fallback. `printBackground` retains background colors. The sample uses 600px content on A4 with 12mm margins. Avoid conflicting CSS `@page` and PDF margin rules when adapting it. See [Playwright PDF options](https://playwright.dev/docs/api/class-page#page-pdf).

Use the [PageBreak component](../README.md#pagebreak) within the required Row/Column structure to request explicit breaks. Test long rows, tables, fonts, and multiple pages with representative data; fitting one sample invoice does not establish pagination for every document.

This example uses system fonts and no remote images. If adding assets, use absolute accessible URLs or embedded data, wait for them, and fail on missing images rather than printing incomplete invoices. Only print trusted application-generated HTML; do not turn this helper into an arbitrary URL/HTML rendering endpoint without controlling network access. Playwright needs a Node.js host that can run a browser, so use a worker/container rather than an edge runtime.

For repeated jobs, reuse a browser with isolated pages/contexts and close each after printing. For email and browser versions of the same content, see [one React template, three outputs](./one-template-email-web-pdf.md).
