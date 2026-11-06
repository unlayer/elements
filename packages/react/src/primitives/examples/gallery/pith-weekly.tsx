/**
 * Pith (a fictional weekly letter about food and where it comes from) sends its Thursday issue.
 *
 * A newspaper's manners on newsprint cream: a centred nameplate between rules, then a long read
 * set to be read, left-aligned, at about sixty-five characters a line. Bodoni Moda for the
 * nameplate and headlines, Source Serif 4 for everything read, and a tomato red for the labels
 * and the numbers. The recipe is a ruled box with its ingredients beside its method.
 */
import { Column, Divider, Email, Heading, LineBreak, Link, List, ListItem, Paragraph, Row, Section, Span, Text } from "../../index";

const PAPER = "#F5F0E6";
const INK = "#1D1B18";
const QUIET = "#6A645A";
const RULE = "#D6CDBD";
const TOMATO = "#B83A26";

const DISPLAY = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif";
const TEXT = "'Source Serif 4', Georgia, 'Times New Roman', serif";

const SITE = "https://pith.example";

const kicker = { fontSize: 12, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: TOMATO } as const;
const rule = `1px solid ${RULE}`;

/** A newspaper's double rule, thin over thick (there's no double border style). */
const doubleRule = (
  <Column style={{ gap: 2 }}>
    <Divider style={{ borderTop: `1px solid ${INK}` }} />
    <Divider style={{ borderTop: `2px solid ${INK}` }} />
  </Column>
);

/** One of the week's shorter pieces: its number, its headline, a line about it. */
const brief = (n: string, title: string, about: string, href: string) => (
  <Row stackOnMobile={false} style={{ gap: 20, padding: [18, 0], border: { top: rule } }} mobile={{ gap: 14 }}>
    <Column style={{ width: 36 }}>
      <Text style={{ fontFamily: DISPLAY, fontSize: 34, lineHeight: 1, color: TOMATO }}>{n}</Text>
    </Column>
    <Column style={{ gap: 4 }}>
      <Heading level={3} style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, lineHeight: 1.2 }}>
        <Link href={href} style={{ color: INK, textDecoration: "none" }}>
          {title}
        </Link>
      </Heading>
      <Paragraph style={{ fontSize: 16, lineHeight: 1.5, color: QUIET }}>{about}</Paragraph>
    </Column>
  </Row>
);

export const pithWeekly = (
  <Email
    width={600}
    lang="en-GB"
    title="Pith, No. 112"
    previewText="The last perry pear orchards of the Vale of Evesham, a field guide to winter squash, and pears poached in perry."
    fonts={[
      { family: "Bodoni Moda", src: "https://fonts.gstatic.com/s/bodonimoda/v28/aFTQ7PxzY382XsXX63LUYJSKSKjWXFBP.woff2", format: "woff2", weight: "400 900" },
      { family: "Bodoni Moda", src: "https://fonts.gstatic.com/s/bodonimoda/v28/aFTS7PxzY382XsXX63LUYJSPeKrcW3JNsao.woff2", format: "woff2", weight: "400 900", style: "italic" },
      { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFI2_tTDB4M7-auWDN0ahZJW1gb8te1Xb7G.woff2", format: "woff2", weight: "200 900" },
      { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFK2_tTDB4M7-auWDN0ahZJW1gewtW_WpzEpMs.woff2", format: "woff2", weight: "200 900", style: "italic" },
    ]}
    style={{ backgroundColor: PAPER, color: INK, fontFamily: TEXT, fontSize: 17, lineHeight: 1.62 }}
  >
    {/* Nameplate */}
    <Section style={{ padding: [36, 48, 0], gap: 14 }} mobile={{ padding: [24, 20, 0], gap: 12 }}>
      <Row stackOnMobile={false} style={{ padding: [0, 0, 10], border: { bottom: `1px solid ${INK}` } }}>
        <Column>
          <Text style={{ ...kicker, color: INK }}>No. 112</Text>
        </Column>
        <Column>
          <Text style={{ ...kicker, color: INK, textAlign: "right" }}>5 November 2026</Text>
        </Column>
      </Row>
      <Heading level={1} style={{ fontFamily: DISPLAY, fontSize: 92, fontWeight: 500, fontStyle: "italic", lineHeight: 1, letterSpacing: -2, textAlign: "center" }} mobile={{ fontSize: 68 }}>
        <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
          Pith
        </Link>
      </Heading>
      <Text style={{ fontStyle: "italic", fontSize: 16, color: QUIET, textAlign: "center", padding: [0, 0, 2] }} mobile={{ fontSize: 14 }}>
        A weekly letter about food, and where it comes from
      </Text>
      {doubleRule}
    </Section>

    {/* The long read */}
    <Section style={{ padding: [40, 48, 0], gap: 18 }} mobile={{ padding: [32, 20, 0], gap: 16 }}>
      <Text style={kicker}>This week’s long read</Text>
      <Heading level={2} style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: 600, lineHeight: 1.08, letterSpacing: -0.6 }} mobile={{ fontSize: 32 }}>
        The last perry pears of the Vale of Evesham
      </Heading>
      <Paragraph style={{ fontSize: 20, fontStyle: "italic", lineHeight: 1.45, color: QUIET }} mobile={{ fontSize: 18 }}>
        Perry pears once grew on four thousand acres here. Mary Holloway farms the last forty, and she isn’t sure who will farm them next.
      </Paragraph>
      <Text style={{ fontSize: 14, color: QUIET }}>By Tom Ashworth · A nine-minute read</Text>
      <Paragraph style={{ padding: [6, 0, 0] }}>
        <Span style={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontSize: 14 }}>The trees are older than the farmhouse.</Span> Some of them went in when Victoria was a girl, and they’ve outlived every
        Holloway who planted them. A perry pear tree takes a lifetime to bear and then bears for two more: the saying in the Vale is that you plant pears for your heirs.
      </Paragraph>
      <Paragraph>
        What Mary’s heirs will inherit is less clear. The cider makers who bought her fruit have gone over to apples, which crop in five years instead of fifty, and the last perry mill in the
        county closed in the spring. This autumn she pressed the harvest herself, in a borrowed press, in her own barn.
      </Paragraph>
      <Text style={{ fontSize: 16, fontWeight: 600 }}>
        <Link href={`${SITE}/112/evesham`} style={{ color: TOMATO }}>
          Read the rest of the piece
        </Link>
      </Text>
    </Section>

    {/* Pull quote */}
    <Section style={{ padding: [36, 48, 0] }} mobile={{ padding: [28, 20, 0] }}>
      <Column style={{ gap: 12, padding: [24, 0], border: { top: `1px solid ${INK}`, bottom: `1px solid ${INK}` } }}>
        <Text style={{ fontFamily: DISPLAY, fontSize: 28, fontStyle: "italic", lineHeight: 1.22, letterSpacing: -0.3, textAlign: "center" }} mobile={{ fontSize: 23 }}>
          “Nobody plants a pear tree for themselves. You plant it for whoever’s left.”
        </Text>
        <Text style={{ ...kicker, color: QUIET, textAlign: "center" }}>Mary Holloway, Bredon Hill Farm</Text>
      </Column>
    </Section>

    {/* The rest of the week */}
    <Section style={{ padding: [40, 48, 0], gap: 14 }} mobile={{ padding: [32, 20, 0] }}>
      <Text style={kicker}>Also this week</Text>
      <Column style={{ border: { bottom: rule } }}>
        {brief("2", "A field guide to winter squash", "Twelve of them, from crown prince to delicata: which to roast, which to soup, and which to leave on the windowsill until March.", `${SITE}/112/squash`)}
        {brief("3", "Why your loaf costs £6", "We followed a sourdough from a Hackney bakery back to the field, and counted every penny on the way.", `${SITE}/112/loaf`)}
        {brief("4", "Readers’ kitchens: a tenement in Leith", "Two burners, one window, and the best kedgeree Joanna’s neighbours have eaten.", `${SITE}/112/leith`)}
      </Column>
    </Section>

    {/* The recipe */}
    <Section style={{ padding: [40, 48, 0] }} mobile={{ padding: [32, 20, 0] }}>
      <Column style={{ gap: 20, padding: [28, 32, 32], border: `1px solid ${INK}` }} mobile={{ padding: [22, 18, 24] }}>
        <Column style={{ gap: 8 }}>
          <Text style={kicker}>The recipe</Text>
          <Heading level={2} style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, lineHeight: 1.12 }} mobile={{ fontSize: 22 }}>
            Pears poached in perry, with bay and black pepper
          </Heading>
          <Text style={{ fontSize: 14, color: QUIET }}>Serves 4 · An hour, mostly waiting</Text>
        </Column>
        <Row style={{ gap: 28, padding: [20, 0, 0], border: { top: rule } }} mobile={{ gap: 18 }}>
          <Column style={{ width: 196, gap: 8 }}>
            <Text style={{ ...kicker, color: INK, fontSize: 11 }}>You’ll need</Text>
            <List style={{ fontSize: 15, lineHeight: 1.5, gap: 4, indent: 16 }}>
              <ListItem>4 firm pears</ListItem>
              <ListItem>500 ml dry perry</ListItem>
              <ListItem>100 g golden caster sugar</ListItem>
              <ListItem>3 bay leaves</ListItem>
              <ListItem>10 black peppercorns</ListItem>
              <ListItem>Thick cream, to serve</ListItem>
            </List>
          </Column>
          <Column style={{ gap: 8 }}>
            <Text style={{ ...kicker, color: INK, fontSize: 11 }}>Method</Text>
            <List type="number" style={{ fontSize: 15, lineHeight: 1.5, gap: 6, indent: 26 }}>
              <ListItem>Peel the pears, leaving their stalks on, and stand them in a pan that just holds them.</ListItem>
              <ListItem>Pour over the perry, add the sugar, bay and pepper, and bring to a bare simmer.</ListItem>
              <ListItem>Cover with a circle of paper and poach for 40 minutes, until a knife slides in.</ListItem>
              <ListItem>Lift out the pears, boil the liquor to a syrup, and spoon it over them, warm, with the cream.</ListItem>
            </List>
          </Column>
        </Row>
      </Column>
    </Section>

    {/* Sign-off and footer */}
    <Section style={{ padding: [40, 48, 48], gap: 24 }} mobile={{ padding: [32, 20, 40], gap: 20 }}>
      <Paragraph style={{ fontStyle: "italic", fontSize: 18 }}>
        Until next Thursday,
        <LineBreak />
        Tom
      </Paragraph>
      {doubleRule}
      <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET, textAlign: "center" }}>
        You’re reading Pith because you subscribed to it. If someone you know cooks, forward it to them.
        <LineBreak />
        <Link href={`${SITE}/112`} style={{ color: QUIET }}>
          Read it on the web
        </Link>
        {"  ·  "}
        <Link href={`${SITE}/unsubscribe`} style={{ color: QUIET }}>
          Unsubscribe
        </Link>
      </Text>
    </Section>
  </Email>
);
