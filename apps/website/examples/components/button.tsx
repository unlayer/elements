import { Button, Column, Email, Row } from "@hyper-elements/react";

export const meta = {
  title: "Button",
  description: "A link drawn as a button, with its colors on hover. Rounded everywhere but classic Outlook, which the diagnostics tell you.",
  group: "Blocks",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Row style={{ gap: 12, justifyContent: "center" }}>
          <Button
            href="https://example.com/start"
            style={{ backgroundColor: "#ef4638", borderRadius: 8, padding: [12, 22], fontWeight: 600, width: 150 }}
            hover={{ backgroundColor: "#d93425" }}
          >
            Get started
          </Button>
          <Button
            href="https://example.com/docs"
            style={{ backgroundColor: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: [12, 22], width: 170 }}
            hover={{ backgroundColor: "#f1f5f9" }}
          >
            Read the docs
          </Button>
        </Row>
      </Column>
    </Email>
  );
}
