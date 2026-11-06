import { Button, Column, Email, Grid, Heading, Image, Menu, MergeTag, Text, Section, Social } from "@hyper-elements/react";

export const meta = {
  title: "Welcome",
  description: "An onboarding email with a logo, a three-step grid that stacks on phones, a footer menu and social links.",
  root: "Email",
};

const steps = [
  { n: "1", title: "Connect a repo", body: "Orbit reads your project and finds every template." },
  { n: "2", title: "Invite your team", body: "Designers edit copy. Engineers keep the code." },
  { n: "3", title: "Ship it", body: "Every deploy renders fresh HTML and plain text." },
];

export default function Welcome() {
  return (
    <Email
      previewText="Three steps to your first send"
      style={{ backgroundColor: "#f5f5f7", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#1f2937" }}
    >
      <Section style={{ padding: [32, 24, 0, 24] }}>
        <Image
          src={{ src: "https://hyperelements.dev/img/orbit-logo.png", width: 252, height: 128 }}
          alt="Orbit"
          style={{ width: 88 }}
        />
      </Section>
      <Section style={{ padding: 24 }}>
        <Column style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: 40, gap: 20 }}>
          <Heading level={1} style={{ fontSize: 30, letterSpacing: -0.5, color: "#0f172a" }} mobile={{ fontSize: 24 }}>
            Welcome aboard, <MergeTag name="first_name" />.
          </Heading>
          <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#475569" }}>
            Your workspace is ready. Here's how teams get from zero to their first send in an afternoon.
          </Text>
          <Grid columns={3} style={{ gap: 16 }}>
            {steps.map((step) => (
              <Column key={step.n} style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: 16, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#6d5efc", letterSpacing: 1 }}>STEP {step.n}</Text>
                <Heading level={3} style={{ fontSize: 16, color: "#0f172a" }}>{step.title}</Heading>
                <Text style={{ fontSize: 14, color: "#64748b" }}>{step.body}</Text>
              </Column>
            ))}
          </Grid>
          <Button
            href="https://example.com/start"
            style={{ backgroundColor: "#6d5efc", borderRadius: 8, padding: [14, 28], fontSize: 15, fontWeight: 600 }}
            hover={{ backgroundColor: "#5a4bf0" }}
          >
            Open your workspace
          </Button>
        </Column>
      </Section>
      <Section style={{ padding: [0, 24, 40, 24], gap: 16 }}>
        <Menu
          items={[
            { text: "Docs", href: "https://example.com/docs" },
            { text: "Changelog", href: "https://example.com/changelog" },
            { text: "Support", href: "https://example.com/support" },
          ]}
          separator="·"
          style={{ fontSize: 13, color: "#64748b", justifyContent: "center" }}
        />
        <Social
          icons={[
            { name: "X", href: "https://x.com/example" },
            { name: "GitHub", href: "https://github.com/example" },
            { name: "LinkedIn", href: "https://linkedin.com/company/example" },
          ]}
          iconType="circle"
          size={28}
          style={{ gap: 8 }}
        />
        <Text style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
          Orbit Labs, 500 Howard St, San Francisco. You're getting this because you signed up.
        </Text>
      </Section>
    </Email>
  );
}
