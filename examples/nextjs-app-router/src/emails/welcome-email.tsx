import {
  Email,
  Row,
  Column,
  Heading,
  Paragraph,
  Button,
  Divider,
  ColumnLayouts,
} from "@unlayer/react-elements";
import { escapeHtml, requireSafeUrl } from "@/utils/safe";

const font = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export interface WelcomeEmailProps {
  /** Recipient's first name */
  name: string;
  /** Plan they signed up for */
  plan: string;
  /** Where the CTA sends them */
  dashboardUrl: string;
}

/**
 * A realistic transactional email: welcome + activation CTA.
 *
 * It is a plain component tree — the props come from wherever your app gets
 * data (a DB row, a webhook payload, a CMS). Nothing here is Next-specific;
 * the same tree can be handed to renderToHtml() from a route handler, a
 * background job, or a test.
 *
 * Because those props are untrusted, dynamic values are escaped before being
 * interpolated into raw HTML and link targets are validated as http(s).
 */
export default function WelcomeEmail({ name, plan, dashboardUrl }: WelcomeEmailProps) {
  // Props may come from a DB, webhook, or CMS: escape anything interpolated
  // into the raw `html` prop and reject non-http(s) link targets.
  const safePlan = escapeHtml(plan);
  const safeDashboardUrl = requireSafeUrl(dashboardUrl);

  return (
    <Email
      backgroundColor="#f4f4f5"
      textColor="#18181b"
      contentAlign="center"
      contentWidth="560px"
      fontFamily={font}
      previewText={`Your ${plan} workspace is ready, ${name}.`}
    >
      {/* Masthead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 40px 0px 40px">
        <Column>
          <Heading
            text="ACME"
            headingType="h4"
            fontSize="13px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1"
            letterSpacing="2px"
            fontFamily={font}
          />
        </Column>
      </Row>

      {/* Greeting */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px 0px 40px">
        <Column>
          <Heading
            text={`Welcome, ${name}`}
            headingType="h1"
            fontSize="26px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1.25"
            fontFamily={font}
          />
          <Paragraph
            html={`Your <b>${safePlan}</b> workspace is ready. Invite your team, connect a repository, and ship your first deploy in under five minutes.`}
            fontSize="15px"
            color="#52525b"
            textAlign="left"
            lineHeight="1.7"
            fontFamily={font}
          />
          <Button
            text="Open your dashboard"
            href={safeDashboardUrl}
            buttonColors={{ backgroundColor: "#18181b", color: "#ffffff" }}
            padding="13px 26px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="left"
            fontFamily={font}
          />
        </Column>
      </Row>

      {/* What's included — two columns */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="28px 40px 0px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor="#e4e4e7" borderTopStyle="solid" />
          <Heading
            text="Unlimited projects"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={font}
          />
          <Paragraph
            html="Spin up as many workspaces as your team needs."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.6"
            fontFamily={font}
          />
        </Column>
        <Column>
          <Divider borderTopWidth="1px" borderTopColor="#e4e4e7" borderTopStyle="solid" />
          <Heading
            text="Priority support"
            headingType="h3"
            fontSize="15px"
            fontWeight={600}
            color="#18181b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={font}
          />
          <Paragraph
            html="Reach a human in under an hour, every day of the week."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.6"
            fontFamily={font}
          />
        </Column>
      </Row>

      {/* Sign-off */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px 36px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor="#e4e4e7" borderTopStyle="solid" />
          <Paragraph
            html="Questions? Just reply to this email — it reaches the team directly."
            fontSize="13px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.6"
            fontFamily={font}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 40px 32px 40px">
        <Column>
          <Paragraph
            html='Acme Inc · San Francisco, CA · <a href="#">Unsubscribe</a>'
            fontSize="11px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={font}
          />
        </Column>
      </Row>
    </Email>
  );
}
