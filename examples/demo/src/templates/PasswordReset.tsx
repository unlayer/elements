import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Text,
  Section,
  Span,
} from "@unlayer/react-elements";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function PasswordReset(): ReactElement {
  return (
    <Email
      width={480}
      previewText="Reset your Vault password. This link expires in 60 minutes."
      style={{ backgroundColor: "#f4f4f5", color: "#18181b", fontFamily: sansFont }}
    >
      {/* Logo */}
      <Section style={{ padding: [40, 0, 24, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 16,
            fontWeight: 700,
            color: "#18181b",
            textAlign: "center",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          vault
        </Heading>
      </Section>

      {/* Card */}
      <Section style={{ backgroundColor: "#ffffff", padding: [40, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 22, fontWeight: 700, color: "#18181b", textAlign: "center", lineHeight: 1.3 }}
        >
          Reset your password
        </Heading>
        <Text style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "center", lineHeight: 1.7 }}>
          {"We received a request to reset the password for the account associated with "}
          <Span style={{ fontWeight: 700 }}>user@example.com</Span>. Click the button below to
          choose a new password.
        </Text>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#18181b",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 8,
            }}
          >
            Reset Password
          </Button>
        </Column>
        <Text style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          This link expires in 60 minutes.
        </Text>
      </Section>

      {/* Safety note */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 40, 0] }}>
        <Divider style={{ borderTop: "1px solid #e4e4e7", padding: 10 }} />
        <Text style={{ padding: 10, fontSize: 13, color: "#a1a1aa", textAlign: "center", lineHeight: 1.6 }}>
          If you didn't request this, you can safely ignore this email. Your password won't change
          unless you click the button above.
        </Text>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 40, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          Vault Inc · San Francisco, CA
        </Text>
      </Section>
    </Email>
  );
}
