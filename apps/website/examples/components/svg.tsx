import { Circle, Column, Page, Path, Rect, Svg } from "@hyper-elements/react";

export const meta = {
  title: "Svg",
  description: "Shapes drawn in a box of their own, on a Page, in a Document or on a Canvas. Not in email: Gmail and Outlook do not show inline SVG.",
  group: "Drawing",
  root: "Page",
};

export default function Example() {
  return (
    <Page width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Svg width={240} height={120} viewBox="0 0 240 120" style={{ backgroundColor: "#0f172a", borderRadius: 12 }}>
          <Rect x={24} y={70} width={28} height={30} rx={4} style={{ fill: "#334155" }} />
          <Rect x={64} y={50} width={28} height={50} rx={4} style={{ fill: "#475569" }} />
          <Rect x={104} y={30} width={28} height={70} rx={4} style={{ fill: "#64748b" }} />
          <Rect x={144} y={16} width={28} height={84} rx={4} style={{ fill: "#ef4638" }} />
          <Circle cx={204} cy={40} r={14} style={{ fill: "#e2e8f0" }} />
          <Path d="M196 40 l6 6 l10 -12" style={{ stroke: "#0f172a", strokeWidth: 3, fill: "transparent" }} />
        </Svg>
      </Column>
    </Page>
  );
}
