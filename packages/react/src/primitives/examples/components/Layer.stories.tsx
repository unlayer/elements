import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, Layer, Paragraph, Section, Text } from "../../index";
import { BRAND, FONT, landscape, picture } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Layer",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Its children over each other, in one box: an image with words on it. In an email, that's an `Image` with one child over it. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** Words and a button over a picture: `height` is the box's, and the picture covers it. */
export const WordsOverAPicture = story((Root) => (
  <Root width={560} style={{ color: "#FFFFFF", fontFamily: FONT }}>
    <Section>
      <Layer style={{ height: 280, alignItems: "center" }}>
        <Image src={landscape(1120, 560)} alt="Hills under a sun" style={{ width: "100%" }} />
        <Column style={{ padding: [0, 32], gap: 12, alignItems: "start" }}>
          <Heading level={1} style={{ fontSize: 32 }}>Into the hills</Heading>
          <Paragraph style={{ fontSize: 15 }}>Trails for every weekend of the season.</Paragraph>
          <Button href="https://example.com/trails" style={{ backgroundColor: "#FFFFFF", color: BRAND, borderRadius: 6 }}>Find a trail</Button>
        </Column>
      </Layer>
    </Section>
  </Root>
));

/** A caption along the bottom, on a band of its own, with the Layer's corners rounded. */
export const Caption = story((Root) => (
  <Root width={560} style={{ fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Layer style={{ height: 200, alignItems: "end", borderRadius: 12 }}>
        <Image src={landscape(1024, 400)} alt="Hills under a sun" style={{ width: "100%" }} />
        <Paragraph style={{ padding: [10, 16], backgroundColor: "#111827", color: "#F9FAFB", fontSize: 14 }}>Photographed in the north, last spring</Paragraph>
      </Layer>
    </Section>
  </Root>
));

/** `alignItems` is where its children sit in its height: at the top, in the middle, at the bottom. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: "#FFFFFF", fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Layer style={{ height: 120, alignItems: "start" }}>
        <Image src={picture("#334E68", 1024, 240)} alt="A flat blue" style={{ width: "100%" }} />
        <Text style={{ padding: 12, fontSize: 15, textAlign: "center" }}>At the top</Text>
      </Layer>
      <Layer style={{ height: 120, alignItems: "center" }}>
        <Image src={picture("#486581", 1024, 240)} alt="A flat blue" style={{ width: "100%" }} />
        <Text style={{ padding: 12, fontSize: 15, textAlign: "center" }}>In the middle</Text>
      </Layer>
      <Layer style={{ height: 120, alignItems: "end" }}>
        <Image src={picture("#627D98", 1024, 240)} alt="A flat blue" style={{ width: "100%" }} />
        <Text style={{ padding: 12, fontSize: 15, textAlign: "center" }}>At the bottom</Text>
      </Layer>
    </Section>
  </Root>
));

/** `mobile` has the text's size and alignment on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: "#FFFFFF", fontFamily: FONT }}>
    <Section>
      <Layer style={{ height: 240, alignItems: "center", fontSize: 22 }} mobile={{ fontSize: 16, textAlign: "center" }}>
        <Image src={landscape(1120, 480)} alt="Hills under a sun" style={{ width: "100%" }} />
        <Text style={{ padding: [0, 32], fontWeight: 700 }}>Smaller on phones</Text>
      </Layer>
    </Section>
  </Root>
));
