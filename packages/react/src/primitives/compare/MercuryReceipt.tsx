/**
 * main's "Mercury · Transaction Receipt" example, a 560px email, and the same design written with
 * the new components (main's layout read as StripeReceipt.tsx says).
 */
import { MercuryReceipt } from "../../examples/MercuryReceipt.stories";
import { Button, Divider, Email, Heading, Link, Paragraph, Section } from "../index";
import { lineRow } from "./lineRow";

const INK = "#0E0E10";
const MUTED = "#6B6B70";
const ACCENT = "#5A4FCF";
const SUCCESS = "#1F9D55";
const LINE = "#ECECEE";
const CARD = "#FFFFFF";

const lines = { label: MUTED, value: INK, line: LINE };
const eyebrow = { fontSize: 12, fontWeight: 700, letterSpacing: 0.72, lineHeight: "100%" } as const;

export const main = <MercuryReceipt />;

export const next = (
  <Email width={560} style={{ backgroundColor: "#FAFAFA", color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
    <Section style={{ backgroundColor: CARD, padding: [54, 10, 10, 10] }}>
      <Heading level={4} style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.17, lineHeight: "100%" }}>
        Meridian
      </Heading>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [62, 10, 10, 10] }}>
      <Paragraph style={{ ...eyebrow, color: SUCCESS }}>PAYMENT SENT</Paragraph>
    </Section>
    <Section style={{ backgroundColor: CARD, padding: [24, 10, 10, 10] }}>
      <Heading level={1} style={{ fontSize: 48, fontWeight: 600, letterSpacing: -0.96, lineHeight: "110%" }}>
        $1,240.00
      </Heading>
    </Section>
    <Section style={{ backgroundColor: CARD, padding: [16, 10, 10, 10] }}>
      <Paragraph style={{ fontSize: 16, color: MUTED, lineHeight: "150%" }}>Your transfer to Olivia Hart is on its way.</Paragraph>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [50, 10, 14, 10] }}>
      <Paragraph style={{ ...eyebrow, color: MUTED }}>DETAILS</Paragraph>
    </Section>
    {lineRow("To", "Olivia Hart", lines)}
    {lineRow("From", "Acme Inc · ••4291", lines)}
    {lineRow("Date", "Jul 1, 2026", lines)}
    {lineRow("Reference", "INV-2705", lines, true)}

    <Section style={{ backgroundColor: CARD, padding: [46, 10, 10, 10] }}>
      <Divider style={{ borderTop: `1px solid ${LINE}` }} />
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [42, 10, 10, 10] }}>
      <Button
        href="https://meridian.example.com/tx/INV-2705"
        style={{ backgroundColor: INK, color: "#FFFFFF", fontSize: 15, fontWeight: 500, padding: "13px 24px", borderRadius: 8 }}
      >
        View transaction
      </Button>
    </Section>

    <Section style={{ backgroundColor: CARD, padding: [58, 10, 66, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, lineHeight: "170%" }}>
        Meridian Financial · This receipt confirms a completed transfer. Need help?{" "}
        <Link href="https://meridian.example.com/support" style={{ color: ACCENT, textDecoration: "none" }}>
          Contact support
        </Link>
        .
      </Paragraph>
    </Section>
  </Email>
);
