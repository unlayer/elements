/**
 * Headings as Strandline (a fictional quarterly about Britain's coasts) sets them: a magazine that
 * lives by its type. Sea-fog paper, kelp-black ink and one sea-glass green. Fraunces for the voice,
 * Instrument Sans for the small print, DM Mono for the quiet notes on what each heading sets.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, LineBreak, Link, MergeTag, Text, Row, Section, Table, TableCell, TableRow, type EmailProps, type SectionProps } from "../../index";

const FOG = "#F0EFE8";
const INK = "#18211E";
const QUIET = "#5E6A64";
const RULE = "#D2D4C9";
const TINT = "#E3E4DA";
const GLASS = "#17676C";
const WHITE = "#FBFBF7";

const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://strandline.example";

const root: Pick<EmailProps, "width" | "fonts" | "style"> = {
  width: 560,
  fonts: [
    { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeP2Xz5c.woff2", format: "woff2", weight: "100 900" },
    { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU58FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChjeveQ7ZXk8g.woff2", format: "woff2", weight: "100 900", style: "italic" },
    { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" },
    { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
  ],
  style: { backgroundColor: FOG, color: INK, fontFamily: SERIF, fontSize: 16, lineHeight: 1.55 },
};

/** Small sans capitals: labels. */
const label = { fontFamily: SANS, fontSize: 12, fontWeight: 600, lineHeight: 1.5, letterSpacing: 1.3, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what a heading sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const reading = { fontFamily: SANS, fontSize: 16, lineHeight: 1.55, color: QUIET };

/** The band each story is drawn in. */
const band = (children: ReactNode, style: SectionProps["style"] = {}) => (
  <Section style={{ padding: [28, 44, 44], gap: 20, ...style }} mobile={{ padding: [20, 22, 32] }}>
    {children}
  </Section>
);

/** Strandline's name and which issue this is, over a rule. */
const masthead = (issue = "No. 14 · Winter") => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 8], border: { bottom: `1px solid ${INK}` } }}>
    <Column style={{ width: 150 }}>
      <Text style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, lineHeight: "28px" }}>Strandline</Text>
    </Column>
    <Column>
      <Text style={{ ...label, color: INK, textAlign: "right" }}>{issue}</Text>
    </Column>
  </Row>
);

const meta: Meta<Args> = {
  title: "Components/Heading",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A heading, from `level={1}` to `level={6}`, with its size, color and box in `style`. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A heading on the specimen sheet: its level and size at the left, and the heading beside it. */
const specimen = (level: 1 | 2 | 3 | 4 | 5 | 6, size: number, heading: ReactNode) => (
  <Row style={{ gap: 12, padding: [14, 0, 16], ...(level > 1 && { border: { top: `1px solid ${RULE}` } }) }} mobile={{ gap: 6 }}>
    <Column style={{ width: 72 }}>
      <Text style={{ ...note, lineHeight: "18px" }}>
        level {level}
        <LineBreak />
        {size} px
      </Text>
    </Column>
    <Column>{heading}</Column>
  </Row>
);

/** The six levels, each with its size set in `style`. */
export const Levels = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead()}
        <Column style={{ gap: 0 }}>
          {specimen(1, 40, <Heading level={1} style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.08, letterSpacing: -1 }}>The tide pools at Porth Ledden</Heading>)}
          {specimen(2, 30, <Heading level={2} style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5 }}>Low water, before breakfast</Heading>)}
          {specimen(3, 23, <Heading level={3} style={{ fontSize: 23, fontWeight: 500, lineHeight: 1.2 }}>What lives in the upper pools</Heading>)}
          {specimen(4, 19, <Heading level={4} style={{ fontFamily: SANS, fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>Beadlet anemone</Heading>)}
          {specimen(5, 16, <Heading level={5} style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>Where to look: under the ledges</Heading>)}
          {specimen(6, 12, <Heading level={6} style={label}>Field note 14</Heading>)}
        </Column>
      </>
    )}
  </Root>
));

/** A color, a lighter weight, tight spacing, capitals, a decoration: all in `style`. */
export const Styles = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead()}
        <Column style={{ gap: 14, padding: [12, 0, 8] }}>
          <Heading level={2} style={{ fontFamily: SANS, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: QUIET }}>
            This issue’s long read
          </Heading>
          <Heading level={2} style={{ fontSize: 72, fontWeight: 800, lineHeight: 0.98, letterSpacing: -3 }} mobile={{ fontSize: 52, letterSpacing: -2 }}>
            The kelp
            <LineBreak />
            is leaving.
          </Heading>
          <Heading level={2} style={{ fontSize: 28, fontWeight: 300, lineHeight: 1.2, letterSpacing: -0.4 }} mobile={{ fontSize: 24 }}>
            Why the forests off the south-west are thinning, and who’s counting them.
          </Heading>
        </Column>
        <Column style={{ gap: 10, padding: [18, 0, 0], border: { top: `1px solid ${RULE}` } }}>
          <Heading level={2} style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.2, color: GLASS }}>
            A field guide to the tideline
          </Heading>
          <Heading level={2} style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, lineHeight: 1.3 }}>
            Also: how to read a tide table, and why you should
          </Heading>
          <Heading level={2} style={{ fontSize: 18, fontStyle: "italic", fontWeight: 400, textDecoration: "underline" }}>
            Read it all online
          </Heading>
        </Column>
        <Text style={note}>Capitals, large and tight, a lighter weight, a color, another font, a line under: all in style</Text>
      </>
    )}
  </Root>
));

/** `textAlign` puts it on either side or in the center, and `maxWidth` keeps it from running the whole width. */
export const Alignment = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Tide tables")}
        <Column style={{ gap: 4, padding: [20, 0, 12] }}>
          <Heading level={2} style={{ fontSize: 44, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, letterSpacing: -1, textAlign: "left" }} mobile={{ fontSize: 36 }}>
            Out at six,
          </Heading>
          <Heading level={2} style={{ fontSize: 44, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, letterSpacing: -1, textAlign: "center" }} mobile={{ fontSize: 36 }}>
            slack at noon,
          </Heading>
          <Heading level={2} style={{ fontSize: 44, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, letterSpacing: -1, textAlign: "right", color: GLASS }} mobile={{ fontSize: 36 }}>
            back by dusk.
          </Heading>
        </Column>
        <Column style={{ gap: 12, padding: [18, 0, 0], border: { top: `1px solid ${RULE}` } }}>
          <Heading level={3} style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.2, maxWidth: 260 }}>
            Every tide on the south-west coast
          </Heading>
          <Text style={note}>textAlign: "left", "center", "right"; maxWidth: 260</Text>
        </Column>
      </>
    )}
  </Root>
));

/** A heading holds what text holds: a `Link`, a `MergeTag`. */
export const LinksAndMergeTags = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead()}
        <Column style={{ gap: 12, padding: [16, 0, 0] }}>
          <Heading level={2} style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.8 }} mobile={{ fontSize: 32 }}>
            Good morning, <MergeTag name="first_name" />
          </Heading>
          <Text style={reading}>Your copy left the printer on Tuesday, and it should be on your mat by Saturday. While you wait, it’s all online:</Text>
        </Column>
        <Heading level={2} style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.2, padding: [18, 0, 0], border: { top: `1px solid ${RULE}` } }}>
          <Link href={`${SITE}/14/the-kelp-is-leaving`} style={{ color: GLASS, textDecoration: "none" }} hover={{ textDecoration: "underline" }}>
            The kelp is leaving, and other stories from Winter
          </Link>
        </Heading>
        <Text style={note}>A MergeTag in one, a Link in the other, underlined under the pointer</Text>
      </>
    )}
  </Root>
));

/** A line of the week's tides. */
const tide = (day: string, high: string, low: string) => (
  <TableRow>
    <TableCell style={{ padding: [6, 0], lineHeight: "21px" }}>{day}</TableCell>
    <TableCell style={{ padding: [6, 0], fontFamily: MONO, fontSize: 13, lineHeight: "21px" }}>{high}</TableCell>
    <TableCell style={{ padding: [6, 0], fontFamily: MONO, fontSize: 13, lineHeight: "21px", textAlign: "right" }}>{low}</TableCell>
  </TableRow>
);

/** A heading is a box too: a background, padding, a line under it, round corners. */
export const Boxes = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("The back pages")}
        <Column style={{ gap: 10 }}>
          <Heading level={3} style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, padding: [10, 14], backgroundColor: TINT, borderRadius: 4 }}>
            This week’s tides at Porth Ledden
          </Heading>
          <Table style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.4, rowBorder: `1px solid ${RULE}` }}>
            {tide("Saturday", "High 06:14", "Low 12:31")}
            {tide("Sunday", "High 06:58", "Low 13:12")}
          </Table>
        </Column>
        <Column style={{ gap: 10, padding: [10, 0, 0] }}>
          <Heading level={3} style={{ fontSize: 24, fontWeight: 500, padding: [0, 0, 8], border: { bottom: `2px solid ${GLASS}` } }}>
            Birds to look for
          </Heading>
          <Text style={reading}>Turnstones on the slip at low water, and a purple sandpiper on the outer rocks, if you’re lucky and it’s cold.</Text>
        </Column>
        <Heading level={3} style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.25, padding: [18, 16], backgroundColor: GLASS, color: WHITE, textAlign: "center" }} mobile={{ fontSize: 19 }}>
          No. 15 ships on the spring tide
        </Heading>
        <Text style={note}>A background and corners; a line under it; a band, its text in the center</Text>
      </>
    )}
  </Root>
));

/** `mobile` has its size, alignment and padding on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead()}
        <Heading level={1} style={{ fontSize: 54, fontWeight: 500, lineHeight: 1.02, letterSpacing: -1.8, padding: [24, 0, 4] }} mobile={{ fontSize: 34, textAlign: "center", padding: [12, 0, 0] }}>
          The last bench on the harbour wall
        </Heading>
        <Text style={reading} mobile={{ textAlign: "center" }}>
          Forty years of watching the same water, from the same plank, with the same flask.
        </Text>
        <Text style={note} mobile={{ textAlign: "center" }}>
          fontSize: 54; on phones 34, centered, with less padding
        </Text>
      </>
    )}
  </Root>
));
