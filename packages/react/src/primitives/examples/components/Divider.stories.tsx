import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Divider, Paragraph, Section } from "../../index";
import { BRAND, FONT, INK, MUTED } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Divider",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A horizontal line: `borderTop` draws it, `width` is how long it is, `padding` the space around it. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** With nothing set: a thin gray line, the whole width. */
export const Default = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Paragraph style={{ fontSize: 15 }}>Above the line.</Paragraph>
      <Divider />
      <Paragraph style={{ fontSize: 15 }}>Below the line.</Paragraph>
    </Section>
  </Root>
));

/** `borderTop` is written as CSS writes it, or as `{ width, style, color }`: solid, dashed, dotted, heavy, in a color. */
export const Lines = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Divider style={{ borderTop: "1px solid #9AA5B1" }} />
      <Divider style={{ borderTop: "1px dashed #9AA5B1" }} />
      <Divider style={{ borderTop: "2px dotted #9AA5B1" }} />
      <Divider style={{ borderTop: { width: 4, style: "solid", color: BRAND } }} />
    </Section>
  </Root>
));

/** `width` makes it shorter than its place, in px or as a share. */
export const Widths = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Divider style={{ borderTop: `2px solid ${BRAND}`, width: "80%" }} />
      <Divider style={{ borderTop: `2px solid ${BRAND}`, width: "50%" }} />
      <Divider style={{ borderTop: `2px solid ${BRAND}`, width: 80 }} />
    </Section>
  </Root>
));

/** `padding` is the space around the line, and `mobile` has its width and padding on phones. */
export const Spacing = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Paragraph style={{ fontSize: 15, color: MUTED }}>Space comes from the divider's own padding here.</Paragraph>
      <Divider style={{ borderTop: "1px solid #9AA5B1", padding: [24, 0] }} />
      <Paragraph style={{ fontSize: 15, color: MUTED }}>On phones, the one below runs the whole width, with less space.</Paragraph>
      <Divider style={{ borderTop: `2px solid ${BRAND}`, width: "50%", padding: [32, 0] }} mobile={{ width: "100%", padding: [16, 0] }} />
      <Paragraph style={{ fontSize: 15, color: MUTED }}>And the last line of text.</Paragraph>
    </Section>
  </Root>
));
