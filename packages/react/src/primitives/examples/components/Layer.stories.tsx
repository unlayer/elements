import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, Layer, LineBreak, Paragraph, Row, Section, Span } from "../../index";
import { caption, drawing, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Layer",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Its children over each other, in one box: an image with words on it. In an email, that's an `Image` with one child over it. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Wayfell (a fictional maker of walking maps for the high country).
 *
 * Its pictures are the fells themselves: ridge behind ridge in flat color, like the shaded relief on
 * its maps. DM Serif Display for the voice, Hanken Grotesk for the facts, bone and pine, and the
 * rust of its map covers where the eye should land.
 */
const BONE = "#F1ECE0";
const CARD = "#FBF8F1";
const PINE = "#14261F";
const QUIET = "#5C675E";
const RUST = "#A8441F";

const SERIF = "'DM Serif Display', Georgia, serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://wayfell.example";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "DM Serif Display", src: "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Bx0vrx52g.woff2", format: "woff2", weight: 400 },
    { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" },
    MONO_FONT,
  ],
  style: { backgroundColor: BONE, color: PINE, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 },
};

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase" } as const;

/** A ridge across the picture: a few waves laid over each other, walked in short straight steps. */
const ridge = (width: number, base: number, rise: number, phase: number, fill: string) => {
  const steps = Array.from({ length: Math.ceil(width / 30) + 1 }, (_, i) => {
    const height = Math.sin(i * 0.17 + phase) * 0.62 + Math.sin(i * 0.47 + phase * 2) * 0.26 + Math.sin(i * 1.3 + phase * 3) * 0.12;
    return `${i * 30} ${Math.round(base - rise * height)}`;
  });
  return `<path d="M${steps.join("L")}V9999H0Z" fill="${fill}"/>`;
};

/** The fells as a picture: a sky, perhaps a sun, and ridges from the farthest to the nearest. */
const fells = (width: number, height: number, sky: string, sun: string, ridges: Array<[base: number, rise: number, phase: number, fill: string]>) =>
  drawing(width, height, `<rect width="${width}" height="${height}" fill="${sky}"/>${sun}${ridges.map(([base, rise, phase, fill]) => ridge(width, base, rise, phase, fill)).join("")}`);

const DAWN = fells(1200, 920, "#EFD9B4", `<circle cx="850" cy="500" r="104" fill="#C9592B"/>`, [
  [590, 70, 0.6, "#CDBF9D"],
  [670, 66, 1.9, "#93A28A"],
  [750, 60, 3.1, "#507263"],
  [840, 48, 4.4, "#1C352C"],
]);

/** Words and a button over a picture: `height` is the box's, and the picture covers it. */
export const WordsOverAPicture = story((Root) => (
  <Root {...root}>
    <Section style={{ gap: 12 }} mobile={{ gap: 10 }}>
      <Layer style={{ height: 460, alignItems: "start" }}>
        <Image src={DAWN} alt="Four ridges of fell, one behind another, under a low rust-coloured sun" style={{ width: "100%" }} />
        <Column style={{ padding: [44, 44, 0], gap: 14, alignItems: "start" }} mobile={{ padding: [32, 24, 0] }}>
          <Paragraph style={label}>Wayfell maps, autumn</Paragraph>
          <Heading level={1} style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 400, lineHeight: 1, letterSpacing: -0.5 }} mobile={{ fontSize: 46 }}>
            Into the hills
          </Heading>
          <Paragraph style={{ fontSize: 17, lineHeight: 1.45, maxWidth: 340 }} mobile={{ fontSize: 16 }}>
            Forty-one routes for the short days, each walked twice before we drew it.
          </Paragraph>
          <Button href={`${SITE}/routes`} style={{ backgroundColor: PINE, color: BONE, fontSize: 15, fontWeight: 600, padding: [13, 24], borderRadius: 2 }} hover={{ backgroundColor: RUST }}>
            Find a route
          </Button>
        </Column>
      </Layer>
      <Paragraph style={{ ...caption(QUIET), padding: [0, 0, 16] }} mobile={{ padding: [0, 24, 16] }}>
        height: 460, and the picture covers it
      </Paragraph>
    </Section>
  </Root>
));

const NORTH_RIDGE = fells(1104, 560, "#D8DED2", `<circle cx="440" cy="136" r="58" fill="#F4F0E2"/>`, [
  [270, 58, 2.2, "#AFBEB0"],
  [340, 60, 0.9, "#7F9A8A"],
  [420, 44, 3.4, "#4A6D5D"],
  [500, 30, 5.2, "#203B31"],
]);

/** One fact about a route: its number over what it counts. */
const fact = (figure: string, what: string) => (
  <Column style={{ gap: 2 }}>
    <Paragraph style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.1 }} mobile={{ fontSize: 24 }}>
      {figure}
    </Paragraph>
    <Paragraph style={{ fontSize: 13, color: QUIET }}>{what}</Paragraph>
  </Column>
);

/** A caption along the bottom, on a band of its own, with the Layer's corners rounded. */
export const Caption = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [40, 24, 44] }} mobile={{ padding: [20, 12, 28] }}>
      <Column style={{ backgroundColor: CARD, borderRadius: 16, padding: 24, gap: 22 }} mobile={{ padding: 16, gap: 18 }}>
        <Layer style={{ height: 280, alignItems: "end", borderRadius: 12 }}>
          <Image src={NORTH_RIDGE} alt="Harrow Fell's north ridge, grey-green under a pale morning sun" style={{ width: "100%" }} />
          <Paragraph style={{ padding: [10, 16], backgroundColor: PINE, color: BONE, fontSize: 14, lineHeight: 1.4 }}>Harrow Fell from the north, last April</Paragraph>
        </Layer>
        <Column style={{ gap: 6, padding: [0, 4] }}>
          <Paragraph style={{ ...label, color: RUST }}>Route 14</Paragraph>
          <Heading level={2} style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, lineHeight: 1.15 }}>
            Harrow Fell by the north ridge
          </Heading>
        </Column>
        <Row stackOnMobile={false} style={{ gap: 16, padding: [16, 4, 4], border: { top: "1px solid #E2DCCD" } }}>
          {fact("11.4 km", "there and back")}
          {fact("640 m", "of climbing")}
          {fact("5 hours", "with lunch")}
        </Row>
      </Column>
    </Section>
  </Root>
));

const FIRST_LIGHT = fells(1200, 288, "#F2E2C9", `<circle cx="840" cy="140" r="44" fill="#E39A58"/>`, [
  [176, 26, 0.4, "#CFC6AC"],
  [214, 24, 2.1, "#9CA88F"],
  [252, 18, 3.3, "#66806F"],
]);
const MIDDAY = fells(1200, 288, "#CEDFD8", `<circle cx="340" cy="62" r="36" fill="#F7F4E8"/>`, [
  [206, 20, 1.3, "#A6BEB0"],
  [234, 18, 2.8, "#749A86"],
  [262, 12, 4.6, "#47705C"],
]);
const LAST_LIGHT = fells(1200, 288, "#B8532A", `<circle cx="300" cy="84" r="46" fill="#EFB777"/>`, [
  [110, 26, 3.1, "#7E3F27"],
  [146, 24, 0.7, "#4C2D22"],
  [172, 18, 1.9, "#21191A"],
]);

/** A band of the day: its picture, and its words where `alignItems` puts them. */
const hour = (picture: { src: string; width: number; height: number }, alt: string, alignItems: "start" | "center" | "end", time: string, name: string, color: string) => (
  <Layer style={{ height: 144, alignItems }}>
    <Image src={picture} alt={alt} style={{ width: "100%" }} />
    <Row stackOnMobile={false} style={{ padding: [14, 20], alignItems: "center", color }}>
      <Column>
        <Paragraph style={{ fontFamily: SERIF, fontSize: 24, lineHeight: 1.1 }}>
          {name}
          <Span style={{ fontFamily: SANS, fontSize: 14 }}> {time}</Span>
        </Paragraph>
      </Column>
      <Column style={{ width: 170 }} mobile={{ width: 142 }}>
        <Paragraph style={{ ...caption(color), textAlign: "right" }}>alignItems: "{alignItems}"</Paragraph>
      </Column>
    </Row>
  </Layer>
);

/** `alignItems` is where its children sit in its height: at the top, in the middle, at the bottom. */
export const Alignment = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [40, 0, 44], gap: 18 }} mobile={{ padding: [28, 0, 32] }}>
      <Heading level={2} style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, lineHeight: 1.1 }} mobile={{ fontSize: 28, padding: [0, 20] }}>
        One day on Harrow Fell
      </Heading>
      <Column style={{ gap: 6 }}>
        {hour(FIRST_LIGHT, "The fell at first light, pale gold, with the sun just up", "start", "05:52", "First light", PINE)}
        {hour(MIDDAY, "The fell at midday, green under a pale sky", "center", "12:30", "Midday", PINE)}
        {hour(LAST_LIGHT, "The fell at last light, dark against a rust sky", "end", "18:14", "Last light", BONE)}
      </Column>
    </Section>
  </Root>
));

/** Stars above where the words sit, and a thin moon: a disc with the sky's color laid over it. */
const STARS = [
  [90, 60], [190, 118], [300, 44], [420, 96], [510, 30], [640, 82], [730, 128], [780, 36], [1110, 104], [1160, 40], [250, 150], [580, 140], [980, 70],
]
  .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${x % 3 === 0 ? 3 : 2}" fill="#E7E2CF"/>`)
  .join("");
const MOON = `<circle cx="880" cy="92" r="34" fill="#E7E2CF"/><circle cx="894" cy="82" r="30" fill="#12211D"/>`;
const NIGHT = fells(1200, 560, "#12211D", STARS + MOON, [
  [410, 40, 1.2, "#22392F"],
  [462, 36, 2.6, "#192C25"],
  [524, 26, 4.1, "#0B1613"],
]);

/** `mobile` has the text's size and alignment on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root {...root}>
    <Section style={{ gap: 12 }}>
      <Layer style={{ height: 280, alignItems: "center", color: BONE, fontFamily: SERIF, fontSize: 44, lineHeight: 1.08 }} mobile={{ fontSize: 30, textAlign: "center" }}>
        <Image src={NIGHT} alt="Black ridges under a clear, starry night" style={{ width: "100%" }} />
        <Paragraph style={{ padding: [0, 44] }} mobile={{ padding: [0, 28] }}>
          Walk until the map
          <LineBreak />
          runs out.
        </Paragraph>
      </Layer>
      <Paragraph style={{ ...caption(QUIET), padding: [0, 0, 16] }} mobile={{ padding: [0, 24, 16], textAlign: "center" }}>
        fontSize: 44, on phones 30 and centered
      </Paragraph>
    </Section>
  </Root>
));
