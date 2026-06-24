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
      <Heading headingType="h3" fontSize="17px" fontWeight={700} color={WHITE} lineHeight="130%">
        {`✓  ${title}`}
      </Heading>
      <Paragraph html={desc} fontSize="14px" color={MUTED} lineHeight="155%" />
    </Column>
  );
}

export function SpotifyPremiumWelcome() {
  return (
    <Email backgroundColor={BG} contentWidth="600px" fontFamily={sans}>
      {/* Logo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="32px 40px 18px 40px">
        <Column>
          <Image
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
            alt="Spotify"
            width="120px"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Hero image */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="0px 0px 0px 0px">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80"
            alt="Live music"
            width="100%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Eyebrow + headline + subhead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="36px 40px 4px 40px">
        <Column>
          <Heading
            headingType="h4"
            fontSize="12px"
            fontWeight={700}
            color={GREEN}
            letterSpacing="0.14em"
          >
            SPOTIFY PREMIUM
          </Heading>
          <Heading headingType="h1" fontSize="42px" fontWeight={800} color={WHITE} lineHeight="106%">
            Premium is yours. Welcome.
          </Heading>
          <Paragraph
            html="No ads. No limits. Just the music you love — now in lossless quality, online or off."
            fontSize="17px"
            color={MUTED}
            lineHeight="155%"
          />
        </Column>
      </Row>

      {/* Primary CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="22px 40px 36px 40px">
        <Column>
          <Button
            href="https://open.spotify.com"
            backgroundColor={GREEN}
            color="#000000"
            fontSize="16px"
            fontWeight={700}
            borderRadius="500px"
            padding="16px 40px"
            textAlign="left"
          >
            Start listening
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="0px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Benefits */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="32px 40px 6px 40px">
        <Column>
          <Heading headingType="h4" fontSize="12px" fontWeight={700} color={MUTED} letterSpacing="0.12em">
            WHAT'S INCLUDED
          </Heading>
        </Column>
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BG} padding="14px 40px 10px 40px">
        {benefit("Ad-free music", "Uninterrupted listening — no ad breaks, ever.")}
        {benefit("Lossless audio", "Hear every detail in up to 24-bit quality.")}
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BG} padding="10px 40px 36px 40px">
        {benefit("Offline listening", "Download your favorites and play anywhere.")}
        {benefit("Full control", "Pick any track, skip freely, repeat at will.")}
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="8px 40px 40px 40px">
        <Column>
          <Paragraph
            html="You're receiving this because you subscribed to Spotify Premium."
            fontSize="12px"
            color="#7A7A7A"
            textAlign="center"
            lineHeight="150%"
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
