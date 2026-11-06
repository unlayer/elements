import { Button, Column, Divider, Email, Heading, Image, Link, Text, Span } from "@hyper-elements/react";

export const meta = {
  title: "Password reset",
  description: "A focused security email: one action, a one-time code, and plain text that reads as well as the HTML.",
  root: "Email",
};

export default function PasswordReset() {
  return (
    <Email
      previewText="Reset your Orbit password"
      width={520}
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a" }}
    >
      <Column style={{ padding: [40, 32], gap: 24 }}>
        <Image
          src={{ src: "https://hyperelements.dev/img/orbit-logo.png", width: 252, height: 128 }}
          alt="Orbit"
          style={{ width: 80 }}
        />
        <Heading level={1} style={{ fontSize: 24 }}>Reset your password</Heading>
        <Text style={{ color: "#475569", lineHeight: 1.6 }}>
          Someone asked to reset the password for your account. If it was you, use the button
          below. The link works for 30 minutes.
        </Text>
        <Button
          href="https://example.com/reset?token=abc123"
          style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: [12, 24], alignSelf: "start" }}
          hover={{ backgroundColor: "#334155" }}
        >
          Choose a new password
        </Button>
        <Text style={{ color: "#475569" }}>
          Or enter this code: <Span style={{ fontFamily: "Menlo, monospace", fontWeight: 700, letterSpacing: 2, color: "#0f172a" }}>482 913</Span>
        </Text>
        <Divider style={{ borderTop: "1px solid #e2e8f0" }} />
        <Text style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
          Didn't ask for this? You can ignore this email, your password won't change.
          Questions? <Link href="mailto:security@example.com">security@example.com</Link>
        </Text>
      </Column>
    </Email>
  );
}
