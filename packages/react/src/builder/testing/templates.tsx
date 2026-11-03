/**
 * Templates the builder adapter's tests take to the builder and back: every component the builder takes, in every
 * root, with what its tools have no field for. `sample`, `everyTool` and `invoice` are the templates the real
 * builder saved designs of (__fixtures__/designs/*.saved-in-builder.json).
 */
import React from "react";
import {
  Button,
  Column,
  Divider,
  Document,
  Email,
  Grid,
  Heading,
  Html,
  Image,
  Layer,
  LineBreak,
  Link,
  List,
  ListItem,
  Menu,
  MergeTag,
  Page,
  PageBreak,
  PageFooter,
  PageHeader,
  PageNumber,
  Paragraph,
  Row,
  Section,
  Social,
  Span,
  Text,
  Video,
} from "../../primitives";

export const sample = (
  <Email previewText="Hi" style={{ backgroundColor: "#f5f5f5" }}>
    <Section style={{ backgroundColor: "#eeeeee", padding: 20, gap: 10 }}>
      <Heading id="title" style={{ backgroundColor: "#fde68a", borderRadius: 8 }}>
        Title
      </Heading>
      <Paragraph>
        Hello{" "}
        <Link href="https://x.test" hover={{ color: "#0000ff" }}>
          link
        </Link>
        <Span style={{ fontWeight: 700 }}> bold</Span>
      </Paragraph>
      <Row style={{ gap: 20 }}>
        <Column style={{ backgroundColor: "#ffffff", padding: 8 }}>
          <Text>A</Text>
        </Column>
        <Column>
          <Button href="https://b.test" hover={{ backgroundColor: "#333333" }}>
            Go
          </Button>
        </Column>
      </Row>
    </Section>
    <Image src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="x" style={{ borderRadius: 16 }} />
    <Layer style={{ height: 200 }}>
      <Image src={{ src: "https://example.com/b.png", width: 600, height: 300 }} alt="" />
      <Heading>Over</Heading>
    </Layer>
  </Email>
);

/** Each of the builder's tools, with what it has no field for. */
export const everyTool = (
  <Email previewText="Every tool" style={{ backgroundColor: "#fafafa", color: "#222222" }}>
    <Section style={{ backgroundColor: "#ffffff", padding: [24, 16, 24, 16], gap: 12 }}>
      <Heading level={2} style={{ letterSpacing: 1, textTransform: "uppercase", backgroundColor: "#fde68a" }}>
        Heading
      </Heading>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.6 }}>
        Text with a{" "}
        <Link href={{ href: "https://x.test", target: "_self" }} hover={{ color: "#0000ff" }}>
          link
        </Link>{" "}
        and <MergeTag name="first_name" />
      </Paragraph>
      <Button href="https://x.test/go" style={{ backgroundColor: "#111111", color: "#ffffff", borderRadius: 6, padding: [12, 24, 12, 24] }} hover={{ backgroundColor: "#333333" }}>
        Button
      </Button>
      <Link href="https://x.test/image">
        <Image src={{ src: "https://picsum.photos/id/10/600/300", width: 600, height: 300 }} alt="Linked image" style={{ width: "80%" }} />
      </Link>
      <Divider style={{ borderTop: { width: 2, style: "dashed", color: "#cccccc" } }} />
      <Menu items={[{ text: "Docs", href: "https://x.test/docs" }, { text: "Blog", href: { href: "https://x.test/blog", target: "_self" } }]} separator="|" />
      <Social icons={[{ name: "Facebook", href: "https://facebook.com/x" }, { name: "X", href: "https://x.com/x" }]} />
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
    </Section>
    <Row style={{ gap: 16, border: { bottom: { width: 1, style: "solid", color: "#eeeeee" } } }}>
      <Column style={{ padding: 8, backgroundColor: "#f0f0f0" }} hidden={{ mobile: true }}>
        <Text>Desktop only</Text>
      </Column>
      <Column>
        <Image src="https://picsum.photos/id/11/300/200" alt="" style={{ width: "50%" }} hidden={{ mobile: true }} />
      </Column>
    </Row>
    <Grid columns={2} style={{ gap: 8 }}>
      <Text>a</Text>
      <Text>b</Text>
      <Text>c</Text>
    </Grid>
    <Layer style={{ height: 120 }}>
      <Image src={{ src: "https://picsum.photos/id/12/600/240", width: 600, height: 240 }} alt="" />
      <Heading>Over</Heading>
    </Layer>
  </Email>
);

export const invoice = (
  <Document size="A5" orientation="landscape" margin={40}>
    <PageHeader>
      <Text>Acme Inc.</Text>
    </PageHeader>
    <Document.Page>
      <Heading>Invoice</Heading>
      <Paragraph>
        Page <PageNumber /> of <PageNumber total />
      </Paragraph>
    </Document.Page>
    <Document.Page>
      <Text>Terms</Text>
    </Document.Page>
    <Text>Notes</Text>
    <PageBreak />
    <Text>Appendix</Text>
    <PageFooter>
      <Text>Thank you</Text>
    </PageFooter>
  </Document>
);

/** What text tools hold: runs of every kind, a list, a heading of each level, boxes, directions. */
export const text = (
  <Email width={640} style={{ color: "#333333", fontFamily: "Georgia, serif" }}>
    <Heading level={3} dir="rtl" style={{ textAlign: "right", fontStyle: "italic" }}>
      Level three
    </Heading>
    <Heading level={6}>Level six</Heading>
    <Paragraph style={{ textDecoration: "underline", fontSize: 18, letterSpacing: 0.5 }}>
      E = mc<Span style={{ verticalAlign: "super" }}>2</Span>, H<Span style={{ verticalAlign: "sub", color: "#ff0000" }}>2</Span>O,{" "}
      <Span style={{ fontFamily: '"Courier New", monospace', fontSize: 14 }}>code</Span>,{" "}
      <Link href="https://x.test/about" title="About us" aria-label="Read about us">
        about
      </Link>
      ,<LineBreak />
      <Span style={{ backgroundColor: "#ffff00", fontStyle: "italic", textTransform: "uppercase" }}>marked</Span>
    </Paragraph>
    <List style={{ gap: 6, indent: 30, padding: [8, 0, 8, 0] }}>
      <ListItem>One</ListItem>
      <ListItem>
        Two
        <List type="number" start={3}>
          <ListItem>Three</ListItem>
          <ListItem>Four</ListItem>
        </List>
      </ListItem>
    </List>
    <Paragraph style={{ backgroundColor: "#eef2ff", border: { left: "4px solid #6366f1" }, padding: 12, borderRadius: 4, maxWidth: 400 }}>A boxed note</Paragraph>
    <Text style={{ textAlign: "center", lineHeight: "24px" }} mobile={{ fontSize: 13, textAlign: "left" }}>
      Centered
    </Text>
    <Html html='<table role="presentation"><tr><td>Raw cell</td></tr></table>' text="Raw cell" />
  </Email>
);

/** Buttons, images, dividers and the rest, placed and spaced every way a column places them. */
export const blocks = (
  <Page width={800} style={{ backgroundColor: "#ffffff" }}>
    <Column style={{ alignItems: "center", gap: 16, padding: 24 }}>
      <Button href={{ href: "https://x.test/buy", target: "_blank" }} title="Buy it" style={{ width: 240, textAlign: "left", border: { top: "2px solid #000000", bottom: "2px solid #000000" }, fontStyle: "italic" }} mobile={{ padding: 8 }}>
        Buy <Span style={{ fontWeight: 700 }}>now</Span>
      </Button>
      <Image src={{ src: "https://example.com/wide.png", width: 1200, height: 400 }} alt="Wide" style={{ width: 300, border: { top: "1px solid #dddddd" } }} mobile={{ width: "100%" }} />
      <Image src="https://example.com/no-size.png" alt="No size" style={{ width: "100%" }} />
      <Divider style={{ width: 200, borderTop: "3px dotted #ff0000", padding: [4, 0, 4, 0] }} />
      <Video src="https://vimeo.com/76979871" title="Launch" style={{ maxWidth: 400 }} />
      <Menu items={[{ text: "A", href: "https://a.test" }, { text: "B", href: "https://b.test" }]} layout="vertical" style={{ justifyContent: "start", lineHeight: 1.5, fontWeight: 700 }} />
      <Social icons={[{ name: "Instagram", href: "https://instagram.com/acme" }]} iconType="squared" size={24} style={{ gap: 10, justifyContent: "end" }} />
    </Column>
    <Row stackOnMobile={false} style={{ gap: 10, padding: [12, 0, 12, 0], backgroundColor: "#f3f4f6", alignItems: "center" }}>
      <Column style={{ width: 200, borderRadius: 6, backgroundColor: "#ffffff", padding: 10 }}>
        <Paragraph>Fixed</Paragraph>
      </Column>
      <Column style={{ flex: 2 }}>
        <Paragraph>Two shares</Paragraph>
      </Column>
      <Column>
        <Paragraph>One share</Paragraph>
      </Column>
    </Row>
    <Section style={{ backgroundColor: "#111827", color: "#ffffff", padding: [32, 24, 32, 24], gap: 8, border: { top: "4px solid #f59e0b" } }} hidden={{ mobile: true }}>
      <Heading level={2}>Dark band</Heading>
      <Paragraph style={{ color: "#d1d5db" }}>On every desktop</Paragraph>
      <Row style={{ gap: 12 }}>
        <Column>
          <Paragraph>Left</Paragraph>
        </Column>
        <Column>
          <Paragraph>Right</Paragraph>
        </Column>
      </Row>
    </Section>
    <Section style={{ padding: 40 }} />
    <Column style={{ padding: [16, 0, 16, 0] }} />
  </Page>
);

/** Every template the round-trip tests take, by name. */
export const TEMPLATES: Record<string, React.ReactElement> = { sample, everyTool, invoice, text, blocks };
