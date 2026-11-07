import { Button, Column, Grid, Heading, Image, Menu, Page, Text, Row, Section } from "@hyper-elements/react";

export const meta = { title: "Landing page", root: "Page", component: "LandingPage", url: "orbit.dev" };

const features = [
  { icon: "◆", title: "Live previews", body: "See every template in every output while you type." },
  { icon: "▲", title: "Typed templates", body: "Props checked by TypeScript before anything ships." },
  { icon: "●", title: "One-click deploys", body: "Push a new version to production in seconds." },
];

export default function LandingPage() {
  return (
    <Page width={1120} title="Orbit: ship every surface" style={{ backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif", color: "#0f172a" }}>
      <Section style={{ padding: [20, 32], border: { bottom: "1px solid #eef0f4" } }}>
        <Row style={{ alignItems: "center", gap: 24 }} stackOnMobile={false}>
          <Image src={{ src: "https://hyperelements.dev/img/orbit-logo.png", width: 252, height: 128 }} alt="Orbit" style={{ width: 84, flex: "none" }} />
          <Menu
            items={[
              { text: "Product", href: "https://example.com/product" },
              { text: "Pricing", href: "https://example.com/pricing" },
              { text: "Docs", href: "https://example.com/docs" },
              { text: "Changelog", href: "https://example.com/changelog" },
            ]}
            separator=" "
            style={{ fontSize: 14, color: "#475569", justifyContent: "center" }}
          />
          <Button href="https://example.com/signup" style={{ backgroundColor: "#0f172a", borderRadius: 999, padding: [10, 18], fontSize: 14, fontWeight: 700, flex: "none" }}>
            Get started
          </Button>
        </Row>
      </Section>
      <Section style={{ padding: [72, 32, 40, 32], gap: 22, alignItems: "center", textAlign: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: 700, color: "#6d5efc", backgroundColor: "#eeecff", borderRadius: 999, padding: [6, 14] }}>
          New · Orbit 2.0
        </Text>
        <Heading level={1} style={{ fontSize: 60, lineHeight: 1.04, letterSpacing: -2, maxWidth: 760 }} mobile={{ fontSize: 38 }}>
          Ship every surface from one codebase.
        </Heading>
        <Text style={{ fontSize: 19, lineHeight: 1.55, color: "#475569", maxWidth: 600 }}>
          Live previews, typed templates and one-click deploys for the team that owns your product's every pixel.
        </Text>
        <Row style={{ gap: 12, justifyContent: "center" }}>
          <Button href="https://example.com/signup" style={{ backgroundColor: "#6d5efc", borderRadius: 10, padding: [14, 24], fontSize: 16, fontWeight: 700, flex: "none" }} hover={{ backgroundColor: "#5a4bf0" }}>
            Start for free
          </Button>
          <Button href="https://example.com/demo" style={{ backgroundColor: "#ffffff", color: "#0f172a", border: "1px solid #d7dbe3", borderRadius: 10, padding: [14, 24], fontSize: 16, fontWeight: 700, flex: "none" }}>
            Book a demo
          </Button>
        </Row>
      </Section>
      <Section style={{ padding: [8, 32, 56, 32] }}>
        <Image
          src={{ src: "https://hyperelements.dev/img/orbit-app.png", width: 1200, height: 700 }}
          alt="The Orbit 2.0 dashboard"
          style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}
        />
      </Section>
      <Section style={{ backgroundColor: "#f8fafc", padding: [56, 32] }}>
        <Grid columns={3} style={{ gap: 20 }}>
          {features.map((f) => (
            <Column key={f.title} style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, gap: 8 }}>
              <Text style={{ fontSize: 18, color: "#6d5efc" }}>{f.icon}</Text>
              <Heading level={3} style={{ fontSize: 18 }}>{f.title}</Heading>
              <Text style={{ fontSize: 15, lineHeight: 1.55, color: "#64748b" }}>{f.body}</Text>
            </Column>
          ))}
        </Grid>
      </Section>
      <Section style={{ padding: [28, 32] }}>
        <Text style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>© 2026 Orbit Labs · Privacy · Terms</Text>
      </Section>
    </Page>
  );
}
