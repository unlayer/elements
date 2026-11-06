import { Button, Column, Email, Heading, Link, MergeTag, Text, Row, Span, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = {
  title: "Order receipt",
  description: "A receipt with a line-item table, two columns that stack on phones and a button with a hover color.",
  root: "Email",
};

const card = { backgroundColor: "#ffffff", padding: 32, gap: 16, borderRadius: 8 };

export default function Receipt() {
  return (
    <Email
      previewText="Your Acme receipt"
      style={{
        backgroundColor: "#f4f4f5",
        fontFamily: "Inter, Arial, sans-serif",
        gap: 16,
      }}
    >
      <Column style={card}>
        <Heading level={1} style={{ fontSize: 24 }} mobile={{ fontSize: 20 }}>
          Thanks for your order, <MergeTag name="first_name" />
        </Heading>
        <Text>
          Order <Span style={{ fontWeight: 700 }}>#10482</Span> ships tomorrow.{" "}
          <Link href="https://example.com/orders/10482">Track it</Link>.
        </Text>
        <Table style={{ cellPadding: [8, 0], rowBorder: "1px solid #e4e4e7" }}>
          <TableRow header>
            <TableCell>Item</TableCell>
            <TableCell style={{ textAlign: "right" }}>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Linen shirt</TableCell>
            <TableCell style={{ textAlign: "right" }}>$48.00</TableCell>
          </TableRow>
        </Table>
        <Row style={{ gap: 16 }}>
          <Column>
            <Text style={{ fontWeight: 700 }}>Shipping to</Text>
            <Text>Ada Lovelace, London</Text>
          </Column>
          <Column>
            <Text style={{ fontWeight: 700 }}>Arrives</Text>
            <Text>Thursday, 12 Nov</Text>
          </Column>
        </Row>
        <Button
          href="https://example.com/orders/10482"
          style={{ backgroundColor: "#111827", borderRadius: 6 }}
          hover={{ backgroundColor: "#374151" }}
        >
          View your order
        </Button>
      </Column>
      <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>
        Acme Inc., 1 Market St, San Francisco
      </Text>
    </Email>
  );
}
