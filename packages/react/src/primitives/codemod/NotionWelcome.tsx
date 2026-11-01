// main's examples/NotionWelcome.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
import {
  Button,
  Column,
  Email,
  Heading,
  Image,
  Link,
  Paragraph,
  Row,
  Section,
  Social,
} from "../index";

// Notion/Figma-style onboarding welcome — approachable, clean, generous whitespace.
const INK = "#2B2B33";
const MUTED = "#6B6F76";
const SUBTLE = "#9CA0A6";
const ACCENT = "#0B0B0F";
const PANEL = "#F7F7F5";
const sans = {
  label: "Sans Serif",
  value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const PRODUCT = "Lumen";

export function NotionWelcome() {
  return (
    <Email
      width={600}
      previewText={`Welcome to ${PRODUCT} — here's how to get started.`}
      style={{ backgroundColor: PANEL, color: INK, fontFamily: sans.value }}
    >
      {/* Wordmark */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [40, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 18,
            fontWeight: 700,
            color: ACCENT,
            textAlign: "left",
            lineHeight: "100%",
          }}
        >
          ✦ {PRODUCT}
        </Heading>
      </Section>

      {/* Welcome heading + intro */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 8, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontSize: 34,
            fontWeight: 700,
            color: INK,
            textAlign: "left",
            lineHeight: "120%",
          }}
        >
          Welcome to {PRODUCT} 👋
        </Heading>
      </Section>
      <Section style={{ backgroundColor: "#FFFFFF", padding: [0, 0, 8, 0] }}>
        <Paragraph
          style={{ padding: 10, fontSize: 16, color: MUTED, textAlign: "left", lineHeight: "160%" }}
        >
          We're so glad you're here. Lumen is the calm, all-in-one workspace where your notes, docs,
          and plans finally live together. Let's get you set up in just a few minutes.
        </Paragraph>
      </Section>

      {/* Optional small hero image */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 8, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={"https://images.unsplash.com/photo-1517842645767-c639042777db?w=1040&q=80"}
            alt="A tidy desk workspace"
            style={{ width: "100%", maxWidth: 504 }}
          />
        </Column>
      </Section>

      {/* 2x2 feature grid — first row */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [24, 0, 8, 0] }}>
        <Row>
          <Column style={{ width: "50%", padding: "0 16px 16px 0" }}>
            <Heading
              level={3}
              style={{ padding: 10, fontSize: 17, fontWeight: 600, color: INK, lineHeight: "130%" }}
            >
              📝 Write anything
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
              Docs, notes, and wikis that feel effortless to create.
            </Paragraph>
          </Column>
          <Column style={{ width: "50%", padding: "0 0 16px 16px" }}>
            <Heading
              level={3}
              style={{ padding: 10, fontSize: 17, fontWeight: 600, color: INK, lineHeight: "130%" }}
            >
              ✅ Plan together
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
              Tasks and timelines that keep the whole team in sync.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* 2x2 feature grid — second row */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 24, 0] }}>
        <Row>
          <Column style={{ width: "50%", padding: "0 16px 0 0" }}>
            <Heading
              level={3}
              style={{ padding: 10, fontSize: 17, fontWeight: 600, color: INK, lineHeight: "130%" }}
            >
              🔍 Find it fast
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
              Instant search across everything you've ever written.
            </Paragraph>
          </Column>
          <Column style={{ width: "50%", padding: "0 0 0 16px" }}>
            <Heading
              level={3}
              style={{ padding: 10, fontSize: 17, fontWeight: 600, color: INK, lineHeight: "130%" }}
            >
              🤝 Share with anyone
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: MUTED, lineHeight: "150%" }}>
              Invite teammates and guests with a single link.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Get started CTA */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [8, 0, 48, 0] }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="https://example.com/get-started"
            style={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 600,
              padding: "14px 28px",
              borderRadius: 8,
            }}
          >
            Get started
          </Button>
        </Column>
      </Section>

      {/* Footer — social icons */}
      <Section style={{ backgroundColor: PANEL, padding: [32, 0, 8, 0] }}>
        <Column style={{ padding: 10 }}>
          <Social
            icons={[
              { name: "Twitter", href: "https://twitter.com/lumen" },
              { name: "Instagram", href: "https://instagram.com/lumen" },
              { name: "LinkedIn", href: "https://linkedin.com/company/lumen" },
              { name: "GitHub", href: "https://github.com/lumen" },
            ]}
            iconType="rounded"
            size={28}
            style={{ gap: 12, justifyContent: "center" }}
          />
        </Column>
      </Section>
      <Section style={{ backgroundColor: PANEL, padding: [0, 0, 40, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: SUBTLE,
            textAlign: "center",
            lineHeight: "150%",
          }}
        >
          {"Lumen · 100 Market St, San Francisco, CA · "}
          <Link href="https://example.com/unsubscribe">Unsubscribe</Link>
        </Paragraph>
      </Section>
    </Email>
  );
}
