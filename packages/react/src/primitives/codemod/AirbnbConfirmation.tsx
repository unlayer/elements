// main's examples/AirbnbConfirmation.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 35: its html comes from an expression (label): it's written as text, so markup in it would show; write that with Span, Link and LineBreak
import {
  Button,
  Column,
  Email,
  Heading,
  Image,
  Link,
  Paragraph,
  Row,
  Section,
  Span,
} from "../index";

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

export function AirbnbConfirmation() {
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
