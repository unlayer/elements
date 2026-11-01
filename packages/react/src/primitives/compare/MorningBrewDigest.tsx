/**
 * main's "Morning Brew · Daily Digest" example, and the same design written with the new components (main's
 * layout read as StripeReceipt.tsx says, a Column's padding as NotionWelcome.tsx says). main's body link
 * color is each Link's color here.
 *
 * Three differences are main's: its photo, 100% wide, is at most 504px, as in NotionWelcome.tsx; its body
 * link color isn't its links' (they're the default #0000ee); and its menu's links are a space further apart
 * than their padding says (MenuLinks.tsx). `nextAsMain` draws them as main does.
 */
import type { ReactNode } from "react";
import { MorningBrewDigest } from "../../examples/MorningBrewDigest.stories";
import { Column, Divider, Email, Heading, Image, Link, Menu, Paragraph, Row, Section, Span } from "../index";

const INK = "#1A1A1A";
const BODY = "#3F3F46";
const MUTED = "#8A8A8F";
const LINE = "#E6E4DD";
const ACCENT = "#1463FF";
const PAPER = "#FFFFFF";
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const NBSP = " ";

const link = (href: string, text: string, color?: string) => (
  <Link href={href} style={color ? { color } : {}}>
    {text}
  </Link>
);

function story(title: string, text: ReactNode) {
  return (
    <>
      <Heading level={2} style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: INK, lineHeight: "125%" }}>
        {title}
      </Heading>
      <Paragraph style={{ fontSize: 16, lineHeight: "160%" }}>{text}</Paragraph>
    </>
  );
}

const hit = (emoji: string, bold: string, rest: string, href: string, color?: string) => (
  <Paragraph style={{ fontSize: 15, lineHeight: "155%" }}>
    {`${emoji} `}
    <Span style={{ fontWeight: 700 }}>{bold}</Span> {rest} {link(href, "More", color)}
  </Paragraph>
);

const rule = (width: number, color: string) => <Divider style={{ borderTop: `${width}px solid ${color}` }} />;

export const main = <MorningBrewDigest />;

/** The design; `asMain` draws the photo and the links as main does. */
const design = (asMain: boolean, color = asMain ? undefined : ACCENT) => (
  <Email
    width={600}
    previewText="Your 5-minute morning read — markets, tech, and one thing that made us smile."
    style={{ backgroundColor: "#F4F1EA", color: BODY, fontFamily: SANS }}
  >
    <Section style={{ backgroundColor: PAPER, padding: [46, 10, 18, 10] }}>
      <Heading level={1} style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: INK, textAlign: "center", lineHeight: "100%" }}>
        The Daily Pour ☕
      </Heading>
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [10, 10, 30, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "140%" }}>{`MONDAY, JUNE 22, 2026 ${NBSP}·${NBSP} ISSUE #418`}</Paragraph>
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: 10 }}>{rule(2, INK)}</Section>

    <Section style={{ backgroundColor: PAPER, padding: [34, 10, 14, 10] }}>
      <Paragraph style={{ fontSize: 16, lineHeight: "160%" }}>
        Good morning. The sun&apos;s up, the coffee&apos;s hot, and the markets are already misbehaving. Here&apos;s everything you need to sound smart before
        your first meeting — in five minutes flat. Let&apos;s get into it. 👇
      </Paragraph>
    </Section>

    <Section style={{ backgroundColor: PAPER, padding: [30, 10, 10, 10], alignItems: "center" }}>
      <Image
        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1040&q=80"
        alt="Stock market chart on a screen"
        style={asMain ? { width: "100%", maxWidth: 504 } : { width: "100%" }}
      />
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [26, 10, 10, 10], gap: 20 }}>
      {story(
        "Markets shrug off the jitters",
        <>
          Stocks clawed back early losses to close green, with the S&amp;P 500 inching to a fresh record as traders bet the Fed is finally done hiking. Chipmakers
          led the charge, but analysts warn the rally is leaning on a <Span style={{ fontStyle: "italic" }}>very</Span> short list of names.{" "}
          {link("https://example.com/markets", "Read the full market wrap →", color)}
        </>
      )}
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [30, 10, 30, 10] }}>{rule(1, LINE)}</Section>

    <Section style={{ backgroundColor: PAPER, padding: 10, gap: 20 }}>
      {story(
        "Big Tech's new favorite word: “agents”",
        <>
          Every major platform rolled out an AI “agent” this quarter, and the marketing is officially out of control. The real story is quieter: a handful of
          teams are shipping tools that genuinely save people hours, while the rest are slapping a chatbot on a login screen. We sorted the signal from the noise.{" "}
          {link("https://example.com/tech", "See which ones are actually useful →", color)}
        </>
      )}
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [30, 10, 30, 10] }}>{rule(1, LINE)}</Section>

    <Section style={{ backgroundColor: PAPER, padding: 10, gap: 20 }}>
      {story(
        "One thing that made us smile",
        <>
          A small-town library replaced its overdue fines with “read it forward” donations — and circulation jumped 40%. Turns out, dropping the guilt got more
          people through the door. Proof that the gentlest policy can move the biggest numbers. {link("https://example.com/good-news", "Read the heartwarming bit →", color)}
        </>
      )}
    </Section>

    <Section style={{ backgroundColor: PAPER, padding: [38, 10, 10, 10], gap: 20 }}>
      {rule(2, INK)}
      <Heading level={3} style={{ fontSize: 13, fontWeight: 700, color: MUTED, lineHeight: "140%" }}>
        QUICK HITS
      </Heading>
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [8, 0, 24, 0] }}>
      <Row>
        <Column style={{ padding: [10, 26, 10, 10], gap: 20 }}>
          {hit("📈", "Oil dips", "below $70 as supply worries ease for the first time in weeks.", "https://example.com/oil", color)}
          {hit("🏠", "Mortgage rates", "tick down to a 9-month low, nudging buyers off the sidelines.", "https://example.com/housing", color)}
        </Column>
        <Column style={{ padding: [10, 10, 10, 26], gap: 20 }}>
          {hit("🚀", "A startup", "you've never heard of just raised $200M to build cheaper satellites.", "https://example.com/space", color)}
          {hit("🎬", "Streaming wars", "heat up again as two giants merge their catalogs.", "https://example.com/streaming", color)}
        </Column>
      </Row>
    </Section>

    <Section style={{ backgroundColor: PAPER, padding: 10 }}>{rule(1, LINE)}</Section>
    <Section style={{ backgroundColor: PAPER, padding: [34, 10, 18, 10] }}>
      <Menu
        items={[
          { text: "Subscribe", href: "https://example.com/subscribe" },
          { text: "Archive", href: "https://example.com/archive" },
          { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
        ]}
        separator="·"
        style={{ padding: [5, asMain ? 17 : 15] }}
      />
    </Section>
    <Section style={{ backgroundColor: PAPER, padding: [14, 10, 46, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "150%" }}>
        The Daily Pour · 123 Roastery Lane, Brewville · You&apos;re getting this because you have great taste.
      </Paragraph>
    </Section>
  </Email>
);

export const next = design(false);
export const nextAsMain = design(true);
export const quirks =
  "its photo, 100% wide, is at most 504px (its column less the Row's 48px side padding), centered, instead of the column's 580px; and its links are the default #0000ee, not its link color (#1463FF); and its menu's links are about 4px further apart than their padding says.";
