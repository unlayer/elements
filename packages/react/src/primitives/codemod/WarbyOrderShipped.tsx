// main's examples/WarbyOrderShipped.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 45: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
// - line 80: its html comes from an expression (variant): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
import {
  Button,
  Column,
  Email,
  Heading,
  Image,
  Link,
  Paragraph,
  Row,
  Section,
  Span,
} from "../index";

// Warby-Parker-style "Your order has shipped" email.
// Clean, modern, friendly — navy/blue palette, generous whitespace,
// hairline dividers via the Column bottom border (no <Table> shorthand).
const INK = "#2A2A2A"; // primary text
const MUTED = "#767676"; // secondary text
const NAVY = "#00263A"; // navy accent / wordmark
const BLUE = "#3B5BDB"; // friendly CTA blue
const LINE = "#EBEBEB"; // hairline divider
const BG = "#F6F6F4"; // email background
const CARD = "#FFFFFF"; // content rows

const sans = {
  label: "Sans Serif",
  value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * One label/value (or product/price) line, separated by a hairline rule drawn
 * on the Column's bottom border. Called inline as `{lineRow(...)}` — Email only
 * recognizes <Row> children, so this must NOT be used as a <lineRow/> element.
 */
function lineRow(label: string, value: string, last = false) {
  const cell = {
    padding: "14px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: LINE,
  } as const;
  return (
    <Section style={{ backgroundColor: CARD }}>
      <Row
        style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        mobile={{ border: { bottom: "none" } }}
      >
        <Column
          style={{ width: "50%", padding: "14px 0" }}
          mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        >
          <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>
            {label}
          </Paragraph>
        </Column>
        <Column
          style={{ width: "50%", padding: "14px 0" }}
          mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        >
          <Paragraph
            style={{
              padding: 10,
              fontSize: 14,
              color: INK,
              textAlign: "right",
              lineHeight: "140%",
            }}
          >
            <Span style={{ fontWeight: 700 }}>{value}</Span>
          </Paragraph>
        </Column>
      </Row>
    </Section>
  );
}

/**
 * A product line-item: name + variant on the left, bold price on the right,
 * with a small muted sub-label under the name. Hairline via the Column border.
 */
function productRow(name: string, variant: string, price: string, last = false) {
  const cell = {
    padding: "16px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: LINE,
  } as const;
  return (
    <Section style={{ backgroundColor: CARD }}>
      <Row
        style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        mobile={{ border: { bottom: "none" } }}
      >
        <Column
          style={{ width: "50%", padding: "16px 0" }}
          mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        >
          <Paragraph style={{ padding: 10, fontSize: 15, color: INK, lineHeight: "150%" }}>
            <Span style={{ fontWeight: 700 }}>{name}</Span>
          </Paragraph>
          <Paragraph style={{ padding: 10, fontSize: 13, color: MUTED, lineHeight: "150%" }}>
            {variant}
          </Paragraph>
        </Column>
        <Column
          style={{ width: "50%", padding: "16px 0" }}
          mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
        >
          <Paragraph
            style={{
              padding: 10,
              fontSize: 15,
              color: INK,
              textAlign: "right",
              lineHeight: "150%",
            }}
          >
            <Span style={{ fontWeight: 700 }}>{price}</Span>
          </Paragraph>
        </Column>
      </Row>
    </Section>
  );
}

export function WarbyOrderShipped() {
  return (
    <Email
      width={600}
      previewText="Good news, Alex — your order is on its way. 📦"
      style={{ backgroundColor: BG, color: INK, fontFamily: sans.value }}
    >
      {/* Brand wordmark */}
      <Section style={{ backgroundColor: CARD, padding: [36, 0, 28, 0] }}>
        <Heading
          level={2}
          style={{
            padding: 10,
            fontSize: 20,
            fontWeight: 700,
            color: NAVY,
            textAlign: "center",
            lineHeight: "100%",
            letterSpacing: 3.6,
          }}
        >
          WARBY PARKER
        </Heading>
      </Section>

      {/* Hero lifestyle photo */}
      <Section style={{ backgroundColor: CARD }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={
              "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
            }
            alt="A pair of eyeglasses resting on a clean surface"
          />
        </Column>
      </Section>

      {/* Eyebrow + headline */}
      <Section style={{ backgroundColor: CARD, padding: [40, 0, 0, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: BLUE,
            textAlign: "center",
            lineHeight: "100%",
            letterSpacing: 0.72,
          }}
        >
          SHIPPED
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [12, 0, 0, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontSize: 30,
            fontWeight: 700,
            color: NAVY,
            textAlign: "center",
            lineHeight: "124%",
          }}
        >
          Your order is on its way 📦
        </Heading>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [14, 0, 4, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 15,
            color: MUTED,
            textAlign: "center",
            lineHeight: "164%",
          }}
        >
          Hi Alex — your new frames have left our lab and are headed your way. We'll email you again
          the moment they land on your doorstep.
        </Paragraph>
      </Section>

      {/* Tracking summary — eyebrow */}
      <Section style={{ backgroundColor: CARD, padding: [32, 0, 4, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            lineHeight: "100%",
            letterSpacing: 0.72,
          }}
        >
          TRACKING DETAILS
        </Paragraph>
      </Section>

      {/* Tracking detail rows (label / value, hairline divider via Column border) */}
      {lineRow("Carrier", "USPS Priority")}
      {lineRow("Tracking number", "9400 1234 5678 9012 3456")}
      {lineRow("Estimated delivery", "Mon, Jul 8", true)}

      {/* Track package CTA */}
      <Section style={{ backgroundColor: CARD, padding: [28, 0, 4, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="https://tools.usps.com/go/TrackConfirmAction?tLabels=94001234567890123456"
            style={{
              width: "100%",
              backgroundColor: NAVY,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              padding: "15px 28px",
              borderRadius: 8,
            }}
          >
            Track package
          </Button>
        </Column>
      </Section>

      {/* In this order — eyebrow */}
      <Section style={{ backgroundColor: CARD, padding: [36, 0, 4, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            lineHeight: "100%",
            letterSpacing: 0.72,
          }}
        >
          IN THIS ORDER
        </Paragraph>
      </Section>

      {/* Product line-items (name + variant / bold price, hairline divider) */}
      {productRow("Percey", "Whiskey Tortoise", "$145")}
      {productRow("Haskell", "Crystal", "$95", true)}

      {/* Order total */}
      {lineRow("Total", "$240", true)}

      {/* Help / footer */}
      <Section style={{ backgroundColor: CARD, padding: [28, 0, 40, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 14,
            color: MUTED,
            textAlign: "center",
            lineHeight: "164%",
          }}
        >
          {
            "Questions about your order? Our team is here to help — just reply to this email or visit the "
          }
          <Link href="https://www.warbyparker.com/help" style={{ color: "#3B5BDB" }}>
            Help Center
          </Link>
          .
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: BG, padding: [28, 0, 8, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: "160%",
          }}
        >
          Warby Parker · 233 Spring Street, New York, NY 10013
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: BG, padding: [0, 0, 36, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: "160%",
          }}
        >
          <Link href="#" style={{ color: "#767676" }}>
            Unsubscribe
          </Link>
          {"  ·  "}
          <Link href="#" style={{ color: "#767676" }}>
            Privacy Policy
          </Link>
        </Paragraph>
      </Section>
    </Email>
  );
}
