/**
 * main's "Airbnb · Reservation Confirmation" example, and the same design written with the new
 * components (main's layout read as StripeReceipt.tsx says).
 *
 * One difference is main's: its photo, 100% wide, comes out 520px wide and centered. main takes the
 * Row's side padding (40px each) off an image's width, though on desktop that padding is outside the
 * content and the text keeps the full width. `next` draws it at the column's 580px, so what's below it
 * sits 40px lower; `nextAsMain` draws it as main does.
 */
import { AirbnbConfirmation } from "../../examples/AirbnbConfirmation.stories";
import { Button, Email, Heading, Image, Link, Paragraph, Section, Span } from "../index";
import { lineRow } from "./lineRow";

const RAUSCH = "#FF385C";
const INK = "#222222";
const MUTED = "#717171";
const LINE = "#EBEBEB";
const WHITE = "#FFFFFF";

const lines = { label: MUTED, value: INK, line: LINE };

export const main = <AirbnbConfirmation />;

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

export const next = design(false);
export const nextAsMain = design(true);
export const quirks = "its photo, 100% wide, is at most 520px (its column less the Row's 40px side padding), centered, instead of the column's 580px.";
