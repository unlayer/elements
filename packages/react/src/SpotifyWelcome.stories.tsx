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
} from "./index";

// Spotify brand (from spotify.com): green #1DB954, near-black #191414, white.
const GREEN = "#1DB954";
const BLACK = "#191414";
const WHITE = "#FFFFFF";
const MUTED = "#B3B3B3";
const sans = {
  label: "Circular",
  value: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export function SpotifyPremiumWelcome() {
  return (
    <Email backgroundColor={BLACK} contentWidth="600px" fontFamily={sans}>
      {/* Logo header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="32px 40px 16px 40px">
        <Column>
          <Image
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
            alt="Spotify"
            width="132px"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="24px 40px 8px 40px">
        <Column>
          <Heading headingType="h1" fontSize="40px" fontWeight={700} color={WHITE} lineHeight="115%">
            Premium is yours. Welcome.
          </Heading>
          <Paragraph
            html="No ads. No limits. Just the music you love — now in lossless quality, online or off."
            fontSize="17px"
            color={MUTED}
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* Primary CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="16px 40px 32px 40px">
        <Column>
          <Button
            href="https://open.spotify.com"
            backgroundColor={GREEN}
            color={BLACK}
            fontSize="16px"
            fontWeight={700}
            borderRadius="500px"
            padding="16px 36px"
            textAlign="left"
          >
            Start listening
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="0px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor="#2A2A2A" borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Benefits grid 2x2 */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BLACK} padding="28px 40px 8px 40px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Ad-free music</Heading>
          <Paragraph html="Uninterrupted listening — no ad breaks, ever." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Lossless audio</Heading>
          <Paragraph html="Hear every detail in up to 24-bit quality." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BLACK} padding="8px 40px 32px 40px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Offline listening</Heading>
          <Paragraph html="Download your favorites and play anywhere." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Full control</Heading>
          <Paragraph html="Pick any track, skip freely, repeat at will." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="24px 40px 40px 40px">
        <Column>
          <Paragraph
            html="You're receiving this because you subscribed to Spotify Premium."
            fontSize="12px"
            color="#7A7A7A"
            textAlign="center"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof SpotifyPremiumWelcome> = {
  title: "Examples/Spotify Premium Welcome",
  component: SpotifyPremiumWelcome,
};
export default meta;

export const Default: StoryObj<typeof SpotifyPremiumWelcome> = {};
