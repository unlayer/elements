import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Paragraph,
  Row,
  Section,
  Span,
} from "@unlayer/react-elements";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function AbandonedCart(): ReactElement {
  return (
    <Email
      width={540}
      previewText="You left something behind. Complete your order before it sells out."
      style={{ backgroundColor: "#ffffff", color: "#1a1a1a", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ backgroundColor: "#fafaf9", padding: [24, 0, 24, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{
              src: "https://placehold.co/120x30/1a1a1a/ffffff?text=FORMA",
              width: 120,
              height: 30,
            }}
            alt="Forma"
            style={{ width: 120 }}
          />
        </Column>
      </Section>

      {/* Hero */}
      <Section style={{ backgroundColor: "#fafaf9", padding: [32, 0, 40, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.2 }}
        >
          Still thinking it over?
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 15, color: "#71717a", textAlign: "center", lineHeight: 1.6 }}>
          No rush — your cart is waiting. But these items are popular and stock is limited.
        </Paragraph>
      </Section>

      {/* Product 1 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/140x140/f5f5f4/a8a29e?text=Product",
                  width: 140,
                  height: 140,
                }}
                alt="Ceramic Desk Lamp"
                style={{ width: 133 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Ceramic Desk Lamp
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#a1a1aa", textAlign: "left", lineHeight: 1.5 }}>
              Matte White · Medium
            </Paragraph>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              $89.00
            </Heading>
          </Column>
        </Row>
      </Section>

      {/* Divider between products */}
      <Section style={{ backgroundColor: "#ffffff", padding: [20, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #f4f4f5", padding: 10 }} />
      </Section>

      {/* Product 2 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [20, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/140x140/f5f5f4/a8a29e?text=Product",
                  width: 140,
                  height: 140,
                }}
                alt="Linen Throw Pillow"
                style={{ width: 133 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Linen Throw Pillow
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#a1a1aa", textAlign: "left", lineHeight: 1.5 }}>
              Oatmeal · 20″ × 20″
            </Paragraph>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              $45.00
            </Heading>
          </Column>
        </Row>
      </Section>

      {/* Total + CTA */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e4e4e7", padding: 10 }} />
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 18, fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}
        >
          Cart Total: $134.00
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 13, color: "#16a34a", textAlign: "center", lineHeight: 1.5 }}>
          Free shipping on orders over $100 ✔️
        </Paragraph>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#1a1a1a",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              padding: "16px 40px",
              borderRadius: 6,
            }}
          >
            Complete Your Order
          </Button>
        </Column>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          Secure checkout · Free returns within 30 days
        </Paragraph>
      </Section>

      {/* Social proof */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 40, 0] }}>
        <Divider style={{ borderTop: "1px solid #f4f4f5", padding: 10 }} />
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "center", lineHeight: 1.5 }}>
          {"★★★★★ "}
          <Span style={{ fontWeight: 700 }}>4.9/5</Span>
          {" from 2,400+ reviews"}
        </Paragraph>
        <Paragraph style={{ padding: 10, fontSize: 13, color: "#a1a1aa", textAlign: "center", lineHeight: 1.6 }}>
          <Span style={{ fontStyle: "italic" }}>
            "Beautifully made. The lamp is even better in person."
          </Span>
          {" — Emma R."}
        </Paragraph>
      </Section>

      {/* Footer */}
      <Section style={{ backgroundColor: "#fafaf9", padding: [24, 0, 24, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          Forma Home · Brooklyn, NY
        </Paragraph>
      </Section>
    </Email>
  );
}
