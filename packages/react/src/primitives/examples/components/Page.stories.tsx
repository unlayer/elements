import type { Meta } from "@storybook/react-vite";
import { args, argTypes, showing, type Args } from "../../../compat/SideBySide";
import { Button, Column, Grid, Heading, Page, Paragraph, Section } from "../../index";
import { BRAND, FONT, INK, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Page",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A web page, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template.",
      },
    },
  },
};
export default meta;

/** `width` is the widest the content gets; a `Section`'s background still reaches the window's edges. */
export const Width = showing(
  "Page",
  <Page width={480} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: WASH, padding: [32, 24], gap: 8 }}>
      <Heading level={2} style={{ fontSize: 22 }}>At most 480px of content</Heading>
      <Paragraph style={{ fontSize: 15 }}>The default is 1200px. The band behind this text runs the whole window.</Paragraph>
    </Section>
  </Page>
);

/** Text styles on the root are inherited by everything in it, and `backgroundColor` is the window's. */
export const InheritedText = showing(
  "Page",
  <Page width={640} style={{ backgroundColor: "#0F172A", color: "#E2E8F0", fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.7, textAlign: "center" }} mobile={{ fontSize: 16 }}>
    <Section style={{ padding: 40, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 34 }}>From the root's style</Heading>
      <Paragraph>This text sets nothing of its own: its color, its font, its size and its alignment are all the Page's.</Paragraph>
    </Section>
  </Page>
);

/** `gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle. */
export const GapAndAlignment = showing(
  "Page",
  <Page width={560} style={{ backgroundColor: WASH, color: INK, fontFamily: FONT, gap: 16, alignItems: "center", textAlign: "center" }}>
    <Heading level={2} style={{ fontSize: 22, padding: [24, 0, 0, 0] }}>16px between each</Heading>
    <Column style={{ width: 360, padding: 20, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
      <Paragraph style={{ fontSize: 15 }}>A card.</Paragraph>
    </Column>
    <Button href="https://example.com" style={{ backgroundColor: BRAND, borderRadius: 6 }}>And a button</Button>
    <Paragraph style={{ fontSize: 12, color: MUTED, padding: [0, 0, 24, 0] }}>The end of the page.</Paragraph>
  </Page>
);

/** `title` is the browser tab's, `description` the page's meta description, and `lang` its language: none shows on the page. */
export const TitleAndDescription = showing(
  "Page",
  <Page width={560} title="Acme, for teams" description="Acme keeps your team's work in one place." lang="en" style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 8 }}>
      <Heading level={2} style={{ fontSize: 22 }}>Nothing here shows the settings</Heading>
      <Paragraph style={{ fontSize: 15, color: MUTED }}>A browser's tab shows the title, and a search engine the description.</Paragraph>
    </Section>
  </Page>
);

/** `dir="rtl"` writes the whole page from the right, and `lang` says its language. */
export const RightToLeft = showing(
  "Page",
  <Page width={560} dir="rtl" lang="ar" style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: WASH, padding: 32, gap: 12, alignItems: "start" }}>
      <Heading level={1} style={{ fontSize: 28 }}>مرحبا بكم</Heading>
      <Paragraph style={{ fontSize: 16 }}>شكرا لزيارتكم موقعنا.</Paragraph>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, borderRadius: 6 }}>ابدأ الآن</Button>
    </Section>
  </Page>
);

const FEATURES = [
  ["Fast", "Pages load before you've finished clicking."],
  ["Safe", "Backups every hour, kept for a year."],
  ["Shared", "Your whole team, in one place."],
];

/** A landing page in the dark: a hero, three features and a last word, all on the root's background. */
export const Landing = showing(
  "Page",
  <Page width={760} title="Acme" style={{ backgroundColor: "#0F172A", color: "#F8FAFC", fontFamily: FONT }}>
    <Section style={{ padding: [56, 24], gap: 16, alignItems: "center", textAlign: "center" }}>
      <Heading level={1} style={{ fontSize: 44, lineHeight: 1.1 }}>Your team's work, in one place</Heading>
      <Paragraph style={{ fontSize: 17, color: "#94A3B8" }}>Everything you make, findable by everyone who needs it.</Paragraph>
      <Button href="https://example.com/start" style={{ backgroundColor: "#6366F1", padding: [14, 28], borderRadius: 8, fontSize: 15 }} hover={{ backgroundColor: "#4F46E5" }}>Start free</Button>
    </Section>
    <Section style={{ padding: [0, 24, 56, 24] }}>
      <Grid columns={3} style={{ gap: 16 }}>
        {FEATURES.map(([name, line]) => (
          <Column key={name} style={{ gap: 8, padding: 20, backgroundColor: "#1E293B", borderRadius: 12 }}>
            <Heading level={3} style={{ fontSize: 17 }}>{name}</Heading>
            <Paragraph style={{ fontSize: 14, color: "#94A3B8" }}>{line}</Paragraph>
          </Column>
        ))}
      </Grid>
    </Section>
  </Page>
);
