import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Heading, Link, MergeTag, Paragraph, Section } from "../../index";
import { BRAND, FONT, INK, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Heading",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A heading, from `level={1}` to `level={6}`, with its size, color and box in `style`. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** The six levels, each with its size set in `style`. */
export const Levels = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 36 }}>Level 1, the page's title</Heading>
      <Heading level={2} style={{ fontSize: 28 }}>Level 2, a section</Heading>
      <Heading level={3} style={{ fontSize: 22 }}>Level 3, a part of it</Heading>
      <Heading level={4} style={{ fontSize: 18 }}>Level 4, a card's title</Heading>
      <Heading level={5} style={{ fontSize: 16 }}>Level 5, a small title</Heading>
      <Heading level={6} style={{ fontSize: 14 }}>Level 6, a label</Heading>
    </Section>
  </Root>
));

/** A color, a lighter weight, tight spacing, capitals, a decoration: all in `style`. */
export const Styles = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Heading level={2} style={{ fontSize: 28, color: BRAND }}>In the brand's color</Heading>
      <Heading level={2} style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>Large and tight</Heading>
      <Heading level={2} style={{ fontSize: 28, fontWeight: 400 }}>A lighter weight</Heading>
      <Heading level={2} style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: MUTED }}>Small capitals</Heading>
      <Heading level={2} style={{ fontSize: 24, fontFamily: "Georgia, serif", fontStyle: "italic" }}>In another font</Heading>
      <Heading level={2} style={{ fontSize: 22, textDecoration: "underline" }}>Underlined</Heading>
    </Section>
  </Root>
));

/** `textAlign` puts it on either side or in the center, and `maxWidth` keeps it from running the whole width. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Heading level={2} style={{ fontSize: 22, textAlign: "left" }}>On the left</Heading>
      <Heading level={2} style={{ fontSize: 22, textAlign: "center" }}>In the center</Heading>
      <Heading level={2} style={{ fontSize: 22, textAlign: "right" }}>On the right</Heading>
      <Heading level={2} style={{ fontSize: 22, maxWidth: 260 }}>A long heading held to 260px, so that it wraps</Heading>
    </Section>
  </Root>
));

/** A heading holds what text holds: a `Link`, a `MergeTag`. */
export const LinksAndMergeTags = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Heading level={2} style={{ fontSize: 26 }}>Welcome back, <MergeTag name="first_name" /></Heading>
      <Heading level={2} style={{ fontSize: 26 }}>
        <Link href="https://example.com/launch" style={{ color: BRAND, textDecoration: "none" }} hover={{ textDecoration: "underline" }}>A heading that's a link</Link>
      </Heading>
    </Section>
  </Root>
));

/** A heading is a box too: a background, padding, a line under it, round corners. */
export const Boxes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Heading level={3} style={{ fontSize: 18, padding: [12, 16], backgroundColor: WASH, borderRadius: 6 }}>On a background</Heading>
      <Heading level={3} style={{ fontSize: 18, padding: [0, 0, 8, 0], border: { bottom: `2px solid ${BRAND}` } }}>With a line under it</Heading>
      <Heading level={3} style={{ fontSize: 18, padding: [10, 16], backgroundColor: BRAND, color: "#FFFFFF", textAlign: "center" }}>A band with its text in the center</Heading>
    </Section>
  </Root>
));

/** `mobile` has its size, alignment and padding on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 40 }} mobile={{ fontSize: 26, textAlign: "center" }}>Large on desktop, smaller and centered on phones</Heading>
      <Paragraph style={{ fontSize: 15, color: MUTED }} mobile={{ textAlign: "center" }}>The text under it follows.</Paragraph>
    </Section>
  </Root>
));
