import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Button,
  Divider,
  Image,
  ColumnLayouts,
} from "@unlayer/react-elements";

const sansFont = {
  label: "Inter",
  value: "'Inter', system-ui, -apple-system, sans-serif",
};

export default function ProductLaunch(): ReactElement {
  return (
    <Email
      backgroundColor="#0a0a0a"
      textColor="#fafafa"
      contentAlign="center"
      contentWidth="540px"
      fontFamily={sansFont}
      previewText="Introducing Arc 2.0 — the browser, reimagined. Again."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="36px 44px 0px 44px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/36x36/8b5cf6/ffffff?text=A", width: 36, height: 36 }}
            altText="Arc"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="32px 44px 0px 44px">
        <Column>
          <Heading
            text="NEW"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#8b5cf6"
            textAlign="center"
            lineHeight="1"
            letterSpacing="2px"
            fontFamily={sansFont}
          />
          <Heading
            text="Arc 2.0"
            headingType="h1"
            fontSize="44px"
            fontWeight={700}
            color="#fafafa"
            textAlign="center"
            lineHeight="1.1"
            fontFamily={sansFont}
          />
          <Paragraph
            html="The browser that thinks the way you do. Rebuilt from the ground up with AI-native navigation, spatial tabs, and zero clutter."
            fontSize="16px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.7"
            fontFamily={sansFont}
          />
          <Button
            text="Download for Mac"
            buttonColors={{ backgroundColor: "#8b5cf6", color: "#ffffff" }}
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Also available for Windows and Linux"
            fontSize="12px"
            color="#52525b"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Product Screenshot */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="36px 20px 0px 20px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/500x300/18181b/3f3f46?text=Arc+2.0+Interface", width: 500, height: 300 }}
            altText="Arc 2.0 Interface"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Features Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="40px 44px 0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#27272a"
            borderTopStyle="solid"
          />
          <Heading
            text="WHAT'S NEW"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#71717a"
            textAlign="left"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Feature 1 */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="0px 44px 24px 44px">
        <Column>
          <Heading
            text="AI Navigator"
            headingType="h3"
            fontSize="18px"
            fontWeight={600}
            color="#fafafa"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Ask Arc anything. It reads the page, finds answers, and takes actions — no extensions needed. Summarize articles, fill forms, compare products, all from the URL bar."
            fontSize="14px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Feature 2 */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="0px 44px 24px 44px">
        <Column>
          <Heading
            text="Spatial Tabs"
            headingType="h3"
            fontSize="18px"
            fontWeight={600}
            color="#fafafa"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Tabs that organize themselves. Related pages cluster together, old tabs fade away, and your workspace stays clean without any effort."
            fontSize="14px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Feature 3 */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="0px 44px 24px 44px">
        <Column>
          <Heading
            text="Instant Preview"
            headingType="h3"
            fontSize="18px"
            fontWeight={600}
            color="#fafafa"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Hover any link to peek at the page. No more opening tabs just to check if a link is worth visiting."
            fontSize="14px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="16px 44px 0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#27272a"
            borderTopStyle="solid"
          />
          <Heading
            text="Ready to try the future of browsing?"
            headingType="h3"
            fontSize="18px"
            fontWeight={600}
            color="#fafafa"
            textAlign="center"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Button
            text="Get Arc 2.0 Free"
            buttonColors={{ backgroundColor: "#fafafa", color: "#0a0a0a" }}
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0a0a0a" padding="36px 44px 40px 44px">
        <Column>
          <Paragraph
            html="The Browser Company · New York, NY"
            fontSize="12px"
            color="#3f3f46"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
