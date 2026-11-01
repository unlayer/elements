// main's examples/LumaEventInvite.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 153: today's draw this Image's 48px as 20% of its column, at most 52px: that's written out so it doesn't move (give it its width in px to draw it at that)
// - line 163: today's draw this Image's 48px as 20% of its column, at most 52px: that's written out so it doesn't move (give it its width in px to draw it at that)
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Link,
  Paragraph,
  Row,
  Section,
  Span,
} from "../index";

// Luma-style event invite — modern, energetic, full-bleed hero.
const INK = "#0B0B0F";
const SUBTLE = "#6B6B76";
const LINE = "#ECECF1";
const ACCENT = "#FF5C38"; // warm coral for RSVP
const CARD = "#FFFFFF";

const display = {
  label: "Display",
  value:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function LumaEventInvite() {
  return (
    <Email
      width={600}
      style={{ backgroundColor: "#F4F4F7", color: "#000000", fontFamily: display.value }}
    >
      {/* Brand wordmark */}
      <Section style={{ backgroundColor: CARD, padding: [28, 0, 16, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 15,
            fontWeight: 800,
            color: INK,
            textAlign: "left",
            lineHeight: "140%",
            letterSpacing: "-0.2px",
          }}
        >
          ◆ luma
        </Heading>
      </Section>

      {/* Full-width hero image */}
      <Section style={{ backgroundColor: CARD }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={
              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
            }
            alt="Rooftop launch party at golden hour"
          />
        </Column>
      </Section>

      {/* Pill + title */}
      <Section style={{ backgroundColor: CARD, padding: [32, 0, 4, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: ACCENT,
            textAlign: "left",
            lineHeight: "140%",
            letterSpacing: "1.4px",
          }}
        >
          <Span style={{ fontWeight: 700 }}>YOU'RE INVITED</Span>
        </Paragraph>
        <Heading
          style={{
            padding: 10,
            fontSize: 40,
            fontWeight: 800,
            color: INK,
            textAlign: "left",
            lineHeight: "108%",
            letterSpacing: "-1.2px",
          }}
        >
          Neon Nights · Summer Launch
        </Heading>
      </Section>

      {/* Date / time / location detail block */}
      <Section style={{ backgroundColor: CARD, padding: [14, 0, 0, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 15, color: INK, textAlign: "left", lineHeight: "170%" }}
        >
          {"🗓️  "}
          <Span style={{ fontWeight: 700 }}>Thursday, July 9, 2026</Span>
          {"  ·  7:00 – 11:00 PM PDT"}
        </Paragraph>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 15,
            color: SUBTLE,
            textAlign: "left",
            lineHeight: "170%",
          }}
        >
          {"📍  "}
          <Span style={{ fontWeight: 700 }}>The Skydeck</Span>
          {" — 450 Market St, San Francisco, CA"}
        </Paragraph>
      </Section>

      {/* RSVP primary CTA */}
      <Section style={{ backgroundColor: CARD, padding: [22, 0, 6, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="https://lu.ma/neon-nights/rsvp"
            style={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 700,
              padding: "15px 30px",
              borderRadius: 10,
            }}
          >
            RSVP — Save my spot
          </Button>
        </Column>
      </Section>

      {/* Secondary add-to-calendar link */}
      <Section style={{ backgroundColor: CARD, padding: [0, 0, 24, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 14, color: INK, textAlign: "left", lineHeight: "140%" }}
        >
          <Link
            href="https://lu.ma/neon-nights/calendar"
            style={{ color: "#0B0B0F", textDecoration: "underline" }}
          >
            + Add to calendar
          </Link>
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Hosts — avatars + names */}
      <Section style={{ backgroundColor: CARD, padding: [20, 0, 6, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 11,
            color: SUBTLE,
            textAlign: "left",
            lineHeight: "140%",
            letterSpacing: "1.1px",
          }}
        >
          <Span style={{ fontWeight: 700 }}>HOSTED BY</Span>
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: CARD, padding: [0, 0, 28, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Column style={{ padding: 10, alignItems: "start" }}>
              <Image
                src={
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                }
                alt="Maya Okonkwo"
                style={{ width: "20%", maxWidth: 52 }}
              />
            </Column>
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "left",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>Maya Okonkwo</Span>
            </Paragraph>
            <Paragraph
              style={{
                padding: 10,
                fontSize: 13,
                color: SUBTLE,
                textAlign: "left",
                lineHeight: "140%",
              }}
            >
              Founder, Lumen
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Column style={{ padding: 10, alignItems: "start" }}>
              <Image
                src={
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                }
                alt="Theo Park"
                style={{ width: "20%", maxWidth: 52 }}
              />
            </Column>
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "left",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>Theo Park</Span>
            </Paragraph>
            <Paragraph
              style={{
                padding: 10,
                fontSize: 13,
                color: SUBTLE,
                textAlign: "left",
                lineHeight: "140%",
              }}
            >
              Head of Community
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [18, 0, 40, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: SUBTLE,
            textAlign: "center",
            lineHeight: "160%",
          }}
        >
          {"You're receiving this because you joined the Lumen waitlist. "}
          <Link href="https://lu.ma/settings">Manage notifications</Link>.
        </Paragraph>
      </Section>
    </Email>
  );
}
