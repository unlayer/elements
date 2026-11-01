// main's examples/MercuryReceipt.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 45: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
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

// Mercury/Wise-style fintech receipt — sophisticated, restrained, generous whitespace.
const INK = "#0E0E10";
const MUTED = "#6B6B70";
const ACCENT = "#5A4FCF";
const SUCCESS = "#1F9D55";
const LINE = "#ECECEE";
const BG = "#FAFAFA";
const CARD = "#FFFFFF";

const sans = {
  label: "Sans Serif",
  value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * A single label/value line rendered as a Row + two Columns, with a hairline
 * divider drawn by the Column's bottom border. NOT a <Table> — the shorthand
 * table renders an ugly bordered spreadsheet with no padding.
 *
 * Call inline as {detailRow(...)} — Email only recognizes <Row> children.
 */
function detailRow(label: string, value: string, last = false) {
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

export function MercuryReceipt() {
  return (
    <Email width={560} style={{ backgroundColor: BG, color: INK, fontFamily: sans.value }}>
      {/* Wordmark */}
      <Section style={{ backgroundColor: CARD, padding: [44, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 17,
            fontWeight: 600,
            color: INK,
            textAlign: "left",
            lineHeight: "100%",
            letterSpacing: -0.17,
          }}
        >
          Meridian
        </Heading>
      </Section>

      {/* Status eyebrow */}
      <Section style={{ backgroundColor: CARD, padding: [52, 0, 0, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: SUCCESS,
            textAlign: "left",
            lineHeight: "100%",
            letterSpacing: 0.72,
          }}
        >
          PAYMENT SENT
        </Paragraph>
      </Section>

      {/* Big amount */}
      <Section style={{ backgroundColor: CARD, padding: [14, 0, 0, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontSize: 48,
            fontWeight: 600,
            color: INK,
            textAlign: "left",
            lineHeight: "110%",
            letterSpacing: -0.96,
          }}
        >
          $1,240.00
        </Heading>
      </Section>

      {/* Subhead */}
      <Section style={{ backgroundColor: CARD, padding: [6, 0, 0, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 16, color: MUTED, textAlign: "left", lineHeight: "150%" }}
        >
          Your transfer to Olivia Hart is on its way.
        </Paragraph>
      </Section>

      {/* Section label */}
      <Section style={{ backgroundColor: CARD, padding: [40, 0, 4, 0] }}>
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
          DETAILS
        </Paragraph>
      </Section>

      {/* Details — label/value rows with hairline dividers */}
      {detailRow("To", "Olivia Hart")}
      {detailRow("From", "Acme Inc · ••4291")}
      {detailRow("Date", "Jul 1, 2026")}
      {detailRow("Reference", "INV-2705", true)}

      {/* Divider */}
      <Section style={{ backgroundColor: CARD, padding: [36, 0, 0, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: CARD, padding: [32, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="https://meridian.example.com/tx/INV-2705"
            style={{
              backgroundColor: INK,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 500,
              padding: "13px 24px",
              borderRadius: 8,
            }}
          >
            View transaction
          </Button>
        </Column>
      </Section>

      {/* Footer */}
      <Section style={{ backgroundColor: CARD, padding: [48, 0, 56, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 12, color: MUTED, textAlign: "left", lineHeight: "170%" }}
        >
          {"Meridian Financial · This receipt confirms a completed transfer. Need help? "}
          <Link
            href="https://meridian.example.com/support"
            style={{ color: ACCENT, textDecoration: "none" }}
          >
            Contact support
          </Link>
          .
        </Paragraph>
      </Section>
    </Email>
  );
}
