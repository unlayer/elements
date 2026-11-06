/**
 * Slow Signals (a fictional podcast about quiet work) shares an episode: its social card, 1200 by
 * 630, written as a PNG by @unlayer/react-elements/image.
 *
 * Night at sea: a warm near-black, cream type, and the one amber of a lighthouse's beam, drawn
 * with Svg shapes beside the title. DM Serif Display for the title, DM Mono for the rest.
 */
import { Canvas, Circle, Column, Heading, Line, Path, Polygon, Rect, Row, Svg, Paragraph } from "../../index";

const NIGHT = "#1B1712";
const CREAM = "#F1E8D6";
const DIM = "#A79C88";
const AMBER = "#F2B544";

const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'DM Mono', Menlo, monospace";

const label = { fontFamily: MONO, fontSize: 18, letterSpacing: 2.5, textTransform: "uppercase", color: DIM } as const;

/** Stars: small, and fewer near the beam. */
const STARS: Array<[number, number, number]> = [
  [40, 60, 2],
  [96, 30, 1.5],
  [150, 96, 2.5],
  [212, 44, 1.5],
  [300, 22, 2],
  [352, 84, 1.5],
  [30, 170, 1.5],
  [330, 168, 2],
  [270, 120, 1.2],
];

/** The beam's spread: from the lantern at (252, 194), 0 wide, to 150 wide at x = 0. */
const beam = (from: number, to: number) => {
  const half = (x: number) => ((252 - x) / 252) * 75;
  return `${from},${194 - half(from)} ${to},${194 - half(to)} ${to},${194 + half(to)} ${from},${194 + half(from)}`;
};
const BEAM: Array<[number, number, number]> = Array.from({ length: 8 }, (_, i) => [252 - i * 31.5, 252 - (i + 1) * 31.5, 0.34 - i * 0.042]);

export const slowSignalsCard = (
  <Canvas
    width={1200}
    height={630}
    lang="en"
    title="Slow Signals, episode 48: The quiet economics of lighthouses"
    fonts={[
      { family: "DM Serif Display", src: "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Bx0vrx52g.woff2", format: "woff2", weight: 400 },
      { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
    ]}
    style={{ backgroundColor: NIGHT, color: CREAM, fontFamily: MONO, padding: [64, 72], justifyContent: "space-between" }}
  >
    <Row style={{ gap: 48, alignItems: "stretch" }}>
      <Column style={{ gap: 28, justifyContent: "space-between", height: 502 }}>
        <Paragraph style={label}>Slow Signals · Episode 48</Paragraph>
        <Column style={{ gap: 22 }}>
          <Heading level={1} style={{ fontFamily: SERIF, fontSize: 84, fontWeight: 400, lineHeight: 0.98, letterSpacing: -1.5 }}>
            The quiet economics of lighthouses
          </Heading>
          <Paragraph style={{ fontSize: 20, lineHeight: 1.5, color: CREAM }}>With Hannah Okoye, who kept the Fair Isle South light for twenty-three years.</Paragraph>
        </Column>
        <Row style={{ gap: 32, alignItems: "center" }}>
          <Paragraph style={{ ...label, color: AMBER, flex: "none" }}>52 min</Paragraph>
          <Paragraph style={label}>Wherever you listen</Paragraph>
        </Row>
      </Column>
      <Svg width={360} height={502} viewBox="0 0 360 502" title="A lighthouse at night, its beam sweeping out to the left over a dark sea, under a few stars.">
        {STARS.map(([cx, cy, r]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={{ fill: CREAM, opacity: 0.7 }} />
        ))}
        {/* The beam: a wedge from the lantern, fading in steps as it goes. */}
        {BEAM.map(([from, to, opacity]) => (
          <Polygon key={from} points={beam(from, to)} style={{ fill: AMBER, opacity }} />
        ))}
        {/* The tower, its gallery and lantern. */}
        <Polygon points="228,430 240,214 264,214 276,430" style={{ fill: CREAM }} />
        <Polygon points="230,400 232,370 272,370 274,400" style={{ fill: NIGHT, opacity: 0.85 }} />
        <Polygon points="234,320 236,296 268,296 270,320" style={{ fill: NIGHT, opacity: 0.85 }} />
        <Rect x={232} y={206} width={40} height={8} style={{ fill: CREAM }} />
        <Rect x={238} y={180} width={28} height={26} rx={2} style={{ fill: AMBER }} />
        <Path d="M234 182 L252 160 L270 182 Z" style={{ fill: CREAM }} />
        <Line x1={252} y1={160} x2={252} y2={148} style={{ stroke: CREAM, strokeWidth: 2 }} />
        {/* The rock and the sea. */}
        <Path d="M190 436 C214 420 300 418 330 438 L340 452 L180 452 Z" style={{ fill: "#3A332A" }} />
        <Line x1={10} y1={466} x2={150} y2={466} style={{ stroke: AMBER, strokeWidth: 2, opacity: 0.45 }} />
        <Line x1={40} y1={480} x2={120} y2={480} style={{ stroke: AMBER, strokeWidth: 2, opacity: 0.3 }} />
        <Line x1={190} y1={474} x2={340} y2={474} style={{ stroke: DIM, strokeWidth: 1.5, opacity: 0.4 }} />
        <Line x1={220} y1={490} x2={300} y2={490} style={{ stroke: DIM, strokeWidth: 1.5, opacity: 0.3 }} />
      </Svg>
    </Row>
  </Canvas>
);
