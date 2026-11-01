/**
 * main's "Warby Parker · Order Shipped" example, and the same design written with the new components
 * (main's layout read as StripeReceipt.tsx says).
 *
 * main puts a Row's padding outside the 600px content: in a window narrower than 712px, this Row's 56px
 * sides narrow its paragraph (the comparison's 760px window has room for them).
 */
import { WarbyOrderShipped } from "../../examples/WarbyOrderShipped.stories";
import { Button, Column, Email, Heading, Image, Link, Paragraph, Row, Section } from "../index";
import { lineRow } from "./lineRow";

const INK = "#2A2A2A";
const MUTED = "#767676";
const NAVY = "#00263A";
const BLUE = "#3B5BDB";
const LINE = "#EBEBEB";
const BG = "#F6F6F4";
const CARD = "#FFFFFF";
const NBSP = " ";

const lines = { label: MUTED, value: INK, line: LINE };
const eyebrow = { fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 0.72, lineHeight: "100%" } as const;

/** A product line: its name in bold and its variant under it on the left, its price on the right. */
function productRow(name: string, variant: string, price: string, last = false) {
  const cell = { padding: "16px 0", border: last ? undefined : { bottom: `1px solid ${LINE}` } };
  return (
    <Section style={{ backgroundColor: CARD }}>
      <Row>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 15, fontWeight: 700, color: INK, lineHeight: "150%" }}>{name}</Paragraph>
          <Paragraph style={{ padding: 10, fontSize: 13, color: MUTED, lineHeight: "150%" }}>{variant}</Paragraph>
        </Column>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 15, fontWeight: 700, color: INK, textAlign: "right", lineHeight: "150%" }}>{price}</Paragraph>
        </Column>
      </Row>
    </Section>
  );
}

export const main = <WarbyOrderShipped />;

export const next = (
  <Email
    width={600}
    previewText="Good news, Alex — your order is on its way. 📦"
    style={{ backgroundColor: BG, color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
  >
    <Section style={{ backgroundColor: CARD, padding: [46, 10, 38, 10] }}>
      <Heading level={2} style={{ fontSize: 20, fontWeight: 700, color: NAVY, letterSpacing: 3.6, textAlign: "center", lineHeight: "100%" }}>
        WARBY PARKER
      </Heading>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: 10 }}>
      <Image
        src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
        alt="A pair of eyeglasses resting on a clean surface"
        style={{ width: "100%" }}
      />
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [50, 10, 10, 10] }}>
      <Paragraph style={{ ...eyebrow, color: BLUE, textAlign: "center" }}>SHIPPED</Paragraph>
    </Section>
    <Section style={{ backgroundColor: CARD, padding: [22, 10, 10, 10] }}>
      <Heading level={1} style={{ fontSize: 30, fontWeight: 700, color: NAVY, lineHeight: "124%", textAlign: "center" }}>
        Your order is on its way 📦
      </Heading>
    </Section>
    <Section style={{ backgroundColor: CARD, padding: [24, 10, 14, 10] }}>
      <Paragraph style={{ fontSize: 15, color: MUTED, lineHeight: "164%", textAlign: "center" }}>
        Hi Alex — your new frames have left our lab and are headed your way. We&apos;ll email you again the moment they land on your doorstep.
      </Paragraph>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [42, 10, 14, 10] }}>
      <Paragraph style={eyebrow}>TRACKING DETAILS</Paragraph>
    </Section>
    {lineRow("Carrier", "USPS Priority", lines)}
    {lineRow("Tracking number", "9400 1234 5678 9012 3456", lines)}
    {lineRow("Estimated delivery", "Mon, Jul 8", lines, true)}

    <Section style={{ backgroundColor: CARD, padding: [38, 10, 14, 10] }}>
      <Button
        href="https://tools.usps.com/go/TrackConfirmAction?tLabels=94001234567890123456"
        style={{ width: "100%", backgroundColor: NAVY, color: "#FFFFFF", fontSize: 15, fontWeight: 700, padding: "15px 28px", borderRadius: 8 }}
      >
        Track package
      </Button>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [46, 10, 14, 10] }}>
      <Paragraph style={eyebrow}>IN THIS ORDER</Paragraph>
    </Section>
    {productRow("Percey", "Whiskey Tortoise", "$145")}
    {productRow("Haskell", "Crystal", "$95", true)}
    {lineRow("Total", "$240", lines, true)}

    <Section style={{ backgroundColor: CARD, padding: [38, 10, 50, 10] }}>
      <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "164%", textAlign: "center" }}>
        Questions about your order? Our team is here to help — just reply to this email or visit the{" "}
        <Link href="https://www.warbyparker.com/help" style={{ color: BLUE }}>
          Help Center
        </Link>
        .
      </Paragraph>
    </Section>
    <Section style={{ backgroundColor: BG, padding: [38, 10, 18, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "160%" }}>Warby Parker · 233 Spring Street, New York, NY 10013</Paragraph>
    </Section>
    <Section style={{ backgroundColor: BG, padding: [10, 10, 46, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "160%" }}>
        <Link href="#" style={{ color: MUTED }}>
          Unsubscribe
        </Link>
        {` ${NBSP}·${NBSP} `}
        <Link href="#" style={{ color: MUTED }}>
          Privacy Policy
        </Link>
      </Paragraph>
    </Section>
  </Email>
);
