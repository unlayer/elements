import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, Image, Menu, Paragraph, Row, Section, Social, Text } from "../../index";
import { caption, drawing, MONO, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Menu",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A line of links, or links down a column: `items` has each link's `text` and `href`, `style` their look. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Cratewell (a fictional record shop in Leeds, all crates and no algorithm).
 *
 * A shop that's all shelves and labels: black and bone, Syne shouting from the sleeves, Geist for
 * the small print, and one safety-orange sticker where the eye should land.
 */
const BLACK = "#141311";
const BONE = "#F1ECE2";
const QUIET = "#6B665C";
const DIM = "#9A958A";
const RULE = "#D8D2C5";
const STICKER = "#E2501F";

const DISPLAY = "Syne, 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const SANS = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://cratewell.example";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "Syne", src: "https://fonts.gstatic.com/s/syne/v24/8vIH7w4qzmVxm2BL9G78HEY.woff2", format: "woff2", weight: "400 800" },
    { family: "Geist", src: "https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2", format: "woff2", weight: "100 900" },
    MONO_FONT,
  ],
  style: { backgroundColor: BONE, color: BLACK, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 },
};

const ITEMS = [
  { text: "New in", href: `${SITE}/new` },
  { text: "Reissues", href: `${SITE}/reissues` },
  { text: "Labels", href: `${SITE}/labels` },
  { text: "Visit", href: `${SITE}/visit` },
];

const wordmark = { fontFamily: DISPLAY, fontWeight: 800, lineHeight: 1, letterSpacing: -1 } as const;

/** A record from above: black grooves, a sticker-colored label and its hole. */
const RECORD = drawing(
  440,
  440,
  `<rect width="440" height="440" fill="${BLACK}"/><circle cx="220" cy="220" r="206" fill="#262420"/><path d="M220 220L92 58A206 206 0 0 1 150 26ZM220 220L348 382A206 206 0 0 1 290 414Z" fill="#35322C"/>${[188, 166, 144, 122, 100].map((r) => `<circle cx="220" cy="220" r="${r}" fill="none" stroke="#141311" stroke-width="2"/>`).join("")}<circle cx="220" cy="220" r="72" fill="${STICKER}"/><circle cx="220" cy="220" r="9" fill="${BLACK}"/>`
);

/** `Menu` for a line of links, `Social` for profiles' icons. */
export const WithSocialIcons = story((Root) => (
  <Root {...root} style={{ ...root.style, backgroundColor: BLACK, color: BONE }}>
    <Section style={{ padding: [52, 24, 56], gap: 24, alignItems: "center", textAlign: "center" }} mobile={{ padding: [40, 20, 44], gap: 20 }}>
      <Text style={{ ...wordmark, fontSize: 56 }} mobile={{ fontSize: 34 }}>
        Cratewell
      </Text>
      <Menu
        items={[
          { text: "Mail order", href: `${SITE}/mail-order` },
          { text: "Listening room", href: `${SITE}/room` },
          { text: "Sell us yours", href: `${SITE}/sell` },
        ]}
        separator="·"
        style={{ fontSize: 15, color: BONE, separatorColor: DIM, padding: [4, 10] }}
      />
      <Social
        icons={[
          { name: "x", href: `${SITE}/on/x` },
          { name: "instagram", href: `${SITE}/on/instagram` },
          { name: "youtube", href: `${SITE}/on/youtube` },
        ]}
        iconType="circle"
        size={32}
        style={{ gap: 12 }}
      />
    </Section>
  </Root>
));

/** A menu with what it's set to, in a quiet line over it. */
const shelf = (written: string, menu: JSX.Element) => (
  <Column style={{ gap: 8, padding: [20, 0], border: { top: `1px solid ${RULE}` } }}>
    <Text style={{ ...caption(QUIET), textAlign: "center" }}>{written}</Text>
    {menu}
  </Column>
);

/** With nothing set, and with a `separator` between the links, in a color of its own (phones show none). */
export const Separators = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [40, 24, 28], gap: 24 }} mobile={{ padding: [28, 16, 16], gap: 20 }}>
      <Heading level={2} style={{ ...wordmark, fontSize: 36, textAlign: "center" }} mobile={{ fontSize: 30 }}>
        Browse the shelves
      </Heading>
      <Column>
        {shelf("Nothing set", <Menu items={ITEMS} style={{ color: BLACK }} />)}
        {shelf('separator="|"', <Menu items={ITEMS} separator="|" style={{ color: BLACK, separatorColor: BLACK }} />)}
        {shelf('separator="/", separatorColor', <Menu items={ITEMS} separator="/" style={{ color: BLACK, separatorColor: STICKER, fontWeight: 600 }} />)}
      </Column>
    </Section>
  </Root>
));

/** `layout="vertical"` puts the links down a column. */
export const Vertical = story((Root) => (
  <Root {...root} style={{ ...root.style, backgroundColor: BLACK, color: BONE }}>
    <Section style={{ padding: [40, 32, 44] }} mobile={{ padding: [28, 24, 32] }}>
      <Row style={{ gap: 40, alignItems: "center" }} mobile={{ gap: 24 }}>
        <Column style={{ width: 240, alignItems: "center" }} mobile={{ width: "100%" }}>
          <Image src={RECORD} alt="A black record from above, with an orange label" style={{ width: "100%" }} mobile={{ width: 220, alignSelf: "center" }} />
        </Column>
        <Column style={{ gap: 12 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1, color: DIM, textTransform: "uppercase" }}>In the shop</Text>
          <Menu items={ITEMS} layout="vertical" style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: BONE, padding: [6, 0], justifyContent: "start" }} />
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A band of the shop's colors, with its links where `justifyContent` puts them. */
const band = (backgroundColor: string, color: string, justifyContent: "start" | "center" | "end", textAlign: "left" | "center" | "right", padding: [number, number, number, number]) => (
  <Column style={{ backgroundColor, color, padding: [22, 24, 24], gap: 10, textAlign }} mobile={{ padding: [18, 12, 20] }}>
    <Text style={caption(color)}>justifyContent: "{justifyContent}"</Text>
    <Menu items={ITEMS} style={{ justifyContent, padding, color, fontSize: 16, fontWeight: 500 }} />
  </Column>
);

/** `justifyContent` puts the links on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [32, 0, 36], gap: 4 }} mobile={{ padding: 0, gap: 0 }}>
      {band(BLACK, BONE, "start", "left", [4, 16, 4, 0])}
      {band("#E3DCCD", BLACK, "center", "center", [4, 12, 4, 12])}
      {band(STICKER, BLACK, "end", "right", [4, 0, 4, 16])}
    </Section>
  </Root>
));

/** A site's navigation: light, bold capitals on a dark band. */
export const NavigationBar = story((Root) => (
  <Root {...root}>
    <Section style={{ backgroundColor: BLACK, padding: [8, 16] }} mobile={{ padding: [6, 4] }}>
      <Menu items={ITEMS} style={{ color: BONE, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: [12, 16] }} />
    </Section>
    <Section style={{ padding: [44, 32, 52], gap: 16 }} mobile={{ padding: [32, 24, 36] }}>
      <Text style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: STICKER }}>Friday 6 November</Text>
      <Heading level={1} style={{ ...wordmark, fontSize: 44, lineHeight: 1.04 }} mobile={{ fontSize: 34 }}>
        Forty crates from a shut pressing plant
      </Heading>
      <Paragraph style={{ fontSize: 17, color: QUIET, maxWidth: 440 }} mobile={{ fontSize: 16 }}>
        Test pressings, misprints and a whole run of a dub record nobody ordered. On the shelves from ten.
      </Paragraph>
    </Section>
  </Root>
));

/** An email's footer: small links, a quiet separator, the address under them. */
export const FooterLinks = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [44, 32, 40], gap: 8 }} mobile={{ padding: [32, 24, 28] }}>
      <Heading level={2} style={{ ...wordmark, fontSize: 30 }}>
        See you in the crates.
      </Heading>
      <Paragraph style={{ fontSize: 16, color: QUIET }}>Saturdays we’re open until seven, and the kettle’s on.</Paragraph>
    </Section>
    <Section style={{ padding: [20, 24, 24], gap: 10, border: { top: `1px solid ${RULE}` } }}>
      <Menu
        items={[
          { text: "Unsubscribe", href: `${SITE}/unsubscribe` },
          { text: "Preferences", href: `${SITE}/preferences` },
          { text: "Privacy", href: `${SITE}/privacy` },
        ]}
        separator="|"
        style={{ fontSize: 12, color: QUIET, separatorColor: RULE, padding: [2, 10] }}
      />
      <Paragraph style={{ fontSize: 12, color: QUIET, textAlign: "center" }}>Cratewell Records, 9 Foundry Yard, Leeds LS1 4DX</Paragraph>
    </Section>
  </Root>
));
