import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Paragraph,
  Section,
} from "@unlayer/react-elements";

const sansFont = "'Inter', system-ui, -apple-system, sans-serif";

export default function ProductLaunch(): ReactElement {
  return (
    <Email
      width={540}
      previewText="Introducing Arc 2.0 — the browser, reimagined. Again."
      style={{ backgroundColor: "#0a0a0a", color: "#fafafa", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [36, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{ src: "https://placehold.co/36x36/8b5cf6/ffffff?text=A", width: 36, height: 36 }}
            alt="Arc"
            style={{ width: 36 }}
          />
        </Column>
      </Section>

      {/* Hero */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [32, 0, 0, 0] }}>
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 11,
            fontWeight: 700,
            color: "#8b5cf6",
            textAlign: "center",
            lineHeight: 1,
            letterSpacing: "2px",
          }}
        >
          NEW
        </Heading>
        <Heading
          style={{ padding: 10, fontSize: 44, fontWeight: 700, color: "#fafafa", textAlign: "center", lineHeight: 1.1 }}
        >
          Arc 2.0
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 16, color: "#a1a1aa", textAlign: "center", lineHeight: 1.7 }}>
          The browser that thinks the way you do. Rebuilt from the ground up with AI-native
          navigation, spatial tabs, and zero clutter.
        </Paragraph>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#8b5cf6",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 8,
            }}
          >
            Download for Mac
          </Button>
        </Column>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#52525b", textAlign: "center", lineHeight: 1.5 }}>
          Also available for Windows and Linux
        </Paragraph>
      </Section>

      {/* Product Screenshot */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [36, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{
              src: "https://placehold.co/500x300/18181b/3f3f46?text=Arc+2.0+Interface",
              width: 500,
              height: 300,
            }}
            alt="Arc 2.0 Interface"
            style={{ width: 480 }}
          />
        </Column>
      </Section>

      {/* Features Header */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [40, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #27272a", padding: 10 }} />
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 11,
            fontWeight: 700,
            color: "#71717a",
            textAlign: "left",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          WHAT'S NEW
        </Heading>
      </Section>

      {/* Feature 1 */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [0, 0, 24, 0] }}>
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 18, fontWeight: 600, color: "#fafafa", textAlign: "left", lineHeight: 1.3 }}
        >
          AI Navigator
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "left", lineHeight: 1.65 }}>
          Ask Arc anything. It reads the page, finds answers, and takes actions — no extensions
          needed. Summarize articles, fill forms, compare products, all from the URL bar.
        </Paragraph>
      </Section>

      {/* Feature 2 */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [0, 0, 24, 0] }}>
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 18, fontWeight: 600, color: "#fafafa", textAlign: "left", lineHeight: 1.3 }}
        >
          Spatial Tabs
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "left", lineHeight: 1.65 }}>
          Tabs that organize themselves. Related pages cluster together, old tabs fade away, and
          your workspace stays clean without any effort.
        </Paragraph>
      </Section>

      {/* Feature 3 */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [0, 0, 24, 0] }}>
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 18, fontWeight: 600, color: "#fafafa", textAlign: "left", lineHeight: 1.3 }}
        >
          Instant Preview
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#71717a", textAlign: "left", lineHeight: 1.65 }}>
          Hover any link to peek at the page. No more opening tabs just to check if a link is worth
          visiting.
        </Paragraph>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [16, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #27272a", padding: 10 }} />
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 18, fontWeight: 600, color: "#fafafa", textAlign: "center", lineHeight: 1.3 }}
        >
          Ready to try the future of browsing?
        </Heading>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#fafafa",
              color: "#0a0a0a",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 8,
            }}
          >
            Get Arc 2.0 Free
          </Button>
        </Column>
      </Section>

      {/* Footer */}
      <Section style={{ backgroundColor: "#0a0a0a", padding: [36, 0, 40, 0] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#3f3f46", textAlign: "center", lineHeight: 1.5 }}>
          The Browser Company · New York, NY
        </Paragraph>
      </Section>
    </Email>
  );
}
