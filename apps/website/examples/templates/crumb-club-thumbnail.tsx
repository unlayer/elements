/**
 * Crumb Club (a fictional baking channel) needs a thumbnail: a YouTube thumbnail, 1280 by 720.
 *
 * Made to be read at the size of a stamp: three lines of condensed capitals, each on a black
 * block, over tomato red with rays behind a loaf, and a yellow sticker for the day count. The
 * rays and the loaf are one Svg under the words, in a Layer.
 */
import type { ReactNode } from "react";
import { Canvas, Circle, Column, Ellipse, Heading, Layer, Path, Polygon, Row, Svg, Text } from "@hyper-elements/react";

export const meta = {
  title: "Crumb Club thumbnail",
  description: "A YouTube thumbnail, 1280 by 720: the title on black blocks, a loaf and rays drawn in Svg, and a sticker.",
  root: "Canvas",
};

const TOMATO = "#E8392C";
const RAY = "#F0574A";
const YELLOW = "#FFE14D";
const BLACK = "#141414";
const CRUST = "#B8692E";
const BAKED = "#DE9A52";
const FLOUR = "#F6E7CF";

const TALL = "Anton, Impact, 'Arial Narrow', sans-serif";
const SANS = "Poppins, 'Helvetica Neue', Arial, sans-serif";

/** Rays from (940, 400) out past the edges, every other one drawn. */
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const b = a + Math.PI / 12;
  const far = 1100;
  return `940,400 ${940 + Math.cos(a) * far},${400 + Math.sin(a) * far} ${940 + Math.cos(b) * far},${400 + Math.sin(b) * far}`;
});

/** A line centered in its row, at its own width: how an image centers text, the same in its HTML. */
const centered = (line: ReactNode) => <Row style={{ justifyContent: "center" }}>{line}</Row>;

/** A line of the title: its own width, on a black block. */
const line = (text: string, color: string) => (
  <Row>
    <Heading level={1} style={{ flex: "none", backgroundColor: BLACK, color, fontFamily: TALL, fontWeight: 400, fontSize: 116, lineHeight: 1.05, padding: [6, 24, 0, 24] }}>
      {text}
    </Heading>
  </Row>
);

export default function CrumbClubThumbnail() {
  return (
    <Canvas
      width={1280}
      height={720}
      lang="en"
      title="Crumb Club: I baked bread for 30 days"
      fonts={[
        { family: "Anton", src: "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8CSKlv.woff2", format: "woff2", weight: 400 },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2", format: "woff2", weight: 700 },
      ]}
      style={{ backgroundColor: TOMATO, color: "#FFFFFF", fontFamily: SANS }}
    >
      <Layer style={{ height: 720 }}>
        <Svg width={1280} height={720} title="A golden loaf of bread with three cuts across its top, in front of red rays.">
          {RAYS.map((points) => (
            <Polygon key={points} points={points} style={{ fill: RAY }} />
          ))}
          <Ellipse cx={940} cy={560} rx={260} ry={34} style={{ fill: BLACK, opacity: 0.25 }} />
          {/* The loaf: its crust, its baked top, the cuts, and flour dusted on. */}
          <Path d="M700 540 C690 380 800 300 940 300 C1080 300 1190 380 1180 540 Z" style={{ fill: CRUST }} />
          <Path d="M722 520 C716 392 812 322 940 322 C1068 322 1164 392 1158 520 Z" style={{ fill: BAKED }} />
          <Path d="M820 360 C850 400 870 440 880 490" style={{ stroke: FLOUR, strokeWidth: 12, fill: "transparent" }} />
          <Path d="M930 340 C955 390 970 440 975 500" style={{ stroke: FLOUR, strokeWidth: 12, fill: "transparent" }} />
          <Path d="M1040 360 C1060 400 1070 440 1072 490" style={{ stroke: FLOUR, strokeWidth: 12, fill: "transparent" }} />
          {[[790, 430], [1010, 380], [1110, 460], [900, 470]].map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5} style={{ fill: FLOUR, opacity: 0.8 }} />
          ))}
        </Svg>
        <Row style={{ height: 720, padding: [64, 56, 56, 64] }}>
          <Column style={{ height: 600, justifyContent: "space-between" }}>
            <Column style={{ gap: 12 }}>
              {line("I BAKED", "#FFFFFF")}
              {line("BREAD FOR", "#FFFFFF")}
              {line("30 DAYS", YELLOW)}
            </Column>
            <Text style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>Crumb Club</Text>
          </Column>
          <Column style={{ flex: "none", width: 220, alignItems: "end" }}>
            <Column style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: YELLOW, border: `6px solid ${BLACK}`, justifyContent: "center", color: BLACK }}>
              {centered(<Text style={{ flex: "none", fontWeight: 700, fontSize: 26, letterSpacing: 3, lineHeight: 1 }}>DAY</Text>)}
              {centered(<Text style={{ flex: "none", fontFamily: TALL, fontSize: 96, lineHeight: 1 }}>30</Text>)}
            </Column>
          </Column>
        </Row>
      </Layer>
    </Canvas>
  );
}
