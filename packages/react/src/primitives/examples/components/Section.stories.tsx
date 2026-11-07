/**
 * Brindle (a fictional bakehouse on a Bristol side street) writes to the people who queue for it.
 *
 * Flour-coloured paper, rye-brown ink and one blackcurrant jam, kept for the band or button the eye
 * should land on. Gloock for the bakery's voice, Schibsted Grotesk for the facts, DM Mono for the
 * small captions that say what each story is showing.
 */
import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, LineBreak, Text, Row, Section } from "../../index";

const FLOUR = "#F8F2E7";
const OVEN = "#EFE5D3";
const RYE = "#2B1D14";
const QUIET = "#75655A";
const RULE = "#DFD2BD";
const JAM = "#7B2240";
const JAM_DOWN = "#651A33";

const DISPLAY = "Gloock, Georgia, 'Times New Roman', serif";
const SANS = "'Schibsted Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Gloock", src: "https://fonts.gstatic.com/s/gloock/v8/Iurb6YFw84WUY4NJiBakJLRBjA.woff2", format: "woff2", weight: 400 } as const,
  { family: "Schibsted Grotesk", src: "https://fonts.gstatic.com/s/schibstedgrotesk/v7/Jqz55SSPQuCQF3t8uOwiUL-taUTtap9GayojdSFO.woff2", format: "woff2", weight: "400 900" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const PAPER = { backgroundColor: FLOUR, color: RYE, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 } as const;
const DISPLAY_TYPE = { fontFamily: DISPLAY, fontWeight: 400, lineHeight: 1.08, letterSpacing: -0.4 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const BUTTON = { backgroundColor: JAM, color: FLOUR, fontSize: 15, fontWeight: 600, padding: "14px 24px", borderRadius: 2 } as const;

const SITE = "https://brindle.example";

/** A loaf on today's list: its name, and what it costs. */
const loaf = (name: string, price: string) => (
  <Row stackOnMobile={false} style={{ padding: [10, 0], border: { top: `1px solid ${RULE}` } }}>
    <Column>
      <Text style={{ fontSize: 16 }}>{name}</Text>
    </Column>
    <Column style={{ width: 72 }}>
      <Text style={{ fontFamily: MONO, fontSize: 13, lineHeight: "26px", textAlign: "right", color: QUIET }}>{price}</Text>
    </Column>
  </Row>
);

const meta: Meta<Args> = {
  title: "Components/Section",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A band across the whole window, directly in an Email or a Page: its background spans the window, and its children are stacked at the content width. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** Each `Section`'s background reaches the window's edges, whatever the template's width. */
export const Bands = story((Root) => (
  <Root width={400} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: JAM, color: FLOUR, padding: [32, 24, 28], gap: 6 }}>
      <Text style={{ ...CAPTION, color: FLOUR }}>Tuesday 10 November</Text>
      <Heading level={1} style={{ ...DISPLAY_TYPE, fontSize: 38 }}>
        Today’s bake
      </Heading>
    </Section>
    <Section style={{ padding: [28, 24, 32], gap: 18 }}>
      <Text style={{ fontSize: 18, lineHeight: 1.45 }}>
        Out of the oven at seven.
        <LineBreak />
        They rarely see noon.
      </Text>
      <Column>
        {loaf("Dark rye", "£4.80")}
        {loaf("Seeded spelt", "£5.20")}
        {loaf("Fig and fennel", "£6.40")}
      </Column>
    </Section>
    <Section style={{ backgroundColor: OVEN, padding: [18, 24], gap: 6 }}>
      <Text style={{ fontSize: 14, color: QUIET }}>Closed on Mondays, so the ovens can rest. 14 Mill Row, Bristol.</Text>
      <Text style={CAPTION}>width: 400 · each band’s color reaches the window’s edges</Text>
    </Section>
  </Root>
));

/** `padding` is the space inside the band, and `gap` the space between what it holds. */
export const Spacing = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: OVEN, padding: [40, 24], gap: 24 }}>
      <Text style={CAPTION}>padding: [40, 24] · gap: 24</Text>
      <Heading level={2} style={{ ...DISPLAY_TYPE, fontSize: 48 }} mobile={{ fontSize: 38 }}>
        Fig and fennel
      </Heading>
      <Text style={{ fontSize: 17, maxWidth: 440 }}>This week’s loaf: two days’ slow rise, a dark crust, and enough fruit that it doesn’t need butter. It gets it anyway.</Text>
    </Section>
    <Section style={{ padding: [8, 24], gap: 4 }}>
      <Text style={CAPTION}>padding: [8, 24] · gap: 4</Text>
      <Text style={{ fontSize: 14, color: QUIET }}>Contains wheat, rye and sesame. Baked where nuts have been.</Text>
    </Section>
  </Root>
));

/** `alignItems` says where what it holds sits across the width. */
export const Alignment = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [24, 24], gap: 10, alignItems: "start" }}>
      <Text style={CAPTION}>alignItems: "start"</Text>
      <Button href={`${SITE}/order`} style={BUTTON} hover={{ backgroundColor: JAM_DOWN }}>
        Order for Saturday
      </Button>
    </Section>
    <Section style={{ padding: [24, 24], gap: 10, alignItems: "center", backgroundColor: OVEN }}>
      <Text style={{ ...CAPTION, textAlign: "center" }}>alignItems: "center"</Text>
      <Button href={`${SITE}/classes`} style={BUTTON} hover={{ backgroundColor: JAM_DOWN }}>
        Book a bread class
      </Button>
    </Section>
    <Section style={{ padding: [24, 24], gap: 10, alignItems: "end" }}>
      <Text style={{ ...CAPTION, textAlign: "right" }}>alignItems: "end"</Text>
      <Button href={`${SITE}/gift`} style={BUTTON} hover={{ backgroundColor: JAM_DOWN }}>
        Send someone a loaf
      </Button>
    </Section>
  </Root>
));

/** `border` draws a line on any side of the band: an accent on top, a hairline below. */
export const Borders = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [28, 24], gap: 8, border: { top: `4px solid ${JAM}` } }}>
      <Heading level={2} style={{ ...DISPLAY_TYPE, fontSize: 30 }}>
        Christmas hours
      </Heading>
      <Text style={{ fontSize: 17 }}>We bake until noon on Christmas Eve, then sleep until the 28th.</Text>
      <Text style={CAPTION}>border: {"{"} top: "4px solid" {"}"}, an accent</Text>
    </Section>
    <Section style={{ backgroundColor: OVEN, padding: [24, 24], gap: 8, border: { bottom: `1px solid ${RYE}` } }}>
      <Text style={{ fontSize: 15 }}>Stollen orders close on Friday 18 December. We’ve only got the one oven.</Text>
      <Text style={CAPTION}>border: {"{"} bottom: "1px solid" {"}"}, a hairline</Text>
    </Section>
  </Root>
));

/** A section's text styles are inherited by what it holds, so a dark band needs no color on each line. */
export const InheritedText = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: RYE, color: FLOUR, padding: [56, 32], gap: 16, textAlign: "center", fontFamily: DISPLAY }} mobile={{ padding: [40, 24] }}>
      <Heading level={2} style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.15 }} mobile={{ fontSize: 28 }}>
        “It has ruined all other
        <LineBreak />
        toast for me.”
      </Heading>
      <Text style={{ fontSize: 16 }}>Hanne, every Saturday since 2019</Text>
    </Section>
  </Root>
));

/** `mobile` has its padding, gap and text on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: OVEN, padding: [48, 40], gap: 24, fontSize: 18 }} mobile={{ padding: [20, 16], gap: 8, fontSize: 15, textAlign: "center" }}>
      <Heading level={2} style={{ ...DISPLAY_TYPE, fontSize: 36 }} mobile={{ fontSize: 28 }}>
        Saturday bread class
      </Heading>
      <Text>Eight till noon, six to a table. You’ll shape four loaves, and take home a starter that already has a name.</Text>
      <Text style={CAPTION}>on phones: padding [20, 16], gap 8, centered</Text>
    </Section>
  </Root>
));
