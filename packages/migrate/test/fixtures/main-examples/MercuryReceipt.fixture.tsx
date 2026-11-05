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
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor={CARD} padding="0 48px">
      <Column {...cell}>
        <Paragraph
          html={label}
          fontSize="14px"
          color={MUTED}
          lineHeight="140%"
        />
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

export function MercuryReceipt() {
  return (
    <Email
      backgroundColor={BG}
      contentWidth="560px"
      fontFamily={sans}
      textColor={INK}
    >
      {/* Wordmark */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="44px 48px 0 48px"
      >
        <Column>
          <Heading
            headingType="h4"
            fontSize="17px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            letterSpacing="-0.01em"
            lineHeight="100%"
          >
            Meridian
          </Heading>
        </Column>
      </Row>

      {/* Status eyebrow */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="52px 48px 0 48px"
      >
        <Column>
          <Paragraph
            html="PAYMENT SENT"
            fontSize="12px"
            fontWeight={700}
            color={SUCCESS}
            textAlign="left"
            letterSpacing="0.06em"
            lineHeight="100%"
          />
        </Column>
      </Row>

      {/* Big amount */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="14px 48px 0 48px"
      >
        <Column>
          <Heading
            headingType="h1"
            fontSize="48px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            letterSpacing="-0.02em"
            lineHeight="110%"
          >
            $1,240.00
          </Heading>
        </Column>
      </Row>

      {/* Subhead */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="6px 48px 0 48px"
      >
        <Column>
          <Paragraph
            html="Your transfer to Olivia Hart is on its way."
            fontSize="16px"
            color={MUTED}
            textAlign="left"
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Section label */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="40px 48px 4px 48px"
      >
        <Column>
          <Paragraph
            html="DETAILS"
            fontSize="12px"
            fontWeight={700}
            color={MUTED}
            textAlign="left"
            letterSpacing="0.06em"
            lineHeight="100%"
          />
        </Column>
      </Row>

      {/* Details — label/value rows with hairline dividers */}
      {detailRow("To", "Olivia Hart")}
      {detailRow("From", "Acme Inc · ••4291")}
      {detailRow("Date", "Jul 1, 2026")}
      {detailRow("Reference", "INV-2705", true)}

      {/* Divider */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="36px 48px 0 48px"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor={LINE}
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="32px 48px 0 48px"
      >
        <Column>
          <Button
            href="https://meridian.example.com/tx/INV-2705"
            backgroundColor={INK}
            color="#FFFFFF"
            fontSize="15px"
            fontWeight={500}
            padding="13px 24px"
            borderRadius="8px"
            textAlign="left"
          >
            View transaction
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor={CARD}
        padding="48px 48px 56px 48px"
      >
        <Column>
          <Paragraph
            html={`Meridian Financial · This receipt confirms a completed transfer. Need help? <a href="https://meridian.example.com/support" style="color:${ACCENT};text-decoration:none;">Contact support</a>.`}
            fontSize="12px"
            color={MUTED}
            textAlign="left"
            lineHeight="170%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof MercuryReceipt> = {
  title: "Agent Examples/Mercury · Transaction Receipt",
  component: MercuryReceipt,
};
export default meta;
export const Default: StoryObj<typeof MercuryReceipt> = {};
