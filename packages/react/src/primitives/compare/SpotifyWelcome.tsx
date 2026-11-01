/**
 * main's "Spotify Premium Welcome" example, and the same design written with the new components
 * (main's layout read as StripeReceipt.tsx says).
 *
 * One difference is main's: its logo, 120px wide, comes out 125px wide on desktop and 85px on
 * phones. main writes the width as a percentage (24%), of the content less the Row's side padding,
 * which on desktop is outside the content. The new engine draws it at 120px, so what's below the
 * logo sits a pixel or two higher.
 */
import { SpotifyPremiumWelcome } from "../../SpotifyWelcome.stories";
import { Button, Column, Divider, Email, Heading, Image, Paragraph, Row, Section } from "../index";

const GREEN = "#1ED760";
const BG = "#121212";
const WHITE = "#FFFFFF";
const MUTED = "#B3B3B3";
const LINE = "#2A2A2A";

function benefit(title: string, desc: string) {
  return (
    <Column style={{ padding: 10, gap: 20 }}>
      <Heading level={3} style={{ fontSize: 17, fontWeight: 700, color: WHITE, lineHeight: "130%" }}>
        {`✓  ${title}`}
      </Heading>
      <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "155%" }}>{desc}</Paragraph>
    </Column>
  );
}

export const main = <SpotifyPremiumWelcome />;

export const next = (
  <Email width={600} style={{ backgroundColor: BG, fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
    <Section style={{ backgroundColor: BG, padding: [42, 10, 28, 10] }}>
      <Image src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" style={{ width: 120 }} />
    </Section>

    <Section style={{ backgroundColor: BG, padding: 10 }}>
      <Image src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80" alt="Live music" style={{ width: "100%" }} />
    </Section>

    <Section style={{ backgroundColor: BG, padding: [46, 10, 14, 10], gap: 20 }}>
      <Heading level={4} style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: 1.68, lineHeight: "140%" }}>
        SPOTIFY PREMIUM
      </Heading>
      <Heading level={1} style={{ fontSize: 42, fontWeight: 800, color: WHITE, lineHeight: "106%" }}>
        Premium is yours. Welcome.
      </Heading>
      <Paragraph style={{ fontSize: 17, color: MUTED, lineHeight: "155%" }}>
        No ads. No limits. Just the music you love — now in lossless quality, online or off.
      </Paragraph>
    </Section>

    <Section style={{ backgroundColor: BG, padding: [32, 10, 46, 10] }}>
      <Button href="https://open.spotify.com" style={{ backgroundColor: GREEN, color: "#000000", fontSize: 16, fontWeight: 700, borderRadius: 500, padding: "16px 40px" }}>
        Start listening
      </Button>
    </Section>

    <Section style={{ backgroundColor: BG, padding: 10 }}>
      <Divider style={{ borderTop: `1px solid ${LINE}` }} />
    </Section>

    <Section style={{ backgroundColor: BG, padding: [42, 10, 16, 10] }}>
      <Heading level={4} style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 1.44, lineHeight: "140%" }}>
        WHAT&apos;S INCLUDED
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

    <Section style={{ backgroundColor: BG, padding: [18, 10, 50, 10] }}>
      <Paragraph style={{ fontSize: 12, color: "#7A7A7A", textAlign: "center", lineHeight: "150%" }}>
        You&apos;re receiving this because you subscribed to Spotify Premium.
      </Paragraph>
    </Section>
  </Email>
);
