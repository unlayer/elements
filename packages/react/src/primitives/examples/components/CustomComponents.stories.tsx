import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section, Text } from "../../index";
import { FONT, INK, LINE, MUTED, picture, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Custom components",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "`component()` names a block made of other components, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used.",
      },
    },
  },
};
export default meta;

/** A story of a template with a custom component: "Show code" has the definition, which a template alone doesn't. */
const story = (code: string, template: (Root: typeof Email) => ReactElement): StoryObj<Args> => ({
  ...asEmailAndPage(template),
  parameters: { docs: { source: { code, language: "tsx" } } },
});

const Countdown = component({
  type: "acme.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "Offer ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#E11D48" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 12, alignItems: "center" }}>
      <Paragraph style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", color: accent }}>{headline}</Paragraph>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {[
          [days, "Days"],
          [hours, "Hours"],
          [minutes, "Mins"],
        ].map(([value, unit]) => (
          <Column key={unit} style={{ width: 76, padding: [12, 0], gap: 2, backgroundColor: "#111827", color: "#FFFFFF", borderRadius: 10, textAlign: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: 700 }}>{value}</Text>
            <Text style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#9CA3AF" }}>{unit}</Text>
          </Column>
        ))}
      </Row>
    </Column>
  ),
});

/** A countdown from its props: with their defaults, and with its own. */
export const CountdownTimer = story(
  `import { Column, component, Email, Paragraph, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "acme.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "Offer ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#E11D48" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 12, alignItems: "center" }}>
      <Paragraph style={{ textAlign: "center", color: accent }}>{headline}</Paragraph>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {/* A Column for each of days, hours and minutes */}
      </Row>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Countdown />
      <Countdown headline="Doors open in" days="00" hours="03" minutes="20" accent="#0F766E" />
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={560} style={{ color: INK, fontFamily: FONT }}>
      <Section style={{ padding: 24, gap: 24 }}>
        <Countdown />
        <Countdown headline="Doors open in" days="00" hours="03" minutes="20" accent="#0F766E" />
      </Section>
    </Root>
  )
);

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    photo: prop.image({ label: "Photo", required: true }),
    name: prop.text({ label: "Name", required: true }),
    description: prop.text({ label: "Description", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to cart" }),
    accent: prop.color({ label: "Accent", default: "#6366F1" }),
  },
  render: ({ photo, name, description, price, href, cta, accent }) => (
    <Column style={{ gap: 12, padding: [0, 0, 16, 0], backgroundColor: "#FFFFFF", border: LINE, borderRadius: 12 }}>
      <Image src={photo} alt={name} style={{ width: "100%", borderRadius: [12, 12, 0, 0] }} />
      <Column style={{ gap: 8, padding: [0, 16] }}>
        <Heading level={3} style={{ fontSize: 17 }}>{name}</Heading>
        <Paragraph style={{ fontSize: 13, lineHeight: 1.5, color: MUTED }}>{description}</Paragraph>
        <Paragraph style={{ fontSize: 17, fontWeight: 700, color: accent }}>{price}</Paragraph>
        <Button href={href} style={{ width: "100%", backgroundColor: accent, borderRadius: 8 }}>{cta}</Button>
      </Column>
    </Column>
  ),
});

/** A product card: a required picture and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`. */
export const ProductCards = story(
  `import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    photo: prop.image({ label: "Photo", required: true }),
    name: prop.text({ label: "Name", required: true }),
    description: prop.text({ label: "Description", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to cart" }),
    accent: prop.color({ label: "Accent", default: "#6366F1" }),
  },
  render: ({ photo, name, description, price, href, cta, accent }) => (
    <Column style={{ gap: 12 }}>
      <Image src={photo} alt={name} style={{ width: "100%" }} />
      <Heading level={3}>{name}</Heading>
      <Paragraph>{description}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <ProductCard photo={{ src: "https://example.com/lamp.png", width: 600, height: 300 }} name="Desk lamp" description="Warm, dimmable light." price="$89" href="https://example.com/lamp" />
        <ProductCard style={{ flex: 2 }} photo={{ src: "https://example.com/phones.png", width: 600, height: 300 }} name="Headphones" description="Closed-back, with a case." price="$149" href="https://example.com/phones" cta="Buy now" accent="#0EA5E9" />
      </Row>
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={640} style={{ color: INK, fontFamily: FONT, backgroundColor: WASH }}>
      <Section style={{ padding: 24 }}>
        <Row style={{ gap: 16 }}>
          <ProductCard photo={picture("#F5C6A5", 600, 300)} name="Desk lamp" description="Warm, dimmable light with a machined aluminum base." price="$89" href="https://example.com/lamp" />
          <ProductCard style={{ flex: 2 }} photo={picture("#99D6CF", 600, 300)} name="Headphones" description="Closed-back studio headphones with a detachable cable, memory-foam pads, and a case that survives checked luggage." price="$149" href="https://example.com/phones" cta="Buy now" accent="#0EA5E9" />
        </Row>
      </Section>
    </Root>
  )
);

const Rating = component({
  type: "acme.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 28 : 16, color: "#B7791F" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? ` ${score} of 5` : "")}
    </Text>
  ),
});

/** A rating worked out from its props in `render`: a number, a choice of sizes, and a switch. */
export const WorkedOutFromProps = story(
  `import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "acme.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 28 : 16, color: "#B7791F" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \` \${score} of 5\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={3} />
      <Rating score={4} showScore />
      <Rating score={5} size="large" />
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={560} style={{ color: INK, fontFamily: FONT }}>
      <Section style={{ padding: 24, gap: 12 }}>
        <Rating score={3} />
        <Rating score={4} showScore />
        <Rating score={5} size="large" />
      </Section>
    </Root>
  )
);

const Hero = component({
  type: "acme.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    background: prop.color({ label: "Background", default: "#111827" }),
  },
  render: ({ title, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFFFF", padding: [40, 24] }}>
      <Heading level={1} style={{ fontSize: 30, textAlign: "center" }}>{title}</Heading>
    </Section>
  ),
});

/** `placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one. */
export const AWholeSection = story(
  `import { component, Email, Heading, Paragraph, prop, Section } from "@unlayer/react-elements";

const Hero = component({
  type: "acme.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    background: prop.color({ label: "Background", default: "#111827" }),
  },
  render: ({ title, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFFFF", padding: [40, 24] }}>
      <Heading level={1} style={{ fontSize: 30, textAlign: "center" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" background="#0F766E" />
  </Email>
);`,
  (Root) => (
    <Root width={560} style={{ color: INK, fontFamily: FONT }}>
      <Hero title="New arrivals" />
      <Section style={{ padding: 24 }}>
        <Paragraph style={{ fontSize: 15, color: MUTED }}>The rest of the email goes on under it.</Paragraph>
      </Section>
      <Hero title="Last chance" background="#0F766E" />
    </Root>
  )
);
