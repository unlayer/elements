import { Email, Heading, Text, Section } from "@hyper-elements/react";

export const meta = {
  title: "Section",
  description: "A band whose background spans the whole window, with content at the email's width.",
  group: "Layout",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Section style={{ backgroundColor: "#0f172a", padding: 32, gap: 8, textAlign: "center" }}>
        <Heading level={2} style={{ color: "#ffffff", fontSize: 22 }}>Full-bleed band</Heading>
        <Text style={{ color: "#94a3b8" }}>Its background reaches the window's edges.</Text>
      </Section>
    </Email>
  );
}
