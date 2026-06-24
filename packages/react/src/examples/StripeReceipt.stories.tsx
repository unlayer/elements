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
  Table,
} from "../index";

// Reconstructed from the "fresh agent" Stripe build — verbatim natural forms:
// Table headers/data, string fontWeight/numeric mix, minimal layout.
const INDIGO = "#635BFF";
const INK = "#1A1F36";
const MUTED = "#697386";
const LINE = "#E3E8EE";
const sans = {
  label: "Sans Serif",
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function StripeReceipt() {
  return (
    <Email backgroundColor="#F6F9FC" contentWidth="600px" fontFamily={sans}>
      {/* Brand wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="36px 48px 4px 48px">
        <Column>
          <Heading headingType="h3" fontSize="20px" fontWeight={700} color={INDIGO} textAlign="left">
            Acme, Inc.
          </Heading>
        </Column>
      </Row>

      {/* Heading */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="28px" fontWeight={600} color={INK} lineHeight="130%">
            Receipt from Acme
          </Heading>
          <Paragraph
            html="Receipt #2705-0042 · Paid July 1, 2026"
            fontSize="14px"
            color={MUTED}
          />
        </Column>
      </Row>

      {/* Line items */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 0 48px">
        <Column>
          <Table
            headers={["Description", "Amount"]}
            data={[
              ["Pro Plan (monthly)", "$25.00"],
              ["Additional seats × 3", "$36.00"],
              ["Usage overage", "$4.50"],
            ]}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Total */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="8px 48px 4px 48px">
        <Column>
          <Paragraph html="<b>Total paid</b>" fontSize="16px" color={INK} textAlign="left" />
        </Column>
        <Column>
          <Paragraph html="<b>$65.50</b>" fontSize="16px" color={INK} textAlign="right" />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 36px 48px">
        <Column>
          <Button
            href="https://acme.com/invoices/2705-0042.pdf"
            backgroundColor={INDIGO}
            color="#FFFFFF"
            fontSize="15px"
            fontWeight={500}
            padding="12px 22px"
            borderRadius="6px"
            textAlign="left"
          >
            Download invoice
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 48px 40px 48px">
        <Column>
          <Paragraph
            html="Questions? Contact <a href='mailto:support@acme.com'>support@acme.com</a>."
            fontSize="12px"
            color={MUTED}
            textAlign="center"
            lineHeight="150%"
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
