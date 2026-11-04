import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Button,
  Divider,
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
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="0 48px">
      <Column {...cell}>
        <Paragraph html={label} fontSize="14px" color={MUTED} lineHeight="140%" />
      </Column>
      <Column {...cell}>
        <Paragraph
          html={`<b>${value}</b>`}
          fontSize="14px"
          color={INK}
          textAlign="right"
          lineHeight="140%"
        />
      </Column>
    </Row>
  );
}

export function StripeReceipt() {
  return (
    <Email
      backgroundColor="#F6F9FC"
      contentWidth="600px"
      fontFamily={sans}
      textColor={INK}
      previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026."
    >
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="44px 48px 0 48px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="20px"
            fontWeight={700}
            color={INDIGO}
            textAlign="left"
            lineHeight="100%"
            letterSpacing="-0.01em"
          >
            Acme
          </Heading>
        </Column>
      </Row>

      {/* Eyebrow + heading + meta */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="40px 48px 0 48px">
        <Column>
          <Paragraph
            html="RECEIPT"
            fontSize="12px"
            fontWeight={700}
            color={MUTED}
            textAlign="left"
            letterSpacing="0.06em"
            lineHeight="100%"
          />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 48px 0 48px">
        <Column>
          <Heading
            headingType="h1"
            fontSize="28px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            lineHeight="125%"
            letterSpacing="-0.02em"
          >
            Receipt from Acme
          </Heading>
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="6px 48px 0 48px">
        <Column>
          <Paragraph
            html="Receipt #2705 · Paid Jul 1, 2026"
            fontSize="14px"
            color={MUTED}
            textAlign="left"
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Section divider before line items */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 4px 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Line items — Row + Column with hairline dividers (never <Table>) */}
      {lineRow("Pro Plan (monthly)", "$25.00")}
      {lineRow("Additional seats × 3", "$36.00")}
      {lineRow("Usage overage", "$4.50", true)}

      {/* Section divider before total */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Total — emphasized, no divider */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading
            headingType="h3"
            fontSize="18px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            lineHeight="120%"
          >
            Total
          </Heading>
        </Column>
        <Column>
          <Heading
            headingType="h3"
            fontSize="22px"
            fontWeight={700}
            color={INK}
            textAlign="right"
            lineHeight="120%"
            letterSpacing="-0.01em"
          >
            $65.50
          </Heading>
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="36px 48px 0 48px">
        <Column>
          <Button
            href="https://acme.com/invoices/2705.pdf"
            backgroundColor={INDIGO}
            color="#FFFFFF"
            fontSize="15px"
            fontWeight={600}
            padding="13px 24px"
            borderRadius="8px"
            textAlign="left"
          >
            Download invoice
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="44px 48px 48px 48px">
        <Column>
          <Paragraph
            html="Questions about this receipt? Contact <a href='mailto:support@acme.com'>support@acme.com</a>."
            fontSize="12px"
            color={MUTED}
            textAlign="left"
            lineHeight="160%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof StripeReceipt> = {
  title: "Agent Examples/Stripe · Payment Receipt",
  component: StripeReceipt,
};
export default meta;
export const Default: StoryObj<typeof StripeReceipt> = {};
