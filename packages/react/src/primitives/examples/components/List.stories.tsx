import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Divider, Heading, Link, List, ListItem, MergeTag, Row, Section, Span, Text } from "../../index";
import { caption, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/List",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A bulleted or numbered `List` of `ListItem`s, whose text holds what any text holds. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Long Proof (a fictional bakehouse that teaches sourdough by post and on Saturdays).
 *
 * Recipes are lists, so its emails are all lists: a flour-white card on butter yellow, Fraunces for
 * the voice, Figtree for the steps, and the brown of a good crust for what the eye should find first.
 */
const FLOUR = "#FFFCF5";
const BUTTER = "#F6E4A6";
const INK = "#2A1F14";
const QUIET = "#6E6051";
const RULE = "#E8D9AE";
const CRUST = "#7A3E12";

const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
const SANS = "Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://longproof.example";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeP2Xz5c.woff2", format: "woff2", weight: "100 900" },
    { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU58FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChjeveQ7ZXk8g.woff2", format: "woff2", weight: "100 900", style: "italic" },
    { family: "Figtree", src: "https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DaRvzig.woff2", format: "woff2", weight: "300 900" },
    MONO_FONT,
  ],
  style: { backgroundColor: BUTTER, color: INK, fontFamily: SANS, fontSize: 17, lineHeight: 1.5 },
};

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: CRUST } as const;
const title = { fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.5 } as const;

/** The window around a card: what every story sits in. */
const table = { padding: [36, 24, 44] } as const;
const tableOnPhones = { padding: [16, 12, 24] } as const;
const card = { backgroundColor: FLOUR, borderRadius: 3, padding: [40, 40, 44], gap: 24 } as const;
const cardOnPhones = { padding: [28, 22, 30], gap: 20 } as const;

/** A `Divider` is a line, `List` bullets or numbers, and an item can hold a list of its own. */
export const ListsAndDividers = story((Root) => (
  <Root {...root}>
    <Section style={table} mobile={tableOnPhones}>
      <Column style={card} mobile={cardOnPhones}>
        <Column style={{ gap: 10 }}>
          <Text style={label}>Lesson three</Text>
          <Heading level={2} style={{ ...title, fontSize: 44 }} mobile={{ fontSize: 34 }}>
            A loaf for Sunday
          </Heading>
        </Column>
        <List style={{ gap: 4 }} mobile={{ fontSize: 16 }}>
          <ListItem>500 g strong white flour</ListItem>
          <ListItem>350 g cool water</ListItem>
          <ListItem>100 g lively starter</ListItem>
          <ListItem>10 g fine salt</ListItem>
        </List>
        <Divider style={{ borderTop: `1px solid ${RULE}` }} />
        <List type="number" style={{ gap: 8 }} mobile={{ fontSize: 16 }}>
          <ListItem>Mix it all, and leave it for an hour.</ListItem>
          <ListItem>
            Fold it four times, half an hour apart.
            <List style={{ color: QUIET }}>
              <ListItem>Wet your hands first, and it won’t stick.</ListItem>
            </List>
          </ListItem>
          <ListItem>Shape it, and leave it in the fridge overnight.</ListItem>
          <ListItem>Bake at 240°C, with the lid on for the first half.</ListItem>
        </List>
      </Column>
    </Section>
  </Root>
));

/** A day of the course: its name and when, over the steps that fall on it. */
const day = (name: string, when: string, list: JSX.Element) => (
  <Column style={{ gap: 16, padding: [26, 26, 30], backgroundColor: FLOUR, borderRadius: 3 }}>
    <Column style={{ gap: 2 }}>
      <Text style={{ ...title, fontSize: 30 }}>{name}</Text>
      <Text style={{ fontSize: 14, color: QUIET }}>{when}</Text>
    </Column>
    {list}
  </Column>
);

/** `type="number"` counts from 1, and `start` from another number. */
export const Numbers = story((Root) => (
  <Root {...root}>
    <Section style={{ ...table, gap: 20 }} mobile={{ ...tableOnPhones, gap: 14 }}>
      <Heading level={2} style={{ ...title, fontSize: 40 }} mobile={{ fontSize: 32, padding: [8, 8, 0] }}>
        Your first weekend
      </Heading>
      <Row style={{ gap: 12 }}>
        {day(
          "Friday",
          "After work, half an hour",
          <List type="number" style={{ gap: 6, fontSize: 16 }}>
            <ListItem>Feed your starter</ListItem>
            <ListItem>Mix the dough</ListItem>
          </List>
        )}
        {day(
          "Saturday",
          "Before lunch, an hour",
          <List type="number" start={3} style={{ gap: 6, fontSize: 16 }}>
            <ListItem>Shape the loaves</ListItem>
            <ListItem>Bake, and wait</ListItem>
          </List>
        )}
      </Row>
      <Text style={{ ...caption(INK), padding: [0, 2] }} mobile={{ padding: [0, 8] }}>
        start: 3, so Saturday's count carries on
      </Text>
    </Section>
  </Root>
));

/** An item holds a `List` of its own, down as many levels as it needs. */
export const Nested = story((Root) => (
  <Root {...root}>
    <Section style={table} mobile={tableOnPhones}>
      <Column style={card} mobile={cardOnPhones}>
        <Heading level={2} style={{ ...title, fontSize: 40 }} mobile={{ fontSize: 32 }}>
          What’s on the shelf
        </Heading>
        <List style={{ gap: 10, fontWeight: 600 }} mobile={{ fontSize: 16 }}>
          <ListItem>
            Flour
            <List style={{ gap: 6, fontWeight: 400 }}>
              <ListItem>Strong white, from the mill at Ashby</ListItem>
              <ListItem>
                Rye
                <List style={{ gap: 4, color: QUIET, fontSize: 15 }}>
                  <ListItem>Light, for a milder crumb</ListItem>
                  <ListItem>Dark, for the starter</ListItem>
                </List>
              </ListItem>
            </List>
          </ListItem>
          <ListItem>Salt, fine and sea</ListItem>
        </List>
      </Column>
    </Section>
  </Root>
));

/** `gap` is the space between items, `indent` the markers' column, and a list has a box of its own. */
export const Styles = story((Root) => (
  <Root {...root}>
    <Section style={table} mobile={tableOnPhones}>
      <Column style={{ ...card, gap: 36 }} mobile={{ ...cardOnPhones, gap: 30 }}>
        <Column style={{ gap: 14 }}>
          <Heading level={2} style={{ ...title, fontSize: 32 }} mobile={{ fontSize: 28 }}>
            Saturday’s rules
          </Heading>
          <List style={{ gap: 12, indent: 40, fontFamily: SERIF, fontSize: 20, lineHeight: 1.3, color: CRUST }} mobile={{ fontSize: 18 }}>
            <ListItem>Nobody opens the oven for the first twenty minutes</ListItem>
            <ListItem>Whoever finishes the starter feeds the starter</ListItem>
          </List>
          <Text style={caption(QUIET)}>gap: 12, indent: 40</Text>
        </Column>
        <Column style={{ gap: 14 }}>
          <Heading level={2} style={{ ...title, fontSize: 32 }} mobile={{ fontSize: 28 }}>
            Your order
          </Heading>
          <List type="number" style={{ gap: 8, padding: [18, 20], backgroundColor: BUTTER, border: `1px solid ${RULE}`, fontSize: 16, color: QUIET }}>
            <ListItem>Two country loaves</ListItem>
            <ListItem style={{ fontWeight: 700, color: INK }}>A rye with caraway, the last one</ListItem>
            <ListItem style={{ textDecoration: "line-through" }}>Six cinnamon buns, sold out</ListItem>
          </List>
          <Text style={caption(QUIET)}>A box of its own, one item bold, one struck through</Text>
        </Column>
      </Column>
    </Section>
  </Root>
));

/** An item's text holds what any text holds: a `Span`, a `Link`, a `MergeTag`. */
export const RunsInItems = story((Root) => (
  <Root {...root}>
    <Section style={table} mobile={tableOnPhones}>
      <Column style={card} mobile={cardOnPhones}>
        <Column style={{ gap: 10 }}>
          <Text style={label}>Before you come</Text>
          <Heading level={2} style={{ ...title, fontSize: 40 }} mobile={{ fontSize: 30 }}>
            Three things about Saturday
          </Heading>
        </Column>
        <List style={{ gap: 10, fontSize: 18 }} mobile={{ fontSize: 16, gap: 8 }}>
          <ListItem>
            <Span style={{ fontWeight: 700 }}>Bring an apron.</Span> We have the flour.
          </ListItem>
          <ListItem>
            Read{" "}
            <Link href={`${SITE}/refunds`} style={{ color: CRUST }}>
              how refunds work
            </Link>{" "}
            if you can’t make it.
          </ListItem>
          <ListItem>
            Your code for a free loaf is <MergeTag name="loaf_code" />
          </ListItem>
        </List>
      </Column>
    </Section>
  </Root>
));
