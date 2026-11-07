import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Text,
  Row,
  Section,
  Table,
  TableCell,
  TableRow,
} from "@unlayer/react-elements";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

const tableHeaders = ["Item", "Qty", "Price"];
const tableRows = [
  ["Wireless Headphones Pro", "1", "$249.00"],
  ["USB-C Charging Cable (2m)", "2", "$38.00"],
  ["Leather Carrying Case", "1", "$59.00"],
];
const tableCell = { width: "33.33%", border: "1px solid #cccccc", verticalAlign: "middle" } as const;

export default function OrderConfirmation(): ReactElement {
  return (
    <Email
      width={560}
      previewText="Your order #A1029384 has been confirmed. Estimated delivery: Mar 8-10."
      style={{ backgroundColor: "#f5f5f7", color: "#1d1d1f", fontFamily: sansFont }}
    >
      {/* Header with logo */}
      <Section style={{ backgroundColor: "#ffffff", padding: [36, 0, 36, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Image
            src={{
              src: "https://placehold.co/120x28/1d1d1f/ffffff?text=STORE",
              width: 120,
              height: 28,
            }}
            alt="Store"
            style={{ width: 120 }}
          />
        </Column>
      </Section>

      {/* Green accent bar */}
      <Section style={{ backgroundColor: "#22c55e" }}>
        <Divider style={{ borderTop: "3px solid #22c55e", padding: 10 }} />
      </Section>

      {/* Confirmation message */}
      <Section style={{ backgroundColor: "#ffffff", padding: [36, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 24, fontWeight: 600, color: "#1d1d1f", textAlign: "left", lineHeight: 1.3 }}
        >
          Your order is confirmed.
        </Heading>
        <Text style={{ padding: 10, fontSize: 15, color: "#6e6e73", textAlign: "left", lineHeight: 1.65 }}>
          Hi Alex, thanks for your purchase. We'll send you a shipping confirmation once your order
          is on its way.
        </Text>
      </Section>

      {/* Delivery estimate — highlight box */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Heading
          level={4}
          style={{ padding: 10, fontSize: 10, fontWeight: 700, color: "#86868b", textAlign: "left", lineHeight: 1.4 }}
        >
          ESTIMATED DELIVERY
        </Heading>
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 20, fontWeight: 600, color: "#1d1d1f", textAlign: "left", lineHeight: 1.3 }}
        >
          March 8 – 10, 2026
        </Heading>
      </Section>

      {/* Divider */}
      <Section style={{ backgroundColor: "#ffffff", padding: [8, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e5e5e7", padding: 10 }} />
      </Section>

      {/* Order summary heading */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{ padding: 10, fontSize: 10, fontWeight: 700, color: "#86868b", textAlign: "left", lineHeight: 1.4 }}
        >
          ORDER SUMMARY
        </Heading>
      </Section>

      {/* Table */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Column style={{ padding: 10 }}>
          <Table style={{ fontSize: 14, lineHeight: 1.4, cellPadding: 10, borderCollapse: "collapse" }}>
            <TableRow header style={{ backgroundColor: "#dddddd" }}>
              {tableHeaders.map((text) => (
                <TableCell key={text} style={tableCell}>
                  {text}
                </TableCell>
              ))}
            </TableRow>
            {tableRows.map((row) => (
              <TableRow key={row[0]}>
                {row.map((text, i) => (
                  <TableCell key={i} style={tableCell}>
                    {text}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </Table>
        </Column>
      </Section>

      {/* Total */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #1d1d1f", padding: 10 }} />
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 24, fontWeight: 700, color: "#1d1d1f", textAlign: "right", lineHeight: 1.3 }}
        >
          $346.00
        </Heading>
        <Text style={{ padding: 10, fontSize: 12, color: "#86868b", textAlign: "right", lineHeight: 1.4 }}>
          Includes $27.68 tax · Free shipping
        </Text>
      </Section>

      {/* Divider */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #e5e5e7", padding: 10 }} />
      </Section>

      {/* Shipping & Order details — two columns */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#86868b",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              SHIPPING TO
            </Heading>
            <Text style={{ padding: 10, fontSize: 14, color: "#1d1d1f", textAlign: "left", lineHeight: 1.5 }}>
              Alex Johnson
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#6e6e73", textAlign: "left", lineHeight: 1.5 }}>
              123 Main Street
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#6e6e73", textAlign: "left", lineHeight: 1.5 }}>
              San Francisco, CA 94103
            </Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#86868b",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              ORDER DETAILS
            </Heading>
            <Text style={{ padding: 10, fontSize: 14, color: "#1d1d1f", textAlign: "left", lineHeight: 1.5 }}>
              Order #A1029384
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#6e6e73", textAlign: "left", lineHeight: 1.5 }}>
              Placed on March 3, 2026
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#6e6e73", textAlign: "left", lineHeight: 1.5 }}>
              Visa ending in 4242
            </Text>
          </Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#ffffff", padding: [8, 0, 40, 0] }}>
        <Divider style={{ borderTop: "1px solid #e5e5e7", padding: 10 }} />
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#0071e3",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 8,
            }}
          >
            Track Your Order
          </Button>
        </Column>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 32, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#86868b", textAlign: "center", lineHeight: 1.6 }}>
          Questions? Contact us at support@store.com
        </Text>
        <Text style={{ padding: 10, fontSize: 12, color: "#86868b", textAlign: "center", lineHeight: 1.6 }}>
          Store Inc · 1 Infinite Loop, Cupertino, CA
        </Text>
      </Section>
    </Email>
  );
}
