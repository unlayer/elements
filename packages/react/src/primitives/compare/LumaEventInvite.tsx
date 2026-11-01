/**
 * main's "Luma · Event Invite" example, and the same design written with the new components (main's
 * layout read as StripeReceipt.tsx says; main's text has a 140% line height where it sets none).
 *
 * One difference is main's: the hosts' photos, 48px wide, come out 52px (main writes a px width as a
 * percentage, as SpotifyWelcome.tsx says), so what's below them sits 6px lower in main.
 */
import { LumaEventInvite } from "../../examples/LumaEventInvite.stories";
import { Button, Column, Divider, Email, Heading, Image, Link, Paragraph, Row, Section, Span } from "../index";

const INK = "#0B0B0F";
const SUBTLE = "#6B6B76";
const LINE = "#ECECF1";
const ACCENT = "#FF5C38";
const CARD = "#FFFFFF";
const NBSP = " ";

function host(photo: string, name: string, role: string) {
  return (
    <Column style={{ padding: 10, gap: 20 }}>
      <Image src={photo} alt={name} style={{ width: 48 }} />
      <Paragraph style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: "140%" }}>{name}</Paragraph>
      <Paragraph style={{ fontSize: 13, color: SUBTLE, lineHeight: "140%" }}>{role}</Paragraph>
    </Column>
  );
}

export const main = <LumaEventInvite />;

export const next = (
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
        {host("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80", "Maya Okonkwo", "Founder, Lumen")}
        {host("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80", "Theo Park", "Head of Community")}
      </Row>
    </Section>

    <Section style={{ padding: [28, 10, 50, 10] }}>
      <Paragraph style={{ fontSize: 12, color: SUBTLE, textAlign: "center", lineHeight: "160%" }}>
        You&apos;re receiving this because you joined the Lumen waitlist. <Link href="https://lu.ma/settings">Manage notifications</Link>.
      </Paragraph>
    </Section>
  </Email>
);
