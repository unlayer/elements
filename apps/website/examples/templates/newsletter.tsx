import { Button, Column, Divider, Email, Heading, Image, Link, List, ListItem, Menu, Text, Row, Section } from "@hyper-elements/react";

export const meta = {
  title: "Newsletter",
  description: "A weekly digest with a hero image, stories side by side that stack on phones, a reading list and a footer.",
  root: "Email",
};

const stories = [
  {
    kicker: "DEEP DIVE",
    title: "Why email still runs on tables",
    body: "A short history of the 1999 rendering engine inside your inbox, and what it means for your layout.",
    href: "https://example.com/tables",
  },
  {
    kicker: "TOOLING",
    title: "One template, four outputs",
    body: "The same JSX became an email, a landing page, a PDF and a social card. Here's the code.",
    href: "https://example.com/outputs",
  },
];

export default function Newsletter() {
  return (
    <Email
      previewText="Tables, outputs and five links worth your time"
      style={{ backgroundColor: "#fffbeb", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1f2937" }}
    >
      <Image
        src={{ src: "https://hyperelements.dev/img/newsletter-hero.png", width: 1200, height: 500 }}
        alt="The Weekly Signal"
      />
      <Section style={{ padding: [32, 32, 8, 32], gap: 12 }}>
        <Text style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, letterSpacing: 2, color: "#b45309" }}>
          ISSUE 142 · NOVEMBER 6
        </Text>
        <Heading level={1} style={{ fontSize: 32, lineHeight: 1.15 }} mobile={{ fontSize: 26 }}>
          The week the inbox caught up
        </Heading>
        <Text style={{ fontSize: 17, lineHeight: 1.6, color: "#4b5563" }}>
          Good morning. This week: why your emails are still tables underneath, and a reading list for the weekend.
        </Text>
      </Section>
      <Section style={{ padding: [16, 32] }}>
        <Row style={{ gap: 24 }}>
          {stories.map((story) => (
            <Column key={story.href} style={{ gap: 8 }}>
              <Text style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, letterSpacing: 2, color: "#b45309" }}>
                {story.kicker}
              </Text>
              <Heading level={2} style={{ fontSize: 20, lineHeight: 1.25 }}>
                <Link href={story.href} style={{ color: "#111827", textDecoration: "none" }}>{story.title}</Link>
              </Heading>
              <Text style={{ fontSize: 15, lineHeight: 1.55, color: "#4b5563" }}>{story.body}</Text>
            </Column>
          ))}
        </Row>
      </Section>
      <Section style={{ padding: [8, 32, 24, 32], gap: 16 }}>
        <Divider style={{ borderTop: "1px solid #fcd34d" }} />
        <Heading level={3} style={{ fontSize: 18 }}>Five links for the weekend</Heading>
        <List type="number" style={{ gap: 8, fontSize: 15, color: "#374151" }}>
          <ListItem><Link href="https://example.com/1">Dark mode, one color at a time</Link></ListItem>
          <ListItem><Link href="https://example.com/2">The plain-text version nobody writes</Link></ListItem>
          <ListItem><Link href="https://example.com/3">Merge tags across providers</Link></ListItem>
          <ListItem><Link href="https://example.com/4">Printing invoices without a browser</Link></ListItem>
          <ListItem><Link href="https://example.com/5">Let your agent write the template</Link></ListItem>
        </List>
        <Button
          href="https://example.com/archive"
          style={{ backgroundColor: "#111827", borderRadius: 999, padding: [12, 24], fontFamily: "Helvetica, Arial, sans-serif", alignSelf: "start" }}
        >
          Read past issues
        </Button>
      </Section>
      <Section style={{ backgroundColor: "#111827", padding: 32, gap: 12, color: "#d1d5db" }}>
        <Menu
          items={[
            { text: "Archive", href: "https://example.com/archive" },
            { text: "Sponsor", href: "https://example.com/sponsor" },
            { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
          ]}
          separator="/"
          style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 13, color: "#f9fafb", separatorColor: "#6b7280", justifyContent: "start" }}
        />
        <Text style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, color: "#9ca3af" }}>
          The Weekly Signal is written by people who have opened too many emails in Outlook.
        </Text>
      </Section>
    </Email>
  );
}
