/**
 * Gridline (a fictional design tool) announces a live workshop: a LinkedIn event banner, 1200 by 627.
 *
 * Deep violet with a grid of shapes on the right, squares and circles and quarter-circles in lime,
 * pink and white, like a component library laid out. The title in a chunky grotesque, the details
 * in pills, and the two hosts as initials in circles. The grid is one Svg under the words, in a Layer.
 */
import { Canvas, Circle, Column, Heading, Layer, Path, Rect, Row, Svg, Text } from "@hyper-elements/react";

export const meta = {
  title: "Gridline workshop banner",
  description: "A LinkedIn event banner, 1200 by 627: a title, the details in pills, the hosts, and a grid of shapes drawn in Svg.",
  root: "Canvas",
};

const VIOLET = "#3B1FA8";
const DEEP = "#2A1380";
const LIME = "#C6F36B";
const PINK = "#FF8FCF";
const WHITE = "#FFFFFF";
const SOFT = "#CFC6F5";

const GROTESK = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
const SANS = "Poppins, 'Helvetica Neue', Arial, sans-serif";

/** The grid's cells, 4 across and 5 down from (760, 0), each 110 square: what's drawn in each. */
const CELL = 110;
const SHAPES = ["square", "circle", "quarter", "none", "circle", "quarter", "square", "circle", "none", "square", "circle", "quarter", "quarter", "circle", "none", "square", "circle", "square", "quarter", "circle"] as const;
const FILLS = [LIME, PINK, WHITE, LIME, PINK, WHITE, PINK, LIME, WHITE, PINK, LIME, PINK, WHITE, LIME, PINK, LIME, WHITE, PINK, LIME, PINK];

const shape = (i: number) => {
  const x = 760 + (i % 4) * CELL;
  const y = (Math.floor(i / 4)) * CELL + 40;
  const fill = FILLS[i];
  const pad = 14;
  switch (SHAPES[i]) {
    case "square":
      return <Rect key={i} x={x + pad} y={y + pad} width={CELL - pad * 2} height={CELL - pad * 2} rx={14} style={{ fill }} />;
    case "circle":
      return <Circle key={i} cx={x + CELL / 2} cy={y + CELL / 2} r={CELL / 2 - pad} style={{ fill }} />;
    case "quarter":
      return <Path key={i} d={`M${x + pad} ${y + CELL - pad} L${x + pad} ${y + pad} A${CELL - pad * 2} ${CELL - pad * 2} 0 0 1 ${x + CELL - pad} ${y + CELL - pad} Z`} style={{ fill }} />;
    default:
      return null;
  }
};

/** A detail in a pill: its own width. */
const pill = (text: string, style: object = {}) => (
  <Text style={{ flex: "none", border: `2px solid ${SOFT}`, borderRadius: 999, padding: [8, 20], fontWeight: 500, fontSize: 20, ...style }}>{text}</Text>
);

/** A host: their initials in a circle, and their name and role. */
const host = (initials: string, color: string, name: string, role: string) => (
  <Row style={{ width: 280, gap: 14, alignItems: "center" }}>
    <Column style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: color, justifyContent: "center", color: DEEP }}>
      <Row style={{ justifyContent: "center" }}>
        <Text style={{ flex: "none", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{initials}</Text>
      </Row>
    </Column>
    <Column>
      <Text style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.3 }}>{name}</Text>
      <Text style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.3, color: SOFT }}>{role}</Text>
    </Column>
  </Row>
);

export default function GridlineWorkshopBanner() {
  return (
    <Canvas
      width={1200}
      height={627}
      lang="en"
      title="Gridline live workshop: Design systems that don't break. Thursday 20 November, 5pm GMT"
      fonts={[
        { family: "Bricolage Grotesque", src: "https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9H6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiawA1XphjhQYg.woff2", format: "woff2", weight: "400 800" },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2", format: "woff2", weight: 500 },
        { family: "Poppins", src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2", format: "woff2", weight: 700 },
      ]}
      style={{ backgroundColor: VIOLET, color: WHITE, fontFamily: SANS }}
    >
      <Layer style={{ height: 627 }}>
        <Svg width={1200} height={627} title="A grid of lime, pink and white squares, circles and quarter-circles on the right.">
          <Rect x={740} y={0} width={460} height={627} style={{ fill: DEEP }} />
          {SHAPES.map((_, i) => shape(i))}
        </Svg>
        <Column style={{ height: 627, width: 700, padding: [56, 0, 56, 64], justifyContent: "space-between" }}>
          <Column style={{ gap: 26 }}>
            <Row>
              <Text style={{ flex: "none", backgroundColor: LIME, color: DEEP, fontWeight: 700, fontSize: 18, letterSpacing: 3, textTransform: "uppercase", padding: [8, 18], borderRadius: 999 }}>
                Live workshop
              </Text>
            </Row>
            <Heading level={1} style={{ fontFamily: GROTESK, fontWeight: 800, fontSize: 76, lineHeight: 1, letterSpacing: -2 }}>
              Design systems that don't break
            </Heading>
            <Text style={{ fontWeight: 500, fontSize: 22, lineHeight: 1.45, color: SOFT, maxWidth: 560 }}>
              Forty-five minutes on tokens, variants and naming, with questions at the end.
            </Text>
            <Row style={{ gap: 10 }}>
              {pill("Thu 20 Nov")}
              {pill("5pm GMT")}
              {pill("Free", { backgroundColor: WHITE, color: DEEP, border: `2px solid ${WHITE}`, fontWeight: 700 })}
            </Row>
          </Column>
          <Row style={{ gap: 36, alignItems: "center" }}>
            {host("AO", LIME, "Ama Owusu", "Design lead, Gridline")}
            {host("JP", PINK, "Jonas Petrov", "Staff engineer")}
          </Row>
        </Column>
      </Layer>
    </Canvas>
  );
}
