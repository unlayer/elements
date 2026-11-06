/**
 * Columns as Sundial (a fictional coffee roaster) uses them: oat paper, espresso ink and one crema
 * gold, for the figures and the button that matter. DM Serif Display for the voice, Hanken Grotesk
 * for the facts, DM Mono for the quiet notes on what each column sets.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, showing, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, LineBreak, Link, List, ListItem, Page, Paragraph, Row, Section, type EmailProps } from "../../index";

const OAT = "#F4EEE3";
const CARD = "#FFFCF6";
const ESPRESSO = "#2A1F19";
const QUIET = "#6F6256";
const DIM = "#B9AB98";
const RULE = "#E3D9CA";
const CREMA = "#C8963A";
const CREMA_DOWN = "#B5842C";

const SERIF = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://sundial.example";

const fonts: EmailProps["fonts"] = [
  { family: "DM Serif Display", src: "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Bx0vrx52g.woff2", format: "woff2", weight: 400 },
  { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" },
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
];
const text = { backgroundColor: OAT, color: ESPRESSO, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 };

/** Small mono capitals: labels and origins. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what a column sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const serif = (fontSize: number) => ({ fontFamily: SERIF, fontWeight: 400, fontSize, lineHeight: 1.12 }) as const;

/** Sundial's name and what this is, over a rule. */
const masthead = (what: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 12], border: { bottom: `1px solid ${ESPRESSO}` } }}>
    <Column style={{ width: 110 }}>
      <Paragraph style={{ ...serif(24), lineHeight: "26px" }}>Sundial</Paragraph>
    </Column>
    <Column>
      <Paragraph style={{ ...label, textAlign: "right" }}>{what}</Paragraph>
    </Column>
  </Row>
);

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

/** A coffee on a card: where it's from, its name, how it tastes, and a note on the card's box. */
const coffee = (origin: string, name: string, tastes: string, noted: string) => (
  <>
    <Paragraph style={label}>{origin}</Paragraph>
    <Heading level={3} style={serif(26)}>
      {name}
    </Heading>
    <Paragraph style={{ fontSize: 15, color: QUIET }}>{tastes}</Paragraph>
    <Paragraph style={{ ...note, padding: [6, 0, 0] }}>{noted}</Paragraph>
  </>
);

/** A `Column` with a box is a card: its background, border, corners and padding, and another padding on phones. */
export const Cards = story((Root) => (
  <Root width={560} fonts={fonts} style={text}>
    <Section style={{ padding: [32, 32, 40], gap: 16 }} mobile={{ padding: [24, 16, 32], gap: 12 }}>
      {masthead("This month’s roasts")}
      <Column style={{ gap: 6, padding: 28, backgroundColor: CARD, borderRadius: 8 }} mobile={{ padding: 18 }}>
        {coffee("Filter · Hambela, Ethiopia", "Long Shadow", "Bergamot and white peach, with a finish as clean as tea.", "backgroundColor, borderRadius; less padding on phones")}
      </Column>
      <Column style={{ gap: 6, padding: 28, border: `1px solid ${DIM}` }}>
        {coffee("Espresso · Huila, Colombia", "Solstice", "Dark cherry and cocoa. Holds its own under a lot of milk.", "border: a hairline all around")}
      </Column>
      <Column style={{ gap: 6, padding: 28, backgroundColor: CARD, border: { left: `4px solid ${CREMA}` } }}>
        {coffee("Decaf · Kayanza, Burundi", "Dusk", "Plum and brown sugar, washed with spring water, and kind to you after six.", "border.left: a line on one side only")}
      </Column>
    </Section>
  </Root>
));

/** A kraft bag with Sundial's sun on it, drawn in the page (no network). */
const BAG = {
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200"><path d="M24 22h112l8 170H16Z" fill="#CDB48E"/><path d="M24 22h112l1 20H23Z" fill="#A98F68"/><path d="M50 124a30 30 0 0 1 60 0Z" fill="${ESPRESSO}"/><path d="M38 124h84" stroke="${ESPRESSO}" stroke-width="5"/></svg>`
  )}`,
  width: 160,
  height: 200,
};

/** A bag of coffee: its picture, size and price, and a button; `alignItems` says where they sit, and `textAlign` where their text does. */
const bag = (alignItems: "start" | "center" | "end", textAlign: "left" | "center" | "right", size: string, price: string) => (
  <Column key={size} style={{ gap: 12, padding: [24, 20], backgroundColor: CARD, borderRadius: 6, alignItems, textAlign }}>
    <Image src={BAG} alt={`A kraft paper bag of coffee, ${size}, with a sun on it.`} style={{ width: 56 }} />
    <Column style={{ gap: 2 }}>
      <Heading level={3} style={serif(32)}>
        {size}
      </Heading>
      <Paragraph style={{ fontSize: 14, color: QUIET }}>{price}, whole bean</Paragraph>
    </Column>
    <Button href={`${SITE}/bags/${size}`} style={{ backgroundColor: ESPRESSO, color: CARD, fontSize: 14, fontWeight: 600, padding: [10, 20], borderRadius: 3 }} hover={{ backgroundColor: "#46362C" }}>
      Add
    </Button>
    <Paragraph style={{ ...note, padding: [4, 0, 0] }}>“{alignItems}”</Paragraph>
  </Column>
);

/** `alignItems` says where its children sit across it: on the left, in the center, on the right. */
export const Alignment = story((Root) => (
  <Root width={600} fonts={fonts} style={text}>
    <Section style={{ padding: [32, 32, 40], gap: 20 }} mobile={{ padding: [24, 16, 32] }}>
      {masthead("By the bag")}
      <Row style={{ gap: 12 }}>
        {bag("start", "left", "250 g", "£9")}
        {bag("center", "center", "500 g", "£16")}
        {bag("end", "right", "1 kg", "£29")}
      </Row>
    </Section>
  </Root>
));

/** A roast on the scale: a panel of its color, a set height, and its words where `justifyContent` says. */
const roast = (justifyContent: "start" | "center" | "end", backgroundColor: string, color: string, name: string, tastes: string) => (
  <Column key={name} style={{ height: 260, gap: 6, padding: 20, backgroundColor, color, borderRadius: 4, justifyContent }}>
    <Paragraph style={{ ...note, color }}>“{justifyContent}”</Paragraph>
    <Heading level={3} style={serif(30)}>
      {name}
    </Heading>
    <Paragraph style={{ fontSize: 14, lineHeight: 1.45 }}>{tastes}</Paragraph>
  </Column>
);

/** On a page, `justifyContent` says where its children sit in a set `height` (an email starts them at the top). */
export const HeightAndJustify = showing(
  "Page",
  <Page width={640} fonts={fonts} style={text}>
    <Section style={{ padding: [32, 32, 40], gap: 20 }} mobile={{ padding: [24, 16, 32] }}>
      {masthead("The roast scale")}
      <Row style={{ gap: 8 }}>
        {roast("start", "#DDC49C", ESPRESSO, "Light", "Tastes of where it grew: fruit, flowers, a little tea.")}
        {roast("center", "#8A5C34", CARD, "Medium", "Caramel comes up, and the fruit settles in under it.")}
        {roast("end", ESPRESSO, CARD, "Dark", "Tastes of the roast: cocoa and smoke, heavy in the cup.")}
      </Row>
    </Section>
  </Page>
);

/** One plan's card: `dark` turns it into the featured one. */
const plan = (name: string, price: string, features: string[], dark = false) => (
  <Column key={name} style={{ gap: 14, padding: [24, 20], borderRadius: 8, alignItems: "stretch", backgroundColor: dark ? ESPRESSO : CARD, color: dark ? CARD : ESPRESSO }}>
    <Paragraph style={{ ...label, color: dark ? DIM : QUIET }}>{name}</Paragraph>
    <Paragraph style={{ ...serif(46), lineHeight: 1 }}>
      {price}
    </Paragraph>
    <Paragraph style={{ fontSize: 13, color: dark ? DIM : QUIET }}>a month, cancel any time</Paragraph>
    <List style={{ gap: 6, fontSize: 14, lineHeight: 1.4, indent: 16, padding: [10, 0, 6], border: { top: `1px solid ${dark ? "#4B3D34" : RULE}` } }}>
      {features.map((feature) => (
        <ListItem key={feature}>{feature}</ListItem>
      ))}
    </List>
    <Button
      href={`${SITE}/plans/${name.toLowerCase()}`}
      style={{ width: "100%", backgroundColor: dark ? CREMA : OAT, color: ESPRESSO, fontSize: 14, fontWeight: 600, padding: [12, 0], borderRadius: 3 }}
      hover={{ backgroundColor: dark ? CREMA_DOWN : RULE }}
    >
      Choose {name}
    </Button>
  </Column>
);

/** Three plans, the middle one featured: a `Column` is a card, and a `Row` puts them side by side. */
export const PricingCards = story((Root) => (
  <Root width={640} fonts={fonts} style={text}>
    <Section style={{ padding: [32, 24, 40], gap: 24 }} mobile={{ padding: [24, 16, 32] }}>
      {masthead("Subscriptions")}
      <Heading level={2} style={serif(38)} mobile={{ fontSize: 28 }}>
        Roasted on Monday,
        <LineBreak />
        at your door by Thursday.
      </Heading>
      <Row style={{ gap: 10 }}>
        {plan("Taster", "£9", ["One 250 g bag, every month", "Whatever we like best", "Stop whenever you want"])}
        {plan("Regular", "£24", ["Two 250 g bags, every fortnight", "Ground for you, if you like", "Tell us when you’re away"], true)}
        {plan("Household", "£42", ["A 1 kg bag, every fortnight", "Our espresso or our filter", "Enough for a whole office"])}
      </Row>
    </Section>
  </Root>
));

/** A figure and what it counts, centered in its column. */
const stat = (figure: string, what: string) => (
  <Column key={what} style={{ gap: 6, textAlign: "center" }}>
    <Paragraph style={{ ...serif(40), color: CREMA }} mobile={{ fontSize: 28 }}>
      {figure}
    </Paragraph>
    <Paragraph style={{ fontSize: 13, lineHeight: 1.35, color: DIM }} mobile={{ fontSize: 11 }}>
      {what}
    </Paragraph>
  </Column>
);

/** Figures along a dark band: a column's `textAlign` is inherited by what it holds. */
export const Stats = story((Root) => (
  <Root width={640} fonts={fonts} style={{ ...text, backgroundColor: ESPRESSO }}>
    <Section style={{ backgroundColor: ESPRESSO, color: CARD, padding: [40, 24, 44], gap: 28 }} mobile={{ padding: [32, 16, 36], gap: 24 }}>
      <Paragraph style={{ ...label, color: DIM, textAlign: "center" }}>Sundial’s year, in four numbers</Paragraph>
      <Row stackOnMobile={false} style={{ gap: 16 }} mobile={{ gap: 8 }}>
        {stat("38", "farms we buy from")}
        {stat("4", "days from roast to door")}
        {stat("62p", "a kilo over market")}
        {stat("12k", "cups a day, all told")}
      </Row>
    </Section>
  </Root>
));

/** A link in the sidebar. */
const contents = (href: string, title: ReactNode) => (
  <Paragraph style={{ fontSize: 14, lineHeight: 1.4, padding: [8, 0, 0], border: { top: `1px solid ${RULE}` } }}>
    <Link href={`${SITE}/letter/31#${href}`} style={{ color: ESPRESSO, textDecoration: "none" }} hover={{ textDecoration: "underline" }}>
      {title}
    </Link>
  </Paragraph>
);

/** An article beside a tinted sidebar: the sidebar has a set `width`, and the article takes what's left. */
export const Sidebar = story((Root) => (
  <Root width={640} fonts={fonts} style={{ ...text, backgroundColor: CARD }}>
    <Section style={{ padding: [32, 32, 40], gap: 28 }} mobile={{ padding: [24, 20, 32], gap: 20 }}>
      {masthead("The letter, No. 31")}
      <Row style={{ gap: 32 }} mobile={{ gap: 24 }}>
        <Column style={{ width: 168, gap: 8, padding: 18, backgroundColor: OAT, borderRadius: 4 }}>
          <Paragraph style={{ ...label, padding: [0, 0, 4] }}>In this issue</Paragraph>
          {contents("blends", "Why we stopped blending")}
          {contents("water", "Your tap water, tested")}
          {contents("kayanza", "A week in Kayanza")}
        </Column>
        <Column style={{ gap: 12 }}>
          <Heading level={2} style={serif(34)} mobile={{ fontSize: 30 }}>
            Why we stopped blending
          </Heading>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.65 }}>A blend hides a bad harvest. For nine years that suited us, because it meant the same bag all year. Then Ana sent us a single lot from Huila, and we couldn’t improve it by adding anything.</Paragraph>
          <Paragraph style={{ fontSize: 15, fontWeight: 600 }}>
            <Link href={`${SITE}/letter/31#blends`} style={{ color: ESPRESSO }}>
              Read the rest
            </Link>
          </Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));
