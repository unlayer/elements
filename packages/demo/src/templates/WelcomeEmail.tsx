import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Paragraph,
  Row,
  Section,
  Span,
} from "@unlayer/react-elements/primitives";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export default function WelcomeEmail(): ReactElement {
  return (
    <Email
      width={540}
      previewText="Welcome aboard! Here's everything you need to get started with Acme."
      style={{ backgroundColor: "#f4f4f5", color: "#18181b", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 32, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Image
            src={{
              src: "https://placehold.co/100x26/18181b/ffffff?text=ACME",
              width: 100,
              height: 26,
            }}
            alt="Acme"
            style={{ width: 100 }}
          />
        </Column>
      </Section>

      {/* Indigo accent bar */}
      <Section style={{ backgroundColor: "#4f46e5" }}>
        <Divider style={{ borderTop: "3px solid #4f46e5", padding: 10 }} />
      </Section>

      {/* Hero */}
      <Section style={{ backgroundColor: "#ffffff", padding: [40, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 26, fontWeight: 700, color: "#18181b", textAlign: "left", lineHeight: 1.2 }}
        >
          Welcome to Acme
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 15, color: "#52525b", textAlign: "left", lineHeight: 1.7 }}>
          {"Thanks for signing up. "}
          <Span style={{ fontWeight: 700 }}>Acme</Span>
          {
            " gives your team everything it needs to go from idea to production, fast. Here’s what’s waiting for you."
          }
        </Paragraph>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 28px",
              borderRadius: 8,
            }}
          >
            Go to Dashboard
          </Button>
        </Column>
      </Section>

      {/* Divider */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e4e4e7", padding: 10 }} />
      </Section>

      {/* Features — two-column row 1 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#a1a1aa",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              DEPLOY
            </Heading>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#18181b",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Instant Deploys
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#71717a", textAlign: "left", lineHeight: 1.5 }}>
              Push to ship. Global CDN and HTTPS out of the box.
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#a1a1aa",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              COLLABORATE
            </Heading>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#18181b",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Team Workflows
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#71717a", textAlign: "left", lineHeight: 1.5 }}>
              Branch previews, inline comments, and review flows built in.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Features — two-column row 2 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#a1a1aa",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              OBSERVE
            </Heading>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#18181b",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Real-time Analytics
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#71717a", textAlign: "left", lineHeight: 1.5 }}>
              Performance, errors, and usage insights with zero config.
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={4}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#a1a1aa",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              SECURE
            </Heading>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#18181b",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Enterprise Ready
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 13, color: "#71717a", textAlign: "left", lineHeight: 1.5 }}>
              SOC 2, SSO, audit logs, and role-based access from day one.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Help note */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 40, 0] }}>
        <Divider style={{ borderTop: "1px solid #e4e4e7", padding: 10 }} />
        <Paragraph style={{ padding: 10, fontSize: 13, color: "#a1a1aa", textAlign: "center", lineHeight: 1.6 }}>
          Questions? Just reply to this email — a real person will get back to you within the hour.
        </Paragraph>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 40, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5 }}>
          Acme Inc · San Francisco, CA
        </Paragraph>
      </Section>
    </Email>
  );
}
