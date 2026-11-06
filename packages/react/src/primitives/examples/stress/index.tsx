/**
 * What could fail: small templates that each push on one thing most likely to break (long words in
 * narrow columns, right-to-left text, merge tags everywhere, many columns on phones, hidden blocks,
 * nesting, tables, images, buttons, empty and optional props, emoji and CJK, pagination, shapes,
 * fonts, inherited colours). Storybook shows them under Stress, so its smoke test and the visual
 * baseline see every one; gallery.test.tsx renders every one in each root it's written for.
 *
 * Most are written for any root that shows on a screen, `(Root) => …`, and drawn as an Email and as
 * a Page. Between them they use every component in both.
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
  Text,
  Video,
} from "../../index";

/** A root that shows on a screen: an Email or a Page. */
export type ScreenRoot = typeof Email | typeof Page;
export type Stress = { roots: "screen"; template: (Root: ScreenRoot) => ReactElement } | { roots: "own"; template: ReactElement };

const INK = "#1F2328";
const QUIET = "#59636E";
const RULE = "#D1D9E0";
const WASH = "#F6F8FA";
const ACCENT = "#0969DA";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** A small PNG as a data URI (a 2 by 2 checker), so the tests and stories need no network. */
const CHECKER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAE0lEQVR4nGOQV9b49uMXAxADWQAucAaln1O+qAAAAABJRU5ErkJggg==";
const DRAWING = "gallery/saltworks/low-water.png";

const screen = (template: (Root: ScreenRoot) => ReactElement): Stress => ({ roots: "screen", template });

const shell = (Root: ScreenRoot, children: ReactNode, extra: Record<string, unknown> = {}) => (
  <Root width={600} title="Stress" style={{ backgroundColor: "#FFFFFF", color: INK, fontFamily: FONT, fontSize: 15, lineHeight: 1.5 }} {...extra}>
    <Section style={{ padding: [24, 24], gap: 16 }} mobile={{ padding: [16, 12] }}>
      {children}
    </Section>
  </Root>
);

const caption = (text: string) => <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: QUIET }}>{text}</Text>;

export const stress: Record<string, Stress> = {
  /** Words and links longer than their column: they break inside the column, never out of it. */
  longWords: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Long words in narrow columns")}
        <Row style={{ gap: 12 }}>
          <Column style={{ width: 120, padding: 8, backgroundColor: WASH }}>
            <Text>Donaudampfschifffahrtsgesellschaftskapitänswitwe</Text>
          </Column>
          <Column style={{ padding: 8, backgroundColor: WASH }}>
            <Paragraph>
              See{" "}
              <Link href="https://example.com/a/very/long/path/that/never/ends/with/a/query?utm_source=newsletter&utm_medium=email&utm_campaign=autumn" style={{ color: ACCENT }}>
                https://example.com/a/very/long/path/that/never/ends/with/a/query?utm_source=newsletter&amp;utm_campaign=autumn
              </Link>
            </Paragraph>
          </Column>
          <Column style={{ width: 90, padding: 8, backgroundColor: WASH }}>
            <Text style={{ fontFamily: "Menlo, monospace", fontSize: 12 }}>sk_test_51Habc0123456789XYZabcdefghijk</Text>
          </Column>
        </Row>
        <Heading level={2} style={{ fontSize: 30 }}>
          Pneumonoultramicroscopicsilicovolcanoconiosis
        </Heading>
      </>
    )
  ),

  /** A template written right to left, with a run of left-to-right text inside it. */
  rightToLeft: screen((Root) =>
    shell(
      Root,
      <>
        {caption("RTL")}
        <Heading level={2} style={{ fontSize: 26 }}>
          مرحباً بك في متجرنا
        </Heading>
        <Paragraph>
          شكراً لطلبك. سيصل طلبك رقم <Span style={{ fontWeight: 700 }}>10482</Span> يوم الاثنين.
        </Paragraph>
        <Paragraph dir="ltr">An English sentence inside an Arabic email, left to right.</Paragraph>
        <Row style={{ gap: 12 }}>
          <Column style={{ padding: 12, backgroundColor: WASH }}>
            <Text>العمود الأول</Text>
          </Column>
          <Column style={{ padding: 12, backgroundColor: WASH }}>
            <Text>העמודה השנייה</Text>
          </Column>
        </Row>
        <List type="number">
          <ListItem>نجهز الطلب</ListItem>
          <ListItem>نرسله إليك</ListItem>
        </List>
        <Button href="https://example.com/orders/10482" style={{ backgroundColor: ACCENT }}>
          تتبع الطلب
        </Button>
      </>,
      { dir: "rtl", lang: "ar" }
    )
  ),

  /** Merge tags in every place text goes: headings, paragraphs, buttons, links, cells, list items, a link's href. */
  mergeTags: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Merge tags everywhere")}
        <Heading level={2} style={{ fontSize: 24 }}>
          Hello, <MergeTag name="first_name" />
        </Heading>
        <Paragraph>
          Your plan, <Span style={{ fontWeight: 700 }}><MergeTag name="plan_name" /></Span>, renews on <MergeTag name="renewal_date" />.{" "}
          <Link href="{{manage_url}}" style={{ color: ACCENT }}>
            Manage it, <MergeTag name="first_name" />
          </Link>
          .
        </Paragraph>
        <Table style={{ cellPadding: [6, 8], rowBorder: `1px solid ${RULE}` }}>
          <TableRow header>
            <TableCell>Item</TableCell>
            <TableCell style={{ textAlign: "right" }}>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <MergeTag name="item_name" />
            </TableCell>
            <TableCell style={{ textAlign: "right" }}>
              <MergeTag name="item_price" />
            </TableCell>
          </TableRow>
        </Table>
        <List>
          <ListItem>
            Account: <MergeTag name="email" />
          </ListItem>
        </List>
        <Button href="{{checkout_url}}" style={{ backgroundColor: ACCENT }}>
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
      <>
        {caption("Five columns, stacked on phones")}
        <Row style={{ gap: 8 }}>
          {["One", "Two", "Three", "Four", "Five"].map((word) => (
            <Column key={word} style={{ padding: 10, backgroundColor: WASH }}>
              <Text style={{ textAlign: "center" }}>{word}</Text>
            </Column>
          ))}
        </Row>
        {caption("A Grid of four, side by side on phones")}
        <Grid columns={4} stackOnMobile={false} style={{ gap: 6 }}>
          {["12k", "3.4%", "£98", "41"].map((figure) => (
            <Column key={figure} style={{ padding: [10, 4], backgroundColor: WASH }}>
              <Text style={{ textAlign: "center", fontWeight: 700 }}>{figure}</Text>
            </Column>
          ))}
        </Grid>
        {caption("Three side by side on phones, one of them fixed")}
        <Row stackOnMobile={false} style={{ gap: 8 }}>
          <Column style={{ width: 64, padding: 8, backgroundColor: WASH }}>
            <Text>Fixed</Text>
          </Column>
          <Column style={{ padding: 8, backgroundColor: WASH }}>
            <Text>Shares what’s left</Text>
          </Column>
          <Column style={{ flex: 2, padding: 8, backgroundColor: WASH }}>
            <Text>Takes twice as much of it</Text>
          </Column>
        </Row>
      </>
    )
  ),

  /** Blocks shown on only one of desktop and phone: a band, a column, an image, a button, text. */
  hiddenBlocks: screen((Root) => (
    <Root width={600} title="Stress" style={{ color: INK, fontFamily: FONT, fontSize: 15 }}>
      <Section hidden={{ mobile: true }} style={{ backgroundColor: "#DDF4FF", padding: 16 }}>
        <Text>A band only desktops show</Text>
      </Section>
      <Section hidden={{ desktop: true }} style={{ backgroundColor: "#FFF8C5", padding: 16 }}>
        <Text>A band only phones show</Text>
      </Section>
      <Section style={{ padding: [16, 24], gap: 12 }}>
        <Row style={{ gap: 12 }}>
          <Column style={{ padding: 8, backgroundColor: WASH }}>
            <Text>Always here</Text>
          </Column>
          <Column hidden={{ mobile: true }} style={{ padding: 8, backgroundColor: WASH }}>
            <Text>Desktop’s column</Text>
          </Column>
          <Column hidden={{ desktop: true }} style={{ padding: 8, backgroundColor: WASH }}>
            <Text>Phone’s column</Text>
          </Column>
        </Row>
        <Image hidden={{ mobile: true }} src={{ src: DRAWING, width: 1200, height: 680 }} alt="The desktop's picture" style={{ width: "100%" }} />
        <Text hidden={{ desktop: true }}>Phones get these words instead of the picture.</Text>
        <Button hidden={{ desktop: true }} href="https://example.com/app" style={{ backgroundColor: ACCENT }} mobile={{ width: "100%" }}>
          Open the app
        </Button>
      </Section>
    </Root>
  )),

  /** Layout inside layout: a Row in a Column in a Row, a Grid in a Row, a Layer of an image and words. */
  nested: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Nested rows, grids and a layer")}
        <Row style={{ gap: 12, padding: 12, border: `1px solid ${RULE}` }}>
          <Column style={{ gap: 8 }}>
            <Text style={{ fontWeight: 700 }}>Outer column</Text>
            <Row stackOnMobile={false} style={{ gap: 8 }}>
              <Column style={{ padding: 8, backgroundColor: WASH }}>
                <Text>Inner A</Text>
              </Column>
              <Column style={{ padding: 8, backgroundColor: WASH }}>
                <Row stackOnMobile={false} style={{ gap: 4 }}>
                  <Column style={{ padding: 4, backgroundColor: "#FFFFFF" }}>
                    <Text style={{ fontSize: 12 }}>B1</Text>
                  </Column>
                  <Column style={{ padding: 4, backgroundColor: "#FFFFFF" }}>
                    <Text style={{ fontSize: 12 }}>B2</Text>
                  </Column>
                </Row>
              </Column>
            </Row>
          </Column>
          <Grid columns={2} style={{ gap: 6 }}>
            {["G1", "G2", "G3", "G4"].map((cell) => (
              <Column key={cell} style={{ padding: 8, backgroundColor: WASH }}>
                <Text>{cell}</Text>
              </Column>
            ))}
          </Grid>
        </Row>
        <Layer style={{ alignItems: "end" }}>
          <Image src={{ src: DRAWING, width: 1200, height: 680 }} alt="Tide lines" style={{ width: "100%" }} />
          <Column style={{ padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: 700, color: "#1F2BB5" }}>Words over the picture</Text>
          </Column>
        </Layer>
      </>
    )
  ),

  /** Tables: a header, a footer, a cell spanning columns, long cells, and each alignment. */
  tables: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Tables")}
        <Table style={{ cellPadding: [8, 10], rowBorder: `1px solid ${RULE}`, border: `1px solid ${RULE}` }}>
          <TableRow header style={{ backgroundColor: WASH }}>
            <TableCell>Left</TableCell>
            <TableCell style={{ textAlign: "center" }}>Centre</TableCell>
            <TableCell style={{ textAlign: "right", width: 90 }}>Right</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>A cell whose words run on for long enough to wrap onto three or four lines in a narrow column on a phone.</TableCell>
            <TableCell style={{ textAlign: "center", verticalAlign: "middle" }}>Middle</TableCell>
            <TableCell style={{ textAlign: "right", verticalAlign: "bottom" }}>£1,204.50</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
              Spans two columns
            </TableCell>
            <TableCell style={{ textAlign: "right", fontWeight: 700 }}>£1,204.50</TableCell>
          </TableRow>
          <TableRow footer style={{ color: QUIET }}>
            <TableCell colSpan={3} style={{ fontSize: 12 }}>
              A footer row, under everything.
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
      <>
        {caption("Images")}
        <Image src={{ src: DRAWING, width: 1200, height: 680 }} alt="Full width, with its size" style={{ width: "100%" }} />
        <Row stackOnMobile={false} style={{ gap: 12, alignItems: "center" }}>
          <Image src={CHECKER} alt="No size given, shown at 48 px" style={{ width: 48 }} />
          <Image src={{ src: CHECKER, width: 2, height: 2 }} alt="Its own size, 2 by 2" />
          <Link href="https://example.com/gallery">
            <Image src={{ src: DRAWING, width: 1200, height: 680 }} alt="A linked, rounded thumbnail" style={{ width: 120, borderRadius: 8 }} />
          </Link>
        </Row>
        <Image src={{ src: DRAWING, width: 1200, height: 680 }} alt="Centred on phones, at 50%" style={{ width: "50%", alignSelf: "end" }} mobile={{ width: "100%", alignSelf: "center" }} />
      </>
    )
  ),

  /** Buttons: a long label, full width, outlined, beside each other, placed, with hover colours. */
  buttons: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Buttons")}
        <Button href="https://example.com/long" style={{ backgroundColor: ACCENT }}>
          A button whose label is long enough to need a second line on a phone’s narrow screen
        </Button>
        <Button href="https://example.com/wide" style={{ width: "100%", backgroundColor: INK, padding: [14, 20] }} hover={{ backgroundColor: "#424A53" }}>
          Full width
        </Button>
        <Row stackOnMobile={false} style={{ gap: 8 }}>
          <Button href="https://example.com/yes" style={{ width: 120, backgroundColor: "#1A7F37" }}>
            Yes
          </Button>
          <Button href="https://example.com/no" style={{ width: 120, backgroundColor: "transparent", color: INK, border: `1px solid ${INK}` }} hover={{ backgroundColor: WASH }}>
            No thanks
          </Button>
        </Row>
        <Button href="https://example.com/end" style={{ alignSelf: "end", backgroundColor: ACCENT, borderRadius: 999 }} mobile={{ alignSelf: "center" }}>
          At the end, centred on phones
        </Button>
      </>
    )
  ),

  /** Everything with as little as it takes: no styles, only required props, empty boxes. */
  emptyAndOptional: screen((Root) => (
    <Root>
      <Section>
        <Column />
        <Text>Text with no style.</Text>
        <Paragraph>A paragraph.</Paragraph>
        <Heading>A heading of no level given.</Heading>
        <Divider />
        <Button href="https://example.com">A button</Button>
        <List>
          <ListItem>One item</ListItem>
        </List>
        <Table>
          <TableRow>
            <TableCell>One cell</TableCell>
          </TableRow>
        </Table>
        <Menu items={[{ text: "Only link", href: "https://example.com" }]} />
        <Social icons={[{ name: "Instagram", href: "https://instagram.com/example" }]} />
        <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={{ src: DRAWING, width: 1200, height: 680 }} />
        <Html html="<p style='margin:0'>Markup, written as it is.</p>" text="Markup, written as it is." />
        <Image src={CHECKER} alt="" />
        <Row>
          <Column>
            <Text>One column in a row.</Text>
          </Column>
        </Row>
        <Grid>
          <Text>Grid cell one.</Text>
          <Text>Grid cell two.</Text>
        </Grid>
      </Section>
    </Root>
  )),

  /** Emoji and the scripts of Chinese, Japanese and Korean, in headings, text, buttons and cells. */
  emojiAndCjk: screen((Root) =>
    shell(
      Root,
      <>
        {caption("Emoji and CJK")}
        <Heading level={2} style={{ fontSize: 26 }}>
          🎉 秋のセール、始まりました
        </Heading>
        <Paragraph>
          欢迎光临！您的订单已发货。 주문해 주셔서 감사합니다. Party time 🥳🍰 with a family 👨‍👩‍👧 and flags 🇯🇵🇰🇷.
        </Paragraph>
        <Table style={{ cellPadding: [6, 8], rowBorder: `1px solid ${RULE}` }}>
          <TableRow>
            <TableCell>抹茶ラテ</TableCell>
            <TableCell style={{ textAlign: "right" }}>¥580</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>김치찌개 🌶️</TableCell>
            <TableCell style={{ textAlign: "right" }}>₩9,000</TableCell>
          </TableRow>
        </Table>
        <Button href="https://example.com/sale" style={{ backgroundColor: "#CF222E" }}>
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
      <>
        {caption("Fonts and their fallbacks")}
        <Text style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 22 }}>A web font, Newsreader, with Georgia behind it.</Text>
        <Text style={{ fontFamily: "'Not A Real Font', 'Also Missing', Georgia, serif", fontSize: 18 }}>A family nobody has: Georgia shows instead.</Text>
        <Text style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 18, fontWeight: 700, fontStyle: "italic" }}>Bold italic, from the variable font’s range.</Text>
        <Text style={{ fontFamily: "Menlo, Consolas, monospace", fontSize: 14 }}>Monospace: 0O 1lI |</Text>
      </>,
      {
        fonts: [
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
      <>
        {caption("Links and colours, inherited and set")}
        <Paragraph style={{ color: "#8250DF" }}>
          Purple text, a <Link href="https://example.com/a">link with no colour of its own</Link>, and a{" "}
          <Link href="https://example.com/b" style={{ color: "#1A7F37" }} hover={{ color: "#CF222E", textDecoration: "none" }}>
            green link that turns red on hover
          </Link>
          .
        </Paragraph>
        <Column style={{ color: "#9A6700", gap: 6, padding: 12, backgroundColor: WASH }}>
          <Text>
            A column’s colour, inherited by its text,
            <LineBreak />
            <Span style={{ color: INK }}>overridden by a span</Span>, and{" "}
            <Span style={{ backgroundColor: "#FFF8C5" }}>highlighted</Span>.
          </Text>
          <Heading level={3} style={{ fontSize: 18 }}>
            A heading in the column’s colour
          </Heading>
        </Column>
        <Menu
          items={[
            { text: "Shop", href: "https://example.com/shop" },
            { text: "Journal", href: "https://example.com/journal" },
            { text: "Help", href: "https://example.com/help" },
          ]}
          separator="·"
          style={{ color: "#CF222E", separatorColor: RULE, justifyContent: "start", padding: [4, 8] }}
        />
        <Menu
          layout="vertical"
          items={[
            { text: "Down a column", href: "https://example.com/1" },
            { text: "Its second link", href: "https://example.com/2" },
          ]}
          style={{ color: ACCENT, justifyContent: "start" }}
        />
        <Social
          iconType="squared"
          size={24}
          icons={[
            { name: "Instagram", href: "https://instagram.com/example" },
            { name: "LinkedIn", href: "https://linkedin.com/company/example" },
          ]}
          style={{ justifyContent: "start", gap: 8 }}
        />
      </>
    )
  ),

  /** Shapes on a page: every Svg shape, with fills, strokes and opacity. */
  pageShapes: {
    roots: "own",
    template: (
      <Page width={600} title="Stress: shapes" style={{ fontFamily: FONT, color: INK }}>
        <Section style={{ padding: 24, gap: 12 }}>
          {caption("Svg shapes on a page")}
          <Svg width={320} height={100} viewBox="0 0 320 100" title="Six shapes">
            <Rect x={0} y={10} width={60} height={80} rx={8} style={{ fill: ACCENT }} />
            <Circle cx={100} cy={50} r={36} style={{ fill: "#1A7F37", opacity: 0.8 }} />
            <Ellipse cx={180} cy={50} rx={36} ry={22} style={{ fill: "transparent", stroke: "#CF222E", strokeWidth: 4 }} />
            <Line x1={226} y1={90} x2={256} y2={10} style={{ stroke: INK, strokeWidth: 3 }} />
            <Polygon points="262,90 290,10 318,90" style={{ fill: "#9A6700" }} />
            <Path d="M0 98 Q160 70 320 98" style={{ fill: "transparent", stroke: QUIET, strokeWidth: 2 }} />
          </Svg>
        </Section>
      </Page>
    ),
  },

  /** A Document that runs to three pages: a header, a numbered footer, a page of its own, and a table with a footer row. */
  documentPages: {
    roots: "own",
    template: (
      <Document size="A5" margin={[40, 40]} title="Stress: pages" style={{ fontFamily: FONT, fontSize: 12, lineHeight: 1.5, color: INK }}>
        <PageHeader style={{ padding: [0, 0, 8], border: { bottom: `1px solid ${RULE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontWeight: 700 }}>Field notes</Text>
            </Column>
            <Column>
              <Text style={{ textAlign: "right", color: QUIET }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageHeader>
        <Heading level={1} style={{ fontSize: 22 }}>
          Chapter one
        </Heading>
        <Paragraph>This document has three pages. The header and the footer come back on each, and each says which page it’s on.</Paragraph>
        <Table style={{ cellPadding: [4, 6], rowBorder: `1px solid ${RULE}` }}>
          <TableRow header>
            <TableCell>Day</TableCell>
            <TableCell style={{ textAlign: "right" }}>Miles</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Monday</TableCell>
            <TableCell style={{ textAlign: "right" }}>12</TableCell>
          </TableRow>
          <TableRow footer>
            <TableCell style={{ fontWeight: 700 }}>Total</TableCell>
            <TableCell style={{ textAlign: "right", fontWeight: 700 }}>12</TableCell>
          </TableRow>
        </Table>
        <PageBreak />
        <Heading level={1} style={{ fontSize: 22 }}>
          Chapter two
        </Heading>
        <Paragraph>
          After a PageBreak: this is page <PageNumber />.
        </Paragraph>
        <Document.Page style={{ backgroundColor: WASH, gap: 8 }}>
          <Heading level={1} style={{ fontSize: 22 }}>
            A page of its own
          </Heading>
          <Paragraph>With its own background, out to its edges.</Paragraph>
        </Document.Page>
        <PageFooter style={{ padding: [8, 0, 0], border: { top: `1px solid ${RULE}` } }}>
          <Text style={{ fontSize: 10, color: QUIET, textAlign: "center" }}>
            Printed from Elements · <PageNumber /> / <PageNumber total />
          </Text>
        </PageFooter>
      </Document>
    ),
  },

  /** A Canvas with text over shapes, laid out by padding, gap and justifyContent. */
  canvasShapes: {
    roots: "own",
    template: (
      <Canvas width={600} height={315} title="Stress: canvas" style={{ backgroundColor: "#0D1117", color: "#F0F6FC", fontFamily: FONT, padding: 32, justifyContent: "space-between" }}>
        <Column style={{ gap: 8 }}>
          <Heading level={1} style={{ fontSize: 34, lineHeight: 1.1 }}>
            Words and shapes, in an image
          </Heading>
          <Text style={{ color: "#9198A1" }}>A Canvas lays its children out as a page does.</Text>
        </Column>
        <Row style={{ alignItems: "center", gap: 16 }}>
          <Svg width={120} height={40} viewBox="0 0 120 40" title="Three marks">
            <Circle cx={20} cy={20} r={16} style={{ fill: "#3FB950" }} />
            <Rect x={44} y={4} width={32} height={32} rx={6} style={{ fill: "#D29922" }} />
            <Polygon points="88,36 104,4 120,36" style={{ fill: "#F85149" }} />
          </Svg>
          <Text style={{ fontWeight: 700 }}>example.com</Text>
        </Row>
      </Canvas>
    ),
  },
};
