/**
 * What could fail: small templates that each push on one thing most likely to break (long words in
 * narrow columns, right-to-left text, merge tags everywhere, many columns on phones, hidden blocks,
 * nesting, tables, images, buttons, empty and optional props, emoji and CJK, pagination, shapes,
 * fonts, inherited colours). Storybook shows them under Stress, so its smoke test and the visual
 * baseline see every one; gallery.test.tsx renders every one in each root it's written for.
 *
 * Most are written for any root that shows on a screen, `(Root) => …`, and drawn as an Email and as
 * a Page. Between them they use every component in both.
 *
 * All of them come from Merrow Line, a fictional ferry company with passengers from everywhere and
 * paperwork to match. Chalk paper, harbour ink and one funnel red, for what to press. Familjen
 * Grotesk for the words, DM Mono for times, codes and captions; the tide is the gallery's drawing.
 */
import type { ReactElement, ReactNode } from "react";
import {
  Button,
  Canvas,
  Circle,
  Column,
  Divider,
  Document,
  Ellipse,
  Email,
  Grid,
  Heading,
  Html,
  Image,
  Layer,
  Line,
  LineBreak,
  Link,
  List,
  ListItem,
  Menu,
  MergeTag,
  Page,
  PageBreak,
  PageFooter,
  PageHeader,
  PageNumber,
  Paragraph,
  Path,
  Polygon,
  Rect,
  Row,
  Section,
  Social,
  Span,
  Svg,
  Table,
  TableCell,
  TableRow,
  Video,
} from "../../index";

/** A root that shows on a screen: an Email or a Page. */
export type ScreenRoot = typeof Email | typeof Page;
export type Stress = { roots: "screen"; template: (Root: ScreenRoot) => ReactElement } | { roots: "own"; template: ReactElement };

const CHALK = "#F3F1EA";
const SWELL = "#E6E3D8";
const HARBOUR = "#12242E";
const HARBOUR_UP = "#2A3D48";
const QUIET = "#55636B";
const RULE = "#D2CFC3";
const FUNNEL = "#C93A25";
const FUNNEL_DOWN = "#AB2F1D";
const SEA = "#0F6A70";
const BRASS = "#7D5F14";
const LAMP = "#F5E3A6";

const SANS = "'Familjen Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Familjen Grotesk", src: "https://fonts.gstatic.com/s/familjengrotesk/v11/Qw3GZR9ZHiDnImG6-NEMQ41wby8WbHoEj7E49PA.woff2", format: "woff2", weight: "400 700" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const SITE = "https://merrow.example";
const LINE_RULE = `1px solid ${RULE}`;

/** Signal flag U, red and white checks: a small PNG as a data URI, so the tests and stories need no network. */
const FLAG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAQ0lEQVR42u3PMREAMAgDQMxgov4XVFET2fhc5tyn5nWkG0oBAQEBAQEBAQEBAQEdA6WGUseAgICAgICAgICAgICOgT41J6eP4K9UuAAAAABJRU5ErkJggg==";
const TIDE = { src: "gallery/saltworks/low-water.png", width: 1200, height: 680 };

const PAPER = { backgroundColor: CHALK, color: HARBOUR, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 } as const;
const TITLE = { fontWeight: 600, lineHeight: 1.08, letterSpacing: -0.6 } as const;
const LABEL = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const BOX = { backgroundColor: SWELL, padding: "12px 14px", gap: 4 } as const;
const BUTTON = { backgroundColor: FUNNEL, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "14px 24px", borderRadius: 2 } as const;

const screen = (template: (Root: ScreenRoot) => ReactElement): Stress => ({ roots: "screen", template });

/** A small caption in the mono face. */
const caption = (text: string) => <Paragraph style={LABEL}>{text}</Paragraph>;

/** The top of everything Merrow Line sends: its name, and what this one pushes on. */
const masthead = (name: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 10], border: { bottom: `1px solid ${HARBOUR}` } }}>
    <Column style={{ width: 150 }}>
      <Paragraph style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Merrow Line</Paragraph>
    </Column>
    <Column>
      <Paragraph style={{ ...LABEL, textAlign: "right" }}>{name}</Paragraph>
    </Column>
  </Row>
);

const shell = (Root: ScreenRoot, name: string, children: ReactNode, extra: Record<string, unknown> = {}) => (
  <Root width={600} title={`Merrow Line: ${name}`} fonts={FONTS} style={PAPER} {...extra}>
    <Section style={{ padding: [28, 32, 36], gap: 18 }} mobile={{ padding: [20, 20, 28], gap: 16 }}>
      {masthead(name)}
      {children}
    </Section>
  </Root>
);

export const stress: Record<string, Stress> = {
  /** Words and links longer than their column: they break inside the column, never out of it. */
  longWords: screen((Root) =>
    shell(
      Root,
      "Long words",
      <>
        <Heading level={1} style={{ ...TITLE, fontSize: 34 }} mobile={{ fontSize: 28 }}>
          Schifffahrtsgesellschaftsbeförderungsbedingungen
        </Heading>
        <Paragraph style={{ color: QUIET }}>Our conditions of carriage, in one word. It breaks inside its column, never out of it.</Paragraph>
        <Row style={{ gap: 10 }}>
          <Column style={{ ...BOX, width: 124 }}>
            {caption("Passenger")}
            <Paragraph>Donaudampfschifffahrtsgesellschaftskapitänswitwe</Paragraph>
          </Column>
          <Column style={BOX}>
            {caption("Ticket")}
            <Paragraph>
              <Link href={`${SITE}/a/very/long/path/that/never/ends/with/a/query?utm_source=newsletter&utm_medium=email&utm_campaign=autumn`} style={{ color: FUNNEL }}>
                {`${SITE}/a/very/long/path/that/never/ends/with/a/query?utm_source=newsletter&utm_campaign=autumn`}
              </Link>
            </Paragraph>
          </Column>
          <Column style={{ ...BOX, width: 96 }}>
            {caption("Code")}
            <Paragraph style={{ fontFamily: MONO, fontSize: 12 }}>MRW2026111400048213DANUBEA7C9F2EE</Paragraph>
          </Column>
        </Row>
      </>
    )
  ),

  /** A template written right to left, with a run of left-to-right text inside it. */
  rightToLeft: screen((Root) =>
    shell(
      Root,
      "Right to left",
      <>
        <Heading level={1} style={{ fontWeight: 600, fontSize: 34, lineHeight: 1.2 }} mobile={{ fontSize: 28 }}>
          مرحباً بك على متن عبّارتنا
        </Heading>
        <Paragraph style={{ fontSize: 19 }}>
          شكراً لحجزك. تبحر رحلتك رقم <Span style={{ fontWeight: 700 }}>10482</Span> يوم الاثنين.
        </Paragraph>
        <Paragraph dir="ltr" style={LABEL}>
          MV Selkie, deck 4: an English sentence inside an Arabic email, left to right.
        </Paragraph>
        <Row style={{ gap: 10 }}>
          <Column style={BOX}>
            <Paragraph style={{ fontSize: 15, color: QUIET }}>المغادرة</Paragraph>
            <Paragraph style={{ fontFamily: MONO, fontSize: 24 }}>08:30</Paragraph>
          </Column>
          <Column style={BOX}>
            <Paragraph style={{ fontSize: 15, color: QUIET }}>הגעה</Paragraph>
            <Paragraph style={{ fontFamily: MONO, fontSize: 24 }}>11:45</Paragraph>
          </Column>
        </Row>
        <List type="number" style={{ fontSize: 17 }}>
          <ListItem>احضر قبل الإبحار بساعة</ListItem>
          <ListItem>أظهر رمز الحجز عند البوابة</ListItem>
        </List>
        <Button href={`${SITE}/bookings/10482`} style={BUTTON} hover={{ backgroundColor: FUNNEL_DOWN }}>
          عرض الحجز
        </Button>
      </>,
      { dir: "rtl", lang: "ar" }
    )
  ),

  /** Merge tags in every place text goes: headings, paragraphs, buttons, links, cells, list items, a link's href. */
  mergeTags: screen((Root) =>
    shell(
      Root,
      "Merge tags",
      <>
        <Heading level={1} style={{ ...TITLE, fontSize: 34 }} mobile={{ fontSize: 28 }}>
          Hello, <MergeTag name="first_name" />
        </Heading>
        <Paragraph>
          Your season ticket, <Span style={{ fontWeight: 700 }}><MergeTag name="plan_name" /></Span>, renews on <MergeTag name="renewal_date" />.{" "}
          <Link href="{{manage_url}}" style={{ color: FUNNEL }}>
            Manage it, <MergeTag name="first_name" />
          </Link>
          .
        </Paragraph>
        <Table style={{ fontSize: 15, cellPadding: [10, 0], rowBorder: LINE_RULE }}>
          <TableRow header style={{ fontWeight: 600 }}>
            <TableCell>Item</TableCell>
            <TableCell style={{ textAlign: "right" }}>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <MergeTag name="item_name" />
            </TableCell>
            <TableCell style={{ textAlign: "right", fontFamily: MONO, fontSize: 13, lineHeight: "22.5px" }}>
              <MergeTag name="item_price" />
            </TableCell>
          </TableRow>
        </Table>
        <List style={{ fontSize: 15, color: QUIET }}>
          <ListItem>
            Account: <MergeTag name="email" />
          </ListItem>
        </List>
        <Button href="{{checkout_url}}" style={BUTTON} hover={{ backgroundColor: FUNNEL_DOWN }}>
          Pay <MergeTag name="amount_due" /> now
        </Button>
      </>,
      Root === Email ? { previewText: "Hello {{first_name}}, your plan renews soon." } : { description: "Hello {{first_name}}, your plan renews soon." }
    )
  ),

  /** Many columns: five that stack on phones, a Grid of four that doesn't, three side by side on phones. */
  manyColumns: screen((Root) =>
    shell(
      Root,
      "Many columns",
      <>
        {caption("Five columns, stacked on phones")}
        <Row style={{ gap: 6 }}>
          {[
            ["Mon", "08:30"],
            ["Tue", "08:30"],
            ["Wed", "11:15"],
            ["Thu", "08:30"],
            ["Fri", "16:40"],
          ].map(([day, time]) => (
            <Column key={day} style={{ ...BOX, padding: [12, 10], textAlign: "center" }}>
              <Paragraph style={{ fontSize: 13, color: QUIET }}>{day}</Paragraph>
              <Paragraph style={{ fontFamily: MONO, fontSize: 15 }}>{time}</Paragraph>
            </Column>
          ))}
        </Row>
        {caption("A Grid of four, side by side on phones")}
        <Grid columns={4} stackOnMobile={false} style={{ gap: 6 }}>
          {[
            ["12k", "aboard"],
            ["3.4%", "late"],
            ["£98", "a cabin"],
            ["41", "sailings"],
          ].map(([figure, what]) => (
            <Column key={figure} style={{ padding: [12, 4], backgroundColor: HARBOUR, color: CHALK, textAlign: "center" }}>
              <Paragraph style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{figure}</Paragraph>
              <Paragraph style={{ fontSize: 12 }}>{what}</Paragraph>
            </Column>
          ))}
        </Grid>
        {caption("Three side by side on phones, one of them fixed")}
        <Row stackOnMobile={false} style={{ gap: 6 }}>
          <Column style={{ ...BOX, width: 64, padding: 10 }}>
            <Paragraph style={{ fontWeight: 600 }}>Fixed</Paragraph>
          </Column>
          <Column style={{ ...BOX, padding: 10 }}>
            <Paragraph>Shares what’s left</Paragraph>
          </Column>
          <Column style={{ ...BOX, flex: 2, padding: 10 }}>
            <Paragraph>Takes twice as much of it</Paragraph>
          </Column>
        </Row>
      </>
    )
  ),

  /** Blocks shown on only one of desktop and phone: a band, a column, an image, a button, text. */
  hiddenBlocks: screen((Root) => (
    <Root width={600} title="Merrow Line: Hidden blocks" fonts={FONTS} style={PAPER}>
      <Section hidden={{ mobile: true }} style={{ backgroundColor: HARBOUR, color: CHALK, padding: [14, 32] }}>
        <Paragraph style={{ fontSize: 15 }}>A band only desktops show: print your boarding pass.</Paragraph>
      </Section>
      <Section hidden={{ desktop: true }} style={{ backgroundColor: FUNNEL, color: "#FFFFFF", padding: [14, 20] }}>
        <Paragraph style={{ fontSize: 15 }}>A band only phones show: your pass is in the app.</Paragraph>
      </Section>
      <Section style={{ padding: [24, 32, 36], gap: 16 }} mobile={{ padding: [20, 20, 28] }}>
        {masthead("Hidden blocks")}
        <Row style={{ gap: 10 }}>
          <Column style={BOX}>
            {caption("Always here")}
            <Paragraph style={{ fontWeight: 600 }}>The 08:30 to Stornoway</Paragraph>
          </Column>
          <Column hidden={{ mobile: true }} style={BOX}>
            {caption("Desktop’s column")}
            <Paragraph style={{ fontWeight: 600 }}>Print and fold it</Paragraph>
          </Column>
          <Column hidden={{ desktop: true }} style={BOX}>
            {caption("Phone’s column")}
            <Paragraph style={{ fontWeight: 600 }}>Turn the brightness up</Paragraph>
          </Column>
        </Row>
        <Image hidden={{ mobile: true }} src={TIDE} alt="The tide drawn in blue lines under a low sun: the desktop's picture" style={{ width: "100%" }} />
        <Paragraph hidden={{ desktop: true }} style={{ color: QUIET }}>
          Phones get these words instead of the picture.
        </Paragraph>
        <Button hidden={{ desktop: true }} href={`${SITE}/app`} style={BUTTON} hover={{ backgroundColor: FUNNEL_DOWN }} mobile={{ width: "100%" }}>
          Open the app
        </Button>
      </Section>
    </Root>
  )),

  /** Layout inside layout: a Row in a Column in a Row, a Grid in a Row, a Layer of an image and words. */
  nested: screen((Root) =>
    shell(
      Root,
      "Nested",
      <>
        <Row style={{ gap: 14, padding: 14, border: `1px solid ${HARBOUR}` }}>
          <Column style={{ flex: 3, gap: 8 }}>
            <Paragraph style={{ fontWeight: 600 }}>Oban to Stornoway</Paragraph>
            <Row stackOnMobile={false} style={{ gap: 6 }}>
              <Column style={{ padding: 10, backgroundColor: SWELL }}>
                <Paragraph>Deck 4</Paragraph>
              </Column>
              <Column style={{ padding: 6, backgroundColor: SWELL }}>
                <Row stackOnMobile={false} style={{ gap: 4 }}>
                  <Column style={{ padding: 6, backgroundColor: CHALK }}>
                    <Paragraph style={{ fontFamily: MONO, fontSize: 12 }}>Row B</Paragraph>
                  </Column>
                  <Column style={{ padding: 6, backgroundColor: CHALK }}>
                    <Paragraph style={{ fontFamily: MONO, fontSize: 12 }}>Seat 2</Paragraph>
                  </Column>
                </Row>
              </Column>
            </Row>
          </Column>
          <Grid columns={2} style={{ flex: 2, gap: 6 }}>
            {["One car", "Two bikes", "One dog", "One cabin"].map((cell) => (
              <Column key={cell} style={{ padding: 8, backgroundColor: SWELL }}>
                <Paragraph style={{ fontSize: 14 }}>{cell}</Paragraph>
              </Column>
            ))}
          </Grid>
        </Row>
        <Layer style={{ alignItems: "start", height: 304 }}>
          <Image src={TIDE} alt="The tide drawn in blue lines under a low sun" style={{ width: "100%" }} />
          <Column style={{ padding: [12, 14] }}>
            <Paragraph style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>Words over the picture</Paragraph>
          </Column>
        </Layer>
      </>
    )
  ),

  /** Tables: a header, a footer, a cell spanning columns, long cells, and each alignment. */
  tables: screen((Root) =>
    shell(
      Root,
      "Tables",
      <>
        <Heading level={1} style={{ ...TITLE, fontSize: 34 }} mobile={{ fontSize: 28 }}>
          Fares to Stornoway
        </Heading>
        <Table style={{ fontSize: 15, cellPadding: [10, 12], rowBorder: LINE_RULE, border: `1px solid ${HARBOUR}` }}>
          <TableRow header style={{ backgroundColor: HARBOUR, color: CHALK }}>
            <TableCell>Crossing</TableCell>
            <TableCell style={{ textAlign: "center", width: 64 }}>Deck</TableCell>
            <TableCell style={{ textAlign: "right", width: 104 }}>Fare</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>The season, overnight, with a two-berth cabin, breakfast and a bicycle in the hold, for long enough to wrap onto several lines on a phone.</TableCell>
            <TableCell style={{ textAlign: "center", verticalAlign: "middle" }}>4</TableCell>
            <TableCell style={{ textAlign: "right", verticalAlign: "bottom", fontFamily: MONO, fontSize: 13 }}>£1,204.50</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} style={{ textAlign: "right", fontWeight: 600 }}>
              Spans two columns: the total
            </TableCell>
            <TableCell style={{ textAlign: "right", fontFamily: MONO, fontSize: 13 }}>£1,204.50</TableCell>
          </TableRow>
          <TableRow footer style={{ color: QUIET }}>
            <TableCell colSpan={3} style={{ fontSize: 13 }}>
              A footer row, under everything: fares include port tax.
            </TableCell>
          </TableRow>
        </Table>
      </>
    )
  ),

  /** Images with their size and without it, at a width and at their own, linked, rounded, placed. */
  images: screen((Root) =>
    shell(
      Root,
      "Images",
      <>
        <Image src={TIDE} alt="The tide drawn in blue lines under a low sun: full width, with its size" style={{ width: "100%" }} />
        <Row stackOnMobile={false} style={{ gap: 14, alignItems: "center" }}>
          <Image src={FLAG} alt="Signal flag U, red and white checks: no size given, shown at 48 px" style={{ width: 48 }} />
          <Image src={{ src: FLAG, width: 24, height: 24 }} alt="Signal flag U again, at its size of 24 by 24" style={{ flex: "none" }} />
          <Link href={`${SITE}/gallery`}>
            <Image src={TIDE} alt="The tide: a linked, rounded thumbnail" style={{ width: 120, borderRadius: 8 }} />
          </Link>
        </Row>
        <Image src={TIDE} alt="The tide again: half the width at the end, centred on phones" style={{ width: "50%", alignSelf: "end" }} mobile={{ width: "100%", alignSelf: "center" }} />
      </>
    )
  ),

  /** Buttons: a long label, full width, outlined, beside each other, placed, with hover colours. */
  buttons: screen((Root) =>
    shell(
      Root,
      "Buttons",
      <>
        <Heading level={1} style={{ ...TITLE, fontSize: 34 }} mobile={{ fontSize: 28 }}>
          Your sailing is forty minutes late.
        </Heading>
        <Button href={`${SITE}/rebook`} style={BUTTON} hover={{ backgroundColor: FUNNEL_DOWN }}>
          Move me to the next sailing with the same cabin, at no extra charge, and send me the new times
        </Button>
        <Button href={`${SITE}/keep`} style={{ ...BUTTON, width: "100%", backgroundColor: HARBOUR, padding: [14, 20] }} hover={{ backgroundColor: HARBOUR_UP }}>
          Keep my booking and wait
        </Button>
        {caption("Would a voucher for the café help?")}
        <Row stackOnMobile={false} style={{ gap: 8 }}>
          <Button href={`${SITE}/voucher/yes`} style={{ ...BUTTON, width: 120, backgroundColor: SEA, padding: [12, 0] }}>
            Yes
          </Button>
          <Button href={`${SITE}/voucher/no`} style={{ ...BUTTON, width: 120, backgroundColor: "transparent", color: HARBOUR, border: `1px solid ${HARBOUR}`, padding: [12, 0] }} hover={{ backgroundColor: SWELL }}>
            No thanks
          </Button>
        </Row>
        <Button href={`${SITE}/harbour-office`} style={{ ...BUTTON, alignSelf: "end", backgroundColor: QUIET, borderRadius: 999 }} mobile={{ alignSelf: "center" }}>
          At the end, centred on phones
        </Button>
      </>
    )
  ),

  /**
   * Everything with as little as it takes. The Root and the first and last Sections have no props at all, and every
   * block has only those it must: the one Section with a style gives them paper, ink and room to sit in.
   */
  emptyAndOptional: screen((Root) => (
    <Root>
      <Section>
        <Column />
      </Section>
      <Section style={{ backgroundColor: CHALK, color: HARBOUR, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: [32, 28], gap: 14 }} mobile={{ padding: [24, 20] }}>
        <Heading>Sailings resume on Friday.</Heading>
        <Paragraph>Everything below takes only the props it must have.</Paragraph>
        <Paragraph>The harbour wall is mended, and the 08:30 is back on its old timetable.</Paragraph>
        <Divider />
        <Button href={SITE}>See the timetable</Button>
        <List>
          <ListItem>Your old ticket still works</ListItem>
        </List>
        <Table>
          <TableRow>
            <TableCell>Oban to Stornoway, 08:30</TableCell>
          </TableRow>
        </Table>
        <Menu items={[{ text: "Timetable", href: `${SITE}/timetable` }]} />
        <Social icons={[{ name: "Instagram", href: "https://instagram.com/merrowline" }]} />
        <Video src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" thumbnail={Root === Email ? TIDE : undefined} />
        <Html html="<p style='margin:0'>Markup, written as it is.</p>" text="Markup, written as it is." />
        <Image src={FLAG} alt="" />
        <Row>
          <Column>
            <Paragraph>One column in a row.</Paragraph>
          </Column>
        </Row>
        <Grid>
          <Paragraph>Grid cell one.</Paragraph>
          <Paragraph>Grid cell two.</Paragraph>
        </Grid>
      </Section>
      <Section>
        <Paragraph>Merrow Line, The Pier, Oban. A section and its text, with no style at all.</Paragraph>
      </Section>
    </Root>
  )),

  /** Emoji and the scripts of Chinese, Japanese and Korean, in headings, text, buttons and cells. */
  emojiAndCjk: screen((Root) =>
    shell(
      Root,
      "Emoji and CJK",
      <>
        <Heading level={1} style={{ fontWeight: 600, fontSize: 32, lineHeight: 1.25 }} mobile={{ fontSize: 26 }}>
          🎉 秋の船旅セール、始まりました
        </Heading>
        <Paragraph style={{ fontSize: 17 }}>欢迎登船！您的船票已发送。 탑승해 주셔서 감사합니다. Family cabins 👨‍👩‍👧, party time 🥳🍰 and flags 🇯🇵🇰🇷.</Paragraph>
        <Table style={{ fontSize: 16, cellPadding: [10, 0], rowBorder: LINE_RULE }}>
          <TableRow>
            <TableCell>抹茶ラテ</TableCell>
            <TableCell style={{ textAlign: "right" }}>¥580</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>김치찌개 🌶️</TableCell>
            <TableCell style={{ textAlign: "right" }}>₩9,000</TableCell>
          </TableRow>
        </Table>
        <Button href={`${SITE}/sale`} style={BUTTON} hover={{ backgroundColor: FUNNEL_DOWN }}>
          今すぐ見る →
        </Button>
      </>,
      { lang: "ja" }
    )
  ),

  /** Fonts: a web font with its fallbacks, a family that doesn't exist, weights and italics. */
  fonts: screen((Root) =>
    shell(
      Root,
      "Fonts",
      <>
        <Column style={{ gap: 4 }}>
          {caption("A web font, Newsreader, with Georgia behind it")}
          <Paragraph style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 38, lineHeight: 1.1, letterSpacing: -0.6 }} mobile={{ fontSize: 30 }}>
            The 08:30 for Stornoway
          </Paragraph>
        </Column>
        <Column style={{ gap: 4, padding: [14, 0, 0], border: { top: LINE_RULE } }}>
          {caption("A family nobody has: Georgia shows instead")}
          <Paragraph style={{ fontFamily: "'Not A Real Font', 'Also Missing', Georgia, serif", fontSize: 22, lineHeight: 1.25 }}>Boarding closes twenty minutes before we sail.</Paragraph>
        </Column>
        <Column style={{ gap: 4, padding: [14, 0, 0], border: { top: LINE_RULE } }}>
          {caption("Bold italic, from the variable font’s range")}
          <Paragraph style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 26, lineHeight: 1.2, fontWeight: 700, fontStyle: "italic" }}>Mind the gap at low water.</Paragraph>
        </Column>
        <Column style={{ gap: 4, padding: [14, 0, 0], border: { top: LINE_RULE } }}>
          {caption("A monospace, for what mustn’t be misread")}
          <Paragraph style={{ fontFamily: "Menlo, Consolas, monospace", fontSize: 18 }}>0O 1lI | MRW-104</Paragraph>
        </Column>
      </>,
      {
        fonts: [
          ...FONTS,
          { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2", format: "woff2", weight: "200 800" },
          { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2", format: "woff2", weight: [200, 800], style: "italic" },
        ],
      }
    )
  ),

  /** Colours inherited and set: links in coloured text, spans, a menu's own colour, hover. */
  linksAndColors: screen((Root) =>
    shell(
      Root,
      "Links and colours",
      <>
        <Paragraph style={{ color: SEA, fontSize: 18, lineHeight: 1.45 }}>
          Sea-green text, a <Link href={`${SITE}/a`}>link with no colour of its own</Link>, and a{" "}
          <Link href={`${SITE}/b`} style={{ color: FUNNEL }} hover={{ color: HARBOUR, textDecoration: "none" }}>
            red link that turns dark on hover
          </Link>
          .
        </Paragraph>
        <Column style={{ color: BRASS, gap: 6, padding: [14, 16], backgroundColor: SWELL }}>
          <Paragraph>
            A column’s colour, inherited by its text,
            <LineBreak />
            <Span style={{ color: HARBOUR }}>overridden by a span</Span>, and <Span style={{ backgroundColor: LAMP }}>highlighted</Span>.
          </Paragraph>
          <Heading level={3} style={{ fontSize: 20, fontWeight: 600 }}>
            A heading in the column’s colour
          </Heading>
        </Column>
        <Menu
          items={[
            { text: "Timetable", href: `${SITE}/timetable` },
            { text: "Fares", href: `${SITE}/fares` },
            { text: "Help", href: `${SITE}/help` },
          ]}
          separator="·"
          style={{ color: FUNNEL, separatorColor: QUIET, justifyContent: "start", padding: [4, 8] }}
        />
        <Menu
          layout="vertical"
          items={[
            { text: "Down a column", href: `${SITE}/1` },
            { text: "Its second link", href: `${SITE}/2` },
          ]}
          style={{ color: SEA, justifyContent: "start" }}
        />
        <Social
          iconType="squared"
          size={24}
          icons={[
            { name: "Instagram", href: "https://instagram.com/merrowline" },
            { name: "LinkedIn", href: "https://linkedin.com/company/merrowline" },
          ]}
          style={{ justifyContent: "start", gap: 8 }}
        />
      </>
    )
  ),

  /** Shapes on a page: every Svg shape, with fills, strokes and opacity, drawing the MV Selkie. */
  pageShapes: {
    roots: "own",
    template: (
      <Page width={600} title="Merrow Line: shapes" fonts={FONTS} style={PAPER}>
        <Section style={{ padding: [28, 32, 36], gap: 16 }} mobile={{ padding: [20, 20, 28] }}>
          {masthead("Svg shapes on a page")}
          <Heading level={1} style={{ ...TITLE, fontSize: 34 }} mobile={{ fontSize: 28 }}>
            The MV Selkie, in six shapes
          </Heading>
          <Svg width={320} height={168} viewBox="0 0 320 168" title="A ferry with a red funnel on the waves, under a low sun, drawn in six kinds of shape">
            <Rect x={0} y={0} width={320} height={168} style={{ fill: SWELL }} />
            <Circle cx={254} cy={54} r={26} style={{ fill: FUNNEL, opacity: 0.85 }} />
            <Ellipse cx={92} cy={24} rx={24} ry={9} style={{ fill: "transparent", stroke: QUIET, strokeWidth: 2 }} />
            <Line x1={178} y1={30} x2={178} y2={82} style={{ stroke: HARBOUR, strokeWidth: 3 }} />
            <Rect x={78} y={44} width={22} height={40} style={{ fill: FUNNEL }} />
            <Rect x={62} y={80} width={150} height={24} rx={2} style={{ fill: CHALK, stroke: HARBOUR, strokeWidth: 2 }} />
            <Circle cx={84} cy={92} r={4} style={{ fill: HARBOUR }} />
            <Circle cx={104} cy={92} r={4} style={{ fill: HARBOUR }} />
            <Circle cx={124} cy={92} r={4} style={{ fill: HARBOUR }} />
            <Polygon points="32,104 280,104 258,136 54,136" style={{ fill: HARBOUR }} />
            <Path d="M0 144 Q40 132 80 144 T160 144 T240 144 T320 144" style={{ fill: "transparent", stroke: HARBOUR, strokeWidth: 2 }} />
            <Path d="M0 156 Q40 146 80 156 T160 156 T240 156 T320 156" style={{ fill: "transparent", stroke: QUIET, strokeWidth: 2 }} />
          </Svg>
        </Section>
      </Page>
    ),
  },

  /** A Document that runs to three pages: a header, a numbered footer, a page of its own, and a table with a footer row. */
  documentPages: {
    roots: "own",
    template: (
      <Document size="A5" margin={[44, 40]} title="Merrow Line: the master's log" fonts={FONTS} style={{ backgroundColor: "#FFFFFF", color: HARBOUR, fontFamily: SANS, fontSize: 13, lineHeight: 1.55 }}>
        <PageHeader style={{ padding: [0, 0, 8], border: { bottom: `1px solid ${HARBOUR}` } }}>
          <Row>
            <Column>
              <Paragraph style={{ fontWeight: 700 }}>Merrow Line</Paragraph>
            </Column>
            <Column>
              <Paragraph style={{ ...LABEL, fontSize: 10, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Paragraph>
            </Column>
          </Row>
        </PageHeader>
        <Column style={{ padding: [28, 0, 0], gap: 14 }}>
          <Heading level={1} style={{ ...TITLE, fontSize: 32, letterSpacing: -0.8 }}>
            The master’s log, part one
          </Heading>
          <Paragraph>This document has three pages. The header and the footer come back on each, and each says which page it’s on.</Paragraph>
          <Table style={{ cellPadding: [7, 0], rowBorder: LINE_RULE }}>
            <TableRow header style={{ fontWeight: 600 }}>
              <TableCell>Day</TableCell>
              <TableCell style={{ textAlign: "right" }}>Nautical miles</TableCell>
            </TableRow>
            {[
              ["Monday, Oban to Stornoway", "112"],
              ["Tuesday, Stornoway to Ullapool", "44"],
              ["Wednesday, Ullapool to Oban", "118"],
            ].map(([day, miles]) => (
              <TableRow key={day}>
                <TableCell>{day}</TableCell>
                <TableCell style={{ textAlign: "right", fontFamily: MONO, fontSize: 12, lineHeight: "20px" }}>{miles}</TableCell>
              </TableRow>
            ))}
            <TableRow footer>
              <TableCell style={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell style={{ textAlign: "right", fontFamily: MONO, fontSize: 12, lineHeight: "20px" }}>274</TableCell>
            </TableRow>
          </Table>
        </Column>
        <PageBreak />
        <Column style={{ padding: [28, 0, 0], gap: 14 }}>
          <Heading level={1} style={{ ...TITLE, fontSize: 32, letterSpacing: -0.8 }}>
            Part two
          </Heading>
          <Paragraph>
            After a PageBreak: this is page <PageNumber />. Fair weather, and a following sea past the Shiants.
          </Paragraph>
          <Paragraph style={{ color: QUIET }}>Forty-one sailings this month, and three of them late. The third was a matter of a dog, a gangway and an owner who wouldn’t be hurried.</Paragraph>
        </Column>
        <Document.Page style={{ backgroundColor: CHALK, gap: 14 }}>
          <Heading level={1} style={{ ...TITLE, fontSize: 32, letterSpacing: -0.8, padding: [28, 0, 0] }}>
            A page of its own
          </Heading>
          <Paragraph>With its own background, out to its edges.</Paragraph>
          <Image src={TIDE} alt="The tide drawn in blue lines under a low sun" style={{ width: "100%" }} />
        </Document.Page>
        <PageFooter style={{ padding: [8, 0, 0], border: { top: LINE_RULE } }}>
          <Paragraph style={{ fontFamily: MONO, fontSize: 9, color: QUIET, textAlign: "center" }}>
            Printed from Elements · <PageNumber /> / <PageNumber total />
          </Paragraph>
        </PageFooter>
      </Document>
    ),
  },

  /** A Canvas with text over shapes, laid out by padding, gap and justifyContent. */
  canvasShapes: {
    roots: "own",
    template: (
      <Canvas width={600} height={315} title="Merrow Line: summer timetable" fonts={FONTS} style={{ backgroundColor: HARBOUR, color: CHALK, fontFamily: SANS, padding: 36, justifyContent: "space-between" }}>
        <Column style={{ gap: 10 }}>
          <Paragraph style={{ ...LABEL, color: "#A7B4BA" }}>Summer timetable, out now</Paragraph>
          <Heading level={1} style={{ ...TITLE, fontSize: 52, letterSpacing: -1.4, lineHeight: 1.02 }}>
            Oban to Stornoway,
            <LineBreak />
            every morning.
          </Heading>
        </Column>
        <Row style={{ alignItems: "center", gap: 16 }}>
          <Svg width={120} height={40} viewBox="0 0 120 40" title="A small ferry under a low red sun">
            <Circle cx={100} cy={14} r={11} style={{ fill: FUNNEL }} />
            <Rect x={26} y={10} width={38} height={14} rx={1} style={{ fill: CHALK }} />
            <Polygon points="6,24 88,24 76,38 18,38" style={{ fill: "#A7B4BA" }} />
          </Svg>
          <Paragraph style={{ fontWeight: 600 }}>merrow.example</Paragraph>
        </Row>
      </Canvas>
    ),
  },
};
