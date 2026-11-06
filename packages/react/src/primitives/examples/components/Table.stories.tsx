/**
 * Fennick (a fictional coffee roaster in Leith) sends orders, roast lists and plans, all of them tables.
 *
 * Oat paper, espresso ink and one coffee-cherry red, for the column or word that matters. Bricolage
 * Grotesque for the words, and DM Mono for every number, so the columns of figures line up.
 */
import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, Image, LineBreak, Link, Row, Section, Span, Table, TableCell, TableRow, Text } from "../../index";
import { drawing } from "./kit-d";

const OAT = "#F4EEE4";
const CREMA = "#EAE1D1";
const ESPRESSO = "#221C17";
const QUIET = "#6D6256";
const RULE = "#DDD3C2";
const CHERRY = "#B3362B";
const CHERRY_WASH = "#F3E2D8";

const SANS = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Bricolage Grotesque", src: "https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGIInHWVyNJ.woff2", format: "woff2", weight: "200 800" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEYOtbYf-Vlg.woff2", format: "woff2", weight: 500 } as const,
];

const PAPER = { backgroundColor: OAT, color: ESPRESSO, fontFamily: SANS, fontSize: 16, lineHeight: 1.5 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const LINE = `1px solid ${RULE}`;
const FIGURE = { fontFamily: MONO, fontSize: 13, lineHeight: "22.5px", textAlign: "right" } as const;

const SITE = "https://fennick.example";

/** A table's title: smaller on phones, so it stays on one line. */
const title = (text: string) => (
  <Heading level={2} style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.6 }} mobile={{ fontSize: 25 }}>
    {text}
  </Heading>
);

const meta: Meta<Args> = {
  title: "Components/Table",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A table of data: a `Table` of `TableRow`s of `TableCell`s. Columns take their cells' widths, and the rest share what's left. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** The top of a letter: the roaster's name, and what this is about. */
const masthead = (right: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 10], border: { bottom: `1px solid ${ESPRESSO}` } }}>
    <Column>
      <Text style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>Fennick</Text>
    </Column>
    <Column>
      <Text style={{ ...CAPTION, textAlign: "right" }}>{right}</Text>
    </Column>
  </Row>
);

/** A `Table` of `TableRow`s of `TableCell`s: `header` on the first row, a cell's width sets its column's. */
export const Invoice = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 20 }}>
      {masthead("Order FN-3081")}
      <Table style={{ fontSize: 15, cellPadding: [12, 12], rowBorder: LINE }}>
        <TableRow header style={{ backgroundColor: CREMA, fontWeight: 600 }}>
          <TableCell>Item</TableCell>
          <TableCell style={{ width: 60, textAlign: "right" }}>Qty</TableCell>
          <TableCell style={{ width: 90, textAlign: "right" }}>Price</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Long Meadow, whole bean, 250 g</TableCell>
          <TableCell style={FIGURE}>2</TableCell>
          <TableCell style={FIGURE}>£26.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Paper filters, a hundred</TableCell>
          <TableCell style={FIGURE}>1</TableCell>
          <TableCell style={FIGURE}>£6.50</TableCell>
        </TableRow>
        <TableRow footer style={{ fontWeight: 700 }}>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell style={{ ...FIGURE, fontSize: 15, fontWeight: 500 }}>£32.50</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

const ROASTS = [
  ["Long Meadow", "£13.00", "86", "In stock"],
  ["Black Tarn", "£14.50", "88", "In stock"],
  ["Second Mile", "£12.00", "84", "Low stock"],
  ["Low Field", "£16.00", "91", "Sold out"],
];

/** Stripes are a background on every other `TableRow`, and a header row is one more color. */
export const StripedRows = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      {title("On the roaster this week")}
      <Table style={{ fontSize: 14, cellPadding: [12, 8], border: `1px solid ${ESPRESSO}` }}>
        <TableRow header style={{ backgroundColor: ESPRESSO, color: OAT }}>
          <TableCell>Coffee</TableCell>
          <TableCell style={{ width: 66 }}>250 g</TableCell>
          <TableCell style={{ width: 60 }}>Score</TableCell>
          <TableCell style={{ width: 84 }}>Stock</TableCell>
        </TableRow>
        {ROASTS.map(([name, price, score, stock], index) => (
          <TableRow key={name} style={index % 2 ? { backgroundColor: CREMA } : undefined}>
            <TableCell>{name}</TableCell>
            <TableCell style={{ fontFamily: MONO, fontSize: 13 }}>{price}</TableCell>
            <TableCell style={{ fontFamily: MONO, fontSize: 13 }}>{score}</TableCell>
            <TableCell style={stock === "Sold out" ? { color: CHERRY, fontWeight: 600 } : undefined}>{stock}</TableCell>
          </TableRow>
        ))}
      </Table>
    </Section>
  </Root>
));

const PLANS = [
  ["Bags a month", "1", "3"],
  ["Grind", "Whole bean", "Ground to order"],
  ["Delivery", "£3.50", "Free"],
];

/** Plans side by side: a cell can span columns (`colSpan`) and have a color of its own. */
export const PlanComparison = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      {title("Two ways to never run out")}
      <Table style={{ fontSize: 15, cellPadding: [12, 12], rowBorder: LINE, textAlign: "center" }}>
        <TableRow header style={{ fontWeight: 600 }}>
          <TableCell style={{ ...CAPTION, textAlign: "left", width: 150 }}>A month</TableCell>
          <TableCell>Taster, £14</TableCell>
          <TableCell style={{ backgroundColor: CHERRY, color: "#FFFFFF" }}>Regular, £36</TableCell>
        </TableRow>
        {PLANS.map(([feature, taster, regular]) => (
          <TableRow key={feature}>
            <TableCell style={{ textAlign: "left", color: QUIET }}>{feature}</TableCell>
            <TableCell>{taster}</TableCell>
            <TableCell style={{ backgroundColor: CHERRY_WASH, fontWeight: 600 }}>{regular}</TableCell>
          </TableRow>
        ))}
        <TableRow footer>
          <TableCell colSpan={3} style={{ fontSize: 13, color: QUIET }}>
            Stop or skip any month. Prices include VAT.
          </TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

const CELL = `1px solid ${QUIET}`;

/** `border` goes around the table or a cell, `rowBorder` between its rows; `borderCollapse` is whether cells share theirs. */
export const Borders = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 14 }}>
      {title("How much, for how many")}
      <Text style={CAPTION}>borderCollapse: "collapse": cells share their borders</Text>
      <Table style={{ fontSize: 14, cellPadding: [10, 12], borderCollapse: "collapse" }}>
        <TableRow header style={{ fontWeight: 600 }}>
          <TableCell style={{ border: CELL }}>Filter, one cup</TableCell>
          <TableCell style={{ border: CELL }}>15 g to 250 ml</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ border: CELL }}>Filter, a pot</TableCell>
          <TableCell style={{ border: CELL }}>30 g to 500 ml</TableCell>
        </TableRow>
      </Table>
      <Text style={{ ...CAPTION, padding: [10, 0, 0] }}>borderCollapse: "separate": each cell draws its own</Text>
      <Table style={{ fontSize: 14, cellPadding: [10, 12], borderCollapse: "separate", border: `2px solid ${CHERRY}` }}>
        <TableRow header style={{ fontWeight: 600 }}>
          <TableCell style={{ border: LINE }}>Espresso, single</TableCell>
          <TableCell style={{ border: LINE }}>9 g to 18 g</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ border: LINE }}>Espresso, double</TableCell>
          <TableCell style={{ border: LINE }}>18 g to 36 g</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

/** A bag of coffee, drawn: kraft paper, a fold at the top, and a label in the roast's color. */
const bag = (label: string) =>
  drawing(64, 64, `<rect width="64" height="64" fill="${CREMA}"/><path d="M19 12h26l3 44H16z" fill="#C7A77F"/><path d="M19 12h26l.6 7H18.4z" fill="#A98B66"/><rect x="22" y="27" width="20" height="20" fill="${label}"/><rect x="26" y="32" width="12" height="2" fill="${OAT}"/><rect x="26" y="37" width="8" height="2" fill="${OAT}"/>`);

/** Cells hold images and links; `verticalAlign` is where they sit in the row's `height`. */
export const ImagesAndLinks = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 14 }}>
      {masthead("In your box this month")}
      <Table style={{ fontSize: 15, cellPadding: [10, 12], rowBorder: LINE }}>
        <TableRow style={{ height: 84 }}>
          <TableCell style={{ width: 72, verticalAlign: "middle" }}>
            <Image src={bag(CHERRY)} alt="A kraft bag of Long Meadow, with a cherry-red label" style={{ borderRadius: 2 }} />
          </TableCell>
          <TableCell style={{ verticalAlign: "middle" }}>
            <Span style={{ fontWeight: 700 }}>Long Meadow</Span>
            <LineBreak />
            <Link href={`${SITE}/long-meadow`} style={{ color: CHERRY }}>
              brew notes
            </Link>
          </TableCell>
          <TableCell style={{ ...FIGURE, width: 72, verticalAlign: "top" }}>£13.00</TableCell>
        </TableRow>
        <TableRow style={{ height: 84 }}>
          <TableCell style={{ verticalAlign: "middle" }}>
            <Image src={bag(ESPRESSO)} alt="A kraft bag of Black Tarn, with a near-black label" style={{ borderRadius: 2 }} />
          </TableCell>
          <TableCell style={{ verticalAlign: "middle" }}>
            <Span style={{ fontWeight: 700 }}>Black Tarn</Span>
            <LineBreak />
            <Link href={`${SITE}/black-tarn`} style={{ color: CHERRY }}>
              brew notes
            </Link>
          </TableCell>
          <TableCell style={{ ...FIGURE, verticalAlign: "bottom" }}>£14.50</TableCell>
        </TableRow>
      </Table>
      <Text style={CAPTION}>verticalAlign: one price at the top of its row, one at the bottom</Text>
    </Section>
  </Root>
));

const MONTHS = [
  ["September", "1,204"],
  ["October", "1,386"],
  ["November", "1,512"],
];

/** `mobile` has its text and its cells' padding on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      {title("Bags out of the door")}
      <Table style={{ fontSize: 16, rowBorder: LINE }} mobile={{ fontSize: 13 }}>
        <TableRow header style={{ fontWeight: 600 }}>
          <TableCell style={{ padding: [14, 16] }} mobile={{ padding: [6, 4] }}>
            Month
          </TableCell>
          <TableCell style={{ padding: [14, 16], textAlign: "right" }} mobile={{ padding: [6, 4] }}>
            Bags
          </TableCell>
        </TableRow>
        {MONTHS.map(([month, bags]) => (
          <TableRow key={month}>
            <TableCell style={{ padding: [14, 16] }} mobile={{ padding: [6, 4] }}>
              {month}
            </TableCell>
            <TableCell style={{ padding: [14, 16], textAlign: "right", fontFamily: MONO }} mobile={{ padding: [6, 4] }}>
              {bags}
            </TableCell>
          </TableRow>
        ))}
      </Table>
      <Text style={CAPTION}>on phones: fontSize 13, cells’ padding [6, 4]</Text>
    </Section>
  </Root>
));
