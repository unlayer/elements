// main's examples, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
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
  Social,
  Span,
  Text,
} from "../index";

// main's examples/AirbnbConfirmation.stories.tsx
//
// What the codemod reported:
// - line 35: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
export const airbnb = (() => {
  // Airbnb brand: Rausch coral #FF385C, ink #222, muted #717171, hairline #EBEBEB.
  const RAUSCH = "#FF385C";
  const INK = "#222222";
  const MUTED = "#717171";
  const LINE = "#EBEBEB";
  const sans = {
    label: "Circular",
    value:
      "Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  // One label/value line of the reservation summary, with a hairline divider.
  function detailRow(label: string, value: string, last = false) {
    const cell = {
      padding: "14px 0",
      borderBottomWidth: last ? "0px" : "1px",
      borderBottomStyle: "solid",
      borderBottomColor: LINE,
    } as const;
    return (
      <Section style={{ backgroundColor: "#FFFFFF" }}>
        <Row
          style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          mobile={{ border: { bottom: "none" } }}
        >
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>
              {label}
            </Paragraph>
          </Column>
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "right",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>{value}</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>
    );
  }

  function AirbnbConfirmation() {
    return (
      <Email
        width={600}
        style={{ backgroundColor: "#F7F7F7", color: "#000000", fontFamily: sans.value }}
      >
        {/* Brand */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [28, 0, 12, 0] }}>
          <Heading
            level={2}
            style={{
              padding: 10,
              fontSize: 22,
              fontWeight: 700,
              color: RAUSCH,
              textAlign: "left",
              lineHeight: "140%",
            }}
          >
            airbnb
          </Heading>
        </Section>

        {/* Hero photo */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [4, 0, 0, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Image
              src={"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"}
              alt="Oceanview Villa"
              style={{ width: "100%", maxWidth: 520 }}
            />
          </Column>
        </Section>

        {/* Headline */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [28, 0, 4, 0] }}>
          <Heading
            style={{ padding: 10, fontSize: 26, fontWeight: 700, color: INK, lineHeight: "130%" }}
          >
            You're confirmed, Maya 🎉
          </Heading>
          <Paragraph style={{ padding: 10, fontSize: 16, color: MUTED, lineHeight: "150%" }}>
            {"Your stay at "}
            <Span style={{ fontWeight: 700 }}>Oceanview Villa</Span>
            {" in Malibu is booked. We can't wait to host you."}
          </Paragraph>
        </Section>

        {/* Reservation summary — clean label/value, no spreadsheet borders */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 2, 0] }}>
          <Heading
            level={4}
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
              lineHeight: "140%",
              letterSpacing: 0.72,
            }}
          >
            RESERVATION
          </Heading>
        </Section>
        {detailRow("Property", "Oceanview Villa · Malibu, CA")}
        {detailRow("Check-in", "Fri, Jul 18 · 3:00 PM")}
        {detailRow("Check-out", "Mon, Jul 21 · 11:00 AM")}
        {detailRow("Guests", "2 adults")}
        {detailRow("Total", "$1,248.00", true)}

        {/* CTA */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [28, 0, 32, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Button
              href="https://airbnb.com/trips"
              style={{
                width: "100%",
                backgroundColor: RAUSCH,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 700,
                padding: "15px 28px",
                borderRadius: 10,
              }}
            >
              View itinerary
            </Button>
          </Column>
        </Section>

        {/* Footer */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 40, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 13,
              color: MUTED,
              textAlign: "center",
              lineHeight: "150%",
            }}
          >
            {"Questions about your trip? "}
            <Link href="https://airbnb.com/help">Visit the Help Center</Link>.
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { AirbnbConfirmation };
})();

// main's examples/LumaEventInvite.stories.tsx
//
// What the codemod reported:
// - line 153: today's draw this Image's 48px as 20% of its column, at most 52px: that's written out so it doesn't move (give it its width in px to draw it at that)
// - line 163: today's draw this Image's 48px as 20% of its column, at most 52px: that's written out so it doesn't move (give it its width in px to draw it at that)
export const luma = (() => {
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

  function LumaEventInvite() {
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

  return { LumaEventInvite };
})();

// main's examples/MercuryReceipt.stories.tsx
//
// What the codemod reported:
// - line 45: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
export const mercury = (() => {
  // Mercury/Wise-style fintech receipt — sophisticated, restrained, generous whitespace.
  const INK = "#0E0E10";
  const MUTED = "#6B6B70";
  const ACCENT = "#5A4FCF";
  const SUCCESS = "#1F9D55";
  const LINE = "#ECECEE";
  const BG = "#FAFAFA";
  const CARD = "#FFFFFF";

  const sans = {
    label: "Sans Serif",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  /**
   * A single label/value line rendered as a Row + two Columns, with a hairline
   * divider drawn by the Column's bottom border. NOT a <Table> — the shorthand
   * table renders an ugly bordered spreadsheet with no padding.
   *
   * Call inline as {detailRow(...)} — Email only recognizes <Row> children.
   */
  function detailRow(label: string, value: string, last = false) {
    const cell = {
      padding: "14px 0",
      borderBottomWidth: last ? "0px" : "1px",
      borderBottomStyle: "solid",
      borderBottomColor: LINE,
    } as const;
    return (
      <Section style={{ backgroundColor: CARD }}>
        <Row
          style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          mobile={{ border: { bottom: "none" } }}
        >
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>
              {label}
            </Paragraph>
          </Column>
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "right",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>{value}</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>
    );
  }

  function MercuryReceipt() {
    return (
      <Email width={560} style={{ backgroundColor: BG, color: INK, fontFamily: sans.value }}>
        {/* Wordmark */}
        <Section style={{ backgroundColor: CARD, padding: [44, 0, 0, 0] }}>
          <Heading
            level={4}
            style={{
              padding: 10,
              fontSize: 17,
              fontWeight: 600,
              color: INK,
              textAlign: "left",
              lineHeight: "100%",
              letterSpacing: -0.17,
            }}
          >
            Meridian
          </Heading>
        </Section>

        {/* Status eyebrow */}
        <Section style={{ backgroundColor: CARD, padding: [52, 0, 0, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: SUCCESS,
              textAlign: "left",
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            PAYMENT SENT
          </Paragraph>
        </Section>

        {/* Big amount */}
        <Section style={{ backgroundColor: CARD, padding: [14, 0, 0, 0] }}>
          <Heading
            style={{
              padding: 10,
              fontSize: 48,
              fontWeight: 600,
              color: INK,
              textAlign: "left",
              lineHeight: "110%",
              letterSpacing: -0.96,
            }}
          >
            $1,240.00
          </Heading>
        </Section>

        {/* Subhead */}
        <Section style={{ backgroundColor: CARD, padding: [6, 0, 0, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 16,
              color: MUTED,
              textAlign: "left",
              lineHeight: "150%",
            }}
          >
            Your transfer to Olivia Hart is on its way.
          </Paragraph>
        </Section>

        {/* Section label */}
        <Section style={{ backgroundColor: CARD, padding: [40, 0, 4, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
              textAlign: "left",
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            DETAILS
          </Paragraph>
        </Section>

        {/* Details — label/value rows with hairline dividers */}
        {detailRow("To", "Olivia Hart")}
        {detailRow("From", "Acme Inc · ••4291")}
        {detailRow("Date", "Jul 1, 2026")}
        {detailRow("Reference", "INV-2705", true)}

        {/* Divider */}
        <Section style={{ backgroundColor: CARD, padding: [36, 0, 0, 0] }}>
          <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
        </Section>

        {/* CTA */}
        <Section style={{ backgroundColor: CARD, padding: [32, 0, 0, 0] }}>
          <Column style={{ padding: 10, alignItems: "start" }}>
            <Button
              href="https://meridian.example.com/tx/INV-2705"
              style={{
                backgroundColor: INK,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 500,
                padding: "13px 24px",
                borderRadius: 8,
              }}
            >
              View transaction
            </Button>
          </Column>
        </Section>

        {/* Footer */}
        <Section style={{ backgroundColor: CARD, padding: [48, 0, 56, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: MUTED,
              textAlign: "left",
              lineHeight: "170%",
            }}
          >
            {"Meridian Financial · This receipt confirms a completed transfer. Need help? "}
            <Link
              href="https://meridian.example.com/support"
              style={{ color: ACCENT, textDecoration: "none" }}
            >
              Contact support
            </Link>
            .
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { MercuryReceipt };
})();

// main's examples/MorningBrewDigest.stories.tsx
//
// What the codemod reported:
// - line 37: <Email>'s linkStyle isn't migrated: it's left out (the new components have nothing it becomes)
// - line 246: written as a Row of its links, spaced as today's Menu spaces them (the new Menu leaves out the space today's puts between its links): in the visual editor it's a row of text, not a Menu
export const brew = (() => {
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

  function MorningBrewDigest() {
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
            <Row
              stackOnMobile={false}
              style={{ flexWrap: "wrap", justifyContent: "center", fontSize: 14, lineHeight: 1.2 }}
            >
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://example.com/subscribe"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  Subscribe
                </Link>
              </Text>
              <Text
                hidden={{ mobile: true }}
                style={{ flex: "none", padding: [5, 15], color: "#444444" }}
              >
                {"\u00a0·"}
              </Text>
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://example.com/archive"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  {"\u00a0Archive"}
                </Link>
              </Text>
              <Text
                hidden={{ mobile: true }}
                style={{ flex: "none", padding: [5, 15], color: "#444444" }}
              >
                {"\u00a0·"}
              </Text>
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://example.com/unsubscribe"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  {"\u00a0Unsubscribe"}
                </Link>
              </Text>
            </Row>
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
            The Daily Pour · 123 Roastery Lane, Brewville · You're getting this because you have
            great taste.
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { MorningBrewDigest };
})();

// main's examples/NikeDrop.stories.tsx
export const nike = (() => {
  // Reconstructed from the "fresh agent" Nike build — verbatim natural forms:
  // full-width hero src string + width="100%", oversized fontSize="48px"
  // fontWeight={800}, Social icons shorthand.
  const BLACK = "#111111";
  const WHITE = "#FFFFFF";
  const helv = {
    label: "Helvetica",
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };

  function NikeDrop() {
    return (
      <Email
        width={600}
        style={{ backgroundColor: BLACK, color: "#000000", fontFamily: helv.value }}
      >
        {/* Brand */}
        <Section style={{ backgroundColor: BLACK, padding: [28, 0, 4, 0] }}>
          <Heading
            level={3}
            style={{
              padding: 10,
              fontSize: 22,
              fontWeight: 800,
              color: WHITE,
              textAlign: "center",
              lineHeight: "140%",
            }}
          >
            NIKE
          </Heading>
        </Section>

        {/* Hero */}
        <Section style={{ backgroundColor: BLACK, padding: [8, 0, 0, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Image
              src={"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"}
              alt="New sneaker drop"
            />
          </Column>
        </Section>

        {/* Headline */}
        <Section style={{ backgroundColor: BLACK, padding: [28, 0, 0, 0] }}>
          <Heading
            style={{
              padding: 10,
              fontSize: 48,
              fontWeight: 800,
              color: WHITE,
              textAlign: "center",
              lineHeight: "105%",
            }}
          >
            JUST DROPPED
          </Heading>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 17,
              color: "#B3B3B3",
              textAlign: "center",
              lineHeight: "150%",
            }}
          >
            The Air Max 2026. Limited stock. Move fast.
          </Paragraph>
        </Section>

        {/* CTA */}
        <Section style={{ backgroundColor: BLACK, padding: [20, 0, 36, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Button
              href="https://nike.com/launch"
              style={{
                backgroundColor: WHITE,
                color: BLACK,
                fontSize: 18,
                fontWeight: 700,
                padding: "16px 40px",
                borderRadius: 40,
              }}
            >
              Shop now
            </Button>
          </Column>
        </Section>

        {/* Social footer */}
        <Section style={{ backgroundColor: BLACK, padding: [8, 0, 40, 0] }}>
          <Column style={{ padding: 10 }}>
            <Social
              icons={[
                { name: "Instagram", href: "https://instagram.com/nike" },
                { name: "Twitter", href: "https://twitter.com/nike" },
                { name: "Facebook", href: "https://facebook.com/nike" },
              ]}
              iconType="circle"
              size={36}
              style={{ gap: 12, justifyContent: "center" }}
            />
          </Column>
        </Section>
      </Email>
    );
  }

  return { NikeDrop };
})();

// main's examples/NotionWelcome.stories.tsx
export const notion = (() => {
  // Notion/Figma-style onboarding welcome — approachable, clean, generous whitespace.
  const INK = "#2B2B33";
  const MUTED = "#6B6F76";
  const SUBTLE = "#9CA0A6";
  const ACCENT = "#0B0B0F";
  const PANEL = "#F7F7F5";
  const sans = {
    label: "Sans Serif",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  const PRODUCT = "Lumen";

  function NotionWelcome() {
    return (
      <Email
        width={600}
        previewText={`Welcome to ${PRODUCT} — here's how to get started.`}
        style={{ backgroundColor: PANEL, color: INK, fontFamily: sans.value }}
      >
        {/* Wordmark */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [40, 0, 0, 0] }}>
          <Heading
            level={4}
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: 700,
              color: ACCENT,
              textAlign: "left",
              lineHeight: "100%",
            }}
          >
            ✦ {PRODUCT}
          </Heading>
        </Section>

        {/* Welcome heading + intro */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 8, 0] }}>
          <Heading
            style={{
              padding: 10,
              fontSize: 34,
              fontWeight: 700,
              color: INK,
              textAlign: "left",
              lineHeight: "120%",
            }}
          >
            Welcome to {PRODUCT} 👋
          </Heading>
        </Section>
        <Section style={{ backgroundColor: "#FFFFFF", padding: [0, 0, 8, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 16,
              color: MUTED,
              textAlign: "left",
              lineHeight: "160%",
            }}
          >
            We're so glad you're here. Lumen is the calm, all-in-one workspace where your notes,
            docs, and plans finally live together. Let's get you set up in just a few minutes.
          </Paragraph>
        </Section>

        {/* Optional small hero image */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 8, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Image
              src={"https://images.unsplash.com/photo-1517842645767-c639042777db?w=1040&q=80"}
              alt="A tidy desk workspace"
              style={{ width: "100%", maxWidth: 504 }}
            />
          </Column>
        </Section>

        {/* 2x2 feature grid — first row */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [24, 0, 8, 0] }}>
          <Row>
            <Column style={{ width: "50%", padding: "0 16px 16px 0" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 17,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "130%",
                }}
              >
                📝 Write anything
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
                Docs, notes, and wikis that feel effortless to create.
              </Paragraph>
            </Column>
            <Column style={{ width: "50%", padding: "0 0 16px 16px" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 17,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "130%",
                }}
              >
                ✅ Plan together
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
                Tasks and timelines that keep the whole team in sync.
              </Paragraph>
            </Column>
          </Row>
        </Section>

        {/* 2x2 feature grid — second row */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 24, 0] }}>
          <Row>
            <Column style={{ width: "50%", padding: "0 16px 0 0" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 17,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "130%",
                }}
              >
                🔍 Find it fast
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
                Instant search across everything you've ever written.
              </Paragraph>
            </Column>
            <Column style={{ width: "50%", padding: "0 0 0 16px" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 17,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "130%",
                }}
              >
                🤝 Share with anyone
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
                Invite teammates and guests with a single link.
              </Paragraph>
            </Column>
          </Row>
        </Section>

        {/* Get started CTA */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 48, 0] }}>
          <Column style={{ padding: 10, alignItems: "start" }}>
            <Button
              href="https://example.com/get-started"
              style={{
                backgroundColor: ACCENT,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 600,
                padding: "14px 28px",
                borderRadius: 8,
              }}
            >
              Get started
            </Button>
          </Column>
        </Section>

        {/* Footer — social icons */}
        <Section style={{ backgroundColor: PANEL, padding: [32, 0, 8, 0] }}>
          <Column style={{ padding: 10 }}>
            <Social
              icons={[
                { name: "Twitter", href: "https://twitter.com/lumen" },
                { name: "Instagram", href: "https://instagram.com/lumen" },
                { name: "LinkedIn", href: "https://linkedin.com/company/lumen" },
                { name: "GitHub", href: "https://github.com/lumen" },
              ]}
              iconType="rounded"
              size={28}
              style={{ gap: 12, justifyContent: "center" }}
            />
          </Column>
        </Section>
        <Section style={{ backgroundColor: PANEL, padding: [0, 0, 40, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: SUBTLE,
              textAlign: "center",
              lineHeight: "150%",
            }}
          >
            {"Lumen · 100 Market St, San Francisco, CA · "}
            <Link href="https://example.com/unsubscribe">Unsubscribe</Link>
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { NotionWelcome };
})();

// main's examples/ProductDigest.stories.tsx
//
// What the codemod reported:
// - line 102: written as a Row of its links, spaced as today's Menu spaces them (the new Menu leaves out the space today's puts between its links): in the visual editor it's a row of text, not a Menu
export const digest = (() => {
  // Reconstructed from the "fresh agent" SaaS-digest build — verbatim natural
  // forms: heading fonts, inline <a> via Paragraph html, ColumnLayouts.TwoEqual,
  // Menu items shorthand with separator.
  const INK = "#18181B";
  const BODY = "#52525B";
  const MUTED = "#A1A1AA";
  const LINE = "#E4E4E7";
  const sans = {
    label: "Sans Serif",
    value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  function ProductDigest() {
    return (
      <Email
        width={600}
        style={{ backgroundColor: "#FAFAFA", color: "#000000", fontFamily: sans.value }}
      >
        {/* Brand */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 0, 0] }}>
          <Heading
            level={3}
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: 700,
              color: INK,
              textAlign: "left",
              lineHeight: "140%",
            }}
          >
            ◆ Linear
          </Heading>
        </Section>

        {/* Title */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
          <Heading
            style={{ padding: 10, fontSize: 32, fontWeight: 700, color: INK, lineHeight: "120%" }}
          >
            Product updates, June 2026
          </Heading>
          <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
            Three improvements shipped this month to make you faster.
          </Paragraph>
        </Section>

        {/* Feature 1 */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
          <Heading
            level={2}
            style={{ padding: 10, fontSize: 20, fontWeight: 600, color: INK, lineHeight: "130%" }}
          >
            Faster command palette
          </Heading>
          <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
            {"The command palette now opens in under 50ms. Read the full "}
            <Link href="https://linear.app/changelog">changelog entry</Link>
            {" for the details."}
          </Paragraph>
        </Section>

        {/* Two-column features */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [12, 0, 8, 0] }}>
          <Row>
            <Column style={{ width: "50%" }}>
              <Heading
                level={2}
                style={{
                  padding: 10,
                  fontSize: 20,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "140%",
                }}
              >
                Sub-issues
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
                Break work down without leaving the issue view.
              </Paragraph>
            </Column>
            <Column style={{ width: "50%" }}>
              <Heading
                level={2}
                style={{
                  padding: 10,
                  fontSize: 20,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: "140%",
                }}
              >
                Saved views
              </Heading>
              <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
                Pin the filters you use every day to the sidebar.
              </Paragraph>
            </Column>
          </Row>
        </Section>

        <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 0, 0] }}>
          <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
        </Section>

        {/* Footer menu */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 8, 0] }}>
          <Column style={{ padding: 10 }}>
            <Row
              stackOnMobile={false}
              style={{ flexWrap: "wrap", justifyContent: "center", fontSize: 14, lineHeight: 1.2 }}
            >
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://linear.app/docs"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  Docs
                </Link>
              </Text>
              <Text
                hidden={{ mobile: true }}
                style={{ flex: "none", padding: [5, 15], color: "#444444" }}
              >
                {"\u00a0•"}
              </Text>
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://linear.app/blog"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  {"\u00a0Blog"}
                </Link>
              </Text>
              <Text
                hidden={{ mobile: true }}
                style={{ flex: "none", padding: [5, 15], color: "#444444" }}
              >
                {"\u00a0•"}
              </Text>
              <Text style={{ flex: "none", padding: [5, 15] }}>
                <Link
                  href="https://linear.app/careers"
                  style={{ color: "#0068A5", textDecoration: "none" }}
                >
                  {"\u00a0Careers"}
                </Link>
              </Text>
            </Row>
          </Column>
        </Section>
        <Section style={{ backgroundColor: "#FFFFFF", padding: [0, 0, 36, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: MUTED,
              textAlign: "center",
              lineHeight: "140%",
            }}
          >
            You're receiving this because you use Linear.
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { ProductDigest };
})();

// main's examples/StripeReceipt.stories.tsx
//
// What the codemod reported:
// - line 38: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
export const stripe = (() => {
  // Stripe-style payment receipt — minimal, lots of whitespace, hairline dividers.
  // Line items are rendered as Row + Column (never <Table>) so they stay airy
  // instead of collapsing into a bordered spreadsheet.
  const INDIGO = "#635BFF";
  const INK = "#1A1F36";
  const MUTED = "#697386";
  const LINE = "#E3E8EE";
  const sans = {
    label: "Sans Serif",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  // One label/value line, separated from the next by a hairline drawn on the
  // Column's bottom border. Pass last=true to drop the divider on the final row.
  function lineRow(label: string, value: string, last = false) {
    const cell = {
      padding: "14px 0",
      borderBottomWidth: last ? "0px" : "1px",
      borderBottomStyle: "solid",
      borderBottomColor: LINE,
    } as const;
    return (
      <Section style={{ backgroundColor: "#FFFFFF" }}>
        <Row
          style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          mobile={{ border: { bottom: "none" } }}
        >
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>
              {label}
            </Paragraph>
          </Column>
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "right",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>{value}</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>
    );
  }

  function StripeReceipt() {
    return (
      <Email
        width={600}
        previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026."
        style={{ backgroundColor: "#F6F9FC", color: INK, fontFamily: sans.value }}
      >
        {/* Wordmark */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [44, 0, 0, 0] }}>
          <Heading
            level={4}
            style={{
              padding: 10,
              fontSize: 20,
              fontWeight: 700,
              color: INDIGO,
              textAlign: "left",
              lineHeight: "100%",
              letterSpacing: -0.2,
            }}
          >
            Acme
          </Heading>
        </Section>

        {/* Eyebrow + heading + meta */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [40, 0, 0, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
              textAlign: "left",
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            RECEIPT
          </Paragraph>
        </Section>
        <Section style={{ backgroundColor: "#FFFFFF", padding: [12, 0, 0, 0] }}>
          <Heading
            style={{
              padding: 10,
              fontSize: 28,
              fontWeight: 600,
              color: INK,
              textAlign: "left",
              lineHeight: "125%",
              letterSpacing: -0.56,
            }}
          >
            Receipt from Acme
          </Heading>
        </Section>
        <Section style={{ backgroundColor: "#FFFFFF", padding: [6, 0, 0, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 14,
              color: MUTED,
              textAlign: "left",
              lineHeight: "150%",
            }}
          >
            Receipt #2705 · Paid Jul 1, 2026
          </Paragraph>
        </Section>

        {/* Section divider before line items */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 4, 0] }}>
          <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
        </Section>

        {/* Line items — Row + Column with hairline dividers (never <Table>) */}
        {lineRow("Pro Plan (monthly)", "$25.00")}
        {lineRow("Additional seats × 3", "$36.00")}
        {lineRow("Usage overage", "$4.50", true)}

        {/* Section divider before total */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 0, 0] }}>
          <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
        </Section>

        {/* Total — emphasized, no divider */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
          <Row>
            <Column style={{ width: "50%" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 18,
                  fontWeight: 600,
                  color: INK,
                  textAlign: "left",
                  lineHeight: "120%",
                }}
              >
                Total
              </Heading>
            </Column>
            <Column style={{ width: "50%" }}>
              <Heading
                level={3}
                style={{
                  padding: 10,
                  fontSize: 22,
                  fontWeight: 700,
                  color: INK,
                  textAlign: "right",
                  lineHeight: "120%",
                  letterSpacing: -0.22,
                }}
              >
                $65.50
              </Heading>
            </Column>
          </Row>
        </Section>

        {/* CTA */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [36, 0, 0, 0] }}>
          <Column style={{ padding: 10, alignItems: "start" }}>
            <Button
              href="https://acme.com/invoices/2705.pdf"
              style={{
                backgroundColor: INDIGO,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 600,
                padding: "13px 24px",
                borderRadius: 8,
              }}
            >
              Download invoice
            </Button>
          </Column>
        </Section>

        {/* Footer */}
        <Section style={{ backgroundColor: "#FFFFFF", padding: [44, 0, 48, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: MUTED,
              textAlign: "left",
              lineHeight: "160%",
            }}
          >
            {"Questions about this receipt? Contact "}
            <Link href="mailto:support@acme.com">support@acme.com</Link>.
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { StripeReceipt };
})();

// main's examples/WarbyOrderShipped.stories.tsx
//
// What the codemod reported:
// - line 45: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
// - line 80: its html comes from an expression (variant): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
export const warby = (() => {
  // Warby-Parker-style "Your order has shipped" email.
  // Clean, modern, friendly — navy/blue palette, generous whitespace,
  // hairline dividers via the Column bottom border (no <Table> shorthand).
  const INK = "#2A2A2A"; // primary text
  const MUTED = "#767676"; // secondary text
  const NAVY = "#00263A"; // navy accent / wordmark
  const BLUE = "#3B5BDB"; // friendly CTA blue
  const LINE = "#EBEBEB"; // hairline divider
  const BG = "#F6F6F4"; // email background
  const CARD = "#FFFFFF"; // content rows

  const sans = {
    label: "Sans Serif",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  /**
   * One label/value (or product/price) line, separated by a hairline rule drawn
   * on the Column's bottom border. Called inline as `{lineRow(...)}` — Email only
   * recognizes <Row> children, so this must NOT be used as a <lineRow/> element.
   */
  function lineRow(label: string, value: string, last = false) {
    const cell = {
      padding: "14px 0",
      borderBottomWidth: last ? "0px" : "1px",
      borderBottomStyle: "solid",
      borderBottomColor: LINE,
    } as const;
    return (
      <Section style={{ backgroundColor: CARD }}>
        <Row
          style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          mobile={{ border: { bottom: "none" } }}
        >
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "140%" }}>
              {label}
            </Paragraph>
          </Column>
          <Column
            style={{ width: "50%", padding: "14px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph
              style={{
                padding: 10,
                fontSize: 14,
                color: INK,
                textAlign: "right",
                lineHeight: "140%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>{value}</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>
    );
  }

  /**
   * A product line-item: name + variant on the left, bold price on the right,
   * with a small muted sub-label under the name. Hairline via the Column border.
   */
  function productRow(name: string, variant: string, price: string, last = false) {
    const cell = {
      padding: "16px 0",
      borderBottomWidth: last ? "0px" : "1px",
      borderBottomStyle: "solid",
      borderBottomColor: LINE,
    } as const;
    return (
      <Section style={{ backgroundColor: CARD }}>
        <Row
          style={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          mobile={{ border: { bottom: "none" } }}
        >
          <Column
            style={{ width: "50%", padding: "16px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph style={{ padding: 10, fontSize: 15, color: INK, lineHeight: "150%" }}>
              <Span style={{ fontWeight: 700 }}>{name}</Span>
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 13, color: MUTED, lineHeight: "150%" }}>
              {variant}
            </Paragraph>
          </Column>
          <Column
            style={{ width: "50%", padding: "16px 0" }}
            mobile={{ border: { bottom: `${last ? "0px" : "1px"} solid ${LINE}` } }}
          >
            <Paragraph
              style={{
                padding: 10,
                fontSize: 15,
                color: INK,
                textAlign: "right",
                lineHeight: "150%",
              }}
            >
              <Span style={{ fontWeight: 700 }}>{price}</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>
    );
  }

  function WarbyOrderShipped() {
    return (
      <Email
        width={600}
        previewText="Good news, Alex — your order is on its way. 📦"
        style={{ backgroundColor: BG, color: INK, fontFamily: sans.value }}
      >
        {/* Brand wordmark */}
        <Section style={{ backgroundColor: CARD, padding: [36, 0, 28, 0] }}>
          <Heading
            level={2}
            style={{
              padding: 10,
              fontSize: 20,
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              lineHeight: "100%",
              letterSpacing: 3.6,
            }}
          >
            WARBY PARKER
          </Heading>
        </Section>

        {/* Hero lifestyle photo */}
        <Section style={{ backgroundColor: CARD }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Image
              src={
                "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
              }
              alt="A pair of eyeglasses resting on a clean surface"
            />
          </Column>
        </Section>

        {/* Eyebrow + headline */}
        <Section style={{ backgroundColor: CARD, padding: [40, 0, 0, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: BLUE,
              textAlign: "center",
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            SHIPPED
          </Paragraph>
        </Section>

        <Section style={{ backgroundColor: CARD, padding: [12, 0, 0, 0] }}>
          <Heading
            style={{
              padding: 10,
              fontSize: 30,
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              lineHeight: "124%",
            }}
          >
            Your order is on its way 📦
          </Heading>
        </Section>

        <Section style={{ backgroundColor: CARD, padding: [14, 0, 4, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 15,
              color: MUTED,
              textAlign: "center",
              lineHeight: "164%",
            }}
          >
            Hi Alex — your new frames have left our lab and are headed your way. We'll email you
            again the moment they land on your doorstep.
          </Paragraph>
        </Section>

        {/* Tracking summary — eyebrow */}
        <Section style={{ backgroundColor: CARD, padding: [32, 0, 4, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            TRACKING DETAILS
          </Paragraph>
        </Section>

        {/* Tracking detail rows (label / value, hairline divider via Column border) */}
        {lineRow("Carrier", "USPS Priority")}
        {lineRow("Tracking number", "9400 1234 5678 9012 3456")}
        {lineRow("Estimated delivery", "Mon, Jul 8", true)}

        {/* Track package CTA */}
        <Section style={{ backgroundColor: CARD, padding: [28, 0, 4, 0] }}>
          <Column style={{ padding: 10, alignItems: "center" }}>
            <Button
              href="https://tools.usps.com/go/TrackConfirmAction?tLabels=94001234567890123456"
              style={{
                width: "100%",
                backgroundColor: NAVY,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                padding: "15px 28px",
                borderRadius: 8,
              }}
            >
              Track package
            </Button>
          </Column>
        </Section>

        {/* In this order — eyebrow */}
        <Section style={{ backgroundColor: CARD, padding: [36, 0, 4, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
              lineHeight: "100%",
              letterSpacing: 0.72,
            }}
          >
            IN THIS ORDER
          </Paragraph>
        </Section>

        {/* Product line-items (name + variant / bold price, hairline divider) */}
        {productRow("Percey", "Whiskey Tortoise", "$145")}
        {productRow("Haskell", "Crystal", "$95", true)}

        {/* Order total */}
        {lineRow("Total", "$240", true)}

        {/* Help / footer */}
        <Section style={{ backgroundColor: CARD, padding: [28, 0, 40, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 14,
              color: MUTED,
              textAlign: "center",
              lineHeight: "164%",
            }}
          >
            {
              "Questions about your order? Our team is here to help — just reply to this email or visit the "
            }
            <Link href="https://www.warbyparker.com/help" style={{ color: "#3B5BDB" }}>
              Help Center
            </Link>
            .
          </Paragraph>
        </Section>

        <Section style={{ backgroundColor: BG, padding: [28, 0, 8, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: MUTED,
              textAlign: "center",
              lineHeight: "160%",
            }}
          >
            Warby Parker · 233 Spring Street, New York, NY 10013
          </Paragraph>
        </Section>

        <Section style={{ backgroundColor: BG, padding: [0, 0, 36, 0] }}>
          <Paragraph
            style={{
              padding: 10,
              fontSize: 12,
              color: MUTED,
              textAlign: "center",
              lineHeight: "160%",
            }}
          >
            <Link href="#" style={{ color: "#767676" }}>
              Unsubscribe
            </Link>
            {"  ·  "}
            <Link href="#" style={{ color: "#767676" }}>
              Privacy Policy
            </Link>
          </Paragraph>
        </Section>
      </Email>
    );
  }

  return { WarbyOrderShipped };
})();

// main's SpotifyWelcome.stories.tsx
//
// What the codemod reported:
// - line 31: its html comes from an expression (desc): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
// - line 42: today's draw this Image's 120px as 24% of its column, at most 124.8px: that's written out so it doesn't move (give it its width in px to draw it at that)
export const spotify = (() => {
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

  function SpotifyPremiumWelcome() {
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

  return { SpotifyPremiumWelcome };
})();
