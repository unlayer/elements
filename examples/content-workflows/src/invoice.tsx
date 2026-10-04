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
