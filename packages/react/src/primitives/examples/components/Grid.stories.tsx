/**
 * Grids as Loam (a fictional maker of earth-pigment paint) uses them: its colour cards are grids, so
 * the swatches do the talking, on chalk paper, with near-black ink. Jost for words, DM Mono for
 * paint numbers and the quiet notes on what each grid sets.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Grid, Heading, LineBreak, Text, Row, Section, Span, type EmailProps } from "../../index";

const CHALK = "#F6F3EC";
const CARD = "#FFFDF8";
const INK = "#23211E";
const QUIET = "#6B675E";
const RULE = "#DDD8CC";

const SANS = "Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const root: Pick<EmailProps, "width" | "fonts" | "style"> = {
  width: 560,
  fonts: [
    { family: "Jost", src: "https://fonts.gstatic.com/s/jost/v20/92zatBhPNqw73oTd4jQmfxI.woff2", format: "woff2", weight: "100 900" },
    { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
  ],
  style: { backgroundColor: CHALK, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 },
};

/** Loam's colours: a name, a number, the pigment, and whether light text sits on it. */
type Paint = [name: string, number: string, color: string, light?: boolean];
const BRACKEN: Paint = ["Bracken", "No. 14", "#8A6A3B", true];
const SEA_COAL: Paint = ["Sea Coal", "No. 31", "#2B2E2F", true];
const CHALK_HILL: Paint = ["Chalk Hill", "No. 2", "#E7E0D0"];
const MADDER: Paint = ["Madder", "No. 22", "#7E2F2C", true];
const OCHRE_PIT: Paint = ["Ochre Pit", "No. 9", "#C4923F"];
const VERDIGRIS: Paint = ["Verdigris", "No. 27", "#5D8878", true];
const OLD_BRICK: Paint = ["Old Brick", "No. 18", "#9C5238", true];
const DOCK_LEAF: Paint = ["Dock Leaf", "No. 25", "#5C6B3C", true];
const TALLOW: Paint = ["Tallow", "No. 5", "#E3D4AF"];
const WET_SLATE: Paint = ["Wet Slate", "No. 29", "#4F5B62", true];
const PEAT: Paint = ["Peat", "No. 33", "#43342A", true];
const LICHEN: Paint = ["Lichen", "No. 11", "#A3A77F"];
const RHUBARB: Paint = ["Rhubarb", "No. 20", "#A84E47", true];
const FLINT: Paint = ["Flint", "No. 28", "#8B8A83"];
const REED: Paint = ["Reed", "No. 7", "#C7B98F"];
const HARBOUR: Paint = ["Harbour", "No. 30", "#2F4A53", true];
const ASH: Paint = ["Ash Bud", "No. 12", "#B8B4A2"];

/** A swatch: a block of the paint, with its name and number at the foot. */
const swatch = ([name, number, color, light]: Paint, height = 56) => (
  <Column key={name} style={{ gap: 0, padding: [height, 14, 12], backgroundColor: color, color: light ? CARD : INK }} mobile={{ padding: [20, 14, 12] }}>
    <Text style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.25 }}>{name}</Text>
    <Text style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.4 }}>{number}</Text>
  </Column>
);

/** Small mono capitals: labels. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what a grid sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;

/** The band each story is drawn in. */
const band = (children: ReactNode) => (
  <Section style={{ padding: [28, 44, 44], gap: 24 }} mobile={{ padding: [20, 20, 32], gap: 20 }}>
    {children}
  </Section>
);

/** Loam's name, what this page is, and its headline. */
const masthead = (page: string, title?: ReactNode) => (
  <Column style={{ gap: 16 }}>
    <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 10], border: { bottom: `1px solid ${INK}` } }}>
      <Column style={{ width: 90 }}>
        <Text style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.5, lineHeight: "26px" }}>loam</Text>
      </Column>
      <Column>
        <Text style={{ ...label, textAlign: "right" }}>{page}</Text>
      </Column>
    </Row>
    {title ? (
      <Heading level={2} style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.4 }} mobile={{ fontSize: 26 }}>
        {title}
      </Heading>
    ) : null}
  </Column>
);

/** A quiet note, then a grid. */
const noted = (what: string, grid: ReactNode) => (
  <Column style={{ gap: 8 }}>
    <Text style={note}>{what}</Text>
    {grid}
  </Column>
);

const meta: Meta<Args> = {
  title: "Components/Grid",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Its children in columns of equal width, row after row, and on phones one under another. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** `columns` is how many children to a row; a last row that's short keeps their width. */
export const Columns = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead(
          "Colour card, autumn 2026",
          <>
            Seventeen colours,
            <LineBreak />
            all from the ground.
          </>
        )}
        {noted("columns={2}", <Grid columns={2} style={{ gap: 8 }}>{[BRACKEN, SEA_COAL, CHALK_HILL, MADDER].map((paint) => swatch(paint, 72))}</Grid>)}
        {noted("columns={3}, and a short last row", <Grid columns={3} style={{ gap: 8 }}>{[OCHRE_PIT, VERDIGRIS, OLD_BRICK, DOCK_LEAF, TALLOW].map((paint) => swatch(paint))}</Grid>)}
        {noted("columns={4}", <Grid columns={4} style={{ gap: 8 }}>{[WET_SLATE, PEAT, LICHEN, RHUBARB, FLINT, REED, HARBOUR, ASH].map((paint) => swatch(paint, 40))}</Grid>)}
      </>
    )}
  </Root>
));

/** `gap` is the space across and down, unless `rowGap` sets the space between rows; `mobile` has others on phones. */
export const Gaps = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead(
          "Colour card, autumn 2026",
          <>
            Colours look different
            <LineBreak />
            with room around them.
          </>
        )}
        {noted("gap: 2", <Grid columns={3} style={{ gap: 2 }}>{[BRACKEN, TALLOW, PEAT, OCHRE_PIT, REED, OLD_BRICK].map((paint) => swatch(paint, 36))}</Grid>)}
        {noted("gap: 24", <Grid columns={3} style={{ gap: 24 }}>{[VERDIGRIS, CHALK_HILL, HARBOUR, DOCK_LEAF, LICHEN, WET_SLATE].map((paint) => swatch(paint, 36))}</Grid>)}
        {noted("gap: 8, rowGap: 32; gap: 4 on phones", <Grid columns={3} style={{ gap: 8, rowGap: 32 }} mobile={{ gap: 4 }}>{[MADDER, RHUBARB, ASH, SEA_COAL, FLINT, TALLOW].map((paint) => swatch(paint, 36))}</Grid>)}
      </>
    )}
  </Root>
));

/** A finish: a block of text in a cell. */
const finish = (name: string, body: string) => (
  <Text style={{ padding: [12, 14], backgroundColor: CARD, fontSize: 15, lineHeight: 1.45 }}>
    <Span style={{ fontWeight: 600 }}>{name}</Span>
    {body}
  </Text>
);

/** A sheen, beside its finish. */
const sheen = (percent: string, [, , color]: Paint) => <Text style={{ padding: [12, 14], backgroundColor: color, fontFamily: MONO, fontSize: 13, textAlign: "center" }}>{percent}</Text>;

/** `alignItems` is where each child sits in its row's height. */
export const Alignment = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead(
          "Finishes",
          <>
            Three sheens,
            <LineBreak />
            and where each one belongs.
          </>
        )}
        {noted(
          'alignItems: "start"',
          <Grid columns={2} style={{ gap: 8, alignItems: "start" }}>
            {finish("Matt. ", "Flat as old limewash. Hides a bumpy wall, and marks if you lean on it, so keep it for a bedroom.")}
            {sheen("2% sheen", CHALK_HILL)}
          </Grid>
        )}
        {noted(
          'alignItems: "center"',
          <Grid columns={2} style={{ gap: 8, alignItems: "center" }}>
            {finish("Eggshell. ", "A soft glow that wipes clean. The one for a kitchen, a hallway, or a house with children in it.")}
            {sheen("15% sheen", TALLOW)}
          </Grid>
        )}
        {noted(
          'alignItems: "end"',
          <Grid columns={2} style={{ gap: 8, alignItems: "end" }}>
            {finish("Gloss. ", "Hard, bright and honest about the wood underneath. Doors, window frames, and little else.")}
            {sheen("70% sheen", OCHRE_PIT)}
          </Grid>
        )}
      </>
    )}
  </Root>
));

/** A grid goes one under another on phones unless `stackOnMobile={false}` keeps its columns: choose "phone" under width to see it. */
export const KeptOnPhones = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Rooms", "A hallway, in three colours.")}
        {noted("As it comes: one under another on phones", <Grid columns={3} style={{ gap: 8 }}>{[TALLOW, OLD_BRICK, PEAT].map((paint) => swatch(paint, 64))}</Grid>)}
        {noted("stackOnMobile={false}: three to a row on phones too", <Grid columns={3} stackOnMobile={false} style={{ gap: 8 }}>{[REED, DOCK_LEAF, SEA_COAL].map((paint) => swatch(paint, 64))}</Grid>)}
      </>
    )}
  </Root>
));

/** What Loam does beside the paint: its name, what it means, and a stripe of one of its colours. */
const SERVICES: [string, string, string][] = [
  ["Sample pots", "Enough for a square metre, posted the same day, £4 each.", BRACKEN[2]],
  ["A colour visit", "Hattie comes to the house for an hour, and paints on the walls.", VERDIGRIS[2]],
  ["Delivery", "On a pallet to your door, within the week, free over £200.", MADDER[2]],
  ["Second thoughts", "Unopened tins come back, any time within the year, at our cost.", OCHRE_PIT[2]],
];

/** A grid has a box of its own: here services in a tinted panel, two to a row. */
export const Services = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead(
          "Beside the paint",
          <>
            We’d rather you got it
            <LineBreak />
            right first time.
          </>
        )}
        <Grid columns={2} style={{ gap: 10, padding: 10, backgroundColor: RULE, borderRadius: 4 }}>
          {SERVICES.map(([name, line, color]) => (
            <Column key={name} style={{ gap: 6, padding: [16, 18, 20], backgroundColor: CARD, border: { top: `4px solid ${color}` } }}>
              <Heading level={3} style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.2 }}>
                {name}
              </Heading>
              <Text style={{ fontSize: 15, lineHeight: 1.45, color: QUIET }}>{line}</Text>
            </Column>
          ))}
        </Grid>
      </>
    )}
  </Root>
));
