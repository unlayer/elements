/**
 * main's "Stripe · Payment Receipt" example, and the same design written with the new components.
 *
 * How main's layout reads in the new ones: a Row is a band across the window (a Section) with its
 * padding outside the 600px content, and every block has 10px of padding. So a one-column Row is a
 * Section padded by the Row's top and bottom plus 10, and 10 on the sides; a two-column Row is a
 * Row of Columns padded by 10. Letter spacing is in px here (main's em times the font size).
 */
import { StripeReceipt } from "../../examples/StripeReceipt.stories";
import { Button, Column, Divider, Email, Heading, Link, Paragraph, Row, Section } from "../index";

const INDIGO = "#635BFF";
const INK = "#1A1F36";
const MUTED = "#697386";
const LINE = "#E3E8EE";
const WHITE = "#FFFFFF";

function lineRow(label: string, value: string, last = false) {
  const cell = { padding: "14px 0", border: last ? undefined : { bottom: `1px solid ${LINE}` } };
  return (
    <Section style={{ backgroundColor: WHITE }}>
      <Row>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>{label}</Paragraph>
        </Column>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, fontWeight: 700, color: INK, textAlign: "right", lineHeight: "140%" }}>{value}</Paragraph>
        </Column>
      </Row>
    </Section>
  );
}

export const main = <StripeReceipt />;

export const next = (
  <Email
    width={600}
    previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026."
    style={{ backgroundColor: "#F6F9FC", color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
  >
    <Section style={{ backgroundColor: WHITE, padding: [54, 10, 10, 10] }}>
      <Heading level={4} style={{ fontSize: 20, fontWeight: 700, color: INDIGO, lineHeight: "100%", letterSpacing: -0.2 }}>
        Acme
      </Heading>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [50, 10, 10, 10] }}>
      <Paragraph style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 0.72, lineHeight: "100%" }}>RECEIPT</Paragraph>
    </Section>
    <Section style={{ backgroundColor: WHITE, padding: [22, 10, 10, 10] }}>
      <Heading level={1} style={{ fontSize: 28, fontWeight: 600, lineHeight: "125%", letterSpacing: -0.56 }}>
        Receipt from Acme
      </Heading>
    </Section>
    <Section style={{ backgroundColor: WHITE, padding: [16, 10, 10, 10] }}>
      <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "150%" }}>Receipt #2705 · Paid Jul 1, 2026</Paragraph>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [42, 10, 14, 10] }}>
      <Divider style={{ borderTop: `1px solid ${LINE}` }} />
    </Section>

    {lineRow("Pro Plan (monthly)", "$25.00")}
    {lineRow("Additional seats × 3", "$36.00")}
    {lineRow("Usage overage", "$4.50", true)}

    <Section style={{ backgroundColor: WHITE, padding: [18, 10, 10, 10] }}>
      <Divider style={{ borderTop: `1px solid ${LINE}` }} />
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [20, 0, 0, 0] }}>
      <Row>
        <Column style={{ padding: 10 }}>
          <Heading level={3} style={{ fontSize: 18, fontWeight: 600, lineHeight: "120%" }}>
            Total
          </Heading>
        </Column>
        <Column style={{ padding: 10 }}>
          <Heading level={3} style={{ fontSize: 22, fontWeight: 700, textAlign: "right", lineHeight: "120%", letterSpacing: -0.22 }}>
            $65.50
          </Heading>
        </Column>
      </Row>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [46, 10, 10, 10] }}>
      <Button
        href="https://acme.com/invoices/2705.pdf"
        style={{ backgroundColor: INDIGO, color: WHITE, fontSize: 15, fontWeight: 600, padding: "13px 24px", borderRadius: 8 }}
      >
        Download invoice
      </Button>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [54, 10, 58, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, lineHeight: "160%" }}>
        Questions about this receipt? Contact <Link href="mailto:support@acme.com">support@acme.com</Link>.
      </Paragraph>
    </Section>
  </Email>
);
