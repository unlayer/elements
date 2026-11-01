// main's examples/MorningBrewDigest.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 246: today's Menu puts a space between its links on top of their padding (a few px); the new one spaces them by their padding alone
import {
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Link,
  Menu,
  Paragraph,
  Row,
  Section,
  Span,
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
      width={600}
      previewText="Your 5-minute morning read — markets, tech, and one thing that made us smile."
      style={{ backgroundColor: CANVAS, color: BODY, fontFamily: sans.value }}
    >
      {/* Masthead / wordmark */}
      <Section style={{ backgroundColor: PAPER, padding: [36, 0, 8, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontFamily: serif.value,
            fontSize: 40,
            fontWeight: 700,
            color: INK,
            textAlign: "center",
            lineHeight: "100%",
          }}
        >
          The Daily Pour ☕
        </Heading>
      </Section>

      {/* Date line */}
      <Section style={{ backgroundColor: PAPER, padding: [0, 0, 20, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: "140%",
          }}
        >
          {"MONDAY, JUNE 22, 2026  ·  ISSUE #418"}
        </Paragraph>
      </Section>

      {/* Accent rule under masthead */}
      <Section style={{ backgroundColor: PAPER }}>
        <Divider style={{ borderTop: `2px solid ${INK}`, padding: 10 }} />
      </Section>

      {/* Friendly intro */}
      <Section style={{ backgroundColor: PAPER, padding: [24, 0, 4, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
          Good morning. The sun's up, the coffee's hot, and the markets are already misbehaving.
          Here's everything you need to sound smart before your first meeting — in five minutes
          flat. Let's get into it. 👇
        </Paragraph>
      </Section>

      {/* ── Story 1 ── */}
      <Section style={{ backgroundColor: PAPER, padding: [20, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1040&q=80"}
            alt="Stock market chart on a screen"
            style={{ width: "100%", maxWidth: 504 }}
          />
        </Column>
      </Section>
      <Section style={{ backgroundColor: PAPER, padding: [16, 0, 0, 0] }}>
        <Heading
          level={2}
          style={{
            padding: 10,
            fontFamily: serif.value,
            fontSize: 24,
            fontWeight: 700,
            color: INK,
            lineHeight: "125%",
          }}
        >
          Markets shrug off the jitters
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
          {
            "Stocks clawed back early losses to close green, with the S&P 500 inching to a fresh record as traders bet the Fed is finally done hiking. Chipmakers led the charge, but analysts warn the rally is leaning on a "
          }
          <Span style={{ fontStyle: "italic" }}>very</Span>
          {" short list of names. "}
          <Link href="https://example.com/markets">Read the full market wrap →</Link>
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: PAPER, padding: [20, 0, 20, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* ── Story 2 ── */}
      <Section style={{ backgroundColor: PAPER }}>
        <Heading
          level={2}
          style={{
            padding: 10,
            fontFamily: serif.value,
            fontSize: 24,
            fontWeight: 700,
            color: INK,
            lineHeight: "125%",
          }}
        >
          Big Tech's new favorite word: &ldquo;agents&rdquo;
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
          {
            "Every major platform rolled out an AI “agent” this quarter, and the marketing is officially out of control. The real story is quieter: a handful of teams are shipping tools that genuinely save people hours, while the rest are slapping a chatbot on a login screen. We sorted the signal from the noise. "
          }
          <Link href="https://example.com/tech">See which ones are actually useful →</Link>
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: PAPER, padding: [20, 0, 20, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* ── Story 3 ── */}
      <Section style={{ backgroundColor: PAPER }}>
        <Heading
          level={2}
          style={{
            padding: 10,
            fontFamily: serif.value,
            fontSize: 24,
            fontWeight: 700,
            color: INK,
            lineHeight: "125%",
          }}
        >
          One thing that made us smile
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
          {
            "A small-town library replaced its overdue fines with “read it forward” donations — and circulation jumped 40%. Turns out, dropping the guilt got more people through the door. Proof that the gentlest policy can move the biggest numbers. "
          }
          <Link href="https://example.com/good-news">Read the heartwarming bit →</Link>
        </Paragraph>
      </Section>

      {/* Quick hits header */}
      <Section style={{ backgroundColor: PAPER, padding: [28, 0, 0, 0] }}>
        <Divider style={{ borderTop: `2px solid ${INK}`, padding: 10 }} />
        <Heading
          level={3}
          style={{
            padding: 10,
            fontFamily: sans.value,
            fontSize: 13,
            fontWeight: 700,
            color: MUTED,
            textAlign: "left",
            lineHeight: "140%",
          }}
        >
          QUICK HITS
        </Heading>
      </Section>

      {/* Two-column quick hits */}
      <Section style={{ backgroundColor: PAPER, padding: [8, 0, 24, 0] }}>
        <Row>
          <Column style={{ width: "50%", padding: "0 16px 0 0" }}>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "155%" }}>
              {"📈 "}
              <Span style={{ fontWeight: 700 }}>Oil dips</Span>
              {" below $70 as supply worries ease for the first time in weeks. "}
              <Link href="https://example.com/oil">More</Link>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "155%" }}>
              {"🏠 "}
              <Span style={{ fontWeight: 700 }}>Mortgage rates</Span>
              {" tick down to a 9-month low, nudging buyers off the sidelines. "}
              <Link href="https://example.com/housing">More</Link>
            </Paragraph>
          </Column>
          <Column style={{ width: "50%", padding: "0 0 0 16px" }}>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "155%" }}>
              {"🚀 "}
              <Span style={{ fontWeight: 700 }}>A startup</Span>
              {" you've never heard of just raised $200M to build cheaper satellites. "}
              <Link href="https://example.com/space">More</Link>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "155%" }}>
              {"🎬 "}
              <Span style={{ fontWeight: 700 }}>Streaming wars</Span>
              {" heat up again as two giants merge their catalogs. "}
              <Link href="https://example.com/streaming">More</Link>
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Footer divider */}
      <Section style={{ backgroundColor: PAPER }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Footer menu */}
      <Section style={{ backgroundColor: PAPER, padding: [24, 0, 8, 0] }}>
        <Column style={{ padding: 10 }}>
          <Menu
            items={[
              { text: "Subscribe", href: "https://example.com/subscribe" },
              { text: "Archive", href: "https://example.com/archive" },
              { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
            ]}
            separator="·"
            layout="horizontal"
            style={{ fontSize: 14, justifyContent: "center" }}
          />
        </Column>
      </Section>

      {/* Footer fine print */}
      <Section style={{ backgroundColor: PAPER, padding: [4, 0, 36, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: "150%",
          }}
        >
          The Daily Pour · 123 Roastery Lane, Brewville · You're getting this because you have great
          taste.
        </Paragraph>
      </Section>
    </Email>
  );
}
