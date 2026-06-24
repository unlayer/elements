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
  Divider,
  Table,
} from "../index";

// Reconstructed from the "fresh agent" Airbnb build — verbatim natural forms:
// string image src + width="600px", fontFamily object, numeric fontWeight,
// Table headers/data shorthand, Button width="100%".
const RAUSCH = "#FF5A5F";
const INK = "#222222";
const MUTED = "#717171";
const LINE = "#EBEBEB";
const sans = {
  label: "Circular",
  value:
    "Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function AirbnbConfirmation() {
  return (
    <Email backgroundColor="#F7F7F7" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 8px 40px">
        <Column>
          <Heading headingType="h2" fontSize="22px" fontWeight={700} color={RAUSCH} textAlign="left">
            airbnb
          </Heading>
        </Column>
      </Row>

      {/* Hero photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 40px 0 40px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"
            alt="Oceanview Villa"
            width="520px"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 4px 40px">
        <Column>
          <Heading headingType="h1" fontSize="28px" fontWeight={700} color={INK} lineHeight="130%">
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

      {/* Reservation summary */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 40px 8px 40px">
        <Column>
          <Table
            headers={["Reservation", "Details"]}
            data={[
              ["Property", "Oceanview Villa · Malibu, CA"],
              ["Check-in", "Fri, Jul 18 · 3:00 PM"],
              ["Check-out", "Mon, Jul 21 · 11:00 AM"],
              ["Guests", "2 adults"],
              ["Total", "$1,248.00"],
            ]}
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 40px 32px 40px">
        <Column>
          <Button
            href="https://airbnb.com/trips"
            backgroundColor={RAUSCH}
            color="#FFFFFF"
            fontSize="16px"
            fontWeight={700}
            padding="14px 28px"
            borderRadius="8px"
            width="100%"
            textAlign="center"
          >
            View itinerary
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 40px 40px 40px">
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
