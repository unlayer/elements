import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Link,
  Page,
  Paragraph,
  Row,
  Section,
  Span,
} from "@unlayer/react-elements";

const sansFont = "Georgia, 'Times New Roman', Times, serif";

const uiFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

/** Which output this newsletter is being rendered for. */
export type NewsletterOutput = "email" | "web";

const rootStyle = { backgroundColor: "#f9f9f4", color: "#1a1a1a", fontFamily: sansFont };
const summary = "This week: Design systems at scale, the future of email, and more.";

/**
 * The newsletter's content, the same for both outputs. Only the root around it
 * changes:
 *   <Email> → table-based HTML for inboxes
 *   <Page>  → div/flexbox HTML for the browser ("view in browser" archive)
 *
 * See NewsletterWebArchive.tsx for the web variant.
 */
function NewsletterContent({ output }: { output: NewsletterOutput }): ReactElement {
  return (
    <>
      {/* Masthead */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 24, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.2 }}
        >
          The Weekly Brief
        </Heading>
        <Paragraph
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 13,
            color: "#999999",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          March 4, 2026 · Issue #47
        </Paragraph>
      </Section>

      {/* Divider */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "2px solid #1a1a1a", padding: 10 }} />
      </Section>

      {/* Featured Article */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 11,
            fontWeight: 700,
            color: "#e85d04",
            textAlign: "left",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          FEATURED
        </Heading>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{
              src: "https://placehold.co/560x280/1a1a1a/ffffff?text=Design+Systems+at+Scale",
              width: 560,
              height: 280,
            }}
            alt="Design Systems at Scale"
            style={{ width: 452 }}
          />
        </Column>
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 22, fontWeight: 700, color: "#1a1a1a", textAlign: "left", lineHeight: 1.3 }}
        >
          Design Systems at Scale: Lessons from the Trenches
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: "#555555", textAlign: "left", lineHeight: 1.7 }}>
          After three years building a design system used by 200+ engineers, here's what actually
          matters — and what's just noise. Spoiler: tokens are table stakes, but governance is
          everything.
        </Paragraph>
        <Paragraph
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 13,
            color: "#999999",
            textAlign: "left",
            lineHeight: 1.5,
          }}
        >
          {"By "}
          <Span style={{ fontWeight: 700 }}>Sarah Chen</Span>
          {" · 8 min read"}
        </Paragraph>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#1a1a1a",
              color: "#ffffff",
              fontFamily: uiFont,
              fontSize: 13,
              fontWeight: 600,
              padding: "12px 24px",
              borderRadius: 4,
            }}
          >
            Read Article →
          </Button>
        </Column>
      </Section>

      {/* Section Divider */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e5e5e0", padding: 10 }} />
      </Section>

      {/* Article List */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 11,
            fontWeight: 700,
            color: "#999999",
            textAlign: "left",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          MORE THIS WEEK
        </Heading>
      </Section>

      {/* Article 1 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 20, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/160x120/e85d04/ffffff?text=01",
                  width: 160,
                  height: 120,
                }}
                alt="Article thumbnail"
                style={{ width: 137 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              The Future of Email Is Components
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#777777", textAlign: "left", lineHeight: 1.5 }}>
              How React-based email systems are replacing template builders.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Article divider */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #f0f0eb", padding: 10 }} />
      </Section>

      {/* Article 2 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [20, 0, 20, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/160x120/1a1a1a/ffffff?text=02",
                  width: 160,
                  height: 120,
                }}
                alt="Article thumbnail"
                style={{ width: 137 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Accessibility Isn't Optional Anymore
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#777777", textAlign: "left", lineHeight: 1.5 }}>
              The EU Accessibility Act takes effect in June. Here's what it means for your emails.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Article divider */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #f0f0eb", padding: 10 }} />
      </Section>

      {/* Article 3 */}
      <Section style={{ backgroundColor: "#ffffff", padding: [20, 0, 28, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Column style={{ padding: 10, alignItems: "center" }}>
              <Image
                src={{
                  src: "https://placehold.co/160x120/555555/ffffff?text=03",
                  width: 160,
                  height: 120,
                }}
                alt="Article thumbnail"
                style={{ width: 137 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "66.67%" }}>
            <Heading
              level={3}
              style={{
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              Why We Switched from Figma to Code-First
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#777777", textAlign: "left", lineHeight: 1.5 }}>
              Our team's journey from visual tools to component-driven design.
            </Paragraph>
          </Column>
        </Row>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [24, 0, 40, 0] }}>
        <Paragraph
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 12,
            color: "#999999",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {"You're receiving this because you subscribed to "}
          <Span style={{ fontWeight: 700 }}>The Weekly Brief</Span>.
        </Paragraph>
        {/* The only content that differs between the two outputs: the inbox
              copy links out to the archive, the archive links back to signup. */}
        <Paragraph
          style={{
            padding: 10,
            fontFamily: uiFont,
            fontSize: 12,
            color: "#999999",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {output === "web" ? (
            <>
              <Link href="#">Subscribe</Link> · <Link href="#">Browse the archive</Link> ·{" "}
              <Link href="#">RSS</Link>
            </>
          ) : (
            <>
              <Link href="#">Unsubscribe</Link> · <Link href="#">View in browser</Link> ·{" "}
              <Link href="#">Update preferences</Link>
            </>
          )}
        </Paragraph>
      </Section>
    </>
  );
}

/** The newsletter for one output: its content in that output's root. */
export function newsletterTemplate(output: NewsletterOutput): ReactElement {
  return output === "web" ? (
    <Page width={560} description={summary} style={rootStyle}>
      <NewsletterContent output="web" />
    </Page>
  ) : (
    <Email width={560} previewText={summary} style={rootStyle}>
      <NewsletterContent output="email" />
    </Email>
  );
}

/** The newsletter as an email — table-based HTML for inboxes. */
export default function NewsletterDigest(): ReactElement {
  return newsletterTemplate("email");
}
