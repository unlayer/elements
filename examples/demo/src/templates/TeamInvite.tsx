import type { ReactElement } from "react";
import {
  Button,
  Column,
  Email,
  Heading,
  Image,
  Text,
  Section,
} from "@hyper-elements/react";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function TeamInvite(): ReactElement {
  return (
    <Email
      width={480}
      previewText="Alex invited you to join the Rocket Team on Acme."
      style={{ backgroundColor: "#f4f4f5", color: "#18181b", fontFamily: sansFont }}
    >
      {/* Logo */}
      <Section style={{ padding: [40, 0, 24, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{ src: "https://placehold.co/36x36/18181b/ffffff?text=A", width: 36, height: 36 }}
            alt="Acme"
            style={{ width: 36 }}
          />
        </Column>
      </Section>

      {/* Card */}
      <Section style={{ backgroundColor: "#ffffff", padding: [40, 0, 16, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 22, fontWeight: 700, color: "#18181b", textAlign: "center", lineHeight: 1.3 }}
        >
          Join Rocket Team on Acme
        </Heading>
        <Text style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "center", lineHeight: 1.7 }}>
          Alex Chen (alex@acme.dev) has invited you to collaborate on the Rocket Team workspace.
        </Text>
      </Section>

      {/* Avatars */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{
              src: "https://placehold.co/200x64/f4f4f5/71717a?text=AC+%E2%86%92+You",
              width: 200,
              height: 64,
            }}
            alt="Alex Chen invites You"
            style={{ width: 200 }}
          />
        </Column>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 40, 0] }}>
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
            Accept Invitation
          </Button>
        </Column>
        <Text style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          This link expires in 7 days.
        </Text>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 40, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.6 }}>
          This invitation was sent to you@example.com.
        </Text>
        <Text style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.6 }}>
          If you didn't expect it, you can safely ignore this email.
        </Text>
      </Section>
    </Email>
  );
}
