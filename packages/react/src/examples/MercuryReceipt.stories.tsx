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

// Mercury/Wise-style fintech receipt — minimal, restrained, lots of whitespace.
const INK = "#1A1A2E";
const MUTED = "#6B7280";
const ACCENT = "#5C6AC4";
const LINE = "#ECECF1";
const sans = {
  label: "Sans Serif",
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function MercuryReceipt() {
  return (
    <Email backgroundColor="#FFFFFF" contentWidth="560px" fontFamily={sans} textColor={INK}>
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="48px 48px 0 48px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="15px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            lineHeight="100%"
          >
            ◆ Meridian
          </Heading>
        </Column>
      </Row>

      {/* Big amount */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="56px 48px 0 48px">
        <Column>
          <Heading
            headingType="h1"
            fontSize="52px"
            fontWeight={600}
            color={INK}
            textAlign="left"
            lineHeight="110%"
          >
            $1,240.00
          </Heading>
          <Paragraph
            html="Payment sent"
            fontSize="17px"
            color={MUTED}
            textAlign="left"
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Spacer + details table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="40px 48px 0 48px">
        <Column>
          <Table
            enableHeader={false}
            data={[
              ["To", "Olivia Hart"],
              ["From", "Operating · USD ••4582"],
              ["Date", "June 24, 2026"],
              ["Reference", "TXN-9F3K-22B0"],
            ]}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Button
            href="https://meridian.example.com/tx/9F3K22B0"
            backgroundColor={ACCENT}
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
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="48px 48px 56px 48px">
        <Column>
          <Paragraph
            html="Meridian Financial · This receipt confirms a completed transfer."
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

const meta: Meta<typeof MercuryReceipt> = {
  title: "Agent Examples/Mercury · Transaction Receipt",
  component: MercuryReceipt,
};
export default meta;
export const Default: StoryObj<typeof MercuryReceipt> = {};
