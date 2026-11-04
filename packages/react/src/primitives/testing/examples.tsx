/**
 * main's examples and component stories, each written again with the new components: `main`, its template in today's
 * components, and `next`, the same design in the new ones (with, where main draws something other than what its
 * template asks, `nextAsMain` drawing it as main does, and `quirks` saying what). The builder's round-trip tests take
 * each `next` to the builder and back. Each is in a scope of its own, as it would be in a file of its own. Only tests
 * and stories import this; it's in no bundle.
 */
import type { ReactElement, ReactNode } from "react";
import { AirbnbConfirmation } from "../../examples/AirbnbConfirmation.stories";
import { LumaEventInvite } from "../../examples/LumaEventInvite.stories";
import { MercuryReceipt } from "../../examples/MercuryReceipt.stories";
import { MorningBrewDigest } from "../../examples/MorningBrewDigest.stories";
import { NikeDrop } from "../../examples/NikeDrop.stories";
import { NotionWelcome } from "../../examples/NotionWelcome.stories";
import { ProductDigest } from "../../examples/ProductDigest.stories";
import { StripeReceipt } from "../../examples/StripeReceipt.stories";
import { WarbyOrderShipped } from "../../examples/WarbyOrderShipped.stories";
import { Button as MainButton, Column as MainColumn, Email as MainEmail, Heading as MainHeading, Image as MainImage, Menu as MainMenu, Page as MainPage, Paragraph as MainParagraph, Row as MainRow, Social as MainSocial, Video as MainVideo } from "../../index";
import { SpotifyPremiumWelcome } from "../../SpotifyWelcome.stories";
import { Button, Column, Divider, Email, Heading, Image, Link, Menu, Page, Paragraph, Row, Section, Social, Span, Text, Video } from "../index";

/**
 * The label and value line main's receipts repeat (a two-column Row, a hairline under each
 * Column), in the new components: the label on the left, the value in bold on the right.
 *
 * main's Columns are as tall as their Row on desktop, their hairlines in line, and stack on phones,
 * each with its own. The new email writer doesn't stretch a Row's children to its height (its
 * support data says so), so on desktop the hairline is a Divider under the Row, and on phones each
 * Column's border.
 */
function lineRow(label: string, value: string, colors: { label: string; value: string; line: string }, last = false) {
  const line = `1px solid ${colors.line}`;
  const cell = { style: { padding: "14px 0" }, mobile: last ? undefined : { border: { bottom: line } } };
  return (
    <Section style={{ backgroundColor: "#FFFFFF" }}>
      <Row>
        <Column {...cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, color: colors.label, lineHeight: "140%" }}>{label}</Paragraph>
        </Column>
        <Column {...cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, fontWeight: 700, color: colors.value, textAlign: "right", lineHeight: "140%" }}>{value}</Paragraph>
        </Column>
      </Row>
      {!last && <Divider hidden={{ mobile: true }} style={{ borderTop: line }} />}
    </Section>
  );
}

/**
 * main's horizontal Menu drawn with the new components (for a design's `nextAsMain`): main writes its links and its
 * separators as inline-blocks, each separator in a link's padding too, with a space between each two in its markup.
 * The new Menu has a link's padding either side of a separator, not twice, and no spaces: main's is drawn here as a
 * Row of its own that wraps, each link and separator a Text in the links' padding, a non-breaking space before each
 * but the first (where main's space is). Separators are left out on phones, as main's are.
 */
const NBSP = " ";

interface MainMenuProps {
  items: Array<{ text: string; href: string }>;
  separator?: string;
  /** Each link's padding, [top and bottom, sides] in px (main's 5px 15px by default). */
  padding?: [number, number];
  color?: string;
  separatorColor?: string;
  fontSize?: number;
}

function mainMenu({ items, separator = "", padding = [5, 15], color = "#0068A5", separatorColor = "#444444", fontSize = 14 }: MainMenuProps): ReactElement {
  const box = { flex: "none", padding } as const;
  return (
    <Row stackOnMobile={false} style={{ flexWrap: "wrap", justifyContent: "center", fontSize, lineHeight: 1.2 }}>
      {items.flatMap((item, index) => [
        ...(index && separator
          ? [
              <Text key={`separator-${index}`} hidden={{ mobile: true }} style={{ ...box, color: separatorColor }}>
                {NBSP + separator}
              </Text>,
            ]
          : []),
        <Text key={item.href} style={box}>
          <Link href={item.href} style={{ color, textDecoration: "none" }}>
            {(index ? NBSP : "") + item.text}
          </Link>
        </Text>,
      ])}
    </Row>
  );
}

/**
 * main's "Stripe · Payment Receipt" example, and the same design written with the new components.
 *
 * How main's layout reads in the new ones: a Row is a band across the window (a Section) with its
 * padding outside the 600px content, and every block has 10px of padding. So a one-column Row is a
 * Section padded by the Row's top and bottom plus 10, and 10 on the sides; a two-column Row is a
 * Row of Columns padded by 10. Letter spacing is in px here (main's em times the font size).
 */
export const stripe = (() => {
  const INDIGO = "#635BFF";
  const INK = "#1A1F36";
  const MUTED = "#697386";
  const LINE = "#E3E8EE";
  const WHITE = "#FFFFFF";

  const lines = { label: MUTED, value: INK, line: LINE };

  const main = <StripeReceipt />;

  const next = (
    <Email
      width={600}
      previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026."
      style={{ backgroundColor: "#F6F9FC", color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
    >
      <Section style={{ backgroundColor: WHITE, padding: [54, 10, 10, 10] }}>
        <Heading level={4} style={{ fontSize: 20, fontWeight: 700, color: INDIGO, lineHeight: "100%", letterSpacing: -0.2 }}>
          Acme
        </Heading>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [50, 10, 10, 10] }}>
        <Paragraph style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 0.72, lineHeight: "100%" }}>RECEIPT</Paragraph>
      </Section>
      <Section style={{ backgroundColor: WHITE, padding: [22, 10, 10, 10] }}>
        <Heading level={1} style={{ fontSize: 28, fontWeight: 600, lineHeight: "125%", letterSpacing: -0.56 }}>
          Receipt from Acme
        </Heading>
      </Section>
      <Section style={{ backgroundColor: WHITE, padding: [16, 10, 10, 10] }}>
        <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "150%" }}>Receipt #2705 · Paid Jul 1, 2026</Paragraph>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [42, 10, 14, 10] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}` }} />
      </Section>

      {lineRow("Pro Plan (monthly)", "$25.00", lines)}
      {lineRow("Additional seats × 3", "$36.00", lines)}
      {lineRow("Usage overage", "$4.50", lines, true)}

      <Section style={{ backgroundColor: WHITE, padding: [18, 10, 10, 10] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}` }} />
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [20, 0, 0, 0] }}>
        <Row>
          <Column style={{ padding: 10 }}>
            <Heading level={3} style={{ fontSize: 18, fontWeight: 600, lineHeight: "120%" }}>
              Total
            </Heading>
          </Column>
          <Column style={{ padding: 10 }}>
            <Heading level={3} style={{ fontSize: 22, fontWeight: 700, textAlign: "right", lineHeight: "120%", letterSpacing: -0.22 }}>
              $65.50
            </Heading>
          </Column>
        </Row>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [46, 10, 10, 10] }}>
        <Button
          href="https://acme.com/invoices/2705.pdf"
          style={{ backgroundColor: INDIGO, color: WHITE, fontSize: 15, fontWeight: 600, padding: "13px 24px", borderRadius: 8 }}
        >
          Download invoice
        </Button>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [54, 10, 58, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, lineHeight: "160%" }}>
          Questions about this receipt? Contact <Link href="mailto:support@acme.com">support@acme.com</Link>.
        </Paragraph>
      </Section>
    </Email>
  );

  return { main, next };
})();

/**
 * main's "Spotify Premium Welcome" example, and the same design written with the new components
 * (main's layout read as `stripe` says).
 *
 * One difference is main's: its logo, 120px wide, comes out 125px wide on desktop and 85px on
 * phones. main writes the width as a percentage (24%), of the content less the Row's side padding,
 * which on desktop is outside the content. `next` draws it at 120px, so what's below the logo sits a
 * pixel or two higher; `nextAsMain` draws it as main does.
 */
export const spotify = (() => {
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

  const main = <SpotifyPremiumWelcome />;

  /** The design; `asMain` draws the logo as main does. */
  const design = (asMain: boolean) => (
    <Email width={600} style={{ backgroundColor: BG, fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <Section style={{ backgroundColor: BG, padding: [42, 10, 28, 10] }}>
        <Image src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" style={asMain ? { width: "24%", maxWidth: 124.8 } : { width: 120 }} />
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

  const next = design(false);
  const nextAsMain = design(true);
  const quirks = "its 120px logo is 24% wide, at most 124.8px: 125px on desktop and 85px on phones.";

  return { main, next, nextAsMain, quirks };
})();

/**
 * main's "Phone Overrides" example (its template, as that story writes it), and the same design
 * written with the new components: phone padding, type and image width, and lines shown on one
 * screen only. A block's padding in main (containerPadding) is the block's own padding here, or a
 * Column around it for an Image and a Button, which have none.
 */
export const phone = (() => {
  const art = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540"><rect width="900" height="540" fill="#dce8de"/><circle cx="710" cy="120" r="145" fill="#f3c880"/><path d="M0 420 Q210 140 420 330 T900 300 V540 H0Z" fill="#709681"/><path d="M0 490 Q350 290 620 430 T900 400 V540 H0Z" fill="#355b48"/></svg>'
  )}`;

  const main = (
    <MainEmail contentWidth="600px" backgroundColor="#f3f5f1" fontFamily="Arial">
      <MainRow columnsBackgroundColor="#ffffff">
        <MainColumn padding="36px 40px" mobile={{ padding: "24px 20px" }}>
          <MainParagraph containerPadding={0} color="#355b48" fontSize={12} letterSpacing="2px">ELEMENTS · DESIGN PREVIEW</MainParagraph>
          <MainHeading containerPadding="16px 0" fontSize={38} lineHeight="115%" color="#20372a" mobile={{ fontSize: 30, textAlign: "center" }}>Room to read. On every screen.</MainHeading>
          <MainImage src={{ url: art, width: 900, height: 540 }} width="75%" containerPadding="8px 0 20px" mobile={{ autoWidth: true, containerPadding: "4px 0 16px" }} alt="Illustrated green landscape with a warm sun" />
          <MainParagraph containerPadding="0 0 24px" color="#526358" fontSize={16} lineHeight="160%" mobile={{ fontSize: 15, lineHeight: "155%" }}>The same design keeps its desktop layout and adapts its padding, typography and image width for a phone.</MainParagraph>
          <MainButton href="https://github.com/unlayer/elements" backgroundColor="#355b48" color="#ffffff" borderRadius={6} padding="14px 24px" containerPadding={0}>Explore Elements</MainButton>
          <MainParagraph hideOnMobile containerPadding="24px 0 0" fontSize={12} color="#6d7c71">Desktop detail · this line hides on a phone.</MainParagraph>
          <MainParagraph hideOnDesktop containerPadding="20px 0 0" fontSize={12} color="#6d7c71" textAlign="center">Phone detail · more space for the story.</MainParagraph>
        </MainColumn>
      </MainRow>
    </MainEmail>
  );

  const next = (
    <Email width={600} style={{ backgroundColor: "#f3f5f1", fontFamily: "Arial" }}>
      <Column style={{ backgroundColor: "#ffffff", padding: [36, 40] }} mobile={{ padding: [24, 20] }}>
        <Paragraph style={{ color: "#355b48", fontSize: 12, letterSpacing: 2, lineHeight: "140%" }}>ELEMENTS · DESIGN PREVIEW</Paragraph>
        <Heading level={1} style={{ padding: [16, 0], fontSize: 38, fontWeight: 400, lineHeight: "115%", color: "#20372a" }} mobile={{ fontSize: 30, textAlign: "center" }}>
          Room to read. On every screen.
        </Heading>
        <Column style={{ padding: [8, 0, 20, 0], alignItems: "center" }} mobile={{ padding: [4, 0, 16, 0] }}>
          <Image src={{ src: art, width: 900, height: 540 }} alt="Illustrated green landscape with a warm sun" style={{ width: "75%" }} mobile={{ width: "100%" }} />
        </Column>
        <Paragraph style={{ padding: [0, 0, 24, 0], color: "#526358", fontSize: 16, lineHeight: "160%" }} mobile={{ fontSize: 15, lineHeight: "155%" }}>
          The same design keeps its desktop layout and adapts its padding, typography and image width for a phone.
        </Paragraph>
        <Column style={{ alignItems: "center" }}>
          <Button href="https://github.com/unlayer/elements" style={{ backgroundColor: "#355b48", color: "#ffffff", borderRadius: 6, padding: "14px 24px" }}>
            Explore Elements
          </Button>
        </Column>
        <Paragraph hidden={{ mobile: true }} style={{ padding: [24, 0, 0, 0], fontSize: 12, color: "#6d7c71", lineHeight: "140%" }}>
          Desktop detail · this line hides on a phone.
        </Paragraph>
        <Paragraph hidden={{ desktop: true }} style={{ padding: [20, 0, 0, 0], fontSize: 12, color: "#6d7c71", textAlign: "center", lineHeight: "140%" }}>
          Phone detail · more space for the story.
        </Paragraph>
      </Column>
    </Email>
  );

  return { main, next };
})();

/**
 * main's "Airbnb · Reservation Confirmation" example, and the same design written with the new
 * components (main's layout read as `stripe` says).
 *
 * One difference is main's: its photo, 100% wide, comes out 520px wide and centered. main takes the
 * Row's side padding (40px each) off an image's width, though on desktop that padding is outside the
 * content and the text keeps the full width. `next` draws it at the column's 580px, so what's below it
 * sits 40px lower; `nextAsMain` draws it as main does.
 */
export const airbnb = (() => {
  const RAUSCH = "#FF385C";
  const INK = "#222222";
  const MUTED = "#717171";
  const LINE = "#EBEBEB";
  const WHITE = "#FFFFFF";

  const lines = { label: MUTED, value: INK, line: LINE };

  const main = <AirbnbConfirmation />;

  /** The design; `asMain` draws the photo as main does. */
  const design = (asMain: boolean) => (
    <Email width={600} style={{ backgroundColor: "#F7F7F7", fontFamily: "Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Section style={{ backgroundColor: WHITE, padding: [38, 10, 22, 10] }}>
        <Heading level={2} style={{ fontSize: 22, fontWeight: 700, color: RAUSCH, lineHeight: "140%" }}>
          airbnb
        </Heading>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [14, 10, 10, 10], alignItems: "center" }}>
        <Image
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"
          alt="Oceanview Villa"
          style={asMain ? { width: "100%", maxWidth: 520 } : { width: "100%" }}
        />
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [38, 10, 14, 10], gap: 20 }}>
        <Heading level={1} style={{ fontSize: 26, fontWeight: 700, color: INK, lineHeight: "130%" }}>
          You&apos;re confirmed, Maya 🎉
        </Heading>
        <Paragraph style={{ fontSize: 16, color: MUTED, lineHeight: "150%" }}>
          Your stay at <Span style={{ fontWeight: 700 }}>Oceanview Villa</Span> in Malibu is booked. We can&apos;t wait to host you.
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [26, 10, 12, 10] }}>
        <Heading level={4} style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 0.72, lineHeight: "140%" }}>
          RESERVATION
        </Heading>
      </Section>
      {lineRow("Property", "Oceanview Villa · Malibu, CA", lines)}
      {lineRow("Check-in", "Fri, Jul 18 · 3:00 PM", lines)}
      {lineRow("Check-out", "Mon, Jul 21 · 11:00 AM", lines)}
      {lineRow("Guests", "2 adults", lines)}
      {lineRow("Total", "$1,248.00", lines, true)}

      <Section style={{ backgroundColor: WHITE, padding: [38, 10, 42, 10] }}>
        <Button
          href="https://airbnb.com/trips"
          style={{ width: "100%", backgroundColor: RAUSCH, color: WHITE, fontSize: 16, fontWeight: 700, padding: "15px 28px", borderRadius: 10 }}
        >
          View itinerary
        </Button>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [18, 10, 50, 10] }}>
        <Paragraph style={{ fontSize: 13, color: MUTED, textAlign: "center", lineHeight: "150%" }}>
          Questions about your trip? <Link href="https://airbnb.com/help">Visit the Help Center</Link>.
        </Paragraph>
      </Section>
    </Email>
  );

  const next = design(false);
  const nextAsMain = design(true);
  const quirks = "its photo, 100% wide, is at most 520px (its column less the Row's 40px side padding), centered, instead of the column's 580px.";

  return { main, next, nextAsMain, quirks };
})();

/**
 * main's "Mercury · Transaction Receipt" example, a 560px email, and the same design written with
 * the new components (main's layout read as `stripe` says).
 */
export const mercury = (() => {
  const INK = "#0E0E10";
  const MUTED = "#6B6B70";
  const ACCENT = "#5A4FCF";
  const SUCCESS = "#1F9D55";
  const LINE = "#ECECEE";
  const CARD = "#FFFFFF";

  const lines = { label: MUTED, value: INK, line: LINE };
  const eyebrow = { fontSize: 12, fontWeight: 700, letterSpacing: 0.72, lineHeight: "100%" } as const;

  const main = <MercuryReceipt />;

  const next = (
    <Email width={560} style={{ backgroundColor: "#FAFAFA", color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Section style={{ backgroundColor: CARD, padding: [54, 10, 10, 10] }}>
        <Heading level={4} style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.17, lineHeight: "100%" }}>
          Meridian
        </Heading>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [62, 10, 10, 10] }}>
        <Paragraph style={{ ...eyebrow, color: SUCCESS }}>PAYMENT SENT</Paragraph>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: [24, 10, 10, 10] }}>
        <Heading level={1} style={{ fontSize: 48, fontWeight: 600, letterSpacing: -0.96, lineHeight: "110%" }}>
          $1,240.00
        </Heading>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: [16, 10, 10, 10] }}>
        <Paragraph style={{ fontSize: 16, color: MUTED, lineHeight: "150%" }}>Your transfer to Olivia Hart is on its way.</Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [50, 10, 14, 10] }}>
        <Paragraph style={{ ...eyebrow, color: MUTED }}>DETAILS</Paragraph>
      </Section>
      {lineRow("To", "Olivia Hart", lines)}
      {lineRow("From", "Acme Inc · ••4291", lines)}
      {lineRow("Date", "Jul 1, 2026", lines)}
      {lineRow("Reference", "INV-2705", lines, true)}

      <Section style={{ backgroundColor: CARD, padding: [46, 10, 10, 10] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}` }} />
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [42, 10, 10, 10] }}>
        <Button
          href="https://meridian.example.com/tx/INV-2705"
          style={{ backgroundColor: INK, color: "#FFFFFF", fontSize: 15, fontWeight: 500, padding: "13px 24px", borderRadius: 8 }}
        >
          View transaction
        </Button>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [58, 10, 66, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, lineHeight: "170%" }}>
          Meridian Financial · This receipt confirms a completed transfer. Need help?{" "}
          <Link href="https://meridian.example.com/support" style={{ color: ACCENT, textDecoration: "none" }}>
            Contact support
          </Link>
          .
        </Paragraph>
      </Section>
    </Email>
  );

  return { main, next };
})();

/**
 * main's "Luma · Event Invite" example, and the same design written with the new components (main's
 * layout read as `stripe` says; main's text has a 140% line height where it sets none).
 *
 * One difference is main's: the hosts' photos, 48px wide, come out 52px (main writes a px width as a
 * percentage, as `spotify` says), so what's below them sits 6px lower in main; `nextAsMain`
 * draws them as main does.
 */
export const luma = (() => {
  const INK = "#0B0B0F";
  const SUBTLE = "#6B6B76";
  const LINE = "#ECECF1";
  const ACCENT = "#FF5C38";
  const CARD = "#FFFFFF";
  const NBSP = " ";

  function host(photo: string, name: string, role: string, asMain: boolean) {
    return (
      <Column style={{ padding: 10, gap: 20 }}>
        <Image src={photo} alt={name} style={asMain ? { width: "20%", maxWidth: 52 } : { width: 48 }} />
        <Paragraph style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: "140%" }}>{name}</Paragraph>
        <Paragraph style={{ fontSize: 13, color: SUBTLE, lineHeight: "140%" }}>{role}</Paragraph>
      </Column>
    );
  }

  const main = <LumaEventInvite />;

  /** The design; `asMain` draws the hosts' photos as main does. */
  const design = (asMain: boolean) => (
    <Email width={600} style={{ backgroundColor: "#F4F4F7", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Section style={{ backgroundColor: CARD, padding: [38, 10, 26, 10] }}>
        <Heading level={4} style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: -0.2, lineHeight: "140%" }}>
          ◆ luma
        </Heading>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: 10 }}>
        <Image
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
          alt="Rooftop launch party at golden hour"
          style={{ width: 600, maxWidth: "100%" }}
        />
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [42, 10, 14, 10], gap: 20 }}>
        <Paragraph style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: 1.4, lineHeight: "140%" }}>YOU&apos;RE INVITED</Paragraph>
        <Heading level={1} style={{ fontSize: 40, fontWeight: 800, color: INK, lineHeight: "108%", letterSpacing: -1.2 }}>
          Neon Nights · Summer Launch
        </Heading>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [24, 10, 10, 10], gap: 20 }}>
        <Paragraph style={{ fontSize: 15, color: INK, lineHeight: "170%" }}>
          {`🗓️ ${NBSP}`}
          <Span style={{ fontWeight: 700 }}>Thursday, July 9, 2026</Span>
          {` ${NBSP}·${NBSP} 7:00 – 11:00 PM PDT`}
        </Paragraph>
        <Paragraph style={{ fontSize: 15, color: SUBTLE, lineHeight: "170%" }}>
          {`📍 ${NBSP}`}
          <Span style={{ fontWeight: 700 }}>The Skydeck</Span> — 450 Market St, San Francisco, CA
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [32, 10, 16, 10] }}>
        <Button href="https://lu.ma/neon-nights/rsvp" style={{ backgroundColor: ACCENT, color: "#FFFFFF", fontSize: 16, fontWeight: 700, padding: "15px 30px", borderRadius: 10 }}>
          RSVP — Save my spot
        </Button>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [10, 10, 34, 10] }}>
        <Paragraph style={{ fontSize: 14, color: INK, lineHeight: "140%" }}>
          <Link href="https://lu.ma/neon-nights/calendar" style={{ color: INK, textDecoration: "underline" }}>
            + Add to calendar
          </Link>
        </Paragraph>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: 10 }}>
        <Divider style={{ borderTop: `1px solid ${LINE}` }} />
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [30, 10, 16, 10] }}>
        <Paragraph style={{ fontSize: 11, fontWeight: 700, color: SUBTLE, letterSpacing: 1.1, lineHeight: "140%" }}>HOSTED BY</Paragraph>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: [0, 0, 28, 0] }}>
        <Row>
          {host("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80", "Maya Okonkwo", "Founder, Lumen", asMain)}
          {host("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80", "Theo Park", "Head of Community", asMain)}
        </Row>
      </Section>

      <Section style={{ padding: [28, 10, 50, 10] }}>
        <Paragraph style={{ fontSize: 12, color: SUBTLE, textAlign: "center", lineHeight: "160%" }}>
          You&apos;re receiving this because you joined the Lumen waitlist. <Link href="https://lu.ma/settings">Manage notifications</Link>.
        </Paragraph>
      </Section>
    </Email>
  );

  const next = design(false);
  const nextAsMain = design(true);
  const quirks = "its hosts' 48px photos are 20% wide, at most 52px.";

  return { main, next, nextAsMain, quirks };
})();

/**
 * main's "Warby Parker · Order Shipped" example, and the same design written with the new components
 * (main's layout read as `stripe` says).
 *
 * main puts a Row's padding outside the 600px content: in a window narrower than 712px, this Row's 56px
 * sides narrow its paragraph (the comparison's 760px window has room for them).
 */
export const warby = (() => {
  const INK = "#2A2A2A";
  const MUTED = "#767676";
  const NAVY = "#00263A";
  const BLUE = "#3B5BDB";
  const LINE = "#EBEBEB";
  const BG = "#F6F6F4";
  const CARD = "#FFFFFF";
  const NBSP = " ";

  const lines = { label: MUTED, value: INK, line: LINE };
  const eyebrow = { fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: 0.72, lineHeight: "100%" } as const;

  /** A product line: its name in bold and its variant under it on the left, its price on the right; its hairline as `lineRow` draws it. */
  function productRow(name: string, variant: string, price: string, last = false) {
    const line = `1px solid ${LINE}`;
    const cell = { style: { padding: "16px 0" }, mobile: last ? undefined : { border: { bottom: line } } };
    return (
      <Section style={{ backgroundColor: CARD }}>
        <Row>
          <Column {...cell}>
            <Paragraph style={{ padding: 10, fontSize: 15, fontWeight: 700, color: INK, lineHeight: "150%" }}>{name}</Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: MUTED, lineHeight: "150%" }}>{variant}</Paragraph>
          </Column>
          <Column {...cell}>
            <Paragraph style={{ padding: 10, fontSize: 15, fontWeight: 700, color: INK, textAlign: "right", lineHeight: "150%" }}>{price}</Paragraph>
          </Column>
        </Row>
        {!last && <Divider hidden={{ mobile: true }} style={{ borderTop: line }} />}
      </Section>
    );
  }

  const main = <WarbyOrderShipped />;

  const next = (
    <Email
      width={600}
      previewText="Good news, Alex — your order is on its way. 📦"
      style={{ backgroundColor: BG, color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
    >
      <Section style={{ backgroundColor: CARD, padding: [46, 10, 38, 10] }}>
        <Heading level={2} style={{ fontSize: 20, fontWeight: 700, color: NAVY, letterSpacing: 3.6, textAlign: "center", lineHeight: "100%" }}>
          WARBY PARKER
        </Heading>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: 10 }}>
        <Image
          src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
          alt="A pair of eyeglasses resting on a clean surface"
          style={{ width: "100%" }}
        />
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [50, 10, 10, 10] }}>
        <Paragraph style={{ ...eyebrow, color: BLUE, textAlign: "center" }}>SHIPPED</Paragraph>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: [22, 10, 10, 10] }}>
        <Heading level={1} style={{ fontSize: 30, fontWeight: 700, color: NAVY, lineHeight: "124%", textAlign: "center" }}>
          Your order is on its way 📦
        </Heading>
      </Section>
      <Section style={{ backgroundColor: CARD, padding: [24, 10, 14, 10] }}>
        <Paragraph style={{ fontSize: 15, color: MUTED, lineHeight: "164%", textAlign: "center" }}>
          Hi Alex — your new frames have left our lab and are headed your way. We&apos;ll email you again the moment they land on your doorstep.
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [42, 10, 14, 10] }}>
        <Paragraph style={eyebrow}>TRACKING DETAILS</Paragraph>
      </Section>
      {lineRow("Carrier", "USPS Priority", lines)}
      {lineRow("Tracking number", "9400 1234 5678 9012 3456", lines)}
      {lineRow("Estimated delivery", "Mon, Jul 8", lines, true)}

      <Section style={{ backgroundColor: CARD, padding: [38, 10, 14, 10] }}>
        <Button
          href="https://tools.usps.com/go/TrackConfirmAction?tLabels=94001234567890123456"
          style={{ width: "100%", backgroundColor: NAVY, color: "#FFFFFF", fontSize: 15, fontWeight: 700, padding: "15px 28px", borderRadius: 8 }}
        >
          Track package
        </Button>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [46, 10, 14, 10] }}>
        <Paragraph style={eyebrow}>IN THIS ORDER</Paragraph>
      </Section>
      {productRow("Percey", "Whiskey Tortoise", "$145")}
      {productRow("Haskell", "Crystal", "$95", true)}
      {lineRow("Total", "$240", lines, true)}

      <Section style={{ backgroundColor: CARD, padding: [38, 10, 50, 10] }}>
        <Paragraph style={{ fontSize: 14, color: MUTED, lineHeight: "164%", textAlign: "center" }}>
          Questions about your order? Our team is here to help — just reply to this email or visit the{" "}
          <Link href="https://www.warbyparker.com/help" style={{ color: BLUE }}>
            Help Center
          </Link>
          .
        </Paragraph>
      </Section>
      <Section style={{ backgroundColor: BG, padding: [38, 10, 18, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "160%" }}>Warby Parker · 233 Spring Street, New York, NY 10013</Paragraph>
      </Section>
      <Section style={{ backgroundColor: BG, padding: [10, 10, 46, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "160%" }}>
          <Link href="#" style={{ color: MUTED }}>
            Unsubscribe
          </Link>
          {` ${NBSP}·${NBSP} `}
          <Link href="#" style={{ color: MUTED }}>
            Privacy Policy
          </Link>
        </Paragraph>
      </Section>
    </Email>
  );

  return { main, next };
})();

/**
 * main's "Notion · Welcome" example, and the same design written with the new components (main's layout read
 * as `stripe` says;). A Column's padding in main is around its
 * blocks' 10px, so here it's the two added.
 *
 * One difference is main's: its photo, 100% wide, is at most 504px (its column less the Row's 48px side
 * padding), as in `airbnb`; `nextAsMain` draws it as main does.
 */
export const notion = (() => {
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

  const main = <NotionWelcome />;

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
        <Social
          icons={[
            { name: "Twitter", href: "https://twitter.com/lumen" },
            { name: "Instagram", href: "https://instagram.com/lumen" },
            { name: "LinkedIn", href: "https://linkedin.com/company/lumen" },
            { name: "GitHub", href: "https://github.com/lumen" },
          ]}
          iconType="rounded"
          size={28}
          style={{ gap: 12 }}
        />
      </Section>
      <Section style={{ backgroundColor: PANEL, padding: [10, 10, 50, 10] }}>
        <Paragraph style={{ fontSize: 12, color: SUBTLE, textAlign: "center", lineHeight: "150%" }}>
          Lumen · 100 Market St, San Francisco, CA · <Link href="https://example.com/unsubscribe">Unsubscribe</Link>
        </Paragraph>
      </Section>
    </Email>
  );

  const next = design(false);
  const nextAsMain = design(true);
  const quirks = "its photo, 100% wide, is at most 504px (its column less the Row's 48px side padding), centered, instead of the column's 580px.";

  return { main, next, nextAsMain, quirks };
})();

/**
 * main's "Nike · Sneaker Drop" example, and the same design written with the new components (main's layout
 * read as `stripe` says).
 */
export const nike = (() => {
  const BLACK = "#111111";
  const WHITE = "#FFFFFF";

  const main = <NikeDrop />;

  const next = (
    <Email width={600} style={{ backgroundColor: BLACK, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <Section style={{ backgroundColor: BLACK, padding: [38, 10, 14, 10] }}>
        <Heading level={3} style={{ fontSize: 22, fontWeight: 800, color: WHITE, textAlign: "center", lineHeight: "140%" }}>
          NIKE
        </Heading>
      </Section>

      <Section style={{ backgroundColor: BLACK, padding: [18, 10, 10, 10] }}>
        <Image src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80" alt="New sneaker drop" style={{ width: "100%" }} />
      </Section>

      <Section style={{ backgroundColor: BLACK, padding: [38, 10, 10, 10], gap: 20 }}>
        <Heading level={1} style={{ fontSize: 48, fontWeight: 800, color: WHITE, textAlign: "center", lineHeight: "105%" }}>
          JUST DROPPED
        </Heading>
        <Paragraph style={{ fontSize: 17, color: "#B3B3B3", textAlign: "center", lineHeight: "150%" }}>The Air Max 2026. Limited stock. Move fast.</Paragraph>
      </Section>

      <Section style={{ backgroundColor: BLACK, padding: [30, 10, 46, 10], alignItems: "center" }}>
        <Button href="https://nike.com/launch" style={{ backgroundColor: WHITE, color: BLACK, fontSize: 18, fontWeight: 700, padding: "16px 40px", borderRadius: 40 }}>
          Shop now
        </Button>
      </Section>

      <Section style={{ backgroundColor: BLACK, padding: [18, 10, 50, 10] }}>
        <Social
          icons={[
            { name: "Instagram", href: "https://instagram.com/nike" },
            { name: "Twitter", href: "https://twitter.com/nike" },
            { name: "Facebook", href: "https://facebook.com/nike" },
          ]}
          iconType="circle"
          size={36}
          style={{ gap: 12 }}
        />
      </Section>
    </Email>
  );

  return { main, next };
})();

/**
 * main's "Morning Brew · Daily Digest" example, and the same design written with the new components (main's
 * layout read as `stripe` says, a Column's padding as `notion` says). main's body link
 * color is each Link's color here.
 *
 * Three differences are main's: its photo, 100% wide, is at most 504px, as in `notion`; its body
 * link color isn't its links' (they're the default #0000ee); and its menu's links and separators are further apart
 * than the new Menu puts them (`menu`). `nextAsMain` draws them as main does.
 */
export const brew = (() => {
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

  const main = <MorningBrewDigest />;

  const ITEMS = [
    { text: "Subscribe", href: "https://example.com/subscribe" },
    { text: "Archive", href: "https://example.com/archive" },
    { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
  ];

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
        {asMain ? (
          mainMenu({ items: ITEMS, separator: "·" })
        ) : (
          <Menu items={ITEMS} separator="·" />
        )}
      </Section>
      <Section style={{ backgroundColor: PAPER, padding: [14, 10, 46, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "150%" }}>
          The Daily Pour · 123 Roastery Lane, Brewville · You&apos;re getting this because you have great taste.
        </Paragraph>
      </Section>
    </Email>
  );

  const next = design(false);
  const nextAsMain = design(true);
  const quirks =
    "its photo, 100% wide, is at most 504px (its column less the Row's 48px side padding), centered, instead of the column's 580px; and its links are the default #0000ee, not its link color (#1463FF); and its menu's links and separators are further apart than the new Menu puts them (a space between each, each separator in a link's padding too).";

  /** main's menu spaces its links and lines by its font, Elements exactly (`menu`): they may sit up to 3px from main's. */
  const allowance = { x: 3, y: 3 };

  return { main, next, nextAsMain, quirks, allowance };
})();

/**
 * main's "Linear · Product Digest" example, and the same design written with the new components (main's
 * layout read as `stripe` says).
 *
 * One difference is main's: its menu's links and separators are further apart than the new Menu puts them, as
 * `menu` says; `nextAsMain` draws main's menu (`mainMenu`), and its content may sit up to 3px from main's (`allowance`).
 */
export const digest = (() => {
  const INK = "#18181B";
  const BODY = "#52525B";
  const MUTED = "#A1A1AA";
  const LINE = "#E4E4E7";
  const WHITE = "#FFFFFF";

  function feature(title: string, text: string) {
    return (
      <Column style={{ padding: 10, gap: 20 }}>
        <Heading level={2} style={{ fontSize: 20, fontWeight: 600, color: INK, lineHeight: "140%" }}>
          {title}
        </Heading>
        <Paragraph style={{ fontSize: 15, color: BODY, lineHeight: "160%" }}>{text}</Paragraph>
      </Column>
    );
  }

  const main = <ProductDigest />;

  const ITEMS = [
    { text: "Docs", href: "https://linear.app/docs" },
    { text: "Blog", href: "https://linear.app/blog" },
    { text: "Careers", href: "https://linear.app/careers" },
  ];

  /** The design; `asMain` spaces the menu's links as main does. */
  const design = (asMain: boolean) => (
    <Email width={600} style={{ backgroundColor: "#FAFAFA", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Section style={{ backgroundColor: WHITE, padding: [42, 10, 10, 10] }}>
        <Heading level={3} style={{ fontSize: 18, fontWeight: 700, color: INK, lineHeight: "140%" }}>
          ◆ Linear
        </Heading>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [30, 10, 10, 10], gap: 20 }}>
        <Heading level={1} style={{ fontSize: 32, fontWeight: 700, color: INK, lineHeight: "120%" }}>
          Product updates, June 2026
        </Heading>
        <Paragraph style={{ fontSize: 16, color: BODY, lineHeight: "160%" }}>Three improvements shipped this month to make you faster.</Paragraph>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [30, 10, 10, 10], gap: 20 }}>
        <Heading level={2} style={{ fontSize: 20, fontWeight: 600, color: INK, lineHeight: "130%" }}>
          Faster command palette
        </Heading>
        <Paragraph style={{ fontSize: 15, color: BODY, lineHeight: "160%" }}>
          The command palette now opens in under 50ms. Read the full <Link href="https://linear.app/changelog">changelog entry</Link> for the details.
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [12, 0, 8, 0] }}>
        <Row>
          {feature("Sub-issues", "Break work down without leaving the issue view.")}
          {feature("Saved views", "Pin the filters you use every day to the sidebar.")}
        </Row>
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [26, 10, 10, 10] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}` }} />
      </Section>

      <Section style={{ backgroundColor: WHITE, padding: [26, 10, 18, 10] }}>
        {asMain ? (
          mainMenu({ items: ITEMS, separator: "•" })
        ) : (
          <Menu items={ITEMS} separator="•" />
        )}
      </Section>
      <Section style={{ backgroundColor: WHITE, padding: [10, 10, 46, 10] }}>
        <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "140%" }}>You&apos;re receiving this because you use Linear.</Paragraph>
      </Section>
    </Email>
  );

  const next = design(false);
  const nextAsMain = design(true);
  const quirks = "its menu's links and separators are inline-blocks with a space between each, each separator in a link's padding too, so each is further from the next than the new Menu puts them.";

  /** main's menu spaces its links and lines by its font, Elements exactly (`menu`): they may sit up to 3px from main's. */
  const allowance = { x: 3, y: 3 };

  return { main, next, nextAsMain, quirks, allowance };
})();

/**
 * main's Social stories (Components/Social), each in an email, and the same icons with the new Social: main's
 * `url` is `href`, `iconSize` is `size`, `spacing` is the gap, and the block's padding is its Section's.
 */
export const social = (() => {
  type Icon = { name: string; url: string };

  function design(icons: Icon[], iconType: "circle" | "rounded" | "squared", size: number, spacing: number, padding: number) {
    return {
      main: (
        <MainEmail contentWidth="600px">
          <MainRow>
            <MainColumn>
              <MainSocial icons={icons} iconType={iconType} iconSize={size} spacing={spacing} align="center" containerPadding={`${padding}px`} />
            </MainColumn>
          </MainRow>
        </MainEmail>
      ),
      next: (
        <Email width={600}>
          <Section style={{ padding }}>
            <Social icons={icons.map(({ name, url }) => ({ name, href: url.includes("@") && !url.includes(":") ? `mailto:${url}` : url }))} iconType={iconType} size={size} style={{ gap: spacing }} />
          </Section>
        </Email>
      ),
    };
  }

  const bar = design(
    [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
      { name: "LinkedIn", url: "https://linkedin.com/company" },
      { name: "YouTube", url: "https://youtube.com/company" },
    ],
    "circle",
    40,
    12,
    30
  );

  const rounded = design(
    [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "YouTube", url: "https://youtube.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
    ],
    "rounded",
    40,
    15,
    25
  );

  const squared = design(
    [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "LinkedIn", url: "https://linkedin.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
    ],
    "squared",
    36,
    12,
    20
  );

  const footer = design(
    [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
      { name: "Email", url: "contact@company.com" },
    ],
    "circle",
    28,
    8,
    16
  );

  return { bar, rounded, squared, footer };
})();

/**
 * main's Menu stories (Components/Menu), each in an email, and the same links with the new Menu: main's
 * `linkColor` is the color, `textColor` the separator's, `align` the alignment.
 *
 * main's links and separators are inline-blocks with a space between each in its markup, each separator in a link's
 * padding too, so each is further from the next than the new Menu puts them (a link's padding either side of a
 * separator, not twice); `nextAsMain` draws main's menu (`mainMenu`). main's spaces are in its container's font
 * size, and its menu takes the font's normal line height, where Elements writes an exact one (1.2) that every client
 * draws alike: its links may sit up to 3px from main's, across and up and down (`allowance`).
 * Its font is main's email default as main writes it.
 */
export const menu = (() => {
  const ITEMS = [
    { text: "Home", href: "#home" },
    { text: "About", href: "#about" },
    { text: "Services", href: "#services" },
    { text: "Contact", href: "#contact" },
  ];

  function design(separatorColor?: string) {
    const next = (asMain: boolean) => (
      <Email width={600} style={{ fontFamily: "arial, helvetica, sans-serif" }}>
        <Section style={{ padding: 10 }}>
          {asMain ? (
            mainMenu({ items: ITEMS, separator: "|", padding: [10, 16], fontSize: 14, color: "#2563eb", ...(separatorColor ? { separatorColor } : {}) })
          ) : (
            <Menu items={ITEMS} separator="|" style={{ padding: [10, 16], fontSize: 14, color: "#2563eb", ...(separatorColor ? { separatorColor } : {}) }} />
          )}
        </Section>
      </Email>
    );
    return {
      main: (
        <MainEmail contentWidth="600px">
          <MainRow>
            <MainColumn>
              <MainMenu items={ITEMS} layout="horizontal" align="center" separator="|" padding="10px 16px" fontSize="14px" linkColor="#2563eb" {...(separatorColor ? { textColor: separatorColor } : {})} />
            </MainColumn>
          </MainRow>
        </MainEmail>
      ),
      next: next(false),
      nextAsMain: next(true),
      quirks: "its links and separators are inline-blocks with a space between each, each separator in a link's padding too, so each is further from the next than the new Menu puts them.",
      allowance: { x: 3, y: 3 },
    };
  }

  const links = design();
  const separators = design("#374151");

  return { links, separators };
})();

/**
 * main's Video story (Components/Video), in an email and on a page, and the same video with the new Video: main's
 * `videoUrl` is `src`. On a page both are the video's player; in an email, its thumbnail, which the new Video links
 * to the video (main's isn't a link: a reader can't open the video from it).
 */
export const video = (() => {
  const SRC = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  const email = {
    main: (
      <MainEmail contentWidth="600px">
        <MainRow>
          <MainColumn>
            <MainVideo videoUrl={SRC} />
          </MainColumn>
        </MainRow>
      </MainEmail>
    ),
    next: (
      <Email width={600}>
        <Section style={{ padding: 10 }}>
          <Video src={SRC} />
        </Section>
      </Email>
    ),
  };

  /** The page; `asMain` adds the browser's 8px margin around the body, which main's page keeps (its content is that much narrower and lower). */
  const pageOf = (asMain: boolean) => (
    <Page width={600}>
      <Section style={{ padding: asMain ? [18, 10] : 10 }} mobile={asMain ? { padding: 18 } : undefined}>
        <Video src={SRC} />
      </Section>
    </Page>
  );

  const page = {
    quirks: "its page keeps the browser's 8px margin around the body.",
    nextAsMain: pageOf(true),
    main: (
      <MainPage contentWidth="600px">
        <MainRow>
          <MainColumn>
            <MainVideo videoUrl={SRC} />
          </MainColumn>
        </MainRow>
      </MainPage>
    ),
    next: pageOf(false),
  };

  return { email, page };
})();
