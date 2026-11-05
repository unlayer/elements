import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, Paragraph, Row, Section, Text } from "../../index";
import { BRAND, FONT, INK, landscape, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Row",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Lays its children out side by side, and stacks them on phones. A child takes its width, or a share of what's left. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A flat box with a line of text in it, to show where a child sits. */
const box = (label: string, color = "#D9E2EC", height?: number) => (
  <Column key={label} style={{ padding: height ? [0, 12] : 12, backgroundColor: color, height }}>
    <Text style={{ fontSize: 14, textAlign: "center" }}>{label}</Text>
  </Column>
);

/** A `Section` is a band across the window. A `Row` puts its `Column`s side by side, and stacks them on phones. Space is `gap` and `padding`, never margins. */
export const SetWidthAndTheRest = story((Root) => (
  <Root width={560} style={{ backgroundColor: "#F5F7FA", color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: BRAND, color: "#FFFFFF", padding: [20, 24] }}>
      <Heading level={2} style={{ fontSize: 20 }}>A band across the window</Heading>
    </Section>
    <Section style={{ backgroundColor: "#FFFFFF", padding: 24 }}>
      <Row style={{ gap: 16 }}>
        <Column style={{ width: 180, gap: 8 }}>
          <Paragraph style={{ fontWeight: 700 }}>180px</Paragraph>
          <Paragraph style={{ color: MUTED, fontSize: 14 }}>A set width.</Paragraph>
        </Column>
        <Column style={{ gap: 8, padding: 12, backgroundColor: "#F5F7FA", borderRadius: 6 }}>
          <Paragraph style={{ fontWeight: 700 }}>The rest</Paragraph>
          <Paragraph style={{ color: MUTED, fontSize: 14 }}>What's left of the row, with a box of its own.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** Children share the width equally; `flex` gives one more of it. */
export const Shares = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Row style={{ gap: 12 }}>{[box("1"), box("1 ")]}</Row>
      <Row style={{ gap: 12 }}>{[box("1"), box("1 "), box("1  ")]}</Row>
      <Row style={{ gap: 12 }}>{[box("1"), box("1 "), box("1  "), box("1   ")]}</Row>
      <Row style={{ gap: 12 }}>
        <Column style={{ flex: 1, padding: 12, backgroundColor: "#D9E2EC" }}><Text style={{ fontSize: 14, textAlign: "center" }}>flex: 1</Text></Column>
        <Column style={{ flex: 2, padding: 12, backgroundColor: "#9FB3C8" }}><Text style={{ fontSize: 14, textAlign: "center" }}>flex: 2</Text></Column>
      </Row>
    </Section>
  </Root>
));

/** `alignItems` says where children of different heights sit, and `justifyContent` where they sit along the row. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Row style={{ gap: 12, alignItems: "start", backgroundColor: WASH }}>{[box("Tall", "#D9E2EC", 80), box("At the top")]}</Row>
      <Row style={{ gap: 12, alignItems: "center", backgroundColor: WASH }}>{[box("Tall", "#D9E2EC", 80), box("In the middle")]}</Row>
      <Row style={{ gap: 12, alignItems: "end", backgroundColor: WASH }}>{[box("Tall", "#D9E2EC", 80), box("At the bottom")]}</Row>
      <Row style={{ gap: 12, justifyContent: "end", backgroundColor: WASH }}>
        <Column style={{ width: 120, padding: 12, backgroundColor: "#D9E2EC" }}><Text style={{ fontSize: 14, textAlign: "center" }}>At the end</Text></Column>
      </Row>
    </Section>
  </Root>
));

/** A `Row` stacks on phones unless `stackOnMobile={false}` keeps it side by side: choose "phone" under width to see it. */
export const KeptOnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Row style={{ gap: 12 }}>{[box("Stacks"), box("on phones")]}</Row>
      <Row stackOnMobile={false} style={{ gap: 12 }}>{[box("Stays", "#9FB3C8"), box("side by side", "#9FB3C8")]}</Row>
    </Section>
  </Root>
));

const TAGS = ["Design", "Email", "Layout", "Typography", "Accessibility", "Components", "Templates", "Phones"];

/** `flexWrap: "wrap"` moves what doesn't fit to another line, in a row kept side by side on phones. */
export const Wrapping = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row stackOnMobile={false} style={{ gap: 8, flexWrap: "wrap" }}>
        {TAGS.map((tag) => (
          <Text key={tag} style={{ flex: "none", padding: [4, 12], fontSize: 13, backgroundColor: WASH, borderRadius: 12 }}>{tag}</Text>
        ))}
      </Row>
    </Section>
  </Root>
));

/** A picture beside its words, the words in the middle of the row's height, as for a product's feature. */
export const PictureAndWords = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 24, alignItems: "center" }}>
        <Column>
          <Image src={landscape(480, 320)} alt="Hills under a sun" style={{ width: "100%", borderRadius: 8 }} />
        </Column>
        <Column style={{ gap: 12, alignItems: "start" }}>
          <Heading level={3} style={{ fontSize: 20 }}>See it all from above</Heading>
          <Paragraph style={{ fontSize: 14, lineHeight: 1.6, color: MUTED }}>One view of every project, updated as your team works.</Paragraph>
          <Button href="https://example.com/features" style={{ backgroundColor: BRAND, borderRadius: 6 }}>See how</Button>
        </Column>
      </Row>
    </Section>
  </Root>
));
