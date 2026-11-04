import { Button, Column, Document, Email, Heading, Page, Paragraph, Span } from "@unlayer/react-elements/primitives";

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
