import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Canvas, Circle, Column, Ellipse, Heading, Line, Page, Paragraph, Path, Polygon, Rect, render, Row, Section, Svg, Text } from "../index";

const meta: Meta = {
  title: "Canvas",
  parameters: {
    docs: {
      description: {
        component:
          "A `<Canvas>` rendered to HTML, to look at: a box of its size, its content laid out in it. `@unlayer/elements-image` writes the same as a PNG or SVG without a browser (its test compares the two pixel by pixel).",
      },
    },
  },
};
export default meta;

/** A Canvas's HTML in a frame of its size. */
const drawn = (template: ReactElement, width: number, height: number): StoryObj => ({
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => <iframe title="Canvas" srcDoc={loaded.html as string} style={{ width, height, border: 0 }} />,
});

/** A social card (1200 × 630, drawn at half size): a title, a line under it, and a drawn logo. */
export const SocialCard = drawn(
  <Canvas width={600} height={315} style={{ backgroundColor: "#0f172a", padding: 40, gap: 16, color: "#ffffff", justifyContent: "space-between" }}>
    <Column style={{ gap: 12 }}>
      <Heading level={1} style={{ fontSize: 40, lineHeight: 1.1 }}>
        Launch week
      </Heading>
      <Text style={{ fontSize: 18, color: "#cbd5e1" }}>Five days of new things, one a day.</Text>
    </Column>
    <Row style={{ alignItems: "center", gap: 12 }}>
      <Svg width={40} height={40} title="Acme">
        <Rect width={40} height={40} rx={10} style={{ fill: "#6366f1" }} />
        <Path d="M12 28 L20 12 L28 28 Z" style={{ fill: "#ffffff" }} />
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: 700 }}>acme.dev</Text>
      <Svg width={120} height={24}>
        <Circle cx={12} cy={12} r={6} style={{ fill: "#22c55e" }} />
        <Circle cx={36} cy={12} r={6} style={{ fill: "#eab308" }} />
        <Circle cx={60} cy={12} r={6} style={{ fill: "#ef4444" }} />
      </Svg>
    </Row>
  </Canvas>,
  600,
  315
);

/** A layout in the image: `padding`, `gap` and `alignItems` on the `Canvas`, and `justifyContent` to center it in the height. */
export const Banner = drawn(
  <Canvas width={600} height={200} style={{ backgroundColor: "#0f766e", color: "#ffffff", padding: 24, gap: 8, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <Heading level={2} style={{ fontSize: 30 }}>
      Summer sale
    </Heading>
    <Text style={{ fontSize: 15 }}>Up to 40% off, this week only.</Text>
  </Canvas>,
  600,
  200
);

/** The six shapes in an `Svg`: `Rect`, `Circle`, `Ellipse`, `Line`, `Polygon` and `Path`. */
export const Shapes = drawn(
  <Canvas width={600} height={140} style={{ backgroundColor: "#ffffff", padding: 20 }}>
    <Svg width={560} height={100} title="Six shapes">
      <Rect x={0} y={10} width={80} height={80} style={{ fill: "#0f766e" }} />
      <Circle cx={140} cy={50} r={40} style={{ fill: "#b7791f" }} />
      <Ellipse cx={250} cy={50} rx={50} ry={30} style={{ fill: "#334e68" }} />
      <Line x1={320} y1={90} x2={380} y2={10} style={{ stroke: "#1f2933", strokeWidth: 4 }} />
      <Polygon points="400,90 440,10 480,90" style={{ fill: "#b91c1c" }} />
      <Path d="M500 90 Q530 -20 560 90 Z" style={{ fill: "#6366f1" }} />
    </Svg>
  </Canvas>,
  600,
  140
);

/** A shape's `fill`, `stroke`, `strokeWidth` and `opacity` are in `style`, and `rx` rounds a `Rect`'s corners. */
export const ShapeStyles = drawn(
  <Canvas width={600} height={140} style={{ backgroundColor: "#ffffff", padding: 20 }}>
    <Svg width={560} height={100} title="One shape, styled four ways">
      <Rect x={0} y={10} width={120} height={80} rx={16} style={{ fill: "#0f766e" }} />
      <Rect x={140} y={10} width={120} height={80} rx={16} style={{ fill: "transparent", stroke: "#0f766e", strokeWidth: 4 }} />
      <Rect x={280} y={10} width={120} height={80} style={{ fill: "#99d6cf", stroke: "#0f766e", strokeWidth: 1 }} />
      <Circle cx={460} cy={50} r={40} style={{ fill: "#0f766e", opacity: 0.4 }} />
      <Circle cx={500} cy={50} r={40} style={{ fill: "#b7791f", opacity: 0.4 }} />
    </Svg>
  </Canvas>,
  600,
  140
);

/** `viewBox` gives an `Svg` coordinates of its own: here one drawing at three sizes. */
export const ViewBox = drawn(
  <Canvas width={600} height={160} style={{ backgroundColor: "#ffffff", padding: 20 }}>
    <Row stackOnMobile={false} style={{ gap: 24, alignItems: "center" }}>
      {[120, 72, 32].map((size) => (
        <Svg key={size} width={size} height={size} viewBox="0 0 40 40" title={`${size}px wide`} style={{ flex: "none" }}>
          <Rect width={40} height={40} rx={10} style={{ fill: "#6366f1" }} />
          <Path d="M12 28 L20 12 L28 28 Z" style={{ fill: "#ffffff" }} />
        </Svg>
      ))}
    </Row>
  </Canvas>,
  600,
  160
);

const BARS = [
  { label: "Jan", value: 50 },
  { label: "Feb", value: 90 },
  { label: "Mar", value: 70 },
  { label: "Apr", value: 130 },
];

/** A chart under its title: `Rect`s for its bars, a `Line` for its axis, and the `Svg`'s own box around them. */
export const Chart = drawn(
  <Canvas width={600} height={270} style={{ backgroundColor: "#f5f7fa", color: "#1f2933", padding: 24, gap: 16 }}>
    <Heading level={2} style={{ fontSize: 22 }}>
      Orders, by month
    </Heading>
    <Svg width={534} height={154} viewBox="0 0 520 150" title="Orders grew from January to April" style={{ padding: 8, backgroundColor: "#ffffff", border: "1px solid #e4e7eb", borderRadius: 8 }}>
      {BARS.map(({ label, value }, index) => (
        <Rect key={label} x={40 + index * 120} y={140 - value} width={80} height={value} rx={4} style={{ fill: index === 3 ? "#0f766e" : "#99d6cf" }} />
      ))}
      <Line x1={10} y1={140} x2={510} y2={140} style={{ stroke: "#9aa5b1", strokeWidth: 1 }} />
    </Svg>
  </Canvas>,
  600,
  270
);

/** An `Svg` is a block on a `Page` too, among the rest of its content: a page draws shapes, an email doesn't. */
export const SvgOnAPage = drawn(
  <Page width={560} style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2933" }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 16, alignItems: "center" }}>
        <Svg width={64} height={64} title="A logo" style={{ flex: "none" }}>
          <Circle cx={32} cy={32} r={32} style={{ fill: "#0f766e" }} />
          <Polygon points="20,44 32,18 44,44" style={{ fill: "#ffffff" }} />
        </Svg>
        <Column>
          <Heading level={3} style={{ fontSize: 18 }}>
            Acme
          </Heading>
          <Paragraph style={{ fontSize: 14, color: "#616e7c" }}>A logo drawn in the page, next to the words.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Page>,
  600,
  130
);
