/**
 * Emails from Dar Rumman (a fictional guesthouse in Fez, its name "the house of the pomegranate"):
 * limewash plaster, dark walnut ink and one pomegranate red. Newsreader for the voice, Instrument
 * Sans for the facts, DM Mono for the quiet notes, Noto Naskh Arabic for the Arabic.
 */
import type { Meta } from "@storybook/react-vite";
import { args, argTypes, showing, type Args } from "../../../stories/SideBySide";
import { Button, Column, Email, Heading, Image, Link, Text, Row, Section, type EmailProps } from "../../index";

const PLASTER = "#F5EEE2";
const CARD = "#FFFCF7";
const WALNUT = "#2C211B";
const QUIET = "#75675B";
const RULE = "#E5DBCB";
const POMEGRANATE = "#A12B2F";
const POMEGRANATE_DOWN = "#86211F";

const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";
const ARABIC = "'Noto Naskh Arabic', 'Geeza Pro', 'Traditional Arabic', serif";

const SITE = "https://dar-rumman.example";

const fonts: NonNullable<EmailProps["fonts"]> = [
  { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2", format: "woff2", weight: "200 800" },
  { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2", format: "woff2", weight: "200 800", style: "italic" },
  { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" },
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 },
];
const text = { backgroundColor: PLASTER, color: WALNUT, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 };

/** Five horseshoe arches along a courtyard wall, the middle one in pomegranate, drawn in the page (no network). */
const ARCADE = (() => {
  const arch = (x: number, frame: string, opening: string) =>
    `<path d="M${x - 6} 180 V96 A44 44 0 1 1 ${x + 78} 96 V180 Z" fill="${frame}"/><path d="M${x} 180 V96 A38 38 0 1 1 ${x + 72} 96 V180 Z" fill="${opening}"/>`;
  const arches = [40, 142, 244, 346, 448].map((x) => (x === 244 ? arch(x, "#F2E9DA", POMEGRANATE) : arch(x, "#F2E9DA", "#C6B59B"))).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="300" viewBox="0 0 560 200"><rect width="560" height="200" fill="#E6D9C4"/><g transform="translate(0 16)">${arches}</g><rect y="196" width="560" height="4" fill="${WALNUT}"/></svg>`;
  return { src: `data:image/svg+xml,${encodeURIComponent(svg)}`, width: 840, height: 300 };
})();

/** Small mono capitals: labels. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what the root sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const serif = (fontSize: number) => ({ fontFamily: SERIF, fontWeight: 400, fontSize, lineHeight: 1.12, letterSpacing: -0.4 }) as const;

/** A line of the booking: what it is, and its value. */
const fact = (name: string, value: string) => (
  <Row stackOnMobile={false} style={{ padding: [10, 0], border: { top: `1px solid ${RULE}` } }}>
    <Column style={{ width: 110 }}>
      <Text style={{ fontSize: 14, color: QUIET }}>{name}</Text>
    </Column>
    <Column>
      <Text style={{ fontSize: 15 }}>{value}</Text>
    </Column>
  </Row>
);

const meta: Meta<Args> = {
  title: "Components/Email",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An email, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template.",
      },
    },
  },
};
export default meta;

/** `width` is the content's: the window around it takes the root's background. */
export const Width = showing(
  "Email",
  <Email width={420} fonts={fonts} style={text}>
    <Section style={{ padding: [40, 0, 16], gap: 0 }} mobile={{ padding: [20, 16, 12] }}>
      <Image src={ARCADE} alt="Five horseshoe arches along a courtyard wall, the middle one in pomegranate red." style={{ width: "100%" }} />
      <Column style={{ padding: [28, 32, 32], gap: 16, backgroundColor: CARD }} mobile={{ padding: [24, 20, 24] }}>
        <Column style={{ gap: 8 }}>
          <Text style={label}>Friday 11 December</Text>
          <Heading level={1} style={serif(34)}>
            We’ve kept the room over the courtyard.
          </Heading>
        </Column>
        <Column>
          {fact("Arriving", "After 3 pm, any time")}
          {fact("Leaving", "Monday 14 December")}
          {fact("Room", "The Pomegranate Room")}
        </Column>
      </Column>
    </Section>
    <Section style={{ padding: [0, 0, 40] }} mobile={{ padding: [0, 16, 24] }}>
      <Text style={{ ...note, textAlign: "center" }}>width: 420. The default is 600, and the window around it is the Email’s own background.</Text>
    </Section>
  </Email>
);

/** Text styles on the root are inherited by everything in it: its color, font, size, line height and alignment. */
export const InheritedText = showing(
  "Email",
  <Email width={520} fonts={fonts} style={{ backgroundColor: CARD, color: WALNUT, fontFamily: SERIF, fontSize: 20, lineHeight: 1.6, textAlign: "center" }} mobile={{ fontSize: 18 }}>
    <Section style={{ padding: [64, 32], gap: 18 }} mobile={{ padding: [44, 24], gap: 16 }}>
      <Heading level={1} style={{ fontSize: 44, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1 }}>
        Dear Ada,
      </Heading>
      <Text>The orange trees in the courtyard have just come into blossom, so you’ll smell the house before you see it.</Text>
      <Text>
        If your train is late, <Link href="mailto:layla@dar-rumman.example" style={{ color: POMEGRANATE }}>send me a word</Link> and I’ll keep the tagine warm.
      </Text>
      <Text>Layla</Text>
      <Text style={{ ...note, padding: [20, 0, 0] }}>Nothing above sets a color, a font or an alignment: they’re all the Email’s. The link sets only its color.</Text>
    </Section>
  </Email>
);

/** A card on the way there: where it applies, and what to do. */
const before = (name: string, body: string) => (
  <Column style={{ width: 400, padding: [22, 24], gap: 6, backgroundColor: CARD, borderRadius: 4 }} mobile={{ width: 327 }}>
    <Text style={label}>{name}</Text>
    <Text style={{ ...serif(21), lineHeight: 1.3, letterSpacing: 0 }}>{body}</Text>
  </Column>
);

/** `gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle. */
export const GapAndAlignment = showing(
  "Email",
  <Email width={560} fonts={fonts} style={{ ...text, gap: 16, alignItems: "center", textAlign: "center" }}>
    <Heading level={2} style={{ ...serif(36), padding: [44, 24, 8] }} mobile={{ fontSize: 26, padding: [32, 24, 4] }}>
      Two things, before you come
    </Heading>
    {before("From the station", "Hassan will meet you at the Bab Boujloud gate, with a cart for your bags.")}
    {before("At eight", "Dinner is on the roof. Tell us what you don’t eat, and we’ll cook around it.")}
    <Button href={`${SITE}/arrival`} style={{ backgroundColor: POMEGRANATE, fontSize: 15, fontWeight: 600, padding: [15, 30], borderRadius: 3 }} hover={{ backgroundColor: POMEGRANATE_DOWN }}>
      Tell us when you’ll arrive
    </Button>
    <Text style={{ ...note, padding: [8, 24, 44] }} mobile={{ padding: [8, 24, 32] }}>
      gap: 16 between each; alignItems: "center" and textAlign: "center" on the Email
    </Text>
  </Email>
);

/** `previewText` shows after the subject in an inbox, and `title` and `lang` describe the document: none shows in the email. */
export const PreviewTextAndTitle = showing(
  "Email",
  <Email width={560} previewText="Your room is held for 11 December, and a note about the train" title="Your Dar Rumman deposit" lang="en" fonts={fonts} style={text}>
    <Section style={{ padding: [40, 40, 44], gap: 24 }} mobile={{ padding: [28, 24, 32], gap: 20 }}>
      <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 12], border: { bottom: `1px solid ${WALNUT}` } }}>
        <Column style={{ width: 180 }}>
          <Text style={{ ...serif(25), fontStyle: "italic", lineHeight: "28px" }}>Dar Rumman</Text>
        </Column>
        <Column>
          <Text style={{ ...label, textAlign: "right" }}>Receipt 0417</Text>
        </Column>
      </Row>
      <Heading level={1} style={serif(38)} mobile={{ fontSize: 32 }}>
        Your deposit is paid, and your room is yours.
      </Heading>
      <Column>
        {fact("Deposit", "€120, on 6 November")}
        {fact("Left to pay", "€240, when you leave")}
        {fact("Room", "The Pomegranate Room")}
      </Column>
      <Column style={{ gap: 6, padding: [14, 16], backgroundColor: CARD }}>
        <Text style={note}>previewText: “Your room is held for 11 December, and a note about the train”</Text>
        <Text style={note}>title and lang describe the document. None of the three shows in the email.</Text>
      </Column>
    </Section>
  </Email>
);

/** A line of the booking, in Arabic. */
const arabicFact = (name: string, value: string) => (
  <Row stackOnMobile={false} style={{ padding: [10, 0], border: { top: `1px solid ${RULE}` } }}>
    <Column style={{ width: 96 }}>
      <Text style={{ fontSize: 16, color: QUIET }}>{name}</Text>
    </Column>
    <Column>
      <Text style={{ fontSize: 18 }}>{value}</Text>
    </Column>
  </Row>
);

/** `dir="rtl"` writes the whole email from the right, and `lang` says its language. */
export const RightToLeft = showing(
  "Email",
  <Email
    width={560}
    dir="rtl"
    lang="ar"
    fonts={[...fonts, { family: "Noto Naskh Arabic", src: "https://fonts.gstatic.com/s/notonaskharabic/v44/RrQKbpV-9Dd1b1OAGA6M9PkyDuVBeN2DHV2mLXgzTrc.woff2", format: "woff2", weight: "400 700" }]}
    style={{ ...text, fontFamily: ARABIC, fontSize: 19, lineHeight: 1.8 }}
  >
    <Section style={{ padding: [36, 40, 44], gap: 20, alignItems: "start" }} mobile={{ padding: [24, 24, 32] }}>
      <Image src={ARCADE} alt="خمسة أقواس على جدار الفناء، أوسطها بلون الرمّان." style={{ width: "100%" }} />
      <Heading level={1} style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.35 }} mobile={{ fontSize: 30 }}>
        أهلاً بكم في دار الرمّان
      </Heading>
      <Text>غرفتكم جاهزة، والشاي بالنعناع ينتظركم على السطح.</Text>
      <Column>
        {arabicFact("الوصول", "الجمعة ١١ ديسمبر")}
        {arabicFact("المغادرة", "الاثنين ١٤ ديسمبر")}
      </Column>
      <Button href={`${SITE}/ar/dinner`} style={{ backgroundColor: POMEGRANATE, fontFamily: ARABIC, fontSize: 18, fontWeight: 600, padding: [12, 30], borderRadius: 3 }} hover={{ backgroundColor: POMEGRANATE_DOWN }}>
        احجزوا عشاءكم
      </Button>
      <Text dir="ltr" style={{ ...note, textAlign: "right" }}>
        dir="rtl" lang="ar"
      </Text>
    </Section>
  </Email>
);
