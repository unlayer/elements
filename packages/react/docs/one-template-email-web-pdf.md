# One React invoice template to email, web, and PDF

Use `@unlayer/react-elements` when a receipt or invoice needs an email, a browser view, and a downloadable PDF with the same content. Share the `Row > Column > content` tree; select `Email`, `Page`, or `Document` for the output-specific wrapper. Elements renders HTML. Playwright prints the document HTML to a PDF.

## Install and run

The complete [content-workflows example](../../../examples/content-workflows) uses the local workspace package. From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example exec playwright install chromium
pnpm --filter @unlayer/content-workflows-example render:all
```

To adapt the files in a separate Node.js 20+ project, install the public package and a TypeScript runner:

```bash
npm install @unlayer/react-elements react react-dom playwright
npm install --save-dev tsx typescript @types/node @types/react @types/react-dom
npm pkg set type=module
npx playwright install chromium
```

Use `"jsx": "react-jsx"` in your TypeScript configuration. Copy the [example source files](../../../examples/content-workflows/src) and run `npx tsx src/render-all.ts` from that project's root.

## Define the shared React template

[src/invoice.tsx](../../../examples/content-workflows/src/invoice.tsx):

```tsx
import {
  Email, Page, Document, Row, Column, ColumnLayouts,
  Heading, Paragraph, Button,
} from "@unlayer/react-elements";

export interface InvoiceData {
  number: string;
  customer: string;
  total: string;
  receiptUrl: string;
}

export const sampleInvoice: InvoiceData = {
  number: "INV-1001",
  customer: "Ada Lovelace",
  total: "$49.00",
  receiptUrl: "https://example.com/account/invoices/INV-1001",
};

// The html prop accepts raw markup; escape data before interpolation.
function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

// A plain synchronous factory returns the actual Elements root to each renderer.
export function invoiceTemplate(data: InvoiceData, mode: "email" | "web" | "document") {
  const receiptUrl = new URL(data.receiptUrl);
  if (receiptUrl.protocol !== "https:") throw new Error("receiptUrl must use HTTPS");

  // Keep Row and Column directly visible to renderToJson's static tree walker.
  const content = (
    <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px">
      <Column>
        <Heading level="h1" fontSize="28px">Payment receipt</Heading>
        <Paragraph html={`Invoice <b>${escapeHtml(data.number)}</b>`} />
        <Paragraph html={`Thank you, ${escapeHtml(data.customer)}.`} />
        <Paragraph html={`Paid: <b>${escapeHtml(data.total)}</b>`} />
        <Button href={receiptUrl.href} backgroundColor="#0879A1" color="#ffffff">
          View invoice
        </Button>
      </Column>
    </Row>
  );
  const style = {
    contentWidth: "600px" as const,
    backgroundColor: "#ffffff",
    fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
  };

  if (mode === "email") {
    return <Email {...style} previewText="Your payment receipt is ready.">{content}</Email>;
  }
  if (mode === "web") return <Page {...style}>{content}</Page>;
  return <Document {...style} documentSize="A4" documentOrientation="portrait">{content}</Document>;
}
```

The factory returns the actual root, so the renderer can infer the correct mode and collect its document styles. Content is declared once. Keeping `Row` and `Column` directly in the tree also makes it usable by the static `renderToJson()` walker.

## Render all outputs

[src/render-all.ts](../../../examples/content-workflows/src/render-all.ts) uses the [email and JSON exporter](./transactional-email.md#render-html-plain-text-and-design-json) and the [Playwright helper](./react-to-pdf.md#generate-the-pdf):

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { renderToHtml } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";
import "./render-email";

await mkdir("output", { recursive: true });
const webHtml = renderToHtml(invoiceTemplate(sampleInvoice, "web"));
const documentHtml = renderToHtml(invoiceTemplate(sampleInvoice, "document"));
await writeFile("output/invoice.web.html", webHtml);
await writeFile("output/invoice.document.html", documentHtml);
await writeFile("output/invoice.pdf", await htmlToPdf(documentHtml));
console.log("Wrote output/invoice.web.html, invoice.document.html and invoice.pdf");
```

Expected: six files in `examples/content-workflows/output/` when run via the workspace script: `invoice.email.html`, `invoice.txt`, `invoice.design.json`, `invoice.web.html`, `invoice.document.html`, and `invoice.pdf`. Each represents INV-1001 for Ada Lovelace, paid $49.00. Use `pnpm --filter @unlayer/content-workflows-example preview` to browse the HTML files at <http://127.0.0.1:3001/output/invoice.web.html>.

## Constraints

Shared content does not imply identical pixels. Email uses table-oriented HTML and client-specific fallbacks; web uses responsive layouts; document output uses print styling and a fixed page size. Keep content within the printable width, and test long invoices for pagination. A browser preview does not prove inbox compatibility.

For an authenticated web receipt, serve the web HTML from an authorized route with `Content-Type: text/html`; do not publish customer invoices at predictable public URLs. These examples use fictitious data. Use [provider integrations](./email-providers.md) to send the email and [visual editing](./visual-editing.md) to hand the template to an editor user.
