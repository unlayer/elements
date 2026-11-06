/**
 * Dividers as Pith (a fictional weekly letter about food) uses them: a newspaper's manners, where
 * the rule does the work a box would do elsewhere. Newsprint cream and one tomato red, Bodoni Moda
 * for the headlines, Source Serif 4 for what's read, DM Mono for the quiet notes.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Divider, Heading, LineBreak, Paragraph, Row, Section, Text, type EmailProps, type SectionProps } from "../../index";

const PAPER = "#F5F0E6";
const INK = "#1D1B18";
const QUIET = "#6A645A";
const RULE = "#9C9484";
const TOMATO = "#B83A26";

const DISPLAY = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif";
const TEXT = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const root: Pick<EmailProps, "width" | "fonts" | "style"> = {
  width: 560,
  fonts: [
    { family: "Bodoni Moda", src: "https://fonts.gstatic.com/s/bodonimoda/v28/aFTQ7PxzY382XsXX63LUYJSKSKjWXFBP.woff2", format: "woff2", weight: "400 900" },
    { family: "Bodoni Moda", src: "https://fonts.gstatic.com/s/bodonimoda/v28/aFTS7PxzY382XsXX63LUYJSPeKrcW3JNsao.woff2", format: "woff2", weight: "400 900", style: "italic" },
    { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFI2_tTDB4M7-auWDN0ahZJW1gb8te1Xb7G.woff2", format: "woff2", weight: "200 900" },
    { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFK2_tTDB4M7-auWDN0ahZJW1gewtW_WpzEpMs.woff2", format: "woff2", weight: "200 900", style: "italic" },
    { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
  ],
  style: { backgroundColor: PAPER, color: INK, fontFamily: TEXT, fontSize: 17, lineHeight: 1.6 },
};

const kicker = { fontSize: 12, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: TOMATO } as const;
/** A quiet mono note on what a divider sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const headline = { fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.1 } as const;

/** The band each story is drawn in. */
const band = (children: ReactNode, style: SectionProps["style"] = {}) => (
  <Section style={{ padding: [28, 44, 44], gap: 20, ...style }} mobile={{ padding: [20, 22, 36] }}>
    {children}
  </Section>
);

/** Pith's nameplate, small: its name, and the issue. */
const nameplate = (issue: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 8], border: { bottom: `1px solid ${INK}` } }}>
    <Column style={{ width: 80 }}>
      <Text style={{ fontFamily: DISPLAY, fontSize: 32, fontStyle: "italic", fontWeight: 500, lineHeight: "32px", letterSpacing: -0.6 }}>Pith</Text>
    </Column>
    <Column>
      <Text style={{ ...kicker, color: INK, textAlign: "right" }}>{issue}</Text>
    </Column>
  </Row>
);

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

/** A reader's letter, and who sent it. */
const letter = (body: string, from: string) => (
  <Column style={{ gap: 6 }}>
    <Paragraph style={{ fontSize: 17, lineHeight: 1.55 }}>{body}</Paragraph>
    <Text style={{ fontSize: 14, fontStyle: "italic", color: QUIET }}>{from}</Text>
  </Column>
);

/** With nothing set: a thin gray line, the whole width. */
export const Default = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {nameplate("Letters · No. 112")}
        <Heading level={2} style={{ ...headline, fontSize: 34, padding: [6, 0, 0] }}>
          Your letters on pears
        </Heading>
        {letter("My grandfather kept a Barland pear behind the cowshed. It outlived him by sixty years, and it’s still the first thing in the valley to flower.", "Joan Pritchard, Ledbury")}
        <Divider />
        {letter("You say a perry pear takes a lifetime to bear. Mine took eleven years, and it has sulked ever since.", "Owen Hale, Upton-upon-Severn")}
        <Divider />
        {letter("Please stop. I’ve now planted three, and my wife has noticed.", "Name and address supplied")}
        <Text style={{ ...note, padding: [8, 0, 0] }}>{"<Divider />, with nothing set"}</Text>
      </>
    )}
  </Root>
));

/** One of the paper's rules: what it's for, the line, and how it's written. */
const houseRule = (what: string, line: ReactNode, written: string) => (
  <Column style={{ gap: 10 }}>
    <Text style={{ fontSize: 17, lineHeight: 1.3, fontStyle: "italic" }}>{what}</Text>
    {line}
    <Text style={note}>{written}</Text>
  </Column>
);

/** `borderTop` is written as CSS writes it, or as `{ width, style, color }`: solid, dashed, dotted, heavy, in a color. */
export const Lines = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {nameplate("The style book, p. 9")}
        <Heading level={2} style={{ ...headline, fontSize: 34, padding: [6, 0, 8] }}>
          Four rules,
          <LineBreak />
          and their jobs
        </Heading>
        <Column style={{ gap: 28 }}>
          {houseRule("Between one story and the next", <Divider style={{ borderTop: `1px solid ${RULE}` }} />, '"1px solid #9C9484"')}
          {houseRule("Around anything you’re meant to cut out", <Divider style={{ borderTop: `1px dashed ${RULE}` }} />, '"1px dashed #9C9484"')}
          {houseRule("Between the steps of a recipe", <Divider style={{ borderTop: `2px dotted ${RULE}` }} />, '"2px dotted #9C9484"')}
          {houseRule("Over the name of a section, and nowhere else", <Divider style={{ borderTop: { width: 4, style: "solid", color: TOMATO } }} />, '{ width: 4, style: "solid", color }')}
        </Column>
      </>
    )}
  </Root>
));

/** `width` makes it shorter than its place, in px or as a share. */
export const Widths = story((Root) => (
  <Root {...root}>
    {band(
      <>
        <Paragraph style={{ fontFamily: DISPLAY, fontSize: 26, fontStyle: "italic", lineHeight: 1.3 }} mobile={{ fontSize: 22 }}>
          “Nobody plants a pear tree for themselves. You plant it for whoever’s left.”
        </Paragraph>
        <Text style={{ ...kicker, color: QUIET, padding: [0, 0, 16] }}>Mary Holloway, Bredon Hill Farm</Text>
        <Divider style={{ borderTop: `2px solid ${TOMATO}`, width: "80%" }} />
        <Divider style={{ borderTop: `2px solid ${TOMATO}`, width: "50%" }} />
        <Divider style={{ borderTop: `2px solid ${TOMATO}`, width: 80 }} />
        <Text style={{ ...note, padding: [12, 0, 0] }}>width: "80%", "50%" and 80, centered by the stack</Text>
      </>,
      { padding: [48, 44, 48], gap: 12, alignItems: "center", textAlign: "center" }
    )}
  </Root>
));

/** `padding` is the space around the line, and `mobile` has its width and padding on phones. */
export const Spacing = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {nameplate("The long read · No. 112")}
        <Heading level={2} style={{ ...headline, fontSize: 34, padding: [24, 0] }}>
          The last perry pears of the Vale of Evesham
        </Heading>
        <Paragraph>The trees are older than the farmhouse. Some of them went in when Victoria was a girl, and they’ve outlived every Holloway who planted them.</Paragraph>
        <Divider style={{ borderTop: `1px solid ${RULE}`, padding: [24, 0] }} />
        <Paragraph>What Mary’s heirs will inherit is less clear. The last perry mill in the county closed in the spring, so this autumn she pressed the harvest herself.</Paragraph>
        <Divider style={{ borderTop: `2px solid ${TOMATO}`, width: "50%", padding: [32, 0] }} mobile={{ width: "100%", padding: [16, 0] }} />
        <Paragraph>It came to four hundred litres, in a borrowed press, in her own barn.</Paragraph>
        <Text style={{ ...note, padding: [24, 0, 0] }}>No gap here: each line’s own padding spaces it. On phones the red one runs the whole width, with less space.</Text>
      </>,
      { gap: 0 }
    )}
  </Root>
));
