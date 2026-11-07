import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function Welcome({ name = "Ada" }: { name?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Orbit</Preview>
      <Body
        style={{
          backgroundColor: "#f3f4f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            margin: "40px auto",
            padding: "32px",
            maxWidth: "520px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
          }}
        >
          <Heading
            style={{
              margin: "0",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: "700",
              color: "#101828",
            }}
          >
            Welcome, {name}
          </Heading>
          <Text
            style={{
              margin: "16px 0 24px",
              fontSize: "16px",
              lineHeight: "24px",
              color: "#4a5565",
            }}
          >
            Your workspace is ready.
          </Text>
          <Button
            href="https://example.com/start"
            style={{
              backgroundColor: "#4f39f6",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "16px",
              padding: "12px 20px",
              textDecoration: "none",
            }}
          >
            Open your workspace
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

Welcome.PreviewProps = { name: "Ada" };
