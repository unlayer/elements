import { Column, Divider, Email, Text } from "@hyper-elements/react";

export const meta = {
  title: "Divider",
  description: "A horizontal line, styled with borderTop.",
  group: "Blocks",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Text>Above the line</Text>
        <Divider style={{ borderTop: "2px solid #ef4638", width: "40%" }} />
        <Text>Below the line</Text>
        <Divider style={{ borderTop: "1px dashed #94a3b8" }} />
      </Column>
    </Email>
  );
}
