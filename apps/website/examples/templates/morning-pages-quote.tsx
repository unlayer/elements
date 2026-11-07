/**
 * Morning Pages (a fictional journaling app) posts its quote of the week: an Instagram portrait
 * post, 1080 by 1350.
 *
 * Soft and warm: oat paper, a terracotta quote mark, the quote in a tall italic serif, and a sun
 * setting behind a sage arch in the corner. The arch and sun are one Svg under the words, in a Layer.
 */
import { Canvas, Circle, Column, Heading, Layer, Path, Polygon, Rect, Row, Svg, Text } from "@hyper-elements/react";

export const meta = {
  title: "Morning Pages quote",
  description: "An Instagram portrait post, 1080 by 1350: a quote in a large italic serif, with an arch and a sun drawn in Svg.",
  root: "Canvas",
};

const OAT = "#F6EEE3";
const INK = "#2E2A26";
const QUIET = "#7A6F64";
const CLAY = "#D9653B";
const SAGE = "#9DB59A";
const SUN = "#F2A541";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "Poppins, 'Helvetica Neue', Arial, sans-serif";

/** A four-pointed sparkle, centered on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `${x},${y - r} ${x + r * 0.22},${y - r * 0.22} ${x + r},${y} ${x + r * 0.22},${y + r * 0.22} ${x},${y + r} ${x - r * 0.22},${y + r * 0.22} ${x - r},${y} ${x - r * 0.22},${y - r * 0.22}`;

export default function MorningPagesQuote() {
  return (
    <Canvas
      width={1080}
      height={1350}
      lang="en"
      title="Morning Pages, quote of the week: Small steps, taken daily, become the path."
      fonts={[
        { family: "Playfair Display", src: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_pqTXtHA-X-uE0qEEw.woff2", format: "woff2", weight: 500, style: "italic" },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2", format: "woff2", weight: 500 },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2", format: "woff2", weight: 700 },
      ]}
      style={{ backgroundColor: OAT, color: INK, fontFamily: SANS }}
    >
      <Layer style={{ height: 1350 }}>
        <Svg width={1080} height={1350} title="A sun setting behind a sage-green arch in the bottom right corner, with two small sparkles.">
          <Circle cx={830} cy={1040} r={150} style={{ fill: SUN }} />
          {/* The arch: a rectangle with a round top, cut by the bottom edge. */}
          <Path d="M640 1350 L640 1150 A200 200 0 0 1 1040 1150 L1040 1350 Z" style={{ fill: SAGE }} />
          <Rect x={640} y={1288} width={400} height={62} style={{ fill: "#87A184" }} />
          <Polygon points={sparkle(560, 1080, 30)} style={{ fill: CLAY }} />
          <Polygon points={sparkle(940, 860, 18)} style={{ fill: CLAY }} />
        </Svg>
        <Column style={{ height: 1350, padding: [110, 100], justifyContent: "space-between" }}>
          <Column style={{ gap: 64 }}>
            <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ flex: "none", backgroundColor: INK, color: OAT, fontWeight: 700, fontSize: 22, letterSpacing: 1, padding: [10, 24], borderRadius: 999 }}>
                @morningpages
              </Text>
              <Text style={{ flex: "none", fontWeight: 500, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: QUIET }}>Quote of the week</Text>
            </Row>
            <Column style={{ gap: 28 }}>
              <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 240, lineHeight: 0.5, color: CLAY, padding: [64, 0, 0, 0] }}>“</Text>
              <Heading level={1} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 92, lineHeight: 1.08, letterSpacing: -1, maxWidth: 820 }}>
                Small steps, taken daily, become the path.
              </Heading>
              <Text style={{ fontWeight: 700, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: CLAY }}>— Morning Pages</Text>
            </Column>
          </Column>
          <Text style={{ fontWeight: 500, fontSize: 24, color: QUIET }}>morningpages.app · Write a page today</Text>
        </Column>
      </Layer>
    </Canvas>
  );
}
