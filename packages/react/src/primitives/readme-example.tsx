import { Button, Column, Email, Heading, Image, Link, List, ListItem, MergeTag, Paragraph, Row, Span, Table, TableCell, TableRow } from "./index";

export default function Receipt() {
  return (
    <Email previewText="Your Acme receipt" style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, Arial, sans-serif", gap: 16 }}>
      <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
      <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16, borderRadius: 8 }}>
        <Heading level={1} style={{ fontSize: 24 }} mobile={{ fontSize: 20 }}>
          Thanks for your order, <MergeTag name="first_name" />
        </Heading>
        <Paragraph>
          Order <Span style={{ fontWeight: 700 }}>#10482</Span> ships tomorrow. <Link href="https://example.com/orders/10482">Track it</Link>.
        </Paragraph>
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
            <Paragraph style={{ fontWeight: 700 }}>Shipping to</Paragraph>
            <Paragraph>Ada Lovelace, London</Paragraph>
          </Column>
          <Column>
            <Paragraph style={{ fontWeight: 700 }}>Next steps</Paragraph>
            <List type="number">
              <ListItem>We pack it</ListItem>
              <ListItem>You track it</ListItem>
            </List>
          </Column>
        </Row>
        <Button href="https://example.com/orders/10482" style={{ backgroundColor: "#111827", borderRadius: 6 }} hover={{ backgroundColor: "#374151" }}>
          View your order
        </Button>
      </Column>
      <Paragraph style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Email>
  );
}
