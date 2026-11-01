import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Column, Document, Heading, PageBreak, PageFooter, PageHeader, PageNumber, Paragraph, render, Row, Section, Text } from "../index";

const meta: Meta = {
  title: "Primitives/Document",
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
  <Document size="Letter" margin={[56, 64]} title="Invoice 2705" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: 1.45, color: "#111827" }}>
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
