import type { Meta } from "@storybook/react-vite";
import { args, argTypes, showing, type Args } from "../../../compat/SideBySide";
import { Button, Column, Email, Heading, Link, Paragraph, Section } from "../../index";
import { BRAND, FONT, INK, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Email",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An email, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template.",
      },
    },
  },
};
export default meta;

/** `width` is the content's: the window around it takes the root's background. */
export const Width = showing(
  "Email",
  <Email width={420} style={{ backgroundColor: WASH, color: INK, fontFamily: FONT }}>
    <Column style={{ padding: 24, gap: 8, backgroundColor: "#FFFFFF" }}>
      <Heading level={2} style={{ fontSize: 20 }}>420px wide</Heading>
      <Paragraph style={{ fontSize: 15 }}>The default is 600px. The window around it is the Email's own background.</Paragraph>
    </Column>
  </Email>
);

/** Text styles on the root are inherited by everything in it: its color, font, size, line height and alignment. */
export const InheritedText = showing(
  "Email",
  <Email width={560} style={{ backgroundColor: "#FFFBEB", color: "#78350F", fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.7, textAlign: "center" }} mobile={{ fontSize: 15 }}>
    <Section style={{ padding: 32, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 30 }}>From the root's style</Heading>
      <Paragraph>This text sets nothing of its own: its color, its font, its size and its alignment are all the Email's.</Paragraph>
      <Paragraph>
        A <Link href="https://example.com" style={{ color: "#B45309" }}>link</Link> sets only its color.
      </Paragraph>
    </Section>
  </Email>
);

/** `gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle. */
export const GapAndAlignment = showing(
  "Email",
  <Email width={560} style={{ backgroundColor: WASH, color: INK, fontFamily: FONT, gap: 16, alignItems: "center", textAlign: "center" }}>
    <Heading level={2} style={{ fontSize: 20, padding: [24, 0, 0, 0] }}>16px between each</Heading>
    <Column style={{ width: 360, padding: 20, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
      <Paragraph style={{ fontSize: 15 }}>A card.</Paragraph>
    </Column>
    <Column style={{ width: 360, padding: 20, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
      <Paragraph style={{ fontSize: 15 }}>Another card.</Paragraph>
    </Column>
    <Button href="https://example.com" style={{ backgroundColor: BRAND, borderRadius: 6 }}>And a button</Button>
    <Paragraph style={{ fontSize: 12, color: MUTED, padding: [0, 0, 24, 0] }}>Sent by Acme.</Paragraph>
  </Email>
);

/** `previewText` shows after the subject in an inbox, and `title` and `lang` describe the document: none shows in the email. */
export const PreviewTextAndTitle = showing(
  "Email",
  <Email width={560} previewText="Your receipt is inside, and a note about shipping" title="Your receipt" lang="en" style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 8 }}>
      <Heading level={2} style={{ fontSize: 20 }}>Nothing here shows the settings</Heading>
      <Paragraph style={{ fontSize: 15, color: MUTED }}>An inbox shows the preview text after the subject; the email itself doesn't.</Paragraph>
    </Section>
  </Email>
);

/** `dir="rtl"` writes the whole email from the right, and `lang` says its language. */
export const RightToLeft = showing(
  "Email",
  <Email width={560} dir="rtl" lang="ar" style={{ backgroundColor: WASH, color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 32, gap: 12, alignItems: "start" }}>
      <Heading level={1} style={{ fontSize: 28 }}>مرحبا بكم</Heading>
      <Paragraph style={{ fontSize: 16 }}>شكرا لاشتراككم في نشرتنا.</Paragraph>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, borderRadius: 6 }}>ابدأ الآن</Button>
    </Section>
  </Email>
);
