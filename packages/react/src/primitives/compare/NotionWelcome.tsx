/**
 * main's "Notion · Welcome" example, and the same design written with the new components (main's layout read
 * as StripeReceipt.tsx says; its Social as composed.tsx writes it). A Column's padding in main is around its
 * blocks' 10px, so here it's the two added.
 *
 * One difference is main's: its photo, 100% wide, is at most 504px (its column less the Row's 48px side
 * padding), as in AirbnbConfirmation.tsx; `nextAsMain` draws it as main does.
 */
import { NotionWelcome } from "../../examples/NotionWelcome.stories";
import { Button, Column, Email, Heading, Image, Link, Paragraph, Row, Section } from "../index";
import { social } from "./composed";

const INK = "#2B2B33";
const MUTED = "#6B6F76";
const SUBTLE = "#9CA0A6";
const ACCENT = "#0B0B0F";
const PANEL = "#F7F7F5";
const WHITE = "#FFFFFF";

function feature(title: string, text: string, padding: [number, number, number, number]) {
  return (
    <Column style={{ padding, gap: 20 }}>
      <Heading level={3} style={{ fontSize: 17, fontWeight: 600, color: INK, lineHeight: "130%" }}>
        {title}
      </Heading>
      <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "150%" }}>{text}</Paragraph>
    </Column>
  );
}

export const main = <NotionWelcome />;

/** The design; `asMain` draws the photo as main does. */
const design = (asMain: boolean) => (
  <Email
    width={600}
    previewText="Welcome to Lumen — here's how to get started."
    style={{ backgroundColor: PANEL, color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
  >
    <Section style={{ backgroundColor: WHITE, padding: [50, 10, 10, 10] }}>
      <Heading level={4} style={{ fontSize: 18, fontWeight: 700, color: ACCENT, lineHeight: "100%" }}>
        ✦ Lumen
      </Heading>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [42, 10, 18, 10] }}>
      <Heading level={1} style={{ fontSize: 34, fontWeight: 700, lineHeight: "120%" }}>
        Welcome to Lumen 👋
      </Heading>
    </Section>
    <Section style={{ backgroundColor: WHITE, padding: [10, 10, 18, 10] }}>
      <Paragraph style={{ fontSize: 16, color: MUTED, lineHeight: "160%" }}>
        We&apos;re so glad you&apos;re here. Lumen is the calm, all-in-one workspace where your notes, docs, and plans finally live together. Let&apos;s get you
        set up in just a few minutes.
      </Paragraph>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [26, 10, 18, 10], alignItems: "center" }}>
      <Image
        src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=1040&q=80"
        alt="A tidy desk workspace"
        style={asMain ? { width: "100%", maxWidth: 504 } : { width: "100%" }}
      />
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [24, 0, 8, 0] }}>
      <Row>
        {feature("📝 Write anything", "Docs, notes, and wikis that feel effortless to create.", [10, 26, 26, 10])}
        {feature("✅ Plan together", "Tasks and timelines that keep the whole team in sync.", [10, 10, 26, 26])}
      </Row>
    </Section>
    <Section style={{ backgroundColor: WHITE, padding: [8, 0, 24, 0] }}>
      <Row>
        {feature("🔍 Find it fast", "Instant search across everything you've ever written.", [10, 26, 10, 10])}
        {feature("🤝 Share with anyone", "Invite teammates and guests with a single link.", [10, 10, 10, 26])}
      </Row>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [18, 10, 58, 10] }}>
      <Button href="https://example.com/get-started" style={{ backgroundColor: ACCENT, color: WHITE, fontSize: 16, fontWeight: 600, padding: "14px 28px", borderRadius: 8 }}>
        Get started
      </Button>
    </Section>

    <Section style={{ backgroundColor: PANEL, padding: [42, 10, 18, 10] }}>
      {social(
        [
          { name: "Twitter", url: "https://twitter.com/lumen" },
          { name: "Instagram", url: "https://instagram.com/lumen" },
          { name: "LinkedIn", url: "https://linkedin.com/company/lumen" },
          { name: "GitHub", url: "https://github.com/lumen" },
        ],
        { type: "rounded", size: 28 }
      )}
    </Section>
    <Section style={{ backgroundColor: PANEL, padding: [10, 10, 50, 10] }}>
      <Paragraph style={{ fontSize: 12, color: SUBTLE, textAlign: "center", lineHeight: "150%" }}>
        Lumen · 100 Market St, San Francisco, CA · <Link href="https://example.com/unsubscribe">Unsubscribe</Link>
      </Paragraph>
    </Section>
  </Email>
);

export const next = design(false);
export const nextAsMain = design(true);
export const quirks = "its photo, 100% wide, is at most 504px (its column less the Row's 48px side padding), centered, instead of the column's 580px.";
