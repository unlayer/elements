import type { ReactElement } from "react";
import {
  Email,
  Page,
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
  label: "Georgia",
  value: "Georgia, 'Times New Roman', Times, serif",
};

const uiFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

/** Which output this newsletter is being rendered for. */
export type NewsletterOutput = "email" | "web";

/**
 * The newsletter, wrapper-agnostic.
 *
 * Everything inside the wrapper is identical for both outputs — only the root
 * component changes:
 *   <Email> → table-based HTML for inboxes
 *   <Page>  → div/flexbox HTML for the browser ("view in browser" archive)
 *
 * See NewsletterWebArchive.tsx for the web variant.
 */
export function newsletterTemplate(output: NewsletterOutput): ReactElement {
  const Wrapper = output === "web" ? Page : Email;

  return (
    <Wrapper
      backgroundColor="#f9f9f4"
      textColor="#1a1a1a"
      contentAlign="center"
      contentWidth="560px"
      fontFamily={sansFont}
      previewText="This week: Design systems at scale, the future of email, and more."
    >
      {/* Masthead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 44px 24px 44px">
        <Column>
          <Heading
            text="The Weekly Brief"
            headingType="h1"
            fontSize="28px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="March 4, 2026 · Issue #47"
            fontSize="13px"
            color="#999999"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={uiFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 44px">
        <Column>
          <Divider
            borderTopWidth="2px"
            borderTopColor="#1a1a1a"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Featured Article */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 44px 0px 44px">
        <Column>
          <Heading
            text="FEATURED"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#e85d04"
            textAlign="left"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={uiFont}
          />
          <Image
            src={{ url: "https://placehold.co/560x280/1a1a1a/ffffff?text=Design+Systems+at+Scale", width: 560, height: 280 }}
            altText="Design Systems at Scale"
            textAlign="center"
          />
          <Heading
            text="Design Systems at Scale: Lessons from the Trenches"
            headingType="h2"
            fontSize="22px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="After three years building a design system used by 200+ engineers, here's what actually matters — and what's just noise. Spoiler: tokens are table stakes, but governance is everything."
            fontSize="16px"
            color="#555555"
            textAlign="left"
            lineHeight="1.7"
            fontFamily={sansFont}
          />
          <Paragraph
            html="By <b>Sarah Chen</b> · 8 min read"
            fontSize="13px"
            color="#999999"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={uiFont}
          />
          <Button
            text="Read Article →"
            buttonColors={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
            padding="12px 24px"
            borderRadius="4px"
            fontSize="13px"
            fontWeight={600}
            textAlign="left"
            fontFamily={uiFont}
          />
        </Column>
      </Row>

      {/* Section Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 44px 0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e0"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Article List */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 44px 0px 44px">
        <Column>
          <Heading
            text="MORE THIS WEEK"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#999999"
            textAlign="left"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={uiFont}
          />
        </Column>
      </Row>

      {/* Article 1 */}
      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="0px 44px 20px 44px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/160x120/e85d04/ffffff?text=01", width: 160, height: 120 }}
            altText="Article thumbnail"
            textAlign="center"
          />
        </Column>
        <Column>
          <Heading
            text="The Future of Email Is Components"
            headingType="h3"
            fontSize="16px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="How React-based email systems are replacing template builders."
            fontSize="14px"
            color="#777777"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Article divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f0f0eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Article 2 */}
      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="20px 44px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/160x120/1a1a1a/ffffff?text=02", width: 160, height: 120 }}
            altText="Article thumbnail"
            textAlign="center"
          />
        </Column>
        <Column>
          <Heading
            text="Accessibility Isn't Optional Anymore"
            headingType="h3"
            fontSize="16px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="The EU Accessibility Act takes effect in June. Here's what it means for your emails."
            fontSize="14px"
            color="#777777"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Article divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f0f0eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Article 3 */}
      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="20px 44px 28px 44px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/160x120/555555/ffffff?text=03", width: 160, height: 120 }}
            altText="Article thumbnail"
            textAlign="center"
          />
        </Column>
        <Column>
          <Heading
            text="Why We Switched from Figma to Code-First"
            headingType="h3"
            fontSize="16px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Our team's journey from visual tools to component-driven design."
            fontSize="14px"
            color="#777777"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="24px 44px 40px 44px">
        <Column>
          <Paragraph
            html="You're receiving this because you subscribed to <b>The Weekly Brief</b>."
            fontSize="12px"
            color="#999999"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={uiFont}
          />
          {/* The only content that differs between the two outputs: the inbox
              copy links out to the archive, the archive links back to signup. */}
          <Paragraph
            html={
              output === "web"
                ? '<a href="#">Subscribe</a> · <a href="#">Browse the archive</a> · <a href="#">RSS</a>'
                : '<a href="#">Unsubscribe</a> · <a href="#">View in browser</a> · <a href="#">Update preferences</a>'
            }
            fontSize="12px"
            color="#999999"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={uiFont}
          />
        </Column>
      </Row>
    </Wrapper>
  );
}

/** The newsletter as an email — table-based HTML for inboxes. */
export default function NewsletterDigest(): ReactElement {
  return newsletterTemplate("email");
}
