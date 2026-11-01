/**
 * Type contract of the primitives (checked by `pnpm typecheck`): their props'
 * types come from the component definitions that validate them.
 */
import { Button, Column, Email, Heading, Image, Link, Paragraph, Row, Section, Text } from "./index";

export const ok = (
  <Email width={600} previewText="Hi" style={{ backgroundColor: "#f4f4f4", gap: 16, fontFamily: "Inter, Arial, sans-serif" }}>
    <Section style={{ backgroundColor: "#111", padding: [24, 16] }}>
      <Image src={{ src: "https://example.com/logo.png", width: 120 }} alt="Logo" style={{ width: 120 }} />
    </Section>
    <Heading level={2} style={{ fontSize: "28px", lineHeight: "120%" }} mobile={{ fontSize: 22 }}>
      Title
    </Heading>
    <Row style={{ gap: 20, wrap: "none" }}>
      <Column style={{ width: "40%", padding: "8px 16px", border: "1px solid #ccc", borderRadius: 4 }}>
        <Text>Left</Text>
      </Column>
      <Column style={{ flex: 2 }}>
        <Paragraph>
          Read <Link href={{ href: "https://example.com", target: "_blank" }}>this</Link>
        </Paragraph>
        <Button href="https://example.com" hover={{ backgroundColor: "#000" }} style={{ fontWeight: "bold" }}>
          Go
        </Button>
      </Column>
    </Row>
  </Email>
);

// @ts-expect-error a Button needs an href
export const noHref = <Button>Go</Button>;

// @ts-expect-error an Image needs a src
export const noSrc = <Image alt="x" />;

// @ts-expect-error headings go from 1 to 6
export const level = <Heading level={7}>x</Heading>;

// @ts-expect-error em isn't a unit a width takes
export const em = <Column style={{ width: "2em" }} />;

// @ts-expect-error no margins: space between siblings is the parent's gap
export const margin = <Text style={{ margin: 8 }}>x</Text>;

// @ts-expect-error an Image has no text color
export const imageColor = <Image src="https://example.com/a.png" style={{ color: "#000" }} />;

// @ts-expect-error font weights are 100 to 900 in hundreds
export const weight = <Text style={{ fontWeight: 450 }}>x</Text>;
