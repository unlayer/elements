import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Divider,
  Menu,
} from "../index";

// Reconstructed from the "fresh agent" SaaS-digest build — verbatim natural
// forms: heading fonts, inline <a> via Paragraph html, ColumnLayouts.TwoEqual,
// Menu items shorthand with separator.
const INK = "#18181B";
const BODY = "#52525B";
const MUTED = "#A1A1AA";
const LINE = "#E4E4E7";
const sans = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export function ProductDigest() {
  return (
    <Email backgroundColor="#FAFAFA" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={INK} textAlign="left">
            ◆ Linear
          </Heading>
        </Column>
      </Row>

      {/* Title */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="32px" fontWeight={700} color={INK} lineHeight="120%">
            Product updates, June 2026
          </Heading>
          <Paragraph
            html="Three improvements shipped this month to make you faster."
            fontSize="16px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      {/* Feature 1 */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK} lineHeight="130%">
            Faster command palette
          </Heading>
          <Paragraph
            html="The command palette now opens in under 50ms. Read the full <a href='https://linear.app/changelog'>changelog entry</a> for the details."
            fontSize="15px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      {/* Two-column features */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="12px 48px 8px 48px">
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK}>
            Sub-issues
          </Heading>
          <Paragraph
            html="Break work down without leaving the issue view."
            fontSize="15px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK}>
            Saved views
          </Heading>
          <Paragraph
            html="Pin the filters you use every day to the sidebar."
            fontSize="15px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Footer menu */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 8px 48px">
        <Column>
          <Menu
            items={[
              { text: "Docs", href: "https://linear.app/docs" },
              { text: "Blog", href: "https://linear.app/blog" },
              { text: "Careers", href: "https://linear.app/careers" },
            ]}
            layout="horizontal"
            separator="•"
            align="center"
          />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 48px 36px 48px">
        <Column>
          <Paragraph
            html="You're receiving this because you use Linear."
            fontSize="12px"
            color={MUTED}
            textAlign="center"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof ProductDigest> = {
  title: "Agent Examples/Linear · Product Digest",
  component: ProductDigest,
};
export default meta;
export const Default: StoryObj<typeof ProductDigest> = {};
