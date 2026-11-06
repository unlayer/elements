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
  Social,
} from "../index";

// Reconstructed from the "fresh agent" Nike build — verbatim natural forms:
// full-width hero src string + width="100%", oversized fontSize="48px"
// fontWeight={800}, Social icons shorthand.
const BLACK = "#111111";
const WHITE = "#FFFFFF";
const helv = {
  label: "Helvetica",
  value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export function NikeDrop() {
  return (
    <Email backgroundColor={BLACK} contentWidth="600px" fontFamily={helv}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="28px 40px 4px 40px">
        <Column>
          <Heading headingType="h3" fontSize="22px" fontWeight={800} color={WHITE} textAlign="center">
            NIKE
          </Heading>
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="8px 0 0 0">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"
            alt="New sneaker drop"
            width="100%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="28px 40px 0 40px">
        <Column>
          <Heading
            headingType="h1"
            fontSize="48px"
            fontWeight={800}
            color={WHITE}
            textAlign="center"
            lineHeight="105%"
          >
            JUST DROPPED
          </Heading>
          <Paragraph
            html="The Air Max 2026. Limited stock. Move fast."
            fontSize="17px"
            color="#B3B3B3"
            textAlign="center"
            lineHeight="150%"
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="20px 40px 36px 40px">
        <Column>
          <Button
            href="https://nike.com/launch"
            backgroundColor={WHITE}
            color={BLACK}
            fontSize="18px"
            fontWeight={700}
            padding="16px 40px"
            borderRadius="40px"
            textAlign="center"
          >
            Shop now
          </Button>
        </Column>
      </Row>

      {/* Social footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="8px 40px 40px 40px">
        <Column>
          <Social
            icons={[
              { name: "Instagram", url: "https://instagram.com/nike" },
              { name: "Twitter", url: "https://twitter.com/nike" },
              { name: "Facebook", url: "https://facebook.com/nike" },
            ]}
            iconType="circle"
            iconSize={36}
            spacing={12}
            align="center"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof NikeDrop> = {
  title: "Agent Examples/Nike · Sneaker Drop",
  component: NikeDrop,
};
export default meta;
export const Default: StoryObj<typeof NikeDrop> = {};
