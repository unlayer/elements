// main's SpotifyWelcome.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 31: its html comes from an expression (desc): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
// - line 42: today's draw this Image's 120px as 24% of its column, at most 124.8px: that's written out so it doesn't move (give it its width in px to draw it at that)
import { Button, Column, Divider, Email, Heading, Image, Paragraph, Row, Section } from "../index";

// Spotify brand: bright green #1ED760, near-black #121212, muted #B3B3B3.
const GREEN = "#1ED760";
const BG = "#121212";
const WHITE = "#FFFFFF";
const MUTED = "#B3B3B3";
const LINE = "#2A2A2A";
const sans = {
  label: "Circular",
  value: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function benefit(title: string, desc: string) {
  return (
    <Column>
      <Heading
        level={3}
        style={{ padding: 10, fontSize: 17, fontWeight: 700, color: WHITE, lineHeight: "130%" }}
      >
        {`✓  ${title}`}
      </Heading>
      <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "155%" }}>
        {desc}
      </Paragraph>
    </Column>
  );
}

export function SpotifyPremiumWelcome() {
  return (
    <Email width={600} style={{ backgroundColor: BG, color: "#000000", fontFamily: sans.value }}>
      {/* Logo */}
      <Section style={{ backgroundColor: BG, padding: [32, 0, 18, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Image
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
            alt="Spotify"
            style={{ width: "24%", maxWidth: 124.8 }}
          />
        </Column>
      </Section>

      {/* Hero image */}
      <Section style={{ backgroundColor: BG }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80"}
            alt="Live music"
          />
        </Column>
      </Section>

      {/* Eyebrow + headline + subhead */}
      <Section style={{ backgroundColor: BG, padding: [36, 0, 4, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: GREEN,
            lineHeight: "140%",
            letterSpacing: 1.68,
          }}
        >
          SPOTIFY PREMIUM
        </Heading>
        <Heading
          style={{ padding: 10, fontSize: 42, fontWeight: 800, color: WHITE, lineHeight: "106%" }}
        >
          Premium is yours. Welcome.
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 17, color: MUTED, lineHeight: "155%" }}>
          No ads. No limits. Just the music you love — now in lossless quality, online or off.
        </Paragraph>
      </Section>

      {/* Primary CTA */}
      <Section style={{ backgroundColor: BG, padding: [22, 0, 36, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="https://open.spotify.com"
            style={{
              backgroundColor: GREEN,
              color: "#000000",
              fontSize: 16,
              fontWeight: 700,
              padding: "16px 40px",
              borderRadius: 500,
            }}
          >
            Start listening
          </Button>
        </Column>
      </Section>

      <Section style={{ backgroundColor: BG }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Benefits */}
      <Section style={{ backgroundColor: BG, padding: [32, 0, 6, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            lineHeight: "140%",
            letterSpacing: 1.44,
          }}
        >
          WHAT'S INCLUDED
        </Heading>
      </Section>
      <Section style={{ backgroundColor: BG, padding: [14, 0, 10, 0] }}>
        <Row>
          {benefit("Ad-free music", "Uninterrupted listening — no ad breaks, ever.")}
          {benefit("Lossless audio", "Hear every detail in up to 24-bit quality.")}
        </Row>
      </Section>
      <Section style={{ backgroundColor: BG, padding: [10, 0, 36, 0] }}>
        <Row>
          {benefit("Offline listening", "Download your favorites and play anywhere.")}
          {benefit("Full control", "Pick any track, skip freely, repeat at will.")}
        </Row>
      </Section>

      {/* Footer */}
      <Section style={{ backgroundColor: BG, padding: [8, 0, 40, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: "#7A7A7A",
            textAlign: "center",
            lineHeight: "150%",
          }}
        >
          You're receiving this because you subscribed to Spotify Premium.
        </Paragraph>
      </Section>
    </Email>
  );
}
