import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Button,
  Image,
  ColumnLayouts,
} from "@unlayer-dev/react-elements";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function TeamInvite(): ReactElement {
  return (
    <Email
      backgroundColor="#f4f4f5"
      textColor="#18181b"
      contentAlign="center"
      contentWidth="480px"
      fontFamily={sansFont}
      previewText="Alex invited you to join the Rocket Team on Acme."
    >
      {/* Logo */}
      <Row layout={ColumnLayouts.OneColumn} padding="40px 40px 24px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/36x36/18181b/ffffff?text=A", width: 36, height: 36 }}
            altText="Acme"
            textAlign="center"
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Card */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 40px 16px 40px">
        <Column>
          <Heading
            text="Join Rocket Team on Acme"
            headingType="h1"
            fontSize="22px"
            fontWeight={700}
            color="#18181b"
            textAlign="center"
            lineHeight="1.3"
            containerPadding="0 0 12px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Alex Chen (alex@acme.dev) has invited you to collaborate on the Rocket Team workspace."
            fontSize="14px"
            color="#71717a"
            textAlign="center"
            lineHeight="1.7"
            containerPadding="0 0 28px 0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Avatars */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/200x64/f4f4f5/71717a?text=AC+%E2%86%92+You", width: 200, height: 64 }}
            altText="Alex Chen invites You"
            textAlign="center"
            containerPadding="0 0 28px 0"
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 40px 40px 40px">
        <Column>
          <Button
            text="Accept Invitation"
            backgroundColor="#18181b"
            color="#ffffff"
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
          <Paragraph
            text="This link expires in 7 days."
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            containerPadding="12px 0 0 0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 40px 40px 40px">
        <Column>
          <Paragraph
            text="This invitation was sent to you@example.com."
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="If you didn't expect it, you can safely ignore this email."
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            containerPadding="0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
