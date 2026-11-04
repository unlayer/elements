import type { Meta } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Button, Column, Email, Grid, Heading, Image, Layer, Page, Paragraph, Section } from "../index";
import { args, argTypes, sideBySide, type Args } from "../../compat/SideBySide";

const meta: Meta<Args> = {
  title: "Primitives/Email and page",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Layouts the new engine writes for email and for the page in different markup (tables and inline-blocks, flexbox and CSS grid): each template rendered as a Page and as an Email, side by side.",
      },
    },
  },
};
export default meta;

/** A template drawn as a Page and as an Email (`Root` is each). */
const outputs = (template: (Root: typeof Page) => ReactElement) => sideBySide({ label: "Page", template: template(Page) }, { label: "Email", template: template(Email as unknown as typeof Page) });

const INK = "#1F2933";
const MUTED = "#616E7C";
/** A product photo: a flat color, drawn in the page (no network). */
const photo = (color: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${color}"/></svg>`)}`,
  width: 400,
  height: 300,
});

const products = [
  { name: "Linen shirt", price: "$68", color: "#D9C5A0" },
  { name: "Canvas tote", price: "$34", color: "#A3B18A" },
  { name: "Wool beanie", price: "$28", color: "#B5838D" },
  { name: "Leather belt", price: "$52", color: "#6D4C41" },
  { name: "Cotton socks", price: "$14", color: "#90A4AE" },
];

/**
 * A shop's new arrivals: three to a row, the last row's two keeping their width. An email's cells are whole px (174,
 * 173, 173: Outlook's widths), a page's flexbox shares (173.33 each).
 */
export const ProductGrid = outputs((Root) => (
  <Root width={600} style={{ backgroundColor: "#F5F7FA", color: INK, fontFamily: "Arial, Helvetica, sans-serif" }}>
    <Section style={{ backgroundColor: "#FFFFFF", padding: [32, 24] }}>
      <Heading level={2} style={{ fontSize: 22, textAlign: "center" }}>New arrivals</Heading>
    </Section>
    <Section style={{ backgroundColor: "#FFFFFF", padding: [0, 24, 32, 24] }}>
      <Grid columns={3} style={{ gap: 16, rowGap: 24 }}>
        {products.map((product) => (
          <Column key={product.name} style={{ gap: 8 }}>
            <Image src={photo(product.color)} alt={product.name} style={{ width: "100%" }} />
            <Paragraph style={{ fontSize: 15, fontWeight: 700 }}>{product.name}</Paragraph>
            <Paragraph style={{ fontSize: 14, color: MUTED }}>{product.price}</Paragraph>
          </Column>
        ))}
      </Grid>
    </Section>
  </Root>
));

/** Features two to a row, of different heights, each in the middle of its row; kept two to a row on phones. */
export const FeatureGrid = outputs((Root) => (
  <Root width={600} style={{ color: INK, fontFamily: "Arial, Helvetica, sans-serif" }}>
    <Section style={{ padding: [32, 24] }}>
      <Grid columns={2} stackOnMobile={false} style={{ gap: 24, alignItems: "center", padding: 16, backgroundColor: "#EEF2FF", borderRadius: 8 }}>
        <Paragraph style={{ fontSize: 15 }}>Write anything: docs, notes and wikis that feel effortless.</Paragraph>
        <Paragraph style={{ fontSize: 15 }}>Plan together.</Paragraph>
        <Paragraph style={{ fontSize: 15 }}>Find it fast, across everything you've written.</Paragraph>
        <Button href="https://example.com/start" style={{ backgroundColor: "#4F46E5", color: "#FFFFFF", padding: [10, 18], borderRadius: 6 }}>Get started</Button>
      </Grid>
    </Section>
  </Root>
));

/** A wide picture: a gradient with a sun, drawn in the page (no network). */
const scene = (width: number, height: number) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 600" preserveAspectRatio="none"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><circle cx="900" cy="380" r="120" fill="#FDE68A"/></svg>`
  )}`,
  width,
  height,
});

/** A hero: words and a button over a picture, in the middle of the Layer's height, the picture covering it. */
export const HeroOverImage = outputs((Root) => (
  <Root width={600} style={{ color: "#FFFFFF", fontFamily: "Arial, Helvetica, sans-serif" }}>
    <Section>
      <Layer style={{ height: 300, alignItems: "center" }}>
        <Image src={scene(1200, 600)} alt="A sunset over the sea" style={{ width: "100%" }} />
        <Column style={{ padding: [0, 40], gap: 16 }}>
          <Heading level={1} style={{ fontSize: 34, lineHeight: 1.2 }}>Summer sale</Heading>
          <Paragraph style={{ fontSize: 16 }}>Up to 40% off everything for the season, this week only.</Paragraph>
          <Button href="https://example.com/sale" style={{ backgroundColor: "#FFFFFF", color: "#1E3A8A", padding: [12, 22], borderRadius: 6 }}>Shop the sale</Button>
        </Column>
      </Layer>
    </Section>
  </Root>
));

/** A banner, its caption along the bottom on a band of its own, its corners rounded. */
export const BannerCaption = outputs((Root) => (
  <Root width={600} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
    <Section style={{ padding: [24, 24] }}>
      <Layer style={{ height: 184, alignItems: "end", borderRadius: 8 }}>
        <Image src={scene(1200, 400)} alt="The coast at dusk" style={{ width: "100%" }} />
        <Paragraph style={{ padding: [10, 16], backgroundColor: "#111827", color: "#F9FAFB", fontSize: 14 }}>Photographed on the north coast, May 2026</Paragraph>
      </Layer>
    </Section>
  </Root>
));
