import { Button, Column, Divider, Email, Grid, Heading, Image, Link, Menu, Text, Section, Social } from "@hyper-elements/react";

export const meta = { title: "Launch email", root: "Email", component: "LaunchEmail", from: "Orbit", subject: "Orbit 2.0 is here" };

const features = [
  { title: "Live previews", body: "Every template, every client, as you type." },
  { title: "Typed templates", body: "Props checked before a single send." },
  { title: "One-click deploys", body: "Ship a new version in seconds." },
];

export default function LaunchEmail() {
  return (
    <Email
      previewText="Live previews, typed templates and one-click deploys"
      style={{ backgroundColor: "#f1f2f6", fontFamily: "Helvetica, Arial, sans-serif", color: "#0f172a" }}
    >
      <Section style={{ padding: [28, 24, 20, 24], alignItems: "center" }}>
        <Image src={{ src: "https://hyperelements.dev/img/orbit-logo.png", width: 252, height: 128 }} alt="Orbit" style={{ width: 92 }} />
      </Section>
      <Section style={{ padding: [0, 16] }}>
        <Column style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: [36, 36, 32, 36], gap: 18 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#6d5efc" }}>INTRODUCING ORBIT 2.0</Text>
          <Heading level={1} style={{ fontSize: 34, lineHeight: 1.12, letterSpacing: -0.5 }} mobile={{ fontSize: 28 }}>
            Ship every surface from one codebase.
          </Heading>
          <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#475569" }}>
            Live previews, typed templates and one-click deploys, rolling out to every workspace today.
          </Text>
          <Image
            src={{ src: "https://hyperelements.dev/img/orbit-app.png", width: 1200, height: 700 }}
            alt="The Orbit 2.0 dashboard"
            style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
          />
          <Button
            href="https://example.com/orbit-2"
            style={{ backgroundColor: "#6d5efc", borderRadius: 10, padding: [14, 26], fontSize: 15, fontWeight: 700 }}
            hover={{ backgroundColor: "#5a4bf0" }}
          >
            Try Orbit 2.0
          </Button>
          <Divider style={{ borderTop: "1px solid #eef0f4", padding: [6, 0] }} />
          <Grid columns={3} style={{ gap: 18 }}>
            {features.map((f) => (
              <Column key={f.title} style={{ gap: 4 }}>
                <Heading level={3} style={{ fontSize: 15 }}>{f.title}</Heading>
                <Text style={{ fontSize: 13, lineHeight: 1.5, color: "#64748b" }}>{f.body}</Text>
              </Column>
            ))}
          </Grid>
        </Column>
      </Section>
      <Section style={{ padding: [28, 24, 36, 24], gap: 14 }}>
        <Social
          icons={[
            { name: "X", href: "https://x.com/example" },
            { name: "GitHub", href: "https://github.com/example" },
            { name: "LinkedIn", href: "https://linkedin.com/company/example" },
          ]}
          iconType="circle"
          size={26}
          style={{ gap: 8 }}
        />
        <Menu
          items={[
            { text: "Changelog", href: "https://example.com/changelog" },
            { text: "Docs", href: "https://example.com/docs" },
            { text: "Help", href: "https://example.com/help" },
          ]}
          separator="·"
          style={{ fontSize: 12, color: "#64748b", justifyContent: "center" }}
        />
        <Text style={{ fontSize: 11, lineHeight: 1.6, color: "#94a3b8", textAlign: "center" }}>
          Orbit Labs, 500 Howard St, San Francisco.{" "}
          <Link href="https://example.com/unsubscribe" style={{ color: "#94a3b8" }}>Unsubscribe</Link>
        </Text>
      </Section>
    </Email>
  );
}
