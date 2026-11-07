import { Button, Column, Email, Heading, Text } from "@hyper-elements/react";

export const meta = {
  title: "Column",
  description: "Stacks its children with a gap. Give it a background and it's a card.",
  group: "Layout",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Column style={{ backgroundColor: "#0f172a", color: "#e2e8f0", borderRadius: 12, padding: 28, gap: 12 }}>
          <Heading level={3} style={{ fontSize: 20, color: "#ffffff" }}>A card is a Column</Heading>
          <Text style={{ color: "#94a3b8" }}>Background, padding, radius and a gap between what it holds. No margins anywhere.</Text>
          <Button href="https://example.com" style={{ backgroundColor: "#ef4638", borderRadius: 6, alignSelf: "start" }}>Open</Button>
      </Column>
      </Column>
    </Email>
  );
}
