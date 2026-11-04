import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Column, Document, Heading, PageBreak, PageFooter, PageHeader, PageNumber, Paragraph, render, Row, Section, Text } from "../index";

const meta: Meta = {
  title: "Document",
  parameters: {
    docs: {
      description: {
        component:
          "A `<Document>` rendered to print HTML: each page a box of the paper's size, its header and footer on each, numbered. Print it (or save it as PDF) from the frame; `@unlayer/elements-pdf` writes the same pages as a PDF without a browser.",
      },
    },
  },
};
export default meta;

/** A Document's print HTML in a frame as tall as its pages. */
const printed = (template: ReactElement): StoryObj => ({
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => (
    <iframe
      title="Print HTML"
      srcDoc={loaded.html as string}
      style={{ width: "100%", height: 1400, border: 0 }}
      onLoad={(event) => {
        const frame = event.currentTarget;
        frame.style.height = `${frame.contentDocument?.documentElement.scrollHeight ?? 1400}px`;
      }}
    />
  ),
});

const line = (label: string, amount: string) => (
  <Row key={label} style={{ gap: 24, padding: [8, 0], border: { bottom: "1px solid #e5e7eb" } }}>
    <Column>
      <Text>{label}</Text>
    </Column>
    <Column style={{ width: 120 }}>
      <Text style={{ textAlign: "right" }}>{amount}</Text>
    </Column>
  </Row>
);

/** An invoice and its terms: two Letter pages, a header and a numbered footer on each. */
export const Invoice = printed(
  <Document size="Letter" margin={[56, 64]} title="Invoice 2705" style={{ backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: 1.45, color: "#111827" }}>
    <PageHeader style={{ padding: [0, 0, 20, 0] }}>
      <Row style={{ alignItems: "center" }}>
        <Column>
          <Text style={{ fontWeight: 700, fontSize: 14 }}>Acme</Text>
        </Column>
        <Column>
          <Text style={{ textAlign: "right", color: "#6b7280", fontSize: 10 }}>Invoice 2705 · July 1, 2026</Text>
        </Column>
      </Row>
    </PageHeader>
    <Heading level={1} style={{ fontSize: 28 }}>
      Invoice
    </Heading>
    <Paragraph style={{ color: "#4b5563" }}>Billed to Maya Chen, 100 Market St, San Francisco, CA.</Paragraph>
    <Section style={{ padding: [16, 0], gap: 0 }}>
      {line("Pro plan (monthly)", "$25.00")}
      {line("Additional seats × 3", "$36.00")}
      {line("Usage overage", "$4.50")}
      <Row style={{ gap: 24, padding: [12, 0] }}>
        <Column>
          <Text style={{ fontWeight: 700 }}>Total</Text>
        </Column>
        <Column style={{ width: 120 }}>
          <Text style={{ textAlign: "right", fontWeight: 700 }}>$65.50</Text>
        </Column>
      </Row>
    </Section>
    <PageBreak />
    <Heading level={2}>Terms</Heading>
    <Paragraph>Payment is due within 30 days. Late payments accrue interest at 1% a month.</Paragraph>
    <PageFooter>
      <Text style={{ fontSize: 10, color: "#6b7280", textAlign: "right" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

const TYPE = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: 1.5, color: "#111827", gap: 8 };

/** `PageBreak` ends a page where you say: what follows starts the next one. */
export const PageBreaks = printed(
  <Document size="A5" margin={40} title="A short guide" style={TYPE}>
    <Heading level={1} style={{ fontSize: 22 }}>
      Part one
    </Heading>
    <Paragraph>This part ends at the PageBreak under this line, however much room is left on its page.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{ fontSize: 22 }}>
      Part two
    </Heading>
    <Paragraph>This part starts on a page of its own.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{ fontSize: 22 }}>
      Part three
    </Heading>
    <Paragraph>And so does this one.</Paragraph>
  </Document>
);

/** A `PageHeader` and a `PageFooter` are drawn on every page, inside its margins, each with a box of its own. */
export const HeadersAndFooters = printed(
  <Document size="A5" margin={32} title="Quarterly report" style={TYPE}>
    <PageHeader style={{ padding: [0, 0, 8, 0], border: { bottom: "2px solid #0f766e" } }}>
      <Text style={{ fontWeight: 700, color: "#0f766e" }}>Quarterly report</Text>
    </PageHeader>
    <Heading level={1} style={{ fontSize: 22 }}>
      Summary
    </Heading>
    <Paragraph>Orders grew in every region this quarter, and returns held steady.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{ fontSize: 22 }}>
      Next quarter
    </Heading>
    <Paragraph>The header and the footer come back on this page by themselves.</Paragraph>
    <PageFooter style={{ padding: [8, 12], backgroundColor: "#f5f7fa" }}>
      <Text style={{ fontSize: 10, color: "#616e7c", textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Text>
    </PageFooter>
  </Document>
);

/** `PageNumber` is the number of the page it's on, and with `total` how many there are: in a header, a footer, or any text. */
export const PageNumbers = printed(
  <Document size="A5" margin={32} title="Page numbers" style={TYPE}>
    <PageHeader>
      <Text style={{ fontSize: 10, color: "#616e7c", textAlign: "right" }}>
        <PageNumber /> / <PageNumber total />
      </Text>
    </PageHeader>
    <Paragraph>
      This document has <PageNumber total /> pages, and this is page <PageNumber />.
    </Paragraph>
    <PageBreak />
    <Paragraph>
      This is page <PageNumber />, its last.
    </Paragraph>
    <PageFooter>
      <Text style={{ fontSize: 10, color: "#616e7c", textAlign: "center" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

/** `Document.Page` writes each page by itself, with its own background and spacing. */
export const PagesOneByOne = printed(
  <Document size="A5" margin={40} title="A cover and a page" style={TYPE}>
    <Document.Page style={{ backgroundColor: "#0f172a", color: "#ffffff", gap: 12 }}>
      <Heading level={1} style={{ fontSize: 34 }}>
        The cover
      </Heading>
      <Paragraph style={{ color: "#cbd5e1" }}>A page with a background out to its edges.</Paragraph>
    </Document.Page>
    <Document.Page style={{ gap: 24 }}>
      <Heading level={2} style={{ fontSize: 20 }}>
        The first page
      </Heading>
      <Paragraph>A page of its own, with more space between what it holds.</Paragraph>
    </Document.Page>
  </Document>
);

/** `size` and `orientation` are the paper's: A5 turned on its side, for a certificate. */
export const SizeAndOrientation = printed(
  <Document size="A5" orientation="landscape" margin={48} title="Certificate" style={{ ...TYPE, backgroundColor: "#fffbeb", textAlign: "center", gap: 12 }}>
    <Text style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#92400e" }}>Certificate of completion</Text>
    <Heading level={1} style={{ fontSize: 34, fontFamily: "Georgia, serif" }}>
      Your name here
    </Heading>
    <Paragraph>finished all twelve lessons of the course.</Paragraph>
  </Document>
);
