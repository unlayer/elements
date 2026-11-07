import type { ReactElement } from "react";
import {
  Divider,
  Email,
  Heading,
  Text,
  Section,
  Span,
} from "@unlayer/react-elements";

const monoFont = "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function VerificationCode(): ReactElement {
  return (
    <Email
      width={480}
      previewText="Your verification code is 847 293. It expires in 10 minutes."
      style={{ backgroundColor: "#0d1117", color: "#e6edf3", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ padding: [40, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{ padding: 10, fontSize: 16, fontWeight: 700, color: "#e6edf3", textAlign: "center", lineHeight: 1 }}
        >
          ● nexus
        </Heading>
      </Section>

      {/* Card */}
      <Section style={{ backgroundColor: "#161b22", padding: [40, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 20, fontWeight: 600, color: "#e6edf3", textAlign: "center", lineHeight: 1.3 }}
        >
          Verification code
        </Heading>
        <Text style={{ padding: 10, fontSize: 14, color: "#8b949e", textAlign: "center", lineHeight: 1.6 }}>
          Enter this code to verify your identity and complete the sign-in process.
        </Text>
      </Section>

      {/* Code Display */}
      <Section style={{ backgroundColor: "#161b22" }}>
        <Heading
          style={{
            padding: 10,
            fontFamily: monoFont,
            fontSize: 40,
            fontWeight: 700,
            color: "#58a6ff",
            textAlign: "center",
            lineHeight: 1,
            letterSpacing: "8px",
          }}
        >
          847 293
        </Heading>
      </Section>

      {/* Expiry Notice */}
      <Section style={{ backgroundColor: "#161b22", padding: [0, 0, 32, 0] }}>
        <Text style={{ padding: 10, fontSize: 13, color: "#8b949e", textAlign: "center", lineHeight: 1.5 }}>
          This code expires in 10 minutes.
        </Text>
      </Section>

      {/* Security Info */}
      <Section style={{ backgroundColor: "#161b22", padding: [0, 0, 40, 0] }}>
        <Divider style={{ borderTop: "1px solid #30363d", padding: 10 }} />
        <Text style={{ padding: 10, fontSize: 13, color: "#e6edf3", textAlign: "left", lineHeight: 1.5 }}>
          <Span style={{ fontWeight: 700 }}>Didn't request this?</Span>
        </Text>
        <Text style={{ padding: 10, fontSize: 13, color: "#8b949e", textAlign: "left", lineHeight: 1.6 }}>
          Someone may be trying to access your account. We recommend changing your password
          immediately and enabling two-factor authentication.
        </Text>
      </Section>

      {/* Details */}
      <Section style={{ backgroundColor: "#161b22", padding: [0, 0, 32, 0] }}>
        <Divider style={{ borderTop: "1px solid #30363d", padding: 10 }} />
        <Text style={{ padding: 10, fontSize: 10, color: "#484f58", textAlign: "left", lineHeight: 1.5 }}>
          REQUEST DETAILS
        </Text>
        <Text
          style={{
            padding: 10,
            fontFamily: monoFont,
            fontSize: 12,
            color: "#8b949e",
            textAlign: "left",
            lineHeight: 1.8,
          }}
        >
          <Span style={{ fontWeight: 700 }}>IP Address:</Span>
          {" 192.168.1.42"}
        </Text>
        <Text
          style={{
            padding: 10,
            fontFamily: monoFont,
            fontSize: 12,
            color: "#8b949e",
            textAlign: "left",
            lineHeight: 1.8,
          }}
        >
          <Span style={{ fontWeight: 700 }}>Location:</Span>
          {" San Francisco, CA"}
        </Text>
        <Text
          style={{
            padding: 10,
            fontFamily: monoFont,
            fontSize: 12,
            color: "#8b949e",
            textAlign: "left",
            lineHeight: 1.8,
          }}
        >
          <Span style={{ fontWeight: 700 }}>Device:</Span>
          {" Chrome on macOS"}
        </Text>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [24, 0, 40, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#484f58", textAlign: "center", lineHeight: 1.5 }}>
          Nexus Security · This is an automated message
        </Text>
      </Section>
    </Email>
  );
}
