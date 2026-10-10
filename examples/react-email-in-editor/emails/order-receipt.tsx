import { Body, Column, Container, Head, Heading, Hr, Html, Link, Preview, Row, Section, Text } from "@react-email/components";

interface Item {
  name: string;
  quantity: number;
  price: string;
}

interface OrderReceiptProps {
  orderId?: string;
  items?: Item[];
  total?: string;
  trackingUrl?: string;
}

const text = { margin: 0, fontSize: "14px", lineHeight: "22px", color: "#334155" };
const label = { ...text, color: "#64748b" };

export default function OrderReceipt({
  orderId = "NW-1042",
  items = [],
  total = "$0.00",
  trackingUrl = "https://example.com/track",
}: OrderReceiptProps) {
  return (
    <Html>
      <Head />
      <Preview>Receipt for order {orderId}</Preview>
      <Body style={{ backgroundColor: "#f8fafc", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "32px auto", backgroundColor: "#ffffff", padding: "32px" }}>
          <Heading as="h2" style={{ margin: "0 0 4px", fontSize: "22px", color: "#0f172a" }}>
            Thanks for your order
          </Heading>
          <Text style={label}>Order {orderId}</Text>
          <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
          <Section>
            {items.map((item) => (
              <Row key={item.name} style={{ marginBottom: "12px" }}>
                <Column>
                  <Text style={text}>{item.name}</Text>
                  <Text style={label}>Qty {item.quantity}</Text>
                </Column>
                <Column style={{ width: "120px", textAlign: "right" }}>
                  <Text style={text}>{item.price}</Text>
                </Column>
              </Row>
            ))}
          </Section>
          <Hr style={{ borderColor: "#e2e8f0", margin: "12px 0 24px" }} />
          <Row>
            <Column>
              <Text style={{ ...text, fontWeight: 600 }}>Total</Text>
            </Column>
            <Column style={{ width: "120px", textAlign: "right" }}>
              <Text style={{ ...text, fontWeight: 600 }}>{total}</Text>
            </Column>
          </Row>
          <Text style={{ ...text, marginTop: "24px" }}>
            Your order ships within two business days. <Link href={trackingUrl} style={{ color: "#4f46e5" }}>Track your package</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

OrderReceipt.PreviewProps = {
  orderId: "NW-1042",
  items: [
    { name: "Linen notebook", quantity: 2, price: "$24.00" },
    { name: "Brass pen", quantity: 1, price: "$34.00" },
  ],
  total: "$58.00",
  trackingUrl: "https://example.com/track/NW-1042",
} satisfies OrderReceiptProps;
