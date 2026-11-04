# Generate a React invoice PDF

Use `@unlayer/react-elements` for invoices, receipts, and reports that need a real PDF file. Write the template with a `<Document>` from `@unlayer/react-elements/primitives`; then there are two ways to get the file:

- **With Playwright:** `await render(<Document>…</Document>)` produces print-ready HTML, and `page.pdf()` in headless Chromium produces the PDF bytes. It needs Chromium wherever it runs. The rest of this guide and the checked-in example use this way.
- **Without a browser:** `renderPdf(<Document>…</Document>)` from `@unlayer/elements-pdf` writes the PDF on the server, from font and image files you give it. See [below](#without-a-browser).

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
    // The Document's own `size` and `margin` lay out each page, so nothing here sets them.
    return await page.pdf({ preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}
```

Save this as `src/render-pdf.ts` alongside `invoice.tsx` and `pdf.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { render } from "@unlayer/react-elements/primitives";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";

await mkdir("output", { recursive: true });
const { html } = await render(invoiceTemplate(sampleInvoice, "document"));
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

`preferCSSPageSize` honors the paper the `Document` asks for: its print HTML sets the CSS page to its `size` and `orientation`, with no page margin, and draws each page as a box with its own `margin` (48px by default). So set both on the `Document`: a `margin` passed to `page.pdf()` changes nothing. `printBackground` retains background colors. See [Playwright PDF options](https://playwright.dev/docs/api/class-page#page-pdf).

Nothing flows from one page to the next: content taller than its page is cut off, and `render()` warns about it in `diagnostics` (`document/overflow`, an estimate). Use the [PageBreak component](../PRIMITIVES-REFERENCE.md#pagebreak) or `Document.Page` to start a new page, and `PageHeader`, `PageFooter` and `PageNumber` for what repeats on each one. Test tables, fonts, and multiple pages with representative data; fitting one sample invoice does not establish pagination for every document.

This example uses system fonts and no remote images. If adding assets, use absolute accessible URLs or embedded data, wait for them, and fail on missing images rather than printing incomplete invoices. Only print trusted application-generated HTML; do not turn this helper into an arbitrary URL/HTML rendering endpoint without controlling network access. Playwright needs a Node.js host that can run a browser, so use a worker/container rather than an edge runtime.

For repeated jobs, reuse a browser with isolated pages/contexts and close each after printing.

## Without a browser

`@unlayer/elements-pdf` writes a `Document` as a PDF with react-pdf, so a Node.js server needs no Chromium:

```bash
npm install @unlayer/elements-pdf @unlayer/react-elements @react-pdf/renderer react
```

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { renderPdf } from "@unlayer/elements-pdf";
import { invoiceTemplate, sampleInvoice } from "./invoice";

await mkdir("output", { recursive: true });
const { pdf, diagnostics } = await renderPdf(invoiceTemplate(sampleInvoice, "document"));
for (const { code, message } of diagnostics) console.warn(code, message);
await writeFile("output/invoice.pdf", pdf);
```

It takes the same template. Nothing is fetched: pass font files in `fonts` and image files in `images`, as bytes. Text whose font has no file given, as in this invoice, is drawn in a standard PDF font, which covers Western European characters only. The [package's guide](../../pdf/README.md) lists its options, diagnostics and limits.

For email and browser versions of the same content, see [one React template, three outputs](./one-template-email-web-pdf.md).
