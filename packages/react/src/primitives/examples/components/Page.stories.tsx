import type { Meta } from "@storybook/react-vite";
import { args, argTypes, showing, type Args } from "../../../stories/SideBySide";
import { Button, Column, Grid, Heading, Image, LineBreak, Link, List, ListItem, Page, Paragraph, Row, Section, Text } from "../../index";
import { caption, drawing, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Page",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A web page, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template.",
      },
    },
  },
};
export default meta;

/**
 * Kestrel Hill (a fictional public observatory, open on clear Saturdays).
 *
 * Night and parchment, like an old star atlas: Bodoni Moda for the headings, Jost for what you need
 * to know, and the brass of the old telescope where the eye should land. Its Arabic pages are set
 * in Amiri and Noto Naskh.
 */
const NIGHT = "#0F1720";
const PANEL = "#18232E";
const RULE_DARK = "#2C3946";
const PARCHMENT = "#F1EADB";
const SHEET = "#FBF7EE";
const INK = "#1B2128";
const QUIET = "#6A655A";
const MIST = "#A3ADB5";
const BRASS = "#CDA65C";
const BRASS_DOWN = "#B78F47";

const DISPLAY = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif";
const SANS = "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Cormorant Garamond', Garamond, Georgia, serif";
const ARABIC_DISPLAY = "Amiri, 'Times New Roman', serif";
const ARABIC = "'Noto Naskh Arabic', 'Geeza Pro', Tahoma, Arial, sans-serif";

const SITE = "https://kestrelhill.example";

const BODONI = { family: "Bodoni Moda", src: "https://fonts.gstatic.com/s/bodonimoda/v28/aFTQ7PxzY382XsXX63LUYJSKSKjWXFBP.woff2", format: "woff2", weight: "400 900" };
const JOST = { family: "Jost", src: "https://fonts.gstatic.com/s/jost/v20/92zatBhPNqw73oTd4jQmfxI.woff2", format: "woff2", weight: "100 900" };
const FONTS = [BODONI, JOST, MONO_FONT];

const kicker = { fontSize: 12, fontWeight: 500, letterSpacing: 2.2, textTransform: "uppercase" } as const;
const title = { fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.06, letterSpacing: -0.5 } as const;

/** `width` is the widest the content gets; a `Section`'s background still reaches the window's edges. */
export const Width = showing(
  "Page",
  <Page width={480} fonts={FONTS} style={{ backgroundColor: PARCHMENT, color: INK, fontFamily: SANS, fontSize: 17, lineHeight: 1.55 }}>
    <Section style={{ backgroundColor: NIGHT, color: PARCHMENT, padding: [56, 24], gap: 14 }} mobile={{ padding: [44, 24] }}>
      <Text style={{ ...kicker, color: BRASS }}>Tonight’s sky</Text>
      <Heading level={2} style={{ ...title, fontSize: 44 }} mobile={{ fontSize: 36 }}>
        Jupiter rises at 18:40
      </Heading>
      <Paragraph>Look east from the car park. It’s the brightest thing up there until the moon clears the ridge, a little after nine.</Paragraph>
    </Section>
    <Section style={{ padding: [16, 24, 20] }}>
      <Text style={caption(QUIET)}>width: 480 holds the words. The band behind them runs the whole window.</Text>
    </Section>
  </Page>
);

/** Text styles on the root are inherited by everything in it, and `backgroundColor` is the window's. */
export const InheritedText = showing(
  "Page",
  <Page
    width={640}
    fonts={[{ family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2", format: "woff2", weight: "300 700" }, MONO_FONT]}
    style={{ backgroundColor: NIGHT, color: PARCHMENT, fontFamily: SERIF, fontSize: 24, lineHeight: 1.45, textAlign: "center" }}
    mobile={{ fontSize: 21 }}
  >
    <Section style={{ padding: [72, 40, 64], gap: 18 }} mobile={{ padding: [52, 24, 44] }}>
      <Heading level={1} style={{ fontSize: 54, fontWeight: 500, lineHeight: 1.02 }} mobile={{ fontSize: 42 }}>
        Bring a coat.
      </Heading>
      <Paragraph>It’s colder on the hill than you’ll think it is, and the dome has to stay open to the night.</Paragraph>
      <Text style={{ ...caption(MIST), padding: [18, 0, 0] }}>The Page's style has the color, font and alignment; the paragraph sets nothing.</Text>
    </Section>
  </Page>
);

/** `gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle. */
export const GapAndAlignment = showing(
  "Page",
  <Page width={560} fonts={FONTS} style={{ backgroundColor: PARCHMENT, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.5, gap: 16, alignItems: "center", textAlign: "center" }}>
    <Heading level={2} style={{ ...title, fontSize: 40, padding: [44, 20, 8] }} mobile={{ fontSize: 34, padding: [32, 20, 4] }}>
      A public night
    </Heading>
    <Column style={{ width: 360, padding: [24, 24, 26], gap: 6, backgroundColor: SHEET, border: `1px solid #DDD3BE` }} mobile={{ width: 320 }}>
      <Text style={{ ...kicker, color: BRASS_DOWN }}>Saturday 14 November</Text>
      <Text style={{ fontFamily: DISPLAY, fontSize: 28, lineHeight: 1.15 }}>Doors at 19:30</Text>
      <Text style={{ fontSize: 15, color: QUIET }}>Dome opens at nine. £8, children free.</Text>
    </Column>
    <Button href={`${SITE}/book`} style={{ backgroundColor: INK, color: PARCHMENT, fontSize: 15, fontWeight: 500, padding: [14, 30], borderRadius: 2 }} hover={{ backgroundColor: "#2C3640" }}>
      Book a place
    </Button>
    <Paragraph style={{ fontSize: 14, color: QUIET, padding: [0, 24] }}>If it’s cloudy, we’ll write by four and refund you.</Paragraph>
    <Text style={{ ...caption(QUIET), padding: [8, 0, 32] }}>gap: 16, alignItems: "center"</Text>
  </Page>
);

const TITLE = "Kestrel Hill Observatory, open on clear Saturdays";
const DESCRIPTION = "See Saturn through a brass telescope from 1889. Public nights on the hill from September to April, £8, and children come free.";

/** `title` is the browser tab's, `description` the page's meta description, and `lang` its language: none shows on the page. */
export const TitleAndDescription = showing(
  "Page",
  <Page width={560} title={TITLE} description={DESCRIPTION} lang="en" fonts={FONTS} style={{ backgroundColor: PARCHMENT, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 }}>
    <Section style={{ padding: [44, 24, 44], gap: 24 }} mobile={{ padding: [32, 20, 36], gap: 20 }}>
      <Heading level={2} style={{ ...title, fontSize: 36 }} mobile={{ fontSize: 30 }}>
        What a stranger sees first
      </Heading>
      <Column style={{ gap: 8 }}>
        <Text style={caption(QUIET)}>title, on a browser's tab</Text>
        <Column style={{ backgroundColor: "#E1D8C5", padding: [10, 10, 0] }}>
          <Text style={{ width: 300, backgroundColor: SHEET, padding: [8, 14], borderRadius: [8, 8, 0, 0], fontSize: 13, lineHeight: 1.3 }} mobile={{ width: "100%" }}>
            {TITLE}
          </Text>
        </Column>
      </Column>
      <Column style={{ gap: 8 }}>
        <Text style={caption(QUIET)}>description, under a search result</Text>
        <Column style={{ backgroundColor: SHEET, padding: [18, 20, 20], gap: 4, border: "1px solid #E1D8C5" }}>
          <Text style={{ fontSize: 13, color: QUIET }}>kestrelhill.example</Text>
          <Text style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 500, lineHeight: 1.22 }}>
            <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
              {TITLE}
            </Link>
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 1.45, color: QUIET }}>{DESCRIPTION}</Text>
        </Column>
      </Column>
      <Text style={caption(QUIET)}>Neither shows on the page itself; these copies are drawn for you to see them.</Text>
    </Section>
  </Page>
);

/** A number from the Arabic page, over what it counts: the first in the Row sits on the right. */
const fact = (figure: string, what: string) => (
  <Column style={{ gap: 2, padding: [12, 0, 0], border: { top: `1px solid ${RULE_DARK}` } }}>
    <Text style={{ fontFamily: ARABIC_DISPLAY, fontSize: 28, lineHeight: 1.3, color: BRASS }} mobile={{ fontSize: 24 }}>
      {figure}
    </Text>
    <Text style={{ fontSize: 14, color: MIST }} mobile={{ fontSize: 13 }}>
      {what}
    </Text>
  </Column>
);

/** `dir="rtl"` writes the whole page from the right, and `lang` says its language. */
export const RightToLeft = showing(
  "Page",
  <Page
    width={560}
    dir="rtl"
    lang="ar"
    fonts={[
      { family: "Amiri", src: "https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHpUrtLMS7JNKIjk.woff2", format: "woff2", weight: 400 },
      { family: "Amiri", src: "https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkaY6zp5gGDAbnCA.woff2", format: "woff2", weight: 700 },
      { family: "Noto Naskh Arabic", src: "https://fonts.gstatic.com/s/notonaskharabic/v44/RrQKbpV-9Dd1b1OAGA6M9PkyDuVBeN2DHV2mLXgzTrc.woff2", format: "woff2", weight: "400 700" },
      MONO_FONT,
    ]}
    style={{ backgroundColor: NIGHT, color: PARCHMENT, fontFamily: ARABIC, fontSize: 18, lineHeight: 1.8 }}
    mobile={{ fontSize: 17 }}
  >
    <Section style={{ padding: [52, 32, 48], gap: 18, alignItems: "start" }} mobile={{ padding: [36, 24, 36], gap: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: 600, color: BRASS }}>مرصد تل الصقر</Text>
      <Heading level={1} style={{ fontFamily: ARABIC_DISPLAY, fontSize: 52, fontWeight: 700, lineHeight: 1.25 }} mobile={{ fontSize: 40 }}>
        ليلة تحت السماء المفتوحة
      </Heading>
      <Paragraph>نفتح القبة كل يوم سبت عند التاسعة مساءً. تعال لترى حلقات زحل بعينيك، واحضر معطفًا دافئًا.</Paragraph>
      <List style={{ gap: 4, color: MIST, fontSize: 16 }}>
        <ListItem>تفتح الأبواب عند السابعة والنصف</ListItem>
        <ListItem>الدخول مجاني للأطفال</ListItem>
      </List>
      <Button href={`${SITE}/ar/book`} style={{ backgroundColor: BRASS, color: NIGHT, fontSize: 17, fontWeight: 700, padding: [12, 30], borderRadius: 2 }} hover={{ backgroundColor: BRASS_DOWN }}>
        احجز مكانك
      </Button>
      <Row stackOnMobile={false} style={{ gap: 20, padding: [14, 0, 0] }} mobile={{ gap: 14 }}>
        {fact("٩ مساءً", "تفتح القبة")}
        {fact("٨ جنيهات", "ثمن التذكرة")}
        {fact("٤٠ سم", "قطر المنظار")}
      </Row>
    </Section>
  </Page>
);

/** Stars, a constellation in brass thread, and the dome on its hill with its shutter open. */
const STARS = [
  [70, 120], [150, 52], [240, 170], [330, 80], [470, 40], [560, 150], [980, 62], [1080, 140], [1190, 54], [1290, 170], [1400, 84], [1470, 190], [420, 230], [1140, 240],
];
const THE_HILL = drawing(
  1520,
  640,
  `<rect width="1520" height="640" fill="${NIGHT}"/>${STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${x % 3 === 0 ? 3.5 : 2.5}" fill="#D9D4C4"/>`).join("")}<path d="M560 96L700 40L860 84L930 180L1060 136" fill="none" stroke="${BRASS}" stroke-width="2"/>${[[560, 96], [700, 40], [860, 84], [930, 180], [1060, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${BRASS}"/>`).join("")}<path d="M0 590C260 500 520 462 760 462C1000 462 1260 510 1520 580V640H0Z" fill="${PANEL}"/><path d="M610 462V380A150 150 0 0 1 910 380V462Z" fill="${RULE_DARK}"/><path d="M736 232A150 150 0 0 1 800 236L776 462H726Z" fill="${BRASS}"/><rect x="584" y="446" width="352" height="22" fill="#3A4856"/>`
);

/** What the observatory offers: a name, and a line. */
const FEATURES = [
  ["The big glass", "A brass refractor from 1889, still turned by hand and still sharp."],
  ["Clear Saturdays", "Doors at half past seven. We’ll write by four if it’s cloudy."],
  ["Someone to ask", "A volunteer at every eyepiece, and no question is too small."],
];

/** A landing page in the dark: a hero, three features and a last word, all on the root's background. */
export const Landing = showing(
  "Page",
  <Page width={760} title="Kestrel Hill Observatory" fonts={FONTS} style={{ backgroundColor: NIGHT, color: PARCHMENT, fontFamily: SANS, fontSize: 17, lineHeight: 1.55 }}>
    <Section style={{ padding: [64, 24, 24], gap: 18, alignItems: "center", textAlign: "center" }} mobile={{ padding: [44, 24, 16], gap: 14 }}>
      <Text style={{ ...kicker, color: BRASS }}>Kestrel Hill Observatory</Text>
      <Heading level={1} style={{ ...title, fontSize: 68, lineHeight: 1 }} mobile={{ fontSize: 46 }}>
        See Saturn with your own eyes
      </Heading>
      <Paragraph style={{ fontSize: 19, color: MIST, maxWidth: 480 }} mobile={{ fontSize: 17 }}>
        A public observatory on a dark hill, open on clear Saturdays since 1924.
      </Paragraph>
      <Button href={`${SITE}/book`} style={{ backgroundColor: BRASS, color: NIGHT, fontSize: 15, fontWeight: 600, padding: [14, 30], borderRadius: 2 }} hover={{ backgroundColor: BRASS_DOWN }}>
        Book a place, £8
      </Button>
    </Section>
    <Section>
      <Image src={THE_HILL} alt="The observatory's dome on its hill at night, its shutter open in brass, under a constellation" style={{ width: "100%" }} />
    </Section>
    <Section style={{ backgroundColor: PANEL, padding: [48, 24, 56] }} mobile={{ padding: [36, 24, 40] }}>
      <Grid columns={3} style={{ gap: 28 }} mobile={{ gap: 24 }}>
        {FEATURES.map(([name, line]) => (
          <Column key={name} style={{ gap: 8, padding: [16, 0, 0], border: { top: `1px solid ${BRASS}` } }}>
            <Heading level={3} style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 500, lineHeight: 1.15 }}>
              {name}
            </Heading>
            <Paragraph style={{ fontSize: 16, color: MIST }}>{line}</Paragraph>
          </Column>
        ))}
      </Grid>
    </Section>
    <Section style={{ padding: [56, 24, 64], gap: 8, textAlign: "center" }} mobile={{ padding: [44, 24, 48] }}>
      <Text style={{ fontFamily: DISPLAY, fontSize: 32, fontStyle: "italic", lineHeight: 1.2 }} mobile={{ fontSize: 26 }}>
        The sky’s free.
        <LineBreak />
        The tea is £1.
      </Text>
      <Text style={{ fontSize: 14, color: MIST }}>Kestrel Hill, ten minutes above the village</Text>
    </Section>
  </Page>
);
