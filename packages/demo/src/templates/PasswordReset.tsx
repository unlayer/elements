import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Button,
  Divider,
  ColumnLayouts,
} from "@unlayer/react-elements";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function PasswordReset(): ReactElement {
  return (
    <Email
      backgroundColor="#f4f4f5"
      textColor="#18181b"
      contentAlign="center"
      contentWidth="480px"
      fontFamily={sansFont}
      previewText="Reset your Vault password. This link expires in 60 minutes."
    >
      {/* Logo */}
      <Row layout={ColumnLayouts.OneColumn} padding="40px 40px 24px 40px">
        <Column>
          <Heading
            text="vault"
            headingType="h4"
            fontSize="16px"
            fontWeight={700}
            color="#18181b"
            textAlign="center"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Card */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 40px 0px 40px">
        <Column>
          <Heading
            text="Reset your password"
            headingType="h1"
            fontSize="22px"
            fontWeight={700}
            color="#18181b"
            textAlign="center"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="We received a request to reset the password for the account associated with <b>user@example.com</b>. Click the button below to choose a new password."
            fontSize="14px"
            color="#71717a"
            textAlign="center"
            lineHeight="1.7"
            fontFamily={sansFont}
          />
          <Button
            text="Reset Password"
            buttonColors={{ backgroundColor: "#18181b", color: "#ffffff" }}
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
          <Paragraph
            html="This link expires in 60 minutes."
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Safety note */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 40px 40px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Paragraph
            html="If you didn't request this, you can safely ignore this email. Your password won't change unless you click the button above."
            fontSize="13px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Vault Inc · San Francisco, CA"
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
