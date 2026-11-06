# One React invoice template to email, web, and PDF

Use `@unlayer/react-elements` when a receipt or invoice needs an email, a browser view, and a downloadable PDF with the same content. Write the content once with the components from `@unlayer/react-elements`, and select `Email`, `Page`, or `Document` as its root. `await render(element)` writes the HTML that root asks for. Playwright prints the document HTML to a PDF, or [`@unlayer/react-elements/pdf`](./react-to-pdf.md#without-a-browser) writes one without a browser.

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
import { Button, Column, Document, Email, Heading, Page, Paragraph, Span } from "@unlayer/react-elements";

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

// A plain synchronous factory returns the template's root, which says what render() writes.
export function invoiceTemplate(data: InvoiceData, mode: "email" | "web" | "document") {
  const receiptUrl = new URL(data.receiptUrl);
  if (receiptUrl.protocol !== "https:") throw new Error("receiptUrl must use HTTPS");

  // Data goes in as text, never as markup: Elements escapes it when it writes the HTML.
  const content = (
    <Column style={{ backgroundColor: "#ffffff", padding: 24, gap: 16 }}>
      <Heading level={1} style={{ fontSize: 28 }}>Payment receipt</Heading>
      <Paragraph>Invoice <Span style={{ fontWeight: 700 }}>{data.number}</Span></Paragraph>
      <Paragraph>Thank you, {data.customer}.</Paragraph>
      <Paragraph>Paid: <Span style={{ fontWeight: 700 }}>{data.total}</Span></Paragraph>
      <Button href={receiptUrl.href} style={{ backgroundColor: "#0879A1", color: "#ffffff" }}>
        View invoice
      </Button>
    </Column>
  );
  const title = `Invoice ${data.number}`;
  const style = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };

  if (mode === "email") {
    return <Email width={600} title={title} previewText="Your payment receipt is ready." style={style}>{content}</Email>;
  }
  if (mode === "web") return <Page width={600} title={title} style={style}>{content}</Page>;
  return <Document size="A4" orientation="portrait" title={title} style={style}>{content}</Document>;
}
```

The root decides the output, so `render()` needs no mode of its own: email HTML for `Email`, web HTML for `Page`, print HTML for `Document`. Content is declared once. A `Column` with a background is a card, its `gap` is the space between its blocks, and its `padding` the space around them. `Email` and `Page` take their width as a prop; a `Document` gets its width from its `size` and `margin`. A component works as well as this factory (`render(<Invoice mode="email" />)`), since `render()` runs it with React.

## Render all outputs

[src/render-all.ts](../../../examples/content-workflows/src/render-all.ts) uses the [email and JSON exporter](./transactional-email.md#render-html-plain-text-and-design-json) and the [Playwright helper](./react-to-pdf.md#generate-the-pdf):

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { render } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";
import "./render-email";

await mkdir("output", { recursive: true });
const { html: webHtml } = await render(invoiceTemplate(sampleInvoice, "web"));
const { html: documentHtml } = await render(invoiceTemplate(sampleInvoice, "document"));
await writeFile("output/invoice.web.html", webHtml);
await writeFile("output/invoice.document.html", documentHtml);
await writeFile("output/invoice.pdf", await htmlToPdf(documentHtml));
console.info("Wrote output/invoice.web.html, invoice.document.html and invoice.pdf");
```

Expected: six files in `examples/content-workflows/output/` when run via the workspace script: `invoice.email.html`, `invoice.txt`, `invoice.design.json`, `invoice.web.html`, `invoice.document.html`, and `invoice.pdf`. Each represents INV-1001 for Ada Lovelace, paid $49.00. Use `pnpm --filter @unlayer/content-workflows-example preview` to browse the HTML files at <http://127.0.0.1:3001/output/invoice.web.html>.

## Constraints

Shared content does not imply identical pixels. Email uses table-oriented HTML and client-specific fallbacks; web uses responsive layouts; document output uses print styling and a fixed page size. A `Document`'s content does not flow from page to page: what is taller than its page is cut off, and `render()` warns about it in `diagnostics` (`document/overflow`). Split long invoices with `PageBreak` or `Document.Page`. A browser preview does not prove inbox compatibility.

For an authenticated web receipt, serve the web HTML from an authorized route with `Content-Type: text/html`; do not publish customer invoices at predictable public URLs. These examples use fictitious data. Use [provider integrations](./email-providers.md) to send the email and [visual editing](./visual-editing.md) to hand the template to an editor user.
