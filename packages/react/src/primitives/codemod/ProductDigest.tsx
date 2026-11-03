// main's examples/ProductDigest.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
//
// What the codemod reported:
// - line 102: written as a Row of its links, spaced as today's Menu spaces them (the new Menu leaves out the space today's puts between its links): in the visual editor it's a row of text, not a Menu
import { Column, Divider, Email, Heading, Link, Paragraph, Row, Section, Text } from "../index";

// Reconstructed from the "fresh agent" SaaS-digest build — verbatim natural
// forms: heading fonts, inline <a> via Paragraph html, ColumnLayouts.TwoEqual,
// Menu items shorthand with separator.
const INK = "#18181B";
const BODY = "#52525B";
const MUTED = "#A1A1AA";
const LINE = "#E4E4E7";
const sans = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export function ProductDigest() {
  return (
    <Email
      width={600}
      style={{ backgroundColor: "#FAFAFA", color: "#000000", fontFamily: sans.value }}
    >
      {/* Brand */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 0, 0, 0] }}>
        <Heading
          level={3}
          style={{
            padding: 10,
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            textAlign: "left",
            lineHeight: "140%",
          }}
        >
          ◆ Linear
        </Heading>
      </Section>

      {/* Title */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 32, fontWeight: 700, color: INK, lineHeight: "120%" }}
        >
          Product updates, June 2026
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: BODY, lineHeight: "160%" }}>
          Three improvements shipped this month to make you faster.
        </Paragraph>
      </Section>

      {/* Feature 1 */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [20, 0, 0, 0] }}>
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 20, fontWeight: 600, color: INK, lineHeight: "130%" }}
        >
          Faster command palette
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
          {"The command palette now opens in under 50ms. Read the full "}
          <Link href="https://linear.app/changelog">changelog entry</Link>
          {" for the details."}
        </Paragraph>
      </Section>

      {/* Two-column features */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [12, 0, 8, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={2}
              style={{ padding: 10, fontSize: 20, fontWeight: 600, color: INK, lineHeight: "140%" }}
            >
              Sub-issues
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
              Break work down without leaving the issue view.
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={2}
              style={{ padding: 10, fontSize: 20, fontWeight: 600, color: INK, lineHeight: "140%" }}
            >
              Saved views
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 15, color: BODY, lineHeight: "160%" }}>
              Pin the filters you use every day to the sidebar.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 0, 0] }}>
        <Divider style={{ borderTop: `1px solid ${LINE}`, padding: 10 }} />
      </Section>

      {/* Footer menu */}
      <Section style={{ backgroundColor: "#FFFFFF", padding: [16, 0, 8, 0] }}>
        <Column style={{ padding: 10 }}>
          <Row
            stackOnMobile={false}
            style={{ flexWrap: "wrap", justifyContent: "center", fontSize: 14, lineHeight: 1.2 }}
          >
            <Text style={{ flex: "none", padding: [5, 15] }}>
              <Link
                href="https://linear.app/docs"
                style={{ color: "#0068A5", textDecoration: "none" }}
              >
                Docs
              </Link>
            </Text>
            <Text
              hidden={{ mobile: true }}
              style={{ flex: "none", padding: [5, 15], color: "#444444" }}
            >
              {"\u00a0•"}
            </Text>
            <Text style={{ flex: "none", padding: [5, 15] }}>
              <Link
                href="https://linear.app/blog"
                style={{ color: "#0068A5", textDecoration: "none" }}
              >
                {"\u00a0Blog"}
              </Link>
            </Text>
            <Text
              hidden={{ mobile: true }}
              style={{ flex: "none", padding: [5, 15], color: "#444444" }}
            >
              {"\u00a0•"}
            </Text>
            <Text style={{ flex: "none", padding: [5, 15] }}>
              <Link
                href="https://linear.app/careers"
                style={{ color: "#0068A5", textDecoration: "none" }}
              >
                {"\u00a0Careers"}
              </Link>
            </Text>
          </Row>
        </Column>
      </Section>
      <Section style={{ backgroundColor: "#FFFFFF", padding: [0, 0, 36, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: "140%",
          }}
        >
          You're receiving this because you use Linear.
        </Paragraph>
      </Section>
    </Email>
  );
}
