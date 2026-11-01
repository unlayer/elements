// main's examples/StripeReceipt.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 38: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Link,
  Paragraph,
  Row,
  Section,
  Span,
} from "../index";

// Stripe-style payment receipt — minimal, lots of whitespace, hairline dividers.
// Line items are rendered as Row + Column (never <Table>) so they stay airy
// instead of collapsing into a bordered spreadsheet.
const INDIGO = "#635BFF";
const INK = "#1A1F36";
const MUTED = "#697386";
const LINE = "#E3E8EE";
const sans = {
  label: "Sans Serif",
  value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

// One label/value line, separated from the next by a hairline drawn on the
// Column's bottom border. Pass last=true to drop the divider on the final row.
function lineRow(label: string, value: string, last = false) {
  const cell = {
    padding: "14px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: LINE,
  } as const;
  return (
    <Section style={{ backgroundColor: "#FFFFFF" }}>
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

export function StripeReceipt() {
  return (
    <Email
      width={600}
      previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026."
      style={{ backgroundColor: "#F6F9FC", color: INK, fontFamily: sans.value }}
    >
      {/* Wordmark */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [44, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 20,
            fontWeight: 700,
            color: INDIGO,
            textAlign: "left",
            lineHeight: "100%",
            letterSpacing: -0.2,
          }}
        >
          Acme
        </Heading>
      </Section>

      {/* Eyebrow + heading + meta */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [40, 0, 0, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            textAlign: "left",
            lineHeight: "100%",
            letterSpacing: 0.72,
          }}
        >
          RECEIPT
        </Paragraph>
      </Section>
      <Section style={{ backgroundColor: "#FFFFFF", padding: [12, 0, 0, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontSize: 28,
            fontWeight: 600,
            color: INK,
            textAlign: "left",
            lineHeight: "125%",
            letterSpacing: -0.56,
          }}
        >
          Receipt from Acme
        </Heading>
      </Section>
      <Section style={{ backgroundColor: "#FFFFFF", padding: [6, 0, 0, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 14, color: MUTED, textAlign: "left", lineHeight: "150%" }}
        >
          Receipt #2705 · Paid Jul 1, 2026
        </Paragraph>
      </Section>

      {/* Section divider before line items */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 4, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Line items — Row + Column with hairline dividers (never <Table>) */}
      {lineRow("Pro Plan (monthly)", "$25.00")}
      {lineRow("Additional seats × 3", "$36.00")}
      {lineRow("Usage overage", "$4.50", true)}

      {/* Section divider before total */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 0, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Total — emphasized, no divider */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 18,
                fontWeight: 600,
                color: INK,
                textAlign: "left",
                lineHeight: "120%",
              }}
            >
              Total
            </Heading>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 22,
                fontWeight: 700,
                color: INK,
                textAlign: "right",
                lineHeight: "120%",
                letterSpacing: -0.22,
              }}
            >
              $65.50
            </Heading>
          </Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [36, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="https://acme.com/invoices/2705.pdf"
            style={{
              backgroundColor: INDIGO,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              padding: "13px 24px",
              borderRadius: 8,
            }}
          >
            Download invoice
          </Button>
        </Column>
      </Section>

      {/* Footer */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [44, 0, 48, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 12, color: MUTED, textAlign: "left", lineHeight: "160%" }}
        >
          {"Questions about this receipt? Contact "}
          <Link href="mailto:support@acme.com">support@acme.com</Link>.
        </Paragraph>
      </Section>
    </Email>
  );
}
