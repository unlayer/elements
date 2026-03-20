import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Divider,
  ColumnLayouts,
} from "@unlayer/react-elements";

const monoFont = {
  label: "Monospace",
  value: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
};

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function VerificationCode(): ReactElement {
  return (
    <Email
      backgroundColor="#0d1117"
      textColor="#e6edf3"
      contentAlign="center"
      contentWidth="480px"
      fontFamily={sansFont}
      previewText="Your verification code is 847 293. It expires in 10 minutes."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} padding="40px 40px 0px 40px">
        <Column>
          <Heading
            text="● nexus"
            headingType="h4"
            fontSize="16px"
            fontWeight={700}
            color="#e6edf3"
            textAlign="center"
            lineHeight="1"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Card */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#161b22" padding="40px 40px 0px 40px">
        <Column>
          <Heading
            text="Verification code"
            headingType="h1"
            fontSize="20px"
            fontWeight={600}
            color="#e6edf3"
            textAlign="center"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Enter this code to verify your identity and complete the sign-in process."
            fontSize="14px"
            color="#8b949e"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Code Display */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#161b22" padding="0px 40px">
        <Column>
          <Heading
            text="847 293"
            headingType="h1"
            fontSize="40px"
            fontWeight={700}
            color="#58a6ff"
            textAlign="center"
            lineHeight="1"
            letterSpacing="8px"
            fontFamily={monoFont}
          />
        </Column>
      </Row>

      {/* Expiry Notice */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#161b22" padding="0px 40px 32px 40px">
        <Column>
          <Paragraph
            html="This code expires in 10 minutes."
            fontSize="13px"
            color="#8b949e"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Security Info */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#161b22" padding="0px 40px 40px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#30363d"
            borderTopStyle="solid"
          />
          <Paragraph
            html="<b>Didn't request this?</b>"
            fontSize="13px"
            color="#e6edf3"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Someone may be trying to access your account. We recommend changing your password immediately and enabling two-factor authentication."
            fontSize="13px"
            color="#8b949e"
            textAlign="left"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Details */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#161b22" padding="0px 40px 32px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#30363d"
            borderTopStyle="solid"
          />
          <Paragraph
            html="REQUEST DETAILS"
            fontSize="10px"
            color="#484f58"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="<b>IP Address:</b> 192.168.1.42"
            fontSize="12px"
            color="#8b949e"
            textAlign="left"
            lineHeight="1.8"
            fontFamily={monoFont}
          />
          <Paragraph
            html="<b>Location:</b> San Francisco, CA"
            fontSize="12px"
            color="#8b949e"
            textAlign="left"
            lineHeight="1.8"
            fontFamily={monoFont}
          />
          <Paragraph
            html="<b>Device:</b> Chrome on macOS"
            fontSize="12px"
            color="#8b949e"
            textAlign="left"
            lineHeight="1.8"
            fontFamily={monoFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="24px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Nexus Security · This is an automated message"
            fontSize="12px"
            color="#484f58"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
