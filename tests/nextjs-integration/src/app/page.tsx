// Server Component — no "use client" directive.
// Exercises every @unlayer/react-elements component in SSR.
// If `next build` succeeds, the package works in a real Next.js app.

import {
  Button, Heading, Image, Divider, Paragraph,
  Html, Social, Menu, Video, Table,
  Body, Row, Column, ColumnLayouts,
} from "@unlayer/react-elements";

const { TwoEqual } = ColumnLayouts;

export default function IntegrationTest() {
  return (
    <main>
      {/* Web mode — full tree */}
      <Body mode="web">
        <Row>
          <Column>
            <Heading mode="web">Integration Test</Heading>
            <Paragraph mode="web">All components render in web mode.</Paragraph>
            <Button mode="web">Click me</Button>
            <Image mode="web" src={{ url: "https://example.com/img.png", autoWidth: true, maxWidth: "100%" }} alt="test" />
            <Divider mode="web" />
            <Paragraph mode="web" />
            <Html mode="web"><p>Custom HTML</p></Html>
            <Social mode="web" />
            <Menu mode="web" />
            <Video mode="web" />
            <Table mode="web" />
          </Column>
        </Row>

        {/* Multi-column layout */}
        <Row layout={TwoEqual}>
          <Column>
            <Paragraph mode="web">Left column</Paragraph>
          </Column>
          <Column>
            <Paragraph mode="web">Right column</Paragraph>
          </Column>
        </Row>
      </Body>

      {/* Email mode — separate tree */}
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph mode="email">Email mode works.</Paragraph>
            <Button mode="email">Email button</Button>
          </Column>
        </Row>
      </Body>
    </main>
  );
}
