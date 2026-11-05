import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Divider,
  Image,
  Menu,
} from "../index";

// Morning-Brew-style daily digest. Friendly, editorial, readable.
// Styled text wordmark (no logo image), a date line, three story
// sections, a two-column "quick hits" grid, dividers, and a footer menu.

const INK = "#1A1A1A";
const BODY = "#3F3F46";
const MUTED = "#8A8A8F";
const LINE = "#E6E4DD";
const ACCENT = "#1463FF"; // friendly editorial link blue
const PAPER = "#FFFFFF";
const CANVAS = "#F4F1EA"; // warm newsprint canvas

const serif = {
  label: "Georgia",
  value: "Georgia, 'Times New Roman', Times, serif",
};
const sans = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

export function MorningBrewDigest() {
  return (
    <Email
      backgroundColor={CANVAS}
      contentWidth="600px"
      fontFamily={sans}
      textColor={BODY}
      previewText="Your 5-minute morning read — markets, tech, and one thing that made us smile."
      linkStyle={{
        linkColor: ACCENT,
        linkHoverColor: "#0B47C2",
        linkUnderline: true,
        linkHoverUnderline: true,
      }}
    >
      {/* Masthead / wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="36px 48px 8px 48px">
        <Column>
          <Heading
            headingType="h1"
            fontFamily={serif}
            fontSize="40px"
            fontWeight={700}
            color={INK}
            textAlign="center"
            lineHeight="100%"
          >
            The Daily Pour ☕
          </Heading>
        </Column>
      </Row>

      {/* Date line */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="0 48px 20px 48px">
        <Column>
          <Paragraph
            html="MONDAY, JUNE 22, 2026 &nbsp;·&nbsp; ISSUE #418"
            fontSize="12px"
            color={MUTED}
            textAlign="center"
            lineHeight="140%"
          />
        </Column>
      </Row>

      {/* Accent rule under masthead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="0 48px">
        <Column>
          <Divider borderTopWidth="2px" borderTopColor={INK} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Friendly intro */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="24px 48px 4px 48px">
        <Column>
          <Paragraph
            html="Good morning. The sun's up, the coffee's hot, and the markets are already misbehaving. Here's everything you need to sound smart before your first meeting — in five minutes flat. Let's get into it. 👇"
            fontSize="16px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      {/* ── Story 1 ── */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="20px 48px 0 48px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1040&q=80"
            altText="Stock market chart on a screen"
            width="100%"
          />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="16px 48px 0 48px">
        <Column>
          <Heading
            headingType="h2"
            fontFamily={serif}
            fontSize="24px"
            fontWeight={700}
            color={INK}
            lineHeight="125%"
          >
            Markets shrug off the jitters
          </Heading>
          <Paragraph
            html="Stocks clawed back early losses to close green, with the S&amp;P 500 inching to a fresh record as traders bet the Fed is finally done hiking. Chipmakers led the charge, but analysts warn the rally is leaning on a <i>very</i> short list of names. <a href='https://example.com/markets'>Read the full market wrap →</a>"
            fontSize="16px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="20px 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* ── Story 2 ── */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="0 48px 0 48px">
        <Column>
          <Heading
            headingType="h2"
            fontFamily={serif}
            fontSize="24px"
            fontWeight={700}
            color={INK}
            lineHeight="125%"
          >
            Big Tech's new favorite word: &ldquo;agents&rdquo;
          </Heading>
          <Paragraph
            html="Every major platform rolled out an AI &ldquo;agent&rdquo; this quarter, and the marketing is officially out of control. The real story is quieter: a handful of teams are shipping tools that genuinely save people hours, while the rest are slapping a chatbot on a login screen. We sorted the signal from the noise. <a href='https://example.com/tech'>See which ones are actually useful →</a>"
            fontSize="16px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="20px 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* ── Story 3 ── */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="0 48px 0 48px">
        <Column>
          <Heading
            headingType="h2"
            fontFamily={serif}
            fontSize="24px"
            fontWeight={700}
            color={INK}
            lineHeight="125%"
          >
            One thing that made us smile
          </Heading>
          <Paragraph
            html="A small-town library replaced its overdue fines with &ldquo;read it forward&rdquo; donations — and circulation jumped 40%. Turns out, dropping the guilt got more people through the door. Proof that the gentlest policy can move the biggest numbers. <a href='https://example.com/good-news'>Read the heartwarming bit →</a>"
            fontSize="16px"
            color={BODY}
            lineHeight="160%"
          />
        </Column>
      </Row>

      {/* Quick hits header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="28px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="2px" borderTopColor={INK} borderTopStyle="solid" />
          <Heading
            headingType="h3"
            fontFamily={sans}
            fontSize="13px"
            fontWeight={700}
            color={MUTED}
            textAlign="left"
            lineHeight="140%"
          >
            QUICK HITS
          </Heading>
        </Column>
      </Row>

      {/* Two-column quick hits */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={PAPER} padding="8px 48px 24px 48px">
        <Column padding="0 16px 0 0">
          <Paragraph
            html="📈 <b>Oil dips</b> below $70 as supply worries ease for the first time in weeks. <a href='https://example.com/oil'>More</a>"
            fontSize="15px"
            color={BODY}
            lineHeight="155%"
          />
          <Paragraph
            html="🏠 <b>Mortgage rates</b> tick down to a 9-month low, nudging buyers off the sidelines. <a href='https://example.com/housing'>More</a>"
            fontSize="15px"
            color={BODY}
            lineHeight="155%"
          />
        </Column>
        <Column padding="0 0 0 16px">
          <Paragraph
            html="🚀 <b>A startup</b> you've never heard of just raised $200M to build cheaper satellites. <a href='https://example.com/space'>More</a>"
            fontSize="15px"
            color={BODY}
            lineHeight="155%"
          />
          <Paragraph
            html="🎬 <b>Streaming wars</b> heat up again as two giants merge their catalogs. <a href='https://example.com/streaming'>More</a>"
            fontSize="15px"
            color={BODY}
            lineHeight="155%"
          />
        </Column>
      </Row>

      {/* Footer divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Footer menu */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="24px 48px 8px 48px">
        <Column>
          <Menu
            layout="horizontal"
            align="center"
            separator="·"
            items={[
              { text: "Subscribe", href: "https://example.com/subscribe" },
              { text: "Archive", href: "https://example.com/archive" },
              { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
            ]}
          />
        </Column>
      </Row>

      {/* Footer fine print */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={PAPER} padding="4px 48px 36px 48px">
        <Column>
          <Paragraph
            html="The Daily Pour · 123 Roastery Lane, Brewville · You're getting this because you have great taste."
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

const meta = {
  title: "Agent Examples/Morning Brew · Daily Digest",
  component: MorningBrewDigest,
} satisfies Meta<typeof MorningBrewDigest>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
