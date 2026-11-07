import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Column, Document, Grid, Heading, LineBreak, List, ListItem, PageBreak, PageFooter, PageHeader, PageNumber, Text, Path, render, Row, Span, Svg, type EmailProps } from "../index";
import { LiveEditor } from "../../stories/LiveEditor";
import { code } from "../../stories/SideBySide";

const meta: Meta = {
  title: "Document",
  parameters: {
    docs: {
      description: {
        component:
          "A `<Document>` rendered to print HTML: each page a box of the paper's size, its header and footer on each, numbered. Print it (or save it as PDF) from the frame; `@hyper-elements/react/pdf` writes the same pages as a PDF without a browser. The bindery, Kettlestitch, is fictional.",
      },
    },
  },
};
export default meta;

/** A Document's print HTML in a frame as tall as its pages. */
const printed = (template: ReactElement): StoryObj => ({
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => (
    <>
      <iframe
        title="Print HTML"
        srcDoc={loaded.html as string}
        style={{ width: "100%", height: 1400, border: 0 }}
        onLoad={(event) => {
          const frame = event.currentTarget;
          frame.style.height = `${frame.contentDocument?.body.offsetHeight ?? 1400}px`;
        }}
      />
      <LiveEditor template={template} width="desktop" />
    </>
  ),
});

// Kettlestitch, a fictional bindery and small press in Leith: a book printer's manners, Caslon on white, small capitals
// in Franklin, and the oxblood of its bookcloth.
const INK = "#211C17";
const QUIET = "#6F675C";
const RULE = "#DDD5C8";
const CREAM = "#F7F2E8";
const OXBLOOD = "#7E2A20";

const SERIF = "'Libre Caslon Text', Baskerville, 'Times New Roman', serif";
const SANS = "'Libre Franklin', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONTS = [
  { family: "Libre Caslon Text", src: "https://fonts.gstatic.com/s/librecaslontext/v5/DdT878IGsGw1aF1JU10PUbTvNNaDMfq41-JJHRO0.woff2", format: "woff2", weight: 400 },
  { family: "Libre Caslon Text", src: "https://fonts.gstatic.com/s/librecaslontext/v5/DdT678IGsGw1aF1JU10PUbTvNNaDMfq95-BDGjG2u9s.woff2", format: "woff2", weight: 400, style: "italic" },
  { family: "Libre Caslon Text", src: "https://fonts.gstatic.com/s/librecaslontext/v5/DdT578IGsGw1aF1JU10PUbTvNNaDMfID8vdkPx6esdPs.woff2", format: "woff2", weight: 700 },
  { family: "Libre Franklin", src: "https://fonts.gstatic.com/s/librefranklin/v20/jizDREVItHgc8qDIbSTKq4XkRiUf2zcZiVbJ.woff2", format: "woff2", weight: "100 900" },
] satisfies NonNullable<EmailProps["fonts"]>;

/** The type every page starts from. */
const TYPE = { backgroundColor: "#ffffff", fontFamily: SERIF, fontSize: 13, lineHeight: 1.6, color: INK } as const;
/** Small capitals in the sans: labels, running heads, folios. */
const caps = { fontFamily: SANS, fontSize: 9, fontWeight: 600, lineHeight: 1.5, letterSpacing: 1.5, textTransform: "uppercase", color: QUIET } as const;

/** The bindery's mark: a line of the stitch it's named for. */
const stitch = (color: string = OXBLOOD) => (
  <Svg width={60} height={10} viewBox="0 0 60 10" title="A line of stitching">
    <Path d="M0 5 L7.5 1 L15 9 L22.5 1 L30 9 L37.5 1 L45 9 L52.5 1 L60 5" style={{ fill: "transparent", stroke: color, strokeWidth: 1.2 }} />
  </Svg>
);

const line = (work: string, detail: string, amount: string) => (
  <Row key={work} style={{ gap: 24, padding: [11, 0], border: { bottom: `1px solid ${RULE}` } }}>
    <Column>
      <Text>
        {work}
        <Span style={{ fontStyle: "italic", color: QUIET }}>, {detail}</Span>
      </Text>
    </Column>
    <Column style={{ width: 110 }}>
      <Text style={{ textAlign: "right" }}>{amount}</Text>
    </Column>
  </Row>
);

const term = (name: string, words: string) => (
  <Row key={name} style={{ gap: 24 }}>
    <Column style={{ width: 120 }}>
      <Text style={{ ...caps, lineHeight: "21px" }}>{name}</Text>
    </Column>
    <Column>
      <Text>{words}</Text>
    </Column>
  </Row>
);

/** An invoice and its terms: two Letter pages, a header and a numbered footer on each. */
export const Invoice = printed(
  <Document size="Letter" margin={[56, 72]} title="Invoice 2705, Kettlestitch" fonts={FONTS} style={{ ...TYPE, fontSize: 14 }}>
    <PageHeader style={{ padding: [0, 0, 14], border: { bottom: `1px solid ${RULE}` } }}>
      <Row style={{ alignItems: "end" }}>
        <Column>
          <Text style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1 }}>Kettlestitch</Text>
        </Column>
        <Column>
          <Text style={{ ...caps, textAlign: "right" }}>Bindery &amp; small press · Leith</Text>
        </Column>
      </Row>
    </PageHeader>
    <Column style={{ alignItems: "center", textAlign: "center", gap: 14, padding: [72, 0, 60] }}>
      {stitch()}
      <Heading level={1} style={{ fontSize: 52, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.5 }}>
        Invoice
      </Heading>
      <Text style={{ fontStyle: "italic", color: QUIET }}>Number 2705, the first of November 2026</Text>
    </Column>
    <Row style={{ gap: 24, padding: [0, 0, 40] }}>
      <Column style={{ gap: 6 }}>
        <Text style={caps}>Billed to</Text>
        <Text>
          The Librarian, Fenwick Hall
          <LineBreak />
          12 Abbey Lane, Melrose TD6 9LG
        </Text>
      </Column>
      <Column style={{ gap: 6 }}>
        <Text style={caps}>For</Text>
        <Text>
          Rebinding the Fenwick parish registers,
          <LineBreak />
          forty-two volumes, 1742 to 1861
        </Text>
      </Column>
    </Row>
    <Column style={{ border: { top: `1px solid ${INK}` } }}>
      {line("Rebinding", "quarter calf, twelve volumes", "£1,440.00")}
      {line("Repairing spines", "linen, thirty volumes", "£900.00")}
      {line("Endpapers", "marbled to order", "£360.00")}
      <Row style={{ gap: 24, alignItems: "end", padding: [18, 0, 0] }}>
        <Column>
          <Text style={{ fontStyle: "italic" }}>Due by the first of December</Text>
        </Column>
        <Column style={{ width: 160 }}>
          <Text style={{ fontSize: 26, lineHeight: 1.1, textAlign: "right", color: OXBLOOD }}>£2,700.00</Text>
        </Column>
      </Row>
    </Column>
    <Column style={{ gap: 6, padding: [48, 0, 0] }}>
      <Text style={caps}>By transfer</Text>
      <Text>Kettlestitch Bindery Ltd, sort code 80-22-60, account 10482733, reference 2705</Text>
    </Column>
    <PageBreak />
    <Column style={{ alignItems: "center", textAlign: "center", gap: 14, padding: [72, 0, 52] }}>
      {stitch()}
      <Heading level={2} style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.1 }}>
        Terms
      </Heading>
    </Column>
    <Column style={{ gap: 20 }}>
      {term("Payment", "Within thirty days of this invoice, by transfer. Late payments carry interest at one per cent a month.")}
      {term("Materials", "Calf, linen and marbled paper are ordered for each job, and can’t be sent back once they’re cut.")}
      {term("Your books", "They stay insured in our care until you collect them, or until our carrier signs for them.")}
    </Column>
    <PageFooter style={{ padding: [14, 0, 0], border: { top: `1px solid ${RULE}` } }}>
      <Row style={{ alignItems: "center" }}>
        <Column>
          <Text style={caps}>Kettlestitch Bindery, 9 Timber Bush, Leith EH6 6QH</Text>
        </Column>
        <Column style={{ width: 90 }}>
          <Text style={{ ...caps, textAlign: "right" }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Column>
      </Row>
    </PageFooter>
  </Document>
);

/** A book's chapter opening, its number and title in the upper middle of the page; and a note of what the page shows. */
const chapter = (number: string, name: string, words: string, note: string) => (
  <Column style={{ alignItems: "center", textAlign: "center", gap: 14, padding: [150, 16, 0] }}>
    <Text style={{ fontSize: 44, lineHeight: 1, color: OXBLOOD }}>{number}</Text>
    <Heading level={1} style={{ fontSize: 26, fontStyle: "italic", fontWeight: 400, lineHeight: 1.25 }}>
      {name}
    </Heading>
    {stitch()}
    <Text style={{ fontSize: 14, padding: [10, 0, 0] }}>{words}</Text>
    <Text style={{ ...caps, padding: [28, 0, 0] }}>{note}</Text>
  </Column>
);

/** `PageBreak` ends a page where you say: what follows starts the next one. */
export const PageBreaks = printed(
  <Document size="A5" margin={40} title="Keeping a hand-bound book" fonts={FONTS} style={TYPE}>
    {chapter("i", "How to shelve it", "Upright, between books of its own height, and away from a south window.", "Ends at a PageBreak, whatever room is left")}
    <PageBreak />
    {chapter("ii", "How to open it", "Slowly, the first time, a few leaves at a time from each end towards the middle.", "Starts on a page of its own")}
    <PageBreak />
    {chapter("iii", "When to bring it back", "When a joint starts to lift, or a leaf comes loose. A small repair now saves a rebinding later.", "Starts on a page of its own, too")}
  </Document>
);

/** A figure of the report: large in the serif, over what it counts. */
const figure = (value: string, what: string) => (
  <Column key={what} style={{ gap: 4, padding: [10, 0, 0], border: { top: `1px solid ${RULE}` } }}>
    <Text style={{ fontSize: 26, lineHeight: 1.1, color: OXBLOOD }}>{value}</Text>
    <Text style={{ fontSize: 12, lineHeight: 1.4, color: QUIET }}>{what}</Text>
  </Column>
);

/** `PageHeader` and `PageFooter` are drawn on every page, inside its margins, each with a box of its own. */
export const HeadersAndFooters = printed(
  <Document size="A5" margin={32} title="The bindery's autumn report" fonts={FONTS} style={{ ...TYPE, gap: 14 }}>
    <PageHeader style={{ padding: [0, 0, 10], border: { bottom: `2px solid ${OXBLOOD}` } }}>
      <Row style={{ alignItems: "end" }}>
        <Column>
          <Text style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1 }}>Kettlestitch</Text>
        </Column>
        <Column>
          <Text style={{ ...caps, textAlign: "right", color: OXBLOOD }}>Autumn report</Text>
        </Column>
      </Row>
    </PageHeader>
    <Heading level={1} style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15, padding: [36, 0, 2] }}>
      The season so far
    </Heading>
    <Text>Orders grew by a fifth, most of them for family Bibles and parish registers. Repairs now outnumber new bindings for the first time, which suits the workshop well.</Text>
    <Grid columns={3} style={{ gap: 16, padding: [10, 0] }}>
      {figure("21%", "more orders than last autumn")}
      {figure("64", "books repaired, 41 bound new")}
      {figure("11", "weeks on the waiting list")}
    </Grid>
    <Text>The calf we buy from Northampton has gone up twice this year, and we’ve held our prices so far. We’ll look at them again in the spring.</Text>
    <PageBreak />
    <Heading level={1} style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15, padding: [36, 0, 2] }}>
      Next season
    </Heading>
    <Text>A second finisher starts in January, and the press takes on its first poetry pamphlet. The header and the footer come back on this page by themselves.</Text>
    <PageFooter style={{ padding: [10, 14], backgroundColor: CREAM }}>
      <Text style={{ ...caps, textAlign: "center" }}>Kettlestitch Bindery, 9 Timber Bush, Leith</Text>
    </PageFooter>
  </Document>
);

/** `PageNumber` is the number of the page it's on, and with `total` how many there are: in a header, a footer, or any text. */
export const PageNumbers = printed(
  <Document size="A5" margin={32} title="Coptic binding: course notes" fonts={FONTS} style={{ ...TYPE, gap: 14 }}>
    <PageHeader style={{ padding: [0, 0, 32] }}>
      <Text style={{ ...caps, textAlign: "right" }}>
        <PageNumber /> / <PageNumber total />
      </Text>
    </PageHeader>
    <Heading level={1} style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15 }}>
      Coptic binding: course notes
    </Heading>
    <Text>
      These notes run to <PageNumber total /> pages, and this is page <PageNumber />. Bring them to the first lesson, with what’s on the list below.
    </Text>
    <Text style={{ ...caps, padding: [10, 0, 0] }}>What to bring</Text>
    <List style={{ gap: 4, indent: 18 }}>
      <ListItem>A bone folder, and a curved needle</ListItem>
      <ListItem>Two boards, cut a little larger than your paper</ListItem>
      <ListItem>Ten sheets of paper you’re fond of</ListItem>
    </List>
    <PageBreak />
    <Heading level={2} style={{ fontSize: 24, fontStyle: "italic", fontWeight: 400, lineHeight: 1.25 }}>
      Sewing the first signature
    </Heading>
    <Text>
      This is page <PageNumber />, the last. Keep the thread taut, but not so taut that the paper tears at the stations.
    </Text>
    <List type="number" style={{ gap: 6, indent: 24 }}>
      <ListItem>Pierce four stations through the fold</ListItem>
      <ListItem>Sew out through the first, and catch the board</ListItem>
      <ListItem>Link back and carry on to the next station</ListItem>
    </List>
    <PageFooter>
      <Text style={{ ...caps, textAlign: "center" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

/** A title and its author in the catalogue. */
const title = (name: string, by: string, price: string) => (
  <Row key={name} style={{ gap: 16, padding: [0, 0, 12], border: { bottom: `1px solid ${RULE}` } }}>
    <Column>
      <Text style={{ fontStyle: "italic" }}>{name}</Text>
      <Text style={{ fontSize: 12, color: QUIET }}>{by}</Text>
    </Column>
    <Column style={{ width: 54 }}>
      <Text style={{ textAlign: "right" }}>{price}</Text>
    </Column>
  </Row>
);

/** `Document.Page` writes each page by itself, with its own background and spacing. */
export const PagesOneByOne = printed(
  <Document size="A5" margin={40} title="Spring catalogue" fonts={FONTS} style={TYPE}>
    <Document.Page style={{ backgroundColor: OXBLOOD, color: CREAM, textAlign: "center" }}>
      <Column style={{ height: 714, alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ ...caps, color: CREAM }}>Kettlestitch Press</Text>
        <Column style={{ alignItems: "center", gap: 18 }}>
          {stitch(CREAM)}
          <Heading level={1} style={{ fontSize: 46, fontWeight: 400, lineHeight: 1.1 }}>
            Spring
            <LineBreak />
            <Span style={{ fontStyle: "italic" }}>catalogue</Span>
          </Heading>
        </Column>
        <Text style={{ ...caps, color: CREAM }}>Leith, 2027</Text>
      </Column>
    </Document.Page>
    <Document.Page style={{ gap: 24 }}>
      <Heading level={2} style={{ fontSize: 30, fontStyle: "italic", fontWeight: 400, lineHeight: 1.2, padding: [40, 0, 0] }}>
        New this spring
      </Heading>
      <Text style={{ fontSize: 14 }}>A page of its own, with more space between what it holds. All three are sewn by hand in editions of two hundred.</Text>
      <Column style={{ gap: 12 }}>
        {title("The Salt Road", "Poems by Una Carmichael", "£18")}
        {title("A Tanner’s Year", "Essays by Rory Baillie", "£24")}
        {title("Forty Knots", "Drawn by Mairi Weir", "£32")}
      </Column>
    </Document.Page>
  </Document>
);

/** `size` and `orientation` are the paper's: A5 turned on its side, for a certificate. */
export const SizeAndOrientation = printed(
  <Document size="A5" orientation="landscape" margin={26} title="Certificate of completion" fonts={FONTS} style={{ ...TYPE, backgroundColor: CREAM }}>
    <Column style={{ height: 506, alignItems: "center", justifyContent: "center", gap: 14, padding: [0, 48], textAlign: "center", border: `1px solid ${OXBLOOD}` }}>
      {stitch()}
      <Text style={{ ...caps, fontSize: 10, color: OXBLOOD, letterSpacing: 2.4 }}>Certificate of completion</Text>
      <Heading level={1} style={{ fontSize: 42, fontStyle: "italic", fontWeight: 400, lineHeight: 1.2, padding: [6, 0] }}>
        Isla Drummond
      </Heading>
      <Text style={{ fontSize: 15, maxWidth: 420 }}>finished all twelve lessons of Coptic and long-stitch binding at the Kettlestitch workshop, and bound a book of her own.</Text>
      <Row style={{ gap: 64, padding: [28, 0, 0], maxWidth: 480 }}>
        <Column style={{ padding: [6, 0, 0], border: { top: `1px solid ${INK}` } }}>
          <Text style={caps}>Margit Sørlie, master binder</Text>
        </Column>
        <Column style={{ padding: [6, 0, 0], border: { top: `1px solid ${INK}` } }}>
          <Text style={caps}>Leith, 14 November 2026</Text>
        </Column>
      </Row>
    </Column>
  </Document>
);
