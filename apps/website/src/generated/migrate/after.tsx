// Migrated from React Email by @hyper-elements/migrate (codemod mode).
import { Button, Column, Email, Heading, Section, Text } from "@hyper-elements/react";

export default function Welcome({ name = "Ada" }: { name?: string }) {
  return (
    <Email
      width={520}
      previewText="Welcome to Orbit"
      style={{
        backgroundColor: "#f3f4f6",
        color: "#000000",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <Section style={{ padding: [40, 0, 40, 0] }}>
        <Column
          style={{ padding: "32px 32px 32px 32px", backgroundColor: "#ffffff", borderRadius: 8 }}
        >
          <Heading
            style={{
              padding: "0px 0px 0px 0px",
              fontSize: 24,
              fontWeight: 700,
              color: "#101828",
              lineHeight: "32px",
            }}
          >
            Welcome, {name}
          </Heading>
          <Text
            style={{
              padding: "16px 0px 24px 0px",
              fontSize: 16,
              color: "#4a5565",
              lineHeight: "24px",
            }}
          >
            Your workspace is ready.
          </Text>
          <Column style={{ padding: "0px 0px 0px 0px", alignItems: "start" }}>
            <Button
              href={{ href: "https://example.com/start", target: "_blank" }}
              style={{
                backgroundColor: "#4f39f6",
                color: "#ffffff",
                fontSize: 16,
                lineHeight: "120%",
                padding: "12px 20px 12px 20px",
                borderRadius: 6,
              }}
            >
              Open your workspace
            </Button>
          </Column>
        </Column>
      </Section>
    </Email>
  );
}

Welcome.PreviewProps = { name: "Ada" };
