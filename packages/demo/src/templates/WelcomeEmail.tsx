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
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function WelcomeEmail(): ReactElement {
  return (
    <Email
      backgroundColor="#f4f4f5"
      textColor="#18181b"
      contentAlign="center"
      contentWidth="540px"
      fontFamily={sansFont}
      previewText="Welcome aboard! Here's everything you need to get started with Acme."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 44px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/100x26/18181b/ffffff?text=ACME", width: 100, height: 26 }}
            altText="Acme"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Indigo accent bar */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#4f46e5" padding="0px">
        <Column>
          <Divider
            borderTopWidth="3px"
            borderTopColor="#4f46e5"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 44px 0px 44px">
        <Column>
          <Heading
            text="Welcome to Acme"
            headingType="h1"
            fontSize="26px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html={"Thanks for signing up. <b>Acme</b> gives your team everything it needs to go from idea to production, fast. Here\u2019s what\u2019s waiting for you."}
            fontSize="15px"
            color="#52525b"
            textAlign="left"
            lineHeight="1.7"
            fontFamily={sansFont}
          />
          <Button
            text="Go to Dashboard"
            buttonColors={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
            padding="14px 28px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 44px 0px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Features — two-column row 1 */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="28px 44px 0px 44px">
        <Column>
          <Heading
            text="DEPLOY"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="Instant Deploys"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Push to ship. Global CDN and HTTPS out of the box."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="COLLABORATE"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="Team Workflows"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Branch previews, inline comments, and review flows built in."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Features — two-column row 2 */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 44px 0px 44px">
        <Column>
          <Heading
            text="OBSERVE"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="Real-time Analytics"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Performance, errors, and usage insights with zero config."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="SECURE"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="Enterprise Ready"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="SOC 2, SSO, audit logs, and role-based access from day one."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Help note */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 44px 40px 44px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Paragraph
            html="Questions? Just reply to this email — a real person will get back to you within the hour."
            fontSize="13px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 44px 40px 44px">
        <Column>
          <Paragraph
            html="Acme Inc · San Francisco, CA"
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
