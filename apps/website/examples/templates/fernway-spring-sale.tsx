/**
 * Fernway (a fictional flower shop) announces a spring sale: an Instagram post, 1080 by 1080.
 *
 * Loud and friendly: a hot pink square, flowers drawn as rings of circles in its corners, "Spring"
 * in a marker hand over SALE in tall condensed capitals, and the offer in a butter-yellow pill.
 * The flowers are one Svg under the words, in a Layer.
 */
import type { ReactNode } from "react";
import { Canvas, Circle, Column, Heading, Layer, Path, Row, Svg, Text } from "@hyper-elements/react";

export const meta = {
  title: "Fernway spring sale",
  description: "An Instagram sale post, 1080 by 1080: a bold headline over flowers drawn in Svg shapes, and the offer in a pill.",
  root: "Canvas",
};

const PINK = "#FF5C8A";
const BUTTER = "#FFD84D";
const LEAF = "#2F9E6E";
const BLUSH = "#FFC2D4";
const INK = "#2B1B24";
const WHITE = "#FFFFFF";

const SCRIPT = "Caveat, 'Comic Sans MS', cursive";
const TALL = "Anton, Impact, 'Arial Narrow', sans-serif";
const SANS = "Poppins, 'Helvetica Neue', Arial, sans-serif";

/** A flower seen from above: six petals in a ring, and its middle. */
const flower = (cx: number, cy: number, r: number, petal: string, middle: string) => (
  <>
    {Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return <Circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={r * 0.78} style={{ fill: petal }} />;
    })}
    <Circle cx={cx} cy={cy} r={r * 0.62} style={{ fill: middle }} />
  </>
);

/** A line centered in its row, at its own width: how an image centers text, the same in its HTML. */
const centered = (line: ReactNode) => <Row style={{ justifyContent: "center" }}>{line}</Row>;

/** A pill around a few words. */
const pill = (text: string, style: object) => centered(<Text style={{ flex: "none", borderRadius: 999, ...style }}>{text}</Text>);

export default function FernwaySpringSale() {
  return (
    <Canvas
      width={1080}
      height={1080}
      lang="en"
      title="Fernway spring sale: 30% off every bouquet, this weekend only"
      fonts={[
        { family: "Anton", src: "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8CSKlv.woff2", format: "woff2", weight: 400 },
        { family: "Caveat", src: "https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjSx6eIWpYT5Kmgq3sw.woff2", format: "woff2", weight: 600 },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2", format: "woff2", weight: 500 },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2", format: "woff2", weight: 700 },
      ]}
      style={{ backgroundColor: PINK, color: WHITE, fontFamily: SANS, textAlign: "center" }}
    >
      <Layer style={{ height: 1080, alignItems: "center" }}>
        <Svg width={1080} height={1080} title="Flowers in pink, yellow and white in the corners of a pink square, with leaves.">
          {/* Leaves first, so the flowers sit on them. */}
          <Path d="M0 840 C120 800 230 860 260 1080 L0 1080 Z" style={{ fill: LEAF }} />
          <Path d="M1080 250 C960 230 880 140 900 0 L1080 0 Z" style={{ fill: LEAF }} />
          <Circle cx={540} cy={1180} r={260} style={{ fill: BLUSH, opacity: 0.45 }} />
          {flower(150, 150, 70, BUTTER, "#FF8A3D")}
          {flower(330, 70, 34, WHITE, BUTTER)}
          {flower(960, 360, 46, WHITE, BUTTER)}
          {flower(110, 930, 62, BLUSH, BUTTER)}
          {flower(270, 1010, 34, BUTTER, "#FF8A3D")}
          {flower(940, 900, 92, BUTTER, "#FF8A3D")}
          {flower(780, 1010, 38, WHITE, BUTTER)}
          {/* Confetti. */}
          {[[460, 120], [640, 90], [860, 140], [70, 520], [1010, 600], [620, 990], [420, 960]].map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={9} style={{ fill: WHITE, opacity: 0.8 }} />
          ))}
        </Svg>
        <Column style={{ height: 1080, padding: [0, 120], justifyContent: "center", gap: 18 }}>
          {centered(<Text style={{ flex: "none", fontWeight: 700, fontSize: 24, letterSpacing: 6, textTransform: "uppercase" }}>Fernway Flowers</Text>)}
          <Column>
            {centered(<Text style={{ flex: "none", fontFamily: SCRIPT, fontWeight: 600, fontSize: 150, lineHeight: 0.9, color: BUTTER }}>Spring</Text>)}
            {centered(
              <Heading level={1} style={{ flex: "none", fontFamily: TALL, fontWeight: 400, fontSize: 300, lineHeight: 0.92, letterSpacing: 6 }}>
                SALE
              </Heading>,
            )}
          </Column>
          {pill("30% off every bouquet", { backgroundColor: BUTTER, color: INK, fontWeight: 700, fontSize: 38, padding: [14, 36] })}
          {centered(<Text style={{ flex: "none", fontWeight: 500, fontSize: 26 }}>This weekend only · fernway.shop</Text>)}
        </Column>
      </Layer>
    </Canvas>
  );
}
