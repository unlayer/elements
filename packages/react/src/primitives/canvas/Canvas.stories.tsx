import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Canvas, Circle, Column, Heading, Path, Rect, render, Row, Svg, Text } from "../index";

const meta: Meta = {
  title: "Primitives/Canvas",
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
