import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Link,
  Paragraph,
  Row,
  Span,
} from "@unlayer/react-elements";
import { requireSafeUrl } from "@/utils/safe";

const font = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const line = "1px solid #e4e4e7";
const smallPrint = { fontSize: 13, lineHeight: 1.6, color: "#71717a" };
const feature = { fontSize: 15, fontWeight: 600, lineHeight: 1.4 } as const;

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
 * the same tree can be handed to render() from a route handler, a background
 * job, or a test.
 *
 * Those props are untrusted. Text goes in as children, and Elements escapes it
 * when it writes the HTML; the link target is checked here, as http(s).
 */
export default function WelcomeEmail({ name, plan, dashboardUrl }: WelcomeEmailProps) {
  const safeDashboardUrl = requireSafeUrl(dashboardUrl);

  return (
    <Email
      width={560}
      title={`Welcome, ${name}`}
      previewText={`Your ${plan} workspace is ready, ${name}.`}
      style={{ backgroundColor: "#f4f4f5", color: "#18181b", fontFamily: font, gap: 20 }}
    >
      {/* The card */}
      <Column style={{ backgroundColor: "#ffffff", padding: "32px 40px 36px", gap: 24 }}>
        {/* Masthead */}
        <Heading level={4} style={{ fontSize: 13, lineHeight: 1, letterSpacing: 2 }}>
          ACME
        </Heading>

        {/* Greeting */}
        <Heading level={1} style={{ fontSize: 26 }}>
          Welcome, {name}
        </Heading>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.7, color: "#52525b" }}>
          Your <Span style={{ fontWeight: 700 }}>{plan}</Span> workspace is ready. Invite your team, connect a repository, and ship your first deploy in under five minutes.
        </Paragraph>
        <Button
          href={safeDashboardUrl}
          style={{ backgroundColor: "#18181b", padding: [13, 26], borderRadius: 8, fontWeight: 600 }}
        >
          Open your dashboard
        </Button>

        <Divider style={{ borderTop: line }} />

        {/* What's included — two columns, one under the other on phones */}
        <Row style={{ gap: 24 }}>
          <Column style={{ gap: 6 }}>
            <Heading level={3} style={feature}>
              Unlimited projects
            </Heading>
            <Paragraph style={smallPrint}>Spin up as many workspaces as your team needs.</Paragraph>
          </Column>
          <Column style={{ gap: 6 }}>
            <Heading level={3} style={feature}>
              Priority support
            </Heading>
            <Paragraph style={smallPrint}>Reach a human in under an hour, every day of the week.</Paragraph>
          </Column>
        </Row>

        <Divider style={{ borderTop: line }} />

        {/* Sign-off */}
        <Paragraph style={smallPrint}>Questions? Just reply to this email — it reaches the team directly.</Paragraph>
      </Column>

      {/* Footer */}
      <Paragraph style={{ padding: "0 40px 32px", fontSize: 11, lineHeight: 1.6, color: "#a1a1aa", textAlign: "center" }}>
        Acme Inc · San Francisco, CA · <Link href="https://example.com/unsubscribe" style={{ color: "#a1a1aa" }}>Unsubscribe</Link>
      </Paragraph>
    </Email>
  );
}
