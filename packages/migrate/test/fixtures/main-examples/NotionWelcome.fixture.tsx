import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Button,
  Image,
  Social,
} from "../index";

// Notion/Figma-style onboarding welcome — approachable, clean, generous whitespace.
const INK = "#2B2B33";
const MUTED = "#6B6F76";
const SUBTLE = "#9CA0A6";
const ACCENT = "#0B0B0F";
const PANEL = "#F7F7F5";
const sans = {
  label: "Sans Serif",
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const PRODUCT = "Lumen";

export function NotionWelcome() {
  return (
    <Email
      backgroundColor={PANEL}
      contentWidth="600px"
      fontFamily={sans}
      textColor={INK}
      previewText={`Welcome to ${PRODUCT} — here's how to get started.`}
    >
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="40px 48px 0 48px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="18px"
            fontWeight={700}
            color={ACCENT}
            textAlign="left"
            lineHeight="100%"
          >
            ✦ {PRODUCT}
          </Heading>
        </Column>
      </Row>

      {/* Welcome heading + intro */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 8px 48px">
        <Column>
          <Heading
            headingType="h1"
            fontSize="34px"
            fontWeight={700}
            color={INK}
            textAlign="left"
            lineHeight="120%"
          >
            Welcome to {PRODUCT} 👋
          </Heading>
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 48px 8px 48px">
        <Column>
          <Paragraph
            html="We're so glad you're here. Lumen is the calm, all-in-one workspace where your notes, docs, and plans finally live together. Let's get you set up in just a few minutes."
            fontSize="16px"
            color={MUTED}
            textAlign="left"
            lineHeight="160%"
          />
        </Column>
      </Row>

      {/* Optional small hero image */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 8px 48px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=1040&q=80"
            altText="A tidy desk workspace"
            width="100%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* 2x2 feature grid — first row */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="24px 48px 8px 48px">
        <Column padding="0 16px 16px 0">
          <Heading headingType="h3" fontSize="17px" fontWeight={600} color={INK} lineHeight="130%">
            📝 Write anything
          </Heading>
          <Paragraph
            html="Docs, notes, and wikis that feel effortless to create."
            fontSize="14px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
        <Column padding="0 0 16px 16px">
          <Heading headingType="h3" fontSize="17px" fontWeight={600} color={INK} lineHeight="130%">
            ✅ Plan together
          </Heading>
          <Paragraph
            html="Tasks and timelines that keep the whole team in sync."
            fontSize="14px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* 2x2 feature grid — second row */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="8px 48px 24px 48px">
        <Column padding="0 16px 0 0">
          <Heading headingType="h3" fontSize="17px" fontWeight={600} color={INK} lineHeight="130%">
            🔍 Find it fast
          </Heading>
          <Paragraph
            html="Instant search across everything you've ever written."
            fontSize="14px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
        <Column padding="0 0 0 16px">
          <Heading headingType="h3" fontSize="17px" fontWeight={600} color={INK} lineHeight="130%">
            🤝 Share with anyone
          </Heading>
          <Paragraph
            html="Invite teammates and guests with a single link."
            fontSize="14px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Get started CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 48px 48px 48px">
        <Column>
          <Button
            href="https://example.com/get-started"
            backgroundColor={ACCENT}
            color="#FFFFFF"
            fontSize="16px"
            fontWeight={600}
            padding="14px 28px"
            borderRadius="8px"
            textAlign="left"
          >
            Get started
          </Button>
        </Column>
      </Row>

      {/* Footer — social icons */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PANEL} padding="32px 48px 8px 48px">
        <Column>
          <Social
            icons={[
              { name: "Twitter", url: "https://twitter.com/lumen" },
              { name: "Instagram", url: "https://instagram.com/lumen" },
              { name: "LinkedIn", url: "https://linkedin.com/company/lumen" },
              { name: "GitHub", url: "https://github.com/lumen" },
            ]}
            iconType="rounded"
            iconSize={28}
            spacing={12}
            align="center"
          />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PANEL} padding="0 48px 40px 48px">
        <Column>
          <Paragraph
            html="Lumen · 100 Market St, San Francisco, CA · <a href='https://example.com/unsubscribe'>Unsubscribe</a>"
            fontSize="12px"
            color={SUBTLE}
            textAlign="center"
            lineHeight="150%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof NotionWelcome> = {
  title: "Agent Examples/Notion · Welcome",
  component: NotionWelcome,
};

export default meta;

type Story = StoryObj<typeof NotionWelcome>;

export const Default: Story = {};
