import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Image,
  Heading,
  Paragraph,
  Button,
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
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="0 40px">
      <Column {...cell}>
        <Paragraph html={label} fontSize="14px" color={MUTED} lineHeight="140%" />
      </Column>
      <Column {...cell}>
        <Paragraph html={`<b>${value}</b>`} fontSize="14px" color={INK} textAlign="right" lineHeight="140%" />
      </Column>
    </Row>
  );
}

export function AirbnbConfirmation() {
  return (
    <Email backgroundColor="#F7F7F7" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 12px 40px">
        <Column>
          <Heading headingType="h2" fontSize="22px" fontWeight={700} color={RAUSCH} textAlign="left">
            airbnb
          </Heading>
        </Column>
      </Row>

      {/* Hero photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="4px 40px 0 40px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"
            alt="Oceanview Villa"
            width="100%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 4px 40px">
        <Column>
          <Heading headingType="h1" fontSize="26px" fontWeight={700} color={INK} lineHeight="130%">
            You're confirmed, Maya 🎉
          </Heading>
          <Paragraph
            html="Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you."
            fontSize="16px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Reservation summary — clean label/value, no spreadsheet borders */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 40px 2px 40px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="12px"
            fontWeight={700}
            color={MUTED}
            letterSpacing="0.06em"
          >
            RESERVATION
          </Heading>
        </Column>
      </Row>
      {detailRow("Property", "Oceanview Villa · Malibu, CA")}
      {detailRow("Check-in", "Fri, Jul 18 · 3:00 PM")}
      {detailRow("Check-out", "Mon, Jul 21 · 11:00 AM")}
      {detailRow("Guests", "2 adults")}
      {detailRow("Total", "$1,248.00", true)}

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 32px 40px">
        <Column>
          <Button
            href="https://airbnb.com/trips"
            backgroundColor={RAUSCH}
            color="#FFFFFF"
            fontSize="16px"
            fontWeight={700}
            padding="15px 28px"
            borderRadius="10px"
            width="100%"
            textAlign="center"
          >
            View itinerary
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>."
            fontSize="13px"
            color={MUTED}
            textAlign="center"
            lineHeight="150%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof AirbnbConfirmation> = {
  title: "Agent Examples/Airbnb · Reservation Confirmation",
  component: AirbnbConfirmation,
};
export default meta;
export const Default: StoryObj<typeof AirbnbConfirmation> = {};
