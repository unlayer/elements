/**
 * Custom components for Long Shelf (a fictional independent bookshop): a countdown to a sale, a
 * book's card, a reader's rating and a whole band. Warm paper, near-black ink and a bookcloth green.
 * Cormorant Garamond for the voice, Instrument Sans for the facts, DM Mono for the quiet notes.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, component, Divider, Email, Heading, Image, Paragraph, prop, Row, Section, Text, type EmailProps } from "../../index";

const PAPER = "#F7F3EA";
const CARD = "#FFFDF8";
const INK = "#1E1C19";
const QUIET = "#6C665B";
const DIM = "#A9A293";
const RULE = "#E2DBCC";
const CLOTH = "#2E5041";
const CLAY = "#9A4A2A";
const GOLD = "#B0872E";

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://long-shelf.example";

const root: Pick<EmailProps, "fonts" | "style"> = {
  fonts: [
    { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2", format: "woff2", weight: "300 700" },
    { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2", format: "woff2", weight: "300 700", style: "italic" },
    { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" },
    { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
  ],
  style: { backgroundColor: PAPER, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 },
};

/** Small mono capitals: labels. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what a component does. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const serif = (fontSize: number) => ({ fontFamily: SERIF, fontWeight: 500, fontSize, lineHeight: 1.08, letterSpacing: -0.3 }) as const;

/** Long Shelf's name, and what this page is. */
const masthead = (page: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 10], border: { bottom: `1px solid ${INK}` } }}>
    <Column style={{ width: 140 }}>
      <Text style={{ ...serif(26), fontStyle: "italic", lineHeight: "28px" }}>Long Shelf</Text>
    </Column>
    <Column>
      <Text style={{ ...label, textAlign: "right" }}>{page}</Text>
    </Column>
  </Row>
);

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
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: CLOTH }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ ...serif(30), textAlign: "center", color: accent }}>
        {headline}
      </Heading>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {[
          [days, "Days"],
          [hours, "Hours"],
          [minutes, "Mins"],
        ].map(([value, unit]) => (
          <Column key={unit} style={{ width: 92, padding: [8, 0, 12], gap: 2, backgroundColor: INK, color: CARD, borderRadius: 2, textAlign: "center" }}>
            <Text style={{ ...serif(46), lineHeight: 1.25 }}>{value}</Text>
            <Text style={{ ...label, fontSize: 11, color: DIM }}>{unit}</Text>
          </Column>
        ))}
      </Row>
    </Column>
  ),
});

/** A countdown from its props: with their defaults, and with its own. */
export const CountdownTimer = story(
  `import { Column, component, Email, Heading, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ textAlign: "center", color: accent }}>{headline}</Heading>
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
      <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent="#9A4A2A" />
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={560} {...root}>
      <Section style={{ padding: [28, 32, 44], gap: 32 }} mobile={{ padding: [20, 20, 32], gap: 28 }}>
        {masthead("This week")}
        <Countdown />
        <Divider style={{ borderTop: `1px solid ${RULE}` }} />
        <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent={CLAY} />
      </Section>
    </Root>
  )
);

/** A book's jacket on a tinted table, drawn in the page (no network). */
const jacket = (table: string, cloth: string, ink: string, title: string, motif: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${table}"/><rect x="202" y="32" width="208" height="344" fill="#000" opacity=".12"/><rect x="196" y="24" width="208" height="344" fill="${cloth}"/>${motif}<text x="300" y="332" fill="${ink}" font-family="Georgia, serif" font-size="23" text-anchor="middle">${title}</text></svg>`
  )}`,
  width: 600,
  height: 400,
});
const LOW_WATER = jacket("#E7DFCF", "#254653", "#F3E9D2", "Low Water", `<circle cx="300" cy="124" r="52" fill="#E2B04A"/><path d="M196 196q26-20 52 0t52 0 52 0 52 0v172H196Z" fill="#17323D"/><path d="M196 234q26-20 52 0t52 0 52 0 52 0" fill="none" stroke="#F3E9D2" stroke-width="2"/>`);
const ORCHARD_YEAR = jacket("#E4E2D2", "#E9DFC6", "#2E3B24", "The Orchard Year", `<circle cx="300" cy="136" r="78" fill="#5C6B3C"/><rect x="294" y="196" width="12" height="84" fill="#3E2E20"/><circle cx="272" cy="118" r="10" fill="#B54A33"/><circle cx="322" cy="104" r="10" fill="#B54A33"/><circle cx="332" cy="154" r="10" fill="#B54A33"/><circle cx="284" cy="160" r="10" fill="#B54A33"/>`);

const BookCard = component({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: CLOTH }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14, padding: [0, 0, 18], backgroundColor: CARD, borderRadius: 3 }}>
      <Image src={jacket} alt={`The jacket of ${title}.`} style={{ width: "100%", borderRadius: [3, 3, 0, 0] }} />
      <Column style={{ gap: 8, padding: [0, 16] }}>
        <Heading level={3} style={serif(26)}>
          {title}
        </Heading>
        <Paragraph style={{ fontSize: 14, lineHeight: 1.45, color: QUIET }}>{blurb}</Paragraph>
        <Paragraph style={{ ...serif(28), color: accent }}>{price}</Paragraph>
        <Button href={href} style={{ width: "100%", backgroundColor: accent, fontSize: 14, fontWeight: 600, padding: [12, 0], borderRadius: 2 }}>
          {cta}
        </Button>
      </Column>
    </Column>
  ),
});

/** A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`. */
export const ProductCards = story(
  `import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const BookCard = component({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14 }}>
      <Image src={jacket} alt={\`The jacket of \${title}.\`} style={{ width: "100%" }} />
      <Heading level={3}>{title}</Heading>
      <Paragraph>{blurb}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <BookCard jacket={{ src: "https://long-shelf.example/low-water.png", width: 600, height: 400 }} title="Low Water" blurb="Six stories from the Severn." price="£14" href="https://long-shelf.example/low-water" />
        <BookCard style={{ flex: 2 }} jacket={{ src: "https://long-shelf.example/orchard-year.png", width: 600, height: 400 }} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard." price="£22" href="https://long-shelf.example/orchard-year" cta="Reserve a copy" accent="#9A4A2A" />
      </Row>
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={640} {...root}>
      <Section style={{ padding: [28, 24, 40], gap: 20 }} mobile={{ padding: [20, 16, 32] }}>
        {masthead("New this week")}
        <Row style={{ gap: 16 }}>
          <BookCard jacket={LOW_WATER} title="Low Water" blurb="Six stories from the Severn, where the tide comes in faster than a man can run." price="£14" href={`${SITE}/low-water`} />
          <BookCard
            style={{ flex: 2 }}
            jacket={ORCHARD_YEAR}
            title="The Orchard Year"
            blurb="Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates."
            price="£22"
            href={`${SITE}/orchard-year`}
            cta="Reserve a copy"
            accent={CLAY}
          />
        </Row>
      </Section>
    </Root>
  )
);

const Rating = component({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, lineHeight: 1.2, letterSpacing: size === "large" ? 3 : 1, color: GOLD }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? ` ${score} of 5` : "")}
    </Text>
  ),
});

/** A reader's word on a book. */
const review = (rating: ReactElement, words: string, from: string) => (
  <Column style={{ gap: 6, padding: [16, 0], border: { top: `1px solid ${RULE}` } }}>
    {rating}
    <Paragraph style={{ ...serif(21), fontWeight: 400, lineHeight: 1.25, letterSpacing: 0 }}>{words}</Paragraph>
    <Text style={note}>{from}</Text>
  </Column>
);

/** A rating worked out from its props in `render`: a number, a choice of sizes, and a switch. */
export const WorkedOutFromProps = story(
  `import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, color: "#B0872E" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \` \${score} of 5\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={5} size="large" />
      <Rating score={4} showScore />
      <Rating score={3} />
    </Section>
  </Email>
);`,
  (Root) => (
    <Root width={560} {...root}>
      <Section style={{ padding: [28, 44, 44], gap: 24 }} mobile={{ padding: [20, 22, 32] }}>
        {masthead("What readers said")}
        <Column style={{ gap: 8 }}>
          <Rating score={5} size="large" />
          <Heading level={2} style={serif(38)}>
            Low Water
          </Heading>
          <Text style={{ fontSize: 15, color: QUIET }}>Ines Varga. Our book of the month, by a long way.</Text>
        </Column>
        <Column>
          {review(<Rating score={4} showScore />, "I read it on a train, and missed my stop.", "Priya, Gloucester")}
          {review(<Rating score={3} />, "Beautiful, and too sad for January. I’ll try again in spring.", "Tom, Stroud")}
        </Column>
      </Section>
    </Root>
  )
);

const Hero = component({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: INK }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: CARD, padding: [52, 24, 56], gap: 10, textAlign: "center" }} mobile={{ padding: [40, 20, 44] }}>
      <Text style={{ ...label, color: DIM }}>{kicker}</Text>
      <Heading level={1} style={{ ...serif(60), fontStyle: "italic" }} mobile={{ fontSize: 48 }}>
        {title}
      </Heading>
    </Section>
  ),
});

/** `placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one. */
export const AWholeSection = story(
  `import { component, Email, Heading, Paragraph, prop, Section, Text } from "@unlayer/react-elements";

const Hero = component({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: "#1E1C19" }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFDF8", padding: [52, 24, 56], textAlign: "center" }}>
      <Text>{kicker}</Text>
      <Heading level={1} style={{ fontSize: 60, fontStyle: "italic" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);`,
  (Root) => (
    <Root width={560} {...root}>
      <Hero title="New arrivals" />
      <Section style={{ padding: [36, 44], gap: 10 }} mobile={{ padding: [28, 22] }}>
        <Paragraph style={{ ...serif(24), fontWeight: 400, lineHeight: 1.3, letterSpacing: 0, textAlign: "center" }}>Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.</Paragraph>
        <Text style={{ ...note, textAlign: "center" }}>The band above and the one below are each one Hero: it goes where a Section goes.</Text>
      </Section>
      <Hero title="Last chance" kicker="The winter sale" background={CLOTH} />
    </Root>
  )
);
