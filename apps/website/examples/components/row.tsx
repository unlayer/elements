import { Column, Email, Text, Row } from "@hyper-elements/react";

export const meta = {
  title: "Row",
  description: "Children side by side, each at its width or a share of what's left. Stacked on phones unless you say so.",
  group: "Layout",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Row style={{ gap: 12 }}>
          <Column style={{ width: 140, backgroundColor: "#fee2e2", borderRadius: 8, padding: 16 }}>
            <Text style={{ fontWeight: 700 }}>140px</Text>
          </Column>
          <Column style={{ flex: 2, backgroundColor: "#e0e7ff", borderRadius: 8, padding: 16 }}>
            <Text style={{ fontWeight: 700 }}>flex: 2</Text>
          </Column>
          <Column style={{ backgroundColor: "#dcfce7", borderRadius: 8, padding: 16 }}>
            <Text style={{ fontWeight: 700 }}>flex: 1</Text>
          </Column>
        </Row>
      </Column>
    </Email>
  );
}
