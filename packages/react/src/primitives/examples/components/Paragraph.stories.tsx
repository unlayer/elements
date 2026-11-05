import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Heading, LineBreak, Link, MergeTag, Paragraph, Section, Span, Text } from "../../index";
import { BRAND, FONT, INK, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Paragraph",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Text, from `@unlayer/react-elements`: `Paragraph` and `Text` hold it; inside them `Span` styles a run, `Link` links one, `LineBreak` breaks the line and `MergeTag` is filled in by the sender. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** Headings and text: `Span` styles a run, `Link` links one, `LineBreak` breaks the line, `MergeTag` is filled in by the sender. */
export const Runs = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 28 }}>Hello, <MergeTag name="first_name" /></Heading>
      <Heading level={2} style={{ fontSize: 18, color: BRAND }}>Your plan renews soon</Heading>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.6 }}>
        Your <Span style={{ fontWeight: 700 }}>Pro plan</Span> renews on <Span style={{ color: BRAND }}>March 3</Span>.<LineBreak />
        Read <Link href="https://example.com/billing" style={{ color: BRAND }}>how billing works</Link>.
      </Paragraph>
    </Section>
  </Root>
));

/** A paragraph's size, line height, color and spacing are in `style`, and `maxWidth` holds it to a width. */
export const Styles = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Paragraph style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND }}>A small label</Paragraph>
      <Paragraph style={{ fontSize: 22, lineHeight: 1.35 }}>A larger first line, to open an article with.</Paragraph>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.7, color: MUTED }}>Body text in a softer color, with more room between its lines so that a longer paragraph stays easy to read from start to end.</Paragraph>
      <Paragraph style={{ fontSize: 13, fontStyle: "italic", color: MUTED }}>A small note, in italics.</Paragraph>
      <Paragraph style={{ fontSize: 15, maxWidth: 280 }}>This one is held to 280px, however wide the space around it is.</Paragraph>
    </Section>
  </Root>
));

/** `textAlign` puts the lines on the left, in the center, on the right, or out to both sides. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Paragraph style={{ fontSize: 15, textAlign: "left" }}>On the left, where text starts by default.</Paragraph>
      <Paragraph style={{ fontSize: 15, textAlign: "center" }}>In the center, for a short line under a heading.</Paragraph>
      <Paragraph style={{ fontSize: 15, textAlign: "right" }}>On the right, for a date or a signature.</Paragraph>
      <Paragraph style={{ fontSize: 15, textAlign: "justify" }}>Justified, out to both sides: every line but the last is stretched to the full width, which suits a column of text that runs for several lines.</Paragraph>
    </Section>
  </Root>
));

/** A `Span` styles a run of text: its weight, color and decoration, a highlight behind it, or raised and lowered. */
export const Spans = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
        Text can be <Span style={{ fontWeight: 700 }}>bold</Span>, <Span style={{ fontStyle: "italic" }}>italic</Span>, <Span style={{ color: BRAND }}>colored</Span>, <Span style={{ textDecoration: "underline" }}>underlined</Span>, <Span style={{ textDecoration: "line-through" }}>struck through</Span> or <Span style={{ backgroundColor: "#FEF3C7" }}>highlighted</Span>.
      </Paragraph>
      <Paragraph style={{ fontSize: 15 }}>
        Acme<Span style={{ verticalAlign: "super", fontSize: 11 }}>®</Span> measures CO<Span style={{ verticalAlign: "sub", fontSize: 11 }}>2</Span> in the air.
      </Paragraph>
      <Paragraph>
        <Span style={{ fontSize: 28, fontWeight: 700 }}>$48</Span>
        <Span style={{ fontSize: 13, color: MUTED }}> a month</Span>
      </Paragraph>
    </Section>
  </Root>
));

/** A `Link`'s color and underline are in `style`, its colors under the pointer in `hover`; `href` takes a mail or phone link, or a target. */
export const Links = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Paragraph style={{ fontSize: 15 }}>With nothing set: <Link href="https://example.com">underlined, in blue</Link>.</Paragraph>
      <Paragraph style={{ fontSize: 15 }}>In a color: <Link href="https://example.com" style={{ color: BRAND }}>the brand's</Link>.</Paragraph>
      <Paragraph style={{ fontSize: 15 }}>
        Underlined under the pointer only: <Link href="https://example.com" style={{ color: BRAND, textDecoration: "none" }} hover={{ textDecoration: "underline" }}>point at this</Link>.
      </Paragraph>
      <Paragraph style={{ fontSize: 15 }}>
        Highlighted under the pointer: <Link href="https://example.com" style={{ color: BRAND }} hover={{ color: "#FFFFFF", backgroundColor: BRAND }}>point at this</Link>.
      </Paragraph>
      <Paragraph style={{ fontSize: 15 }}>
        <Link href="mailto:hello@example.com" title="Write to us">Write to us</Link> or <Link href="tel:+15550100">call us</Link>.
      </Paragraph>
      <Paragraph style={{ fontSize: 15 }}>
        <Link href={{ href: "https://example.com/terms", target: "_blank" }} aria-label="Our terms, in a new window">In a new window</Link>.
      </Paragraph>
    </Section>
  </Root>
));

/** `Text` is a block with no meaning of its own, and a box like any: here a note, and an address of `LineBreak`s and `MergeTag`s. */
export const TextBlocks = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Text style={{ padding: 16, backgroundColor: "#ECFDF5", border: { left: `3px solid ${BRAND}` }, fontSize: 14, lineHeight: 1.6 }}>
        <Span style={{ fontWeight: 700 }}>Good to know:</Span> your files are kept for 30 days after you cancel.
      </Text>
      <Text style={{ padding: 16, backgroundColor: WASH, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}>
        <Span style={{ fontWeight: 700 }}>Shipping to</Span>
        <LineBreak />
        <MergeTag name="full_name" />
        <LineBreak />
        <MergeTag name="street" />, <MergeTag name="city" />
      </Text>
    </Section>
  </Root>
));
