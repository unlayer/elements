import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Canvas, Circle, Column, Ellipse, Grid, Heading, Line, LineBreak, Page, Text, Path, Polygon, Rect, render, Row, Section, Span, Svg, type EmailProps } from "../index";
import { LiveEditor } from "../../stories/LiveEditor";
import { code } from "../../stories/SideBySide";

const meta: Meta = {
  title: "Canvas",
  parameters: {
    docs: {
      description: {
        component:
          "A `<Canvas>` rendered to HTML, to look at: a box of its size, its content laid out in it. `@hyper-elements/react/image` writes the same as a PNG or SVG without a browser (its test compares the two pixel by pixel). The forecast app, Umbra, is fictional.",
      },
    },
  },
};
export default meta;

/** A Canvas's HTML in a frame of its size (and a Page's, whose Svg these stories show too). */
const drawn = (template: ReactElement, width: number, height: number): StoryObj => ({
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => (
    <>
      <iframe title="Canvas" srcDoc={loaded.html as string} style={{ width, height, border: 0 }} />
      {/* The one here that's a Page goes in the editor; a Canvas doesn't. */}
      {template.type === Page && <LiveEditor template={template} width="desktop" />}
    </>
  ),
});

// Umbra, a fictional forecast app for people who look up: deep night, moonlit cream, and one aurora green.
const NIGHT = "#0D1518";
const RIDGE = "#1A2E33";
const PINE = "#10201F";
const MOON = "#EEE8D8";
const DIM = "#90A3A0";
const AURORA = "#7FD9A8";

const SANS = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Spline Sans Mono', SFMono-Regular, Menlo, Consolas, monospace";
const FONTS = [
  { family: "Manrope", src: "https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSvfedN4.woff2", format: "woff2", weight: "200 800" },
  { family: "Spline Sans Mono", src: "https://fonts.gstatic.com/s/splinesansmono/v13/R70BjzAei_CDNLfgZxrW6wrZOF2WX5KZmE-Z-lw.woff2", format: "woff2", weight: "300 700" },
] satisfies NonNullable<EmailProps["fonts"]>;

/** Small mono capitals: labels, and what a story shows. */
const label = { fontFamily: MONO, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: DIM } as const;

/** Umbra's mark, in a box of 40 by 40: a crescent and a star on the night sky. */
const mark = [
  <Rect key="sky" width={40} height={40} rx={10} style={{ fill: RIDGE }} />,
  <Path key="moon" d="M24 8 A12.5 12.5 0 1 0 32 26 A10 10 0 1 1 24 8 Z" style={{ fill: MOON }} />,
  <Circle key="star" cx={29} cy={13} r={2} style={{ fill: AURORA }} />,
];

/** A social card (1200 × 630, drawn at half size): a title, a line under it, a drawn logo, and the hills along its foot. */
export const SocialCard = drawn(
  <Canvas width={600} height={315} fonts={FONTS} title="Tonight over Kielder: 94% clear" style={{ backgroundColor: NIGHT, color: MOON, fontFamily: SANS, justifyContent: "space-between" }}>
    <Column style={{ padding: [26, 32, 0], gap: 16 }}>
      <Row style={{ alignItems: "center", gap: 10 }}>
        <Svg width={26} height={26} viewBox="0 0 40 40" title="Umbra" style={{ flex: "none" }}>
          {mark}
        </Svg>
        <Text style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Umbra</Text>
        <Text style={{ ...label, textAlign: "right" }}>Tonight, 6 November</Text>
      </Row>
      <Column style={{ gap: 8 }}>
        <Heading level={1} style={{ fontSize: 46, fontWeight: 600, lineHeight: 1.04, letterSpacing: -1.8 }}>
          <Span style={{ color: AURORA }}>94% clear</Span>
          <LineBreak />
          over Kielder.
        </Heading>
        <Text style={{ fontSize: 16, color: DIM }}>Orion rises at 21:40, and the moon is down by midnight.</Text>
      </Column>
    </Column>
    <Svg width={600} height={102} viewBox="0 10 600 102" title="Hills and pines along the horizon, under a few stars">
      {[[46, 24, 1.4], [132, 14, 1], [214, 32, 1.2], [318, 16, 1.5], [402, 28, 1], [486, 14, 1.3], [566, 26, 1.1]].map(([cx, cy, r]) => (
        <Circle key={cx} cx={cx} cy={cy} r={r} style={{ fill: MOON, opacity: 0.8 }} />
      ))}
      <Path d="M0 66 C70 52 130 62 200 50 C270 38 340 58 410 46 C480 34 540 50 600 42 V112 H0 Z" style={{ fill: RIDGE }} />
      <Path d="M0 90 C90 76 170 92 260 80 C350 68 460 90 600 72 V112 H0 Z" style={{ fill: PINE }} />
      {[[452, 82, 20], [472, 84, 28], [494, 82, 18], [540, 74, 24], [562, 72, 16]].map(([x, foot, height]) => (
        <Polygon key={x} points={`${x - 7},${foot} ${x},${foot - height} ${x + 7},${foot}`} style={{ fill: PINE }} />
      ))}
    </Svg>
  </Canvas>,
  600,
  315
);

/** A layout in the image: `padding`, `gap` and `alignItems` on the `Canvas`, and `justifyContent` to center it in the height. */
export const Banner = drawn(
  <Canvas width={600} height={200} fonts={FONTS} title="The Perseids peak on Wednesday" style={{ backgroundColor: AURORA, color: NIGHT, fontFamily: SANS, padding: 24, gap: 8, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <Text style={{ ...label, color: NIGHT }}>Tuesday night into Wednesday</Text>
    <Heading level={2} style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1.2 }}>
      The Perseids are at their peak.
    </Heading>
    <Text style={{ fontSize: 15 }}>Up to sixty meteors an hour, best after midnight.</Text>
  </Canvas>,
  600,
  200
);

/** The six shapes in an `Svg`: `Rect`, `Circle`, `Ellipse`, `Line`, `Polygon` and `Path`. */
export const Shapes = drawn(
  <Canvas width={600} height={190} fonts={FONTS} title="An observatory at night" style={{ backgroundColor: NIGHT, fontFamily: SANS, padding: [20, 20, 16], justifyContent: "space-between" }}>
    <Svg width={560} height={120} viewBox="0 0 560 120" title="An observatory under a comet and the moon, in six shapes">
      {/* Circle: the moon, the stars and the comet's head */}
      <Circle cx={500} cy={34} r={22} style={{ fill: MOON }} />
      {[[40, 18], [120, 34], [226, 12], [352, 22], [420, 46], [548, 66]].map(([cx, cy]) => (
        <Circle key={cx} cx={cx} cy={cy} r={1.5} style={{ fill: MOON, opacity: 0.8 }} />
      ))}
      <Circle cx={304} cy={20} r={4} style={{ fill: MOON }} />
      {/* Path: the comet's tail */}
      <Path d="M302 16 Q250 22 178 54 Q252 36 304 24 Z" style={{ fill: AURORA }} />
      {/* Polygon: the hills */}
      <Polygon points="0,104 72,44 122,84 178,54 262,104" style={{ fill: RIDGE }} />
      <Polygon points="404,104 476,68 560,92 560,104" style={{ fill: RIDGE }} />
      {/* Ellipse and Rect: the observatory's dome, its slit and its walls */}
      <Ellipse cx={366} cy={76} rx={30} ry={26} style={{ fill: DIM }} />
      <Rect x={360} y={52} width={12} height={26} style={{ fill: NIGHT }} />
      <Rect x={330} y={76} width={72} height={28} rx={2} style={{ fill: MOON }} />
      {/* Line: the horizon */}
      <Line x1={0} y1={104} x2={560} y2={104} style={{ stroke: DIM, strokeWidth: 1.5 }} />
    </Svg>
    <Text style={label}>Circle · Path · Polygon · Ellipse · Rect · Line</Text>
  </Canvas>,
  600,
  190
);

/** A shape's `fill`, `stroke`, `strokeWidth` and `opacity` are in `style`, and `rx` rounds a `Rect`'s corners. */
export const ShapeStyles = drawn(
  <Canvas width={600} height={170} fonts={FONTS} title="One shape, styled four ways" style={{ backgroundColor: NIGHT, fontFamily: SANS, padding: [20, 20, 16], justifyContent: "space-between" }}>
    <Svg width={560} height={100} title="One shape, styled four ways">
      <Rect x={0} y={10} width={120} height={80} rx={16} style={{ fill: AURORA }} />
      <Rect x={140} y={10} width={120} height={80} rx={16} style={{ fill: "transparent", stroke: AURORA, strokeWidth: 4 }} />
      <Rect x={280} y={10} width={120} height={80} style={{ fill: RIDGE, stroke: AURORA, strokeWidth: 1 }} />
      <Circle cx={460} cy={50} r={40} style={{ fill: MOON, opacity: 0.5 }} />
      <Circle cx={500} cy={50} r={40} style={{ fill: AURORA, opacity: 0.5 }} />
    </Svg>
    <Grid columns={4} stackOnMobile={false} style={{ gap: 0 }}>
      <Text style={label}>fill, rx</Text>
      <Text style={label}>stroke, rx</Text>
      <Text style={label}>fill, stroke</Text>
      <Text style={label}>opacity</Text>
    </Grid>
  </Canvas>,
  600,
  170
);

/** `viewBox` gives an `Svg` coordinates of its own: here one drawing at three sizes. */
export const ViewBox = drawn(
  <Canvas width={600} height={160} fonts={FONTS} title="Umbra's icon at three sizes" style={{ backgroundColor: NIGHT, color: MOON, fontFamily: SANS, padding: 20, justifyContent: "center" }}>
    <Row stackOnMobile={false} style={{ gap: 24, alignItems: "center" }}>
      {[120, 72, 32].map((size) => (
        <Svg key={size} width={size} height={size} viewBox="0 0 40 40" title={`Umbra's icon, ${size}px wide`} style={{ flex: "none" }}>
          {mark}
        </Svg>
      ))}
      <Column style={{ gap: 6 }}>
        <Text style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>One drawing, three sizes</Text>
        <Text style={label}>viewBox 0 0 40 40</Text>
      </Column>
    </Row>
  </Canvas>,
  600,
  160
);

const NIGHTS = [
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 6 },
  { day: "Sun", hours: 8.5 },
  { day: "Mon", hours: 5 },
  { day: "Tue", hours: 2 },
  { day: "Wed", hours: 4 },
  { day: "Thu", hours: 7 },
];
const PLOT = 534;
const SLOT = PLOT / NIGHTS.length;

/** A chart under its title: `Rect`s for its bars, a `Line` for its axis, and the `Svg`'s own box around them. */
export const Chart = drawn(
  <Canvas width={600} height={288} fonts={FONTS} title="Clear hours over the next seven nights" style={{ backgroundColor: NIGHT, color: MOON, fontFamily: SANS, padding: 24, gap: 12 }}>
    <Row style={{ alignItems: "end" }}>
      <Heading level={2} style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>
        Clear hours, by night
      </Heading>
      <Text style={{ ...label, textAlign: "right" }}>Kielder, 6 to 12 Nov</Text>
    </Row>
    <Column style={{ gap: 8 }}>
      <Svg width={PLOT} height={154} viewBox={`0 0 ${PLOT} 154`} title="Clear hours each night: best on Sunday, with eight and a half" style={{ padding: 8, backgroundColor: "#121D20", border: `1px solid ${RIDGE}`, borderRadius: 6 }}>
        {NIGHTS.map(({ day, hours }, index) => (
          <Rect key={day} x={Math.round(index * SLOT + SLOT / 2 - 22)} y={144 - hours * 15} width={44} height={hours * 15} rx={3} style={{ fill: hours === 8.5 ? AURORA : "#2F4C4C" }} />
        ))}
        <Line x1={0} y1={144} x2={PLOT} y2={144} style={{ stroke: DIM, strokeWidth: 1 }} />
      </Svg>
      <Grid columns={NIGHTS.length} stackOnMobile={false} style={{ gap: 0, padding: [0, 9] }}>
        {NIGHTS.map(({ day, hours }) => (
          <Text key={day} style={{ ...label, textAlign: "center", color: hours === 8.5 ? AURORA : DIM }}>
            {day}
          </Text>
        ))}
      </Grid>
    </Column>
  </Canvas>,
  600,
  288
);

/** An `Svg` is a block on a `Page` too, among the rest of its content: a page draws shapes, an email doesn't. */
export const SvgOnAPage = drawn(
  <Page width={560} fonts={FONTS} style={{ backgroundColor: NIGHT, color: MOON, fontFamily: SANS }}>
    <Section style={{ padding: 28 }}>
      <Row style={{ gap: 18, alignItems: "center" }}>
        <Svg width={64} height={64} viewBox="0 0 40 40" title="Umbra's icon" style={{ flex: "none" }}>
          {mark}
        </Svg>
        <Column style={{ gap: 2 }}>
          <Heading level={3} style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>
            Umbra
          </Heading>
          <Text style={{ fontSize: 15, color: DIM }}>A forecast for people who look up.</Text>
          <Text style={{ ...label, padding: [6, 0, 0] }}>An Svg among the page’s blocks</Text>
        </Column>
      </Row>
    </Section>
  </Page>,
  600,
  130
);
