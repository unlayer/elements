import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Heading, Paragraph, Section } from "../../index";
import { BRAND, FONT, INK, LINE, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Section",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A band across the whole window, directly in an Email or a Page: its background spans the window, and its children are stacked at the content width. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** Each `Section`'s background reaches the window's edges, whatever the template's width. */
export const Bands = story((Root) => (
  <Root width={400} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: BRAND, color: "#FFFFFF", padding: [20, 24] }}>
      <Heading level={2} style={{ fontSize: 20 }}>A band across the window</Heading>
    </Section>
    <Section style={{ padding: [20, 24] }}>
      <Paragraph style={{ fontSize: 15 }}>The text stays at the content width, 400px here.</Paragraph>
    </Section>
    <Section style={{ backgroundColor: WASH, padding: [20, 24] }}>
      <Paragraph style={{ fontSize: 15, color: MUTED }}>Another band, in another color.</Paragraph>
    </Section>
  </Root>
));

/** `padding` is the space inside the band, and `gap` the space between what it holds. */
export const Spacing = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: WASH, padding: [40, 24], gap: 24 }}>
      <Heading level={3} style={{ fontSize: 18 }}>More padding, a wider gap</Heading>
      <Paragraph style={{ fontSize: 15 }}>24px under the heading.</Paragraph>
    </Section>
    <Section style={{ padding: [8, 24], gap: 4 }}>
      <Heading level={3} style={{ fontSize: 18 }}>Less padding, a smaller gap</Heading>
      <Paragraph style={{ fontSize: 15 }}>4px under the heading.</Paragraph>
    </Section>
  </Root>
));

/** `alignItems` says where what it holds sits across the width. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 16, alignItems: "start" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }}>On the left</Button>
    </Section>
    <Section style={{ padding: 16, alignItems: "center", backgroundColor: WASH }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }}>In the center</Button>
    </Section>
    <Section style={{ padding: 16, alignItems: "end" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }}>On the right</Button>
    </Section>
  </Root>
));

/** `border` draws a line on any side of the band: an accent on top, a hairline below. */
export const Borders = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, border: { top: `4px solid ${BRAND}` } }}>
      <Paragraph style={{ fontSize: 15 }}>An accent along the top.</Paragraph>
    </Section>
    <Section style={{ padding: 24, border: { bottom: LINE } }}>
      <Paragraph style={{ fontSize: 15 }}>A hairline along the bottom.</Paragraph>
    </Section>
  </Root>
));

/** A section's text styles are inherited by what it holds, so a dark band needs no color on each line. */
export const InheritedText = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: INK, color: "#FFFFFF", padding: [32, 24], gap: 8, textAlign: "center", fontFamily: "Georgia, serif" }}>
      <Heading level={2} style={{ fontSize: 26 }}>White, centered, in a serif</Heading>
      <Paragraph style={{ fontSize: 15 }}>All of it from the Section's own style.</Paragraph>
    </Section>
  </Root>
));

/** `mobile` has its padding, gap and text on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: WASH, padding: [48, 40], gap: 24, fontSize: 18 }} mobile={{ padding: [20, 16], gap: 8, fontSize: 15, textAlign: "center" }}>
      <Paragraph>Roomy on desktop.</Paragraph>
      <Paragraph>Tighter and centered on phones.</Paragraph>
    </Section>
  </Root>
));
