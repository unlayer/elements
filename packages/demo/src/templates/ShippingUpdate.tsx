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
} from "@unlayer/react-elements/primitives";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function ShippingUpdate(): ReactElement {
  return (
    <Email
      width={540}
      previewText="Great news! Your order has shipped and is on its way."
      style={{ backgroundColor: "#f3f4f6", color: "#111827", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ backgroundColor: "#111827", padding: [20, 0, 20, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Image
            src={{
              src: "https://placehold.co/100x24/ffffff/111827?text=PARCEL",
              width: 100,
              height: 24,
            }}
            alt="Parcel"
            style={{ width: 100 }}
          />
        </Column>
      </Section>

      {/* Status Banner */}
      <Section style={{ backgroundColor: "#059669", padding: [20, 0, 20, 0] }}>
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 18, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.3 }}
        >
          📦 Your order has shipped!
        </Heading>
      </Section>

      {/* Tracking Info */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 0, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#6b7280", textAlign: "center", lineHeight: 1.5 }}>
          Estimated delivery
        </Paragraph>
        <Heading
          style={{ padding: 10, fontSize: 24, fontWeight: 700, color: "#111827", textAlign: "center", lineHeight: 1.2 }}
        >
          Thursday, March 6
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
          by end of day
        </Paragraph>
      </Section>

      {/* Progress Bar Visual */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{ src: "https://placehold.co/460x8/059669/059669?text=+", width: 460, height: 8 }}
            alt="Shipping progress"
            style={{ width: 440 }}
          />
        </Column>
      </Section>

      {/* Progress Labels */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 28, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Paragraph style={{ padding: 10, fontSize: 11, color: "#059669", textAlign: "left", lineHeight: 1.5 }}>
              ✓ Confirmed
            </Paragraph>
          </Column>
          <Column style={{ width: "33.33%" }}>
            <Paragraph style={{ padding: 10, fontSize: 11, color: "#059669", textAlign: "center", lineHeight: 1.5 }}>
              ✓ Shipped
            </Paragraph>
          </Column>
          <Column style={{ width: "33.33%" }}>
            <Paragraph style={{ padding: 10, fontSize: 11, color: "#9ca3af", textAlign: "right", lineHeight: 1.5 }}>
              Delivered
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Track Button */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 28, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 6,
            }}
          >
            Track Package
          </Button>
        </Column>
      </Section>

      {/* Divider */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #e5e7eb", padding: 10 }} />
      </Section>

      {/* Shipping Details */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Paragraph style={{ padding: 10, fontSize: 10, color: "#9ca3af", textAlign: "left", lineHeight: 1.5 }}>
              SHIPPING TO
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#111827", textAlign: "left", lineHeight: 1.5 }}>
              <Span style={{ fontWeight: 700 }}>Alex Johnson</Span>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#6b7280", textAlign: "left", lineHeight: 1.5 }}>
              742 Evergreen Terrace San Francisco, CA 94102
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Paragraph style={{ padding: 10, fontSize: 10, color: "#9ca3af", textAlign: "left", lineHeight: 1.5 }}>
              TRACKING NUMBER
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#111827", textAlign: "left", lineHeight: 1.5 }}>
              <Span style={{ fontWeight: 700 }}>1Z999AA10123456784</Span>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#6b7280", textAlign: "left", lineHeight: 1.5 }}>
              UPS Ground
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Order Item */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e5e7eb", padding: 10 }} />
        <Paragraph style={{ padding: 10, fontSize: 10, color: "#9ca3af", textAlign: "left", lineHeight: 1.5 }}>
          ORDER #PRC-8847
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 32, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/100x100/f3f4f6/6b7280?text=Item",
                  width: 100,
                  height: 100,
                }}
                alt="Wireless Headphones"
                style={{ width: 100 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#111827", textAlign: "left", lineHeight: 1.5 }}>
              <Span style={{ fontWeight: 700 }}>Wireless Headphones Pro</Span>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#6b7280", textAlign: "left", lineHeight: 1.5 }}>
              Midnight Black · Qty: 1
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [24, 0, 40, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
          Questions about your order? Reply to this email or contact support.
        </Paragraph>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
          Parcel Co · Austin, TX
        </Paragraph>
      </Section>
    </Email>
  );
}
