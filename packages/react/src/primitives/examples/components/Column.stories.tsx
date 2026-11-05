import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, showing, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Link, List, ListItem, Page, Paragraph, Row, Section, Text } from "../../index";
import { BRAND, FONT, INK, LINE, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Column",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Stacks its children, with its own spacing and box. In a `Row` it's one of the children side by side; with a background it's a card. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A `Column` with a box is a card: its background, border, corners and padding, and another padding on phones. */
export const Cards = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT, backgroundColor: WASH }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Column style={{ gap: 8, padding: 24, backgroundColor: "#FFFFFF", borderRadius: 8 }} mobile={{ padding: 12 }}>
        <Heading level={3} style={{ fontSize: 18 }}>A plain card</Heading>
        <Paragraph style={{ fontSize: 14, color: MUTED }}>A background, round corners, and less padding on phones.</Paragraph>
      </Column>
      <Column style={{ gap: 8, padding: 24, backgroundColor: "#FFFFFF", border: LINE }}>
        <Heading level={3} style={{ fontSize: 18 }}>With an outline</Heading>
        <Paragraph style={{ fontSize: 14, color: MUTED }}>A hairline all around.</Paragraph>
      </Column>
      <Column style={{ gap: 8, padding: 24, backgroundColor: "#FFFFFF", border: { left: `4px solid ${BRAND}` } }}>
        <Heading level={3} style={{ fontSize: 18 }}>With an accent</Heading>
        <Paragraph style={{ fontSize: 14, color: MUTED }}>A line on one side only.</Paragraph>
      </Column>
    </Section>
  </Root>
));

/** `alignItems` says where its children sit across it: on the left, in the center, on the right. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 12 }}>
        <Column style={{ padding: 12, backgroundColor: WASH, alignItems: "start" }}><Button href="https://example.com" style={{ backgroundColor: BRAND }}>Left</Button></Column>
        <Column style={{ padding: 12, backgroundColor: WASH, alignItems: "center" }}><Button href="https://example.com" style={{ backgroundColor: BRAND }}>Center</Button></Column>
        <Column style={{ padding: 12, backgroundColor: WASH, alignItems: "end" }}><Button href="https://example.com" style={{ backgroundColor: BRAND }}>Right</Button></Column>
      </Row>
    </Section>
  </Root>
));

/** On a page, `justifyContent` says where its children sit in a set `height` (an email starts them at the top). */
export const HeightAndJustify = showing(
  "Page",
  <Page width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 12 }}>
        <Column style={{ height: 160, padding: 12, backgroundColor: WASH, justifyContent: "start" }}><Text style={{ fontSize: 14 }}>At the top</Text></Column>
        <Column style={{ height: 160, padding: 12, backgroundColor: WASH, justifyContent: "center" }}><Text style={{ fontSize: 14 }}>In the middle</Text></Column>
        <Column style={{ height: 160, padding: 12, backgroundColor: WASH, justifyContent: "end" }}><Text style={{ fontSize: 14 }}>At the bottom</Text></Column>
      </Row>
    </Section>
  </Page>
);

/** One plan's card: `dark` turns it into the featured one. */
const plan = (name: string, price: string, features: string[], dark = false) => (
  <Column key={name} style={{ gap: 12, padding: 20, borderRadius: 12, alignItems: "stretch", backgroundColor: dark ? INK : "#FFFFFF", color: dark ? "#FFFFFF" : INK, border: dark ? undefined : LINE }}>
    <Heading level={3} style={{ fontSize: 16 }}>{name}</Heading>
    <Paragraph style={{ fontSize: 30, fontWeight: 700 }}>{price}</Paragraph>
    <List style={{ gap: 4, fontSize: 13, indent: 16 }}>
      {features.map((feature) => (
        <ListItem key={feature}>{feature}</ListItem>
      ))}
    </List>
    <Button href="https://example.com/plans" style={{ width: "100%", backgroundColor: dark ? "#FFFFFF" : BRAND, color: dark ? INK : "#FFFFFF", borderRadius: 6 }}>Choose</Button>
  </Column>
);

/** Three plans, the middle one featured: a `Column` is a card, and a `Row` puts them side by side. */
export const PricingCards = story((Root) => (
  <Root width={640} style={{ color: INK, fontFamily: FONT, backgroundColor: WASH }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 12 }}>
        {[plan("Starter", "$0", ["One project", "Email support"]), plan("Team", "$29", ["Ten projects", "Priority support", "Shared library"], true), plan("Business", "$99", ["Every project", "Phone support"])]}
      </Row>
    </Section>
  </Root>
));

/** A figure and what it counts, centered in its column. */
const stat = (figure: string, label: string) => (
  <Column key={label} style={{ gap: 4, textAlign: "center" }}>
    <Paragraph style={{ fontSize: 28, fontWeight: 700 }}>{figure}</Paragraph>
    <Paragraph style={{ fontSize: 12, color: "#CBD2D9" }}>{label}</Paragraph>
  </Column>
);

/** Figures along a dark band: a column's `textAlign` is inherited by what it holds. */
export const Stats = story((Root) => (
  <Root width={640} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: INK, color: "#FFFFFF", padding: [32, 24] }}>
      <Row stackOnMobile={false} style={{ gap: 16 }}>{[stat("99.9%", "Uptime"), stat("12k", "Teams"), stat("48", "Countries"), stat("4.9", "Rating")]}</Row>
    </Section>
  </Root>
));

/** An article beside a tinted sidebar: the sidebar has a set `width`, and the article takes what's left. */
export const Sidebar = story((Root) => (
  <Root width={640} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 24 }}>
        <Column style={{ width: 160, gap: 8, padding: 16, backgroundColor: WASH, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: MUTED }}>In this issue</Text>
          <Link href="https://example.com/start" style={{ fontSize: 14, color: BRAND }}>Getting started</Link>
          <Link href="https://example.com/layouts" style={{ fontSize: 14, color: BRAND }}>Layouts</Link>
          <Link href="https://example.com/more" style={{ fontSize: 14, color: BRAND }}>What's next</Link>
        </Column>
        <Column style={{ gap: 12 }}>
          <Heading level={2} style={{ fontSize: 24 }}>Getting started</Heading>
          <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>A longer article runs beside the sidebar on a wider window. On a phone, the sidebar comes first and the article goes under it.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));
