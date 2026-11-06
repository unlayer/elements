import { Column, Document, Heading, PageFooter, PageHeader, PageNumber, Text, Row, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = {
  title: "Invoice",
  description: "A printed A4 document with a header and footer on every page and page numbers. Renders to print HTML, and to PDF with @hyper-elements/react/pdf.",
  root: "Document",
};

const lines = [
  { item: "Pro plan, 12 seats", qty: 12, price: 24 },
  { item: "Extra render minutes", qty: 3, price: 40 },
  { item: "Priority support", qty: 1, price: 99 },
];
const money = (n: number) => `$${n.toFixed(2)}`;
const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);

export default function Invoice() {
  return (
    <Document size="A4" margin={48} title="Invoice 2705" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, gap: 24 }}>
      <PageHeader style={{ padding: [0, 0, 12, 0], border: { bottom: "1px solid #e5e7eb" } }}>
        <Row>
          <Text style={{ fontWeight: 700 }}>Acme Inc.</Text>
          <Text style={{ textAlign: "right", color: "#6b7280" }}>Invoice 2705</Text>
        </Row>
      </PageHeader>
      <Heading level={1} style={{ fontSize: 28 }}>Invoice</Heading>
      <Row style={{ gap: 24 }}>
        <Column style={{ gap: 2 }}>
          <Text style={{ color: "#6b7280" }}>Billed to</Text>
          <Text style={{ fontWeight: 700 }}>Ada Lovelace</Text>
          <Text>12 Analytical Row, London</Text>
        </Column>
        <Column style={{ gap: 2 }}>
          <Text style={{ color: "#6b7280" }}>Issued</Text>
          <Text>November 6, 2026</Text>
          <Text style={{ color: "#6b7280" }}>Due</Text>
          <Text>December 6, 2026</Text>
        </Column>
      </Row>
      <Table style={{ cellPadding: [8, 0], rowBorder: "1px solid #e5e7eb" }}>
        <TableRow header>
          <TableCell>Item</TableCell>
          <TableCell style={{ textAlign: "right", width: 60 }}>Qty</TableCell>
          <TableCell style={{ textAlign: "right", width: 90 }}>Price</TableCell>
          <TableCell style={{ textAlign: "right", width: 90 }}>Amount</TableCell>
        </TableRow>
        {lines.map((l) => (
          <TableRow key={l.item}>
            <TableCell>{l.item}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{String(l.qty)}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{money(l.price)}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{money(l.qty * l.price)}</TableCell>
          </TableRow>
        ))}
        <TableRow footer>
          <TableCell colSpan={3} style={{ fontWeight: 700 }}>Total</TableCell>
          <TableCell style={{ textAlign: "right", fontWeight: 700 }}>{money(total)}</TableCell>
        </TableRow>
      </Table>
      <Text style={{ color: "#6b7280" }}>Pay by bank transfer to Acme Inc., IBAN GB00 ACME 0000 0000 2705.</Text>
      <PageFooter>
        <Text style={{ fontSize: 10, color: "#9ca3af", textAlign: "right" }}>
          Page <PageNumber /> of <PageNumber total />
        </Text>
      </PageFooter>
    </Document>
  );
}
