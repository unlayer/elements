/**
 * Limner (a fictional paint maker with a colour card worth keeping) shows its range.
 *
 * Plaster paper and soot ink, so the paints are the only color on the page; Rust Hill, the colour of
 * the month, is the one accent. DM Serif Display names the colours, as a colour card does, Instrument
 * Sans says the rest, and DM Mono holds the captions saying what each row is doing.
 */
import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, Paragraph, Row, Section, Text } from "../../index";
import { drawing } from "./kit-d";

const PLASTER = "#F6F2EA";
const SOOT = "#24211D";
const QUIET = "#6F675C";
const RULE = "#DDD5C8";

// The paints.
const RUST_HILL = "#A8502E";
const RUST_DOWN = "#8E4325";
const BONE = "#E7DFCF";
const WET_CLAY = "#C9A48A";
const SEA_KALE = "#8A9E90";
const OLD_MOSS = "#55604A";
const LAMP_BLACK = "#2E2C29";
const YELLOW_EARTH = "#C8963E";
const CHALK_BLUE = "#A9B8B8";
const FLAX = "#D8CDB8";

const SERIF = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "DM Serif Display", src: "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Bx0vrx52g.woff2", format: "woff2", weight: 400 } as const,
  { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const PAPER = { backgroundColor: PLASTER, color: SOOT, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 } as const;
const NAME = { fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;

const SITE = "https://limner.example";

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

/** A paint as a card's chip: the color, with its name low down in it. */
const CHIP = { padding: "54px 12px 10px", lineHeight: 1.3 } as const;
const chip = (name: string, color: string, ink = PLASTER) => (
  <Column key={name} style={{ ...CHIP, backgroundColor: color, color: ink }}>
    <Text style={{ fontSize: 13, fontWeight: 500 }}>{name}</Text>
  </Column>
);

/** A `Section` is a band across the window. A `Row` puts its `Column`s side by side, and stacks them on phones. Space is `gap` and `padding`, never margins. */
export const SetWidthAndTheRest = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: RUST_HILL, color: PLASTER, padding: [24, 24] }}>
      <Heading level={2} style={{ ...NAME, fontSize: 30 }}>
        Colour of the month
      </Heading>
    </Section>
    <Section style={{ padding: [24, 24, 32] }}>
      <Row style={{ gap: 16 }}>
        <Column style={{ width: 180, gap: 10 }}>
          <Column style={{ height: 132, backgroundColor: RUST_HILL }} />
          <Text style={CAPTION}>width: 180</Text>
        </Column>
        <Column style={{ gap: 8, padding: [16, 18], backgroundColor: BONE, borderRadius: 2 }}>
          <Heading level={3} style={{ ...NAME, fontSize: 24 }}>
            Rust Hill
          </Heading>
          <Paragraph style={{ fontSize: 15 }}>Iron oxide in a chalky base. It’s terracotta by day, and goes the brown of an old saddle after dark.</Paragraph>
          <Text style={CAPTION}>the rest, with a box of its own</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** Children share the width equally; `flex` gives one more of it. */
export const Shares = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 8 }}>
      <Heading level={2} style={{ ...NAME, fontSize: 34, padding: [0, 0, 12] }}>
        The hillside card
      </Heading>
      <Row style={{ gap: 8 }}>{[chip("Bone", BONE, SOOT), chip("Wet Clay", WET_CLAY, SOOT)]}</Row>
      <Row style={{ gap: 8 }}>{[chip("Sea Kale", SEA_KALE, SOOT), chip("Old Moss", OLD_MOSS), chip("Lamp Black", LAMP_BLACK)]}</Row>
      <Row style={{ gap: 8 }}>{[chip("Yellow Earth", YELLOW_EARTH, SOOT), chip("Rust Hill", RUST_HILL), chip("Chalk Blue", CHALK_BLUE, SOOT), chip("Flax", FLAX, SOOT)]}</Row>
      <Row style={{ gap: 8 }}>
        <Column style={{ ...CHIP, flex: 1, backgroundColor: OLD_MOSS, color: PLASTER }}>
          <Text style={{ fontFamily: MONO, fontSize: 12 }}>flex: 1</Text>
        </Column>
        <Column style={{ ...CHIP, flex: 2, backgroundColor: RUST_HILL, color: PLASTER }}>
          <Text style={{ fontFamily: MONO, fontSize: 12 }}>flex: 2</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A tall chip and its name: `alignItems` says where the name sits beside it. */
const placed = (name: string, color: string, alignItems: "start" | "center" | "end") => (
  <Row stackOnMobile={false} style={{ gap: 16, alignItems, padding: [12, 0], border: { top: `1px solid ${RULE}` } }}>
    <Column style={{ width: 88, height: 88, backgroundColor: color }} />
    <Column style={{ gap: 2 }}>
      <Text style={{ ...NAME, fontSize: 22 }}>{name}</Text>
      <Text style={CAPTION}>alignItems: "{alignItems}"</Text>
    </Column>
  </Row>
);

/** `alignItems` says where children of different heights sit, and `justifyContent` where they sit along the row. */
export const Alignment = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [28, 24] }}>
      {placed("Yellow Earth", YELLOW_EARTH, "start")}
      {placed("Sea Kale", SEA_KALE, "center")}
      {placed("Old Moss", OLD_MOSS, "end")}
      <Row style={{ justifyContent: "end", padding: [16, 0, 0], border: { top: `1px solid ${SOOT}` } }}>
        <Column style={{ width: 200 }}>
          <Text style={{ fontWeight: 600, textAlign: "right" }}>From £48 for 2.5 litres</Text>
          <Text style={{ ...CAPTION, textAlign: "right" }}>justifyContent: "end"</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A `Row` stacks on phones unless `stackOnMobile={false}` keeps it side by side: choose "phone" under width to see it. */
export const KeptOnPhones = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [28, 24], gap: 16 }}>
      <Text style={CAPTION}>A Row: stacks on phones</Text>
      <Row style={{ gap: 12 }}>
        <Column style={{ gap: 4, padding: [16, 18], backgroundColor: BONE }}>
          <Text style={{ ...NAME, fontSize: 22 }}>Matt</Text>
          <Text style={{ fontSize: 14, color: QUIET }}>For walls and ceilings. Hides a multitude.</Text>
        </Column>
        <Column style={{ gap: 4, padding: [16, 18], backgroundColor: BONE }}>
          <Text style={{ ...NAME, fontSize: 22 }}>Eggshell</Text>
          <Text style={{ fontSize: 14, color: QUIET }}>For wood and metal. Wipes clean.</Text>
        </Column>
      </Row>
      <Text style={{ ...CAPTION, padding: [8, 0, 0] }}>stackOnMobile={"{false}"}: stays side by side</Text>
      <Row stackOnMobile={false} style={{ gap: 12 }}>
        <Column style={{ gap: 2, padding: [16, 18], backgroundColor: SOOT, color: PLASTER }}>
          <Text style={{ fontSize: 13 }}>2.5 litres</Text>
          <Text style={{ ...NAME, fontSize: 28 }}>£48</Text>
        </Column>
        <Column style={{ gap: 2, padding: [16, 18], backgroundColor: SOOT, color: PLASTER }}>
          <Text style={{ fontSize: 13 }}>5 litres</Text>
          <Text style={{ ...NAME, fontSize: 28 }}>£84</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

const FAMILIES = [
  ["Earths", RUST_HILL],
  ["Chalks", CHALK_BLUE],
  ["Greens", OLD_MOSS],
  ["Ochres", YELLOW_EARTH],
  ["Blacks", LAMP_BLACK],
  ["Whites", BONE],
  ["Limewash", FLAX],
  ["Exterior", SEA_KALE],
  ["North rooms", WET_CLAY],
  ["Small kitchens", YELLOW_EARTH],
];

/** `flexWrap: "wrap"` moves what doesn't fit to another line, in a row kept side by side on phones. */
export const Wrapping = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 14 }}>
      <Heading level={2} style={{ ...NAME, fontSize: 34 }}>
        Browse the card
      </Heading>
      <Row stackOnMobile={false} style={{ gap: 18, flexWrap: "wrap" }}>
        {FAMILIES.map(([family, color]) => (
          <Text key={family} style={{ flex: "none", padding: [8, 2, 4], fontSize: 15, fontWeight: 500, border: { bottom: `3px solid ${color}` } }}>
            {family}
          </Text>
        ))}
      </Row>
      <Text style={{ ...CAPTION, padding: [6, 0, 0] }}>flexWrap: "wrap" · stackOnMobile={"{false}"}</Text>
    </Section>
  </Root>
));

/** A corner of a room painted in Rust Hill: an arched doorway, a floor, a stool and a jug. */
const ROOM = drawing(
  480,
  360,
  `<rect width="480" height="360" fill="${RUST_HILL}"/><path d="M84 288V128a72 72 0 0 1 144 0v160z" fill="${BONE}"/><path d="M84 288V128a72 72 0 0 1 72-72v232z" fill="${FLAX}"/><rect y="288" width="480" height="72" fill="#6F4A35"/><rect y="282" width="480" height="6" fill="${BONE}"/><rect x="316" y="214" width="92" height="10" fill="${LAMP_BLACK}"/><path d="M328 224l-10 64h8l12-64zM396 224l10 64h-8l-12-64z" fill="${LAMP_BLACK}"/><path d="M346 214c-8-22-4-40 8-48v-16h18v16c12 8 16 26 8 48z" fill="${PLASTER}"/><path d="M362 150c-6-30-24-52-42-60M364 150c2-26 12-48 30-62" stroke="${OLD_MOSS}" stroke-width="3" fill="none"/>`
);

/** A picture beside its words, the words in the middle of the row's height, as for a product's feature. */
export const PictureAndWords = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [28, 24] }}>
      <Row style={{ gap: 28, alignItems: "center" }} mobile={{ gap: 20 }}>
        <Column>
          <Image src={ROOM} alt="A corner of a room painted in Rust Hill, with an arched doorway, a black stool and a white jug of twigs" style={{ width: "100%" }} />
        </Column>
        <Column style={{ gap: 12, alignItems: "start" }}>
          <Text style={CAPTION}>No. 41</Text>
          <Heading level={3} style={{ ...NAME, fontSize: 30 }} mobile={{ fontSize: 24 }}>
            Rust Hill, in a north room
          </Heading>
          <Paragraph style={{ fontSize: 15, color: QUIET }}>North light cools most colours. This one keeps its warmth until the lamps come on.</Paragraph>
          <Button href={`${SITE}/rust-hill`} style={{ backgroundColor: RUST_HILL, color: PLASTER, fontSize: 15, fontWeight: 600, padding: [12, 22], borderRadius: 2 }} hover={{ backgroundColor: RUST_DOWN }}>
            Order a sample pot
          </Button>
        </Column>
      </Row>
    </Section>
  </Root>
));
