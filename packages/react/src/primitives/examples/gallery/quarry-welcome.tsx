/**
 * Quarry (a fictional hosted database) welcomes someone who has just made their first database.
 *
 * Dark, because its users live in terminals: charcoal, warm off-white text and one acid lime,
 * kept for what to do next (the step numbers, the button, the prompt). IBM Plex Sans for words,
 * IBM Plex Mono for anything you could type. The welcome is a short terminal session, then three
 * numbered steps, then what the free tier holds.
 */
import type { ReactNode } from "react";
import { Button, Column, Email, Grid, Heading, LineBreak, Link, Text, Row, Section, Span } from "../../index";

const NIGHT = "#0E0F10";
const PANEL = "#17191B";
const TEXT = "#ECEAE4";
const QUIET = "#9C9A92";
const RULE = "#2B2D30";
const LIME = "#D4F25A";
const LIME_DOWN = "#C2E040";

const SANS = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://quarry.example";

const mono = { fontFamily: MONO, fontSize: 13, lineHeight: 1.7 } as const;

/** A line typed at the prompt, and what came back. */
const typed = (command: string) => (
  <>
    <Span style={{ color: LIME }}>$ </Span>
    {command}
    <LineBreak />
  </>
);

/** One of the three steps: its number, what to do, and why. */
const step = (n: string, title: string, body: ReactNode) => (
  <Row stackOnMobile={false} style={{ gap: 20, padding: [20, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 14 }}>
    <Column style={{ width: 32 }}>
      <Text style={{ ...mono, fontSize: 14, color: LIME, lineHeight: "24px" }}>{n}</Text>
    </Column>
    <Column style={{ gap: 4 }}>
      <Heading level={3} style={{ fontSize: 17, fontWeight: 600, lineHeight: "24px" }}>
        {title}
      </Heading>
      <Text style={{ fontSize: 15, lineHeight: 1.6, color: QUIET }}>{body}</Text>
    </Column>
  </Row>
);

/** Code inside a sentence. */
const code = (text: string) => <Span style={{ fontFamily: MONO, fontSize: 14, color: TEXT }}>{text}</Span>;

/** A figure of the free tier. */
const figure = (value: string, unit: string, what: string) => (
  <Column style={{ gap: 4 }}>
    <Text style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.5 }} mobile={{ fontSize: 22 }}>
      {value}
      <Span style={{ fontSize: 15, color: QUIET }}> {unit}</Span>
    </Text>
    <Text style={{ fontSize: 13, lineHeight: 1.45, color: QUIET }}>{what}</Text>
  </Column>
);

export const quarryWelcome = (
  <Email
    width={600}
    lang="en"
    title="Welcome to Quarry"
    previewText="north-ledger is running in Frankfurt. Three steps from an empty schema to your first answer."
    fonts={[
      { family: "IBM Plex Sans", src: "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2", format: "woff2", weight: "100 700" },
      { family: "IBM Plex Mono", src: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q131nj-o.woff2", format: "woff2", weight: 400 },
      { family: "IBM Plex Mono", src: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgsAXHNk.woff2", format: "woff2", weight: 500 },
    ]}
    style={{ backgroundColor: NIGHT, color: TEXT, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 }}
  >
    <Section style={{ padding: [40, 48, 56], gap: 48 }} mobile={{ padding: [28, 24, 40], gap: 36 }}>
      <Row stackOnMobile={false} style={{ alignItems: "center" }}>
        <Column style={{ width: 120 }}>
          <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, letterSpacing: -0.3 }}>
            <Link href={SITE} style={{ color: TEXT, textDecoration: "none" }}>
              quarry<Span style={{ color: LIME }}>_</Span>
            </Link>
          </Text>
        </Column>
        <Column>
          <Text style={{ ...mono, fontSize: 12, color: QUIET, textAlign: "right" }}>north-ledger · eu-central</Text>
        </Column>
      </Row>

      <Column style={{ gap: 20 }}>
        <Text style={{ ...mono, color: QUIET }}>Welcome, Priya.</Text>
        <Heading level={1} style={{ fontSize: 44, fontWeight: 500, lineHeight: 1.08, letterSpacing: -1.4 }} mobile={{ fontSize: 31, letterSpacing: -0.9 }}>
          Your first database
          <LineBreak />
          is running.
        </Heading>
        <Text style={{ fontSize: 18, lineHeight: 1.55, color: QUIET, maxWidth: 470 }} mobile={{ fontSize: 16 }}>
          It’s called <Span style={{ color: TEXT }}>north-ledger</Span>, it lives in Frankfurt, and it’s yours to break. Four commands take you from an empty schema to a shell.
        </Text>
      </Column>

      <Column style={{ backgroundColor: PANEL, border: `1px solid ${RULE}`, borderRadius: 6, padding: [20, 24] }} mobile={{ padding: [16, 16] }}>
        <Text style={{ ...mono, color: TEXT }} mobile={{ fontSize: 12 }}>
          {typed("curl -fsSL quarry.example/i | sh")}
          {typed("quarry login")}
          {typed("quarry link north-ledger")}
          {typed("quarry shell")}
          <Span style={{ color: QUIET }}>north-ledger=&gt; </Span>
          select 'hello' as world;
        </Text>
      </Column>

      <Column>
        {step("01", "Connect from your laptop", <>Run {code("quarry link")} in any project, and your shell gets credentials that expire in an hour. Nothing to paste into a .env file.</>)}
        {step("02", "Load a sample", <>Fill it with two million real journeys from London’s bike hire scheme, so your first queries have something to say.</>)}
        {step("03", "Ask it something", <>Open the console and run the query we left in it. It finds the busiest docking station before 9am, in about forty milliseconds.</>)}
      </Column>

      <Row style={{ alignItems: "center", gap: 24 }} mobile={{ gap: 16 }}>
        <Button
          href={`${SITE}/console/north-ledger`}
          style={{ width: 200, backgroundColor: LIME, color: NIGHT, fontSize: 15, fontWeight: 600, padding: [15, 0], borderRadius: 4 }}
          hover={{ backgroundColor: LIME_DOWN }}
          mobile={{ width: "100%" }}
        >
          Open the console
        </Button>
        <Text style={{ fontSize: 15 }}>
          <Link href={`${SITE}/docs/quickstart`} style={{ color: TEXT }}>
            Or read the quickstart
          </Link>
        </Text>
      </Row>

      <Column style={{ gap: 20, padding: [28, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        <Text style={{ ...mono, fontSize: 12, color: QUIET, letterSpacing: 0.5 }}>WHAT THE FREE TIER HOLDS</Text>
        <Grid columns={3} stackOnMobile={false} style={{ gap: 24 }} mobile={{ gap: 12 }}>
          {figure("10", "GB", "of storage")}
          {figure("1", "bn", "row reads a month")}
          {figure("3", "", "branches to try ideas on")}
        </Grid>
      </Column>

      <Column style={{ gap: 6 }}>
        <Text style={{ fontSize: 16, lineHeight: 1.6 }}>
          If anything gets in your way, reply to this email. It comes to the four of us who answer support, and one of us will write back today.
        </Text>
        <Text style={{ fontSize: 16, color: QUIET }}>Tomás, for the Quarry team</Text>
      </Column>

      <Text style={{ ...mono, fontSize: 12, lineHeight: 1.7, color: QUIET, padding: [24, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        Quarry Data GmbH, Rosenthaler Straße 40, 10178 Berlin
        <LineBreak />
        <Link href={`${SITE}/settings/email`} style={{ color: QUIET }}>
          Email settings
        </Link>
        {"  ·  "}
        <Link href={`${SITE}/unsubscribe`} style={{ color: QUIET }}>
          Unsubscribe
        </Link>
      </Text>
    </Section>
  </Email>
);
