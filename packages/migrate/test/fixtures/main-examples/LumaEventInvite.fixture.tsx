import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Button,
  Image,
  Divider,
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
    <Email backgroundColor="#F4F4F7" contentWidth="600px" fontFamily={display}>
      {/* Brand wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="28px 40px 16px 40px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="15px"
            fontWeight={800}
            color={INK}
            textAlign="left"
            letterSpacing="-0.2px"
          >
            ◆ luma
          </Heading>
        </Column>
      </Row>

      {/* Full-width hero image */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="0px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
            altText="Rooftop launch party at golden hour"
            width="600px"
            maxWidth="100%"
          />
        </Column>
      </Row>

      {/* Pill + title */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="32px 40px 4px 40px">
        <Column>
          <Paragraph
            html="<b>YOU'RE INVITED</b>"
            fontSize="12px"
            color={ACCENT}
            textAlign="left"
            letterSpacing="1.4px"
          />
          <Heading
            headingType="h1"
            fontSize="40px"
            fontWeight={800}
            color={INK}
            textAlign="left"
            lineHeight="108%"
            letterSpacing="-1.2px"
          >
            Neon Nights · Summer Launch
          </Heading>
        </Column>
      </Row>

      {/* Date / time / location detail block */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="14px 40px 0 40px">
        <Column>
          <Paragraph
            html="🗓️ &nbsp;<b>Thursday, July 9, 2026</b> &nbsp;·&nbsp; 7:00 – 11:00 PM PDT"
            fontSize="15px"
            color={INK}
            textAlign="left"
            lineHeight="170%"
          />
          <Paragraph
            html="📍 &nbsp;<b>The Skydeck</b> — 450 Market St, San Francisco, CA"
            fontSize="15px"
            color={SUBTLE}
            textAlign="left"
            lineHeight="170%"
          />
        </Column>
      </Row>

      {/* RSVP primary CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="22px 40px 6px 40px">
        <Column>
          <Button
            href="https://lu.ma/neon-nights/rsvp"
            backgroundColor={ACCENT}
            color="#FFFFFF"
            fontSize="16px"
            fontWeight={700}
            padding="15px 30px"
            borderRadius="10px"
            textAlign="left"
          >
            RSVP — Save my spot
          </Button>
        </Column>
      </Row>

      {/* Secondary add-to-calendar link */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="0 40px 24px 40px">
        <Column>
          <Paragraph
            html="<a href='https://lu.ma/neon-nights/calendar' style='color:#0B0B0F;text-decoration:underline'>+ Add to calendar</a>"
            fontSize="14px"
            color={INK}
            textAlign="left"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="0 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Hosts — avatars + names */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="20px 40px 6px 40px">
        <Column>
          <Paragraph
            html="<b>HOSTED BY</b>"
            fontSize="11px"
            color={SUBTLE}
            textAlign="left"
            letterSpacing="1.1px"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={CARD} padding="0 40px 28px 40px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
            altText="Maya Okonkwo"
            width="48px"
            textAlign="left"
          />
          <Paragraph html="<b>Maya Okonkwo</b>" fontSize="14px" color={INK} textAlign="left" />
          <Paragraph html="Founder, Lumen" fontSize="13px" color={SUBTLE} textAlign="left" />
        </Column>
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
            altText="Theo Park"
            width="48px"
            textAlign="left"
          />
          <Paragraph html="<b>Theo Park</b>" fontSize="14px" color={INK} textAlign="left" />
          <Paragraph html="Head of Community" fontSize="13px" color={SUBTLE} textAlign="left" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="18px 40px 40px 40px">
        <Column>
          <Paragraph
            html="You're receiving this because you joined the Lumen waitlist. <a href='https://lu.ma/settings'>Manage notifications</a>."
            fontSize="12px"
            color={SUBTLE}
            textAlign="center"
            lineHeight="160%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof LumaEventInvite> = {
  title: "Agent Examples/Luma · Event Invite",
  component: LumaEventInvite,
};
export default meta;
export const Default: StoryObj<typeof LumaEventInvite> = {};
