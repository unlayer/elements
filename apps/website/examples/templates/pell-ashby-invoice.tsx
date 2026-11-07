/**
 * Pell & Ashby (a fictional London architecture practice) invoices a client for a stage of work,
 * with the hours behind it on a second page.
 *
 * A printed page, so white paper, black ink and one bottle green, kept for the amount owed and
 * the charts. Newsreader for the words and every figure (its figures are tabular, so a column of
 * amounts lines up), Hanken Grotesk in small capitals for the labels. Everything hangs from four
 * columns: the dates, the addresses and the table's figures all start on them.
 */
import type { ReactNode } from "react";
import { Column, Document, Grid, Heading, LineBreak, PageFooter, PageNumber, Text, Rect, Row, Span, Svg, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = {
  title: "Pell & Ashby invoice",
  description: "An architecture practice's invoice, and the hours behind it as charts on its second page.",
  root: "Document",
};

const INK = "#1C1B19";
const QUIET = "#6B675F";
const RULE = "#DAD6CD";
const GREEN = "#24513D";
const SAGE = "#B9C7BC";

const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** A4 at 96 px to the inch, less the side margins: the width everything lays out in. */
const WIDTH = 665;
const GAP = 24;
/** Two of the four columns and the gap between them. */
const HALF = (WIDTH - GAP) / 2;

/** Small capitals in the sans: every label. */
const label = { fontFamily: SANS, fontSize: 9.5, fontWeight: 600, lineHeight: 1.4, letterSpacing: 1.1, textTransform: "uppercase", color: QUIET } as const;

/** A label over a value, the dates' and the addresses' unit. */
const field = (name: string, value: ReactNode, accent = false) => (
  <Column style={{ gap: 6 }}>
    <Text style={label}>{name}</Text>
    <Text style={{ fontSize: 14, lineHeight: 1.45, color: accent ? GREEN : INK, fontWeight: accent ? 600 : 400 }}>{value}</Text>
  </Column>
);

const hairline = (color = RULE) => `1px solid ${color}`;

/** A line of the invoice: what was done, a note under it, and its hours, rate and amount. */
const line = (what: string, note: string, hours: string, rate: string, amount: string) => (
  <TableRow>
    <TableCell style={{ padding: [10, 16, 11, 0], border: { bottom: hairline() } }}>
      {what}
      <LineBreak />
      <Span style={{ fontFamily: SANS, fontSize: 10.5, color: QUIET }}>{note}</Span>
    </TableCell>
    <TableCell style={{ width: 64, padding: [10, 0, 11], textAlign: "right", verticalAlign: "top", border: { bottom: hairline() } }}>{hours}</TableCell>
    <TableCell style={{ width: 72, padding: [10, 0, 11], textAlign: "right", verticalAlign: "top", border: { bottom: hairline() } }}>{rate}</TableCell>
    <TableCell style={{ width: 136, padding: [10, 0, 11], textAlign: "right", verticalAlign: "top", border: { bottom: hairline() } }}>{amount}</TableCell>
  </TableRow>
);

/** A line of the totals, under the hours and rate columns. */
const total = (name: string, amount: string, last = false) => (
  <TableRow>
    <TableCell />
    <TableCell colSpan={2} style={{ padding: last ? [12, 0, 1] : [8, 0], border: last ? { top: hairline(INK) } : undefined, verticalAlign: "bottom", fontSize: last ? 14 : 13.5, color: last ? INK : QUIET }}>
      {name}
    </TableCell>
    <TableCell style={{ padding: last ? [10, 0, 0] : [8, 0], border: last ? { top: hairline(INK) } : undefined, textAlign: "right", verticalAlign: "bottom", fontSize: last ? 26 : 14, lineHeight: last ? 1.1 : 1.45, letterSpacing: last ? -0.3 : 0, color: last ? GREEN : INK }}>
      {amount}
    </TableCell>
  </TableRow>
);

/** A section of the time summary: its label over a rule. */
const part = (name: string, children: ReactNode) => (
  <Column style={{ gap: 16 }}>
    <Text style={{ ...label, color: INK, padding: [0, 0, 8], border: { bottom: hairline(INK) } }}>{name}</Text>
    {children}
  </Column>
);

/** Hours by phase, as horizontal bars beside their names. */
const PHASES: Array<[string, number]> = [
  ["Technical design drawings", 64],
  ["Specification and schedules", 36],
  ["Structural coordination", 22],
  ["Planning conditions", 18],
  ["Site visits and minutes", 16],
];
const HOURS = 156;
const BAR = WIDTH - 196 - 96 - 2 * GAP;
const phase = ([name, hours]: [string, number]) => (
  <Row key={name} style={{ alignItems: "center", gap: GAP }}>
    <Column style={{ width: 196 }}>
      <Text style={{ fontSize: 13.5 }}>{name}</Text>
    </Column>
    <Svg width={BAR} height={10} title={`${hours} hours`}>
      <Rect width={Math.round((hours / 64) * BAR)} height={10} style={{ fill: hours === 64 ? GREEN : SAGE }} />
    </Svg>
    <Column style={{ width: 96 }}>
      <Text style={{ fontSize: 13.5, textAlign: "right" }}>
        {hours} h <Span style={{ color: QUIET }}>· {Math.round((hours / HOURS) * 100)}%</Span>
      </Text>
    </Column>
  </Row>
);

/** Hours by week, as columns over the weeks' Mondays: drawn in one Svg, its labels in a Grid of as many columns. */
const WEEKS: Array<[string, number]> = [
  ["31 Aug", 14],
  ["7 Sep", 18],
  ["14 Sep", 22],
  ["21 Sep", 20],
  ["28 Sep", 16],
  ["5 Oct", 12],
  ["12 Oct", 19],
  ["19 Oct", 21],
  ["26 Oct", 14],
];
const CHART = 120;
const slot = WIDTH / WEEKS.length;
const weeks = (
  <Column style={{ gap: 10 }}>
    <Svg width={WIDTH} height={CHART + 1} title="Hours by week, from 14 to 22">
      {WEEKS.map(([week, hours], i) => {
        const height = Math.round((hours / 22) * (CHART - 8));
        return <Rect key={week} x={Math.round(i * slot + slot / 2 - 18)} y={CHART - height} width={36} height={height} style={{ fill: hours === 22 ? GREEN : SAGE }} />;
      })}
      <Rect x={0} y={CHART} width={WIDTH} height={1} style={{ fill: INK }} />
    </Svg>
    <Grid columns={WEEKS.length} style={{ gap: 0 }}>
      {WEEKS.map(([week, hours]) => (
        <Text key={week} style={{ textAlign: "center", fontSize: 13.5, lineHeight: 1.35 }}>
          {hours} h
          <LineBreak />
          <Span style={{ fontFamily: SANS, fontSize: 10, color: QUIET }}>{week}</Span>
        </Text>
      ))}
    </Grid>
  </Column>
);

/** A row of the people table. */
const person = (name: string, role: string, hours: number) => (
  <TableRow>
    <TableCell style={{ width: HALF + GAP }}>{name}</TableCell>
    <TableCell style={{ color: QUIET }}>{role}</TableCell>
    <TableCell style={{ width: 64, textAlign: "right" }}>{hours} h</TableCell>
    <TableCell style={{ width: 64, textAlign: "right", color: QUIET }}>{Math.round((hours / HOURS) * 100)}%</TableCell>
  </TableRow>
);


export default function PellAshbyInvoice() {
  return (
    <Document
      size="A4"
      margin={[56, 64, 44, 64]}
      title="Invoice PA-0114, Pell & Ashby"
      lang="en-GB"
      fonts={[
        { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2", format: "woff2", weight: "200 800" },
        { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2", format: "woff2", weight: "200 800", style: "italic" },
        { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" },
      ]}
      style={{ backgroundColor: "#ffffff", color: INK, fontFamily: SERIF, fontSize: 14, lineHeight: 1.45 }}
    >
      <Document.Page style={{ gap: 40 }}>
        {/* Letterhead */}
        <Row style={{ alignItems: "start", gap: GAP }}>
          <Column style={{ gap: 4 }}>
            <Text style={{ fontSize: 25, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>Pell & Ashby</Text>
            <Text style={label}>Architects</Text>
          </Column>
          <Column>
            <Text style={{ fontFamily: SANS, fontSize: 10.5, lineHeight: 1.6, color: QUIET, textAlign: "right" }}>
              14 Calvert Mews, London E2 7LL
              <LineBreak />
              +44 20 7946 0321 · studio@pellashby.example
            </Text>
          </Column>
        </Row>

        {/* Title, and who it's to: the address starts on the third of four columns */}
        <Row style={{ alignItems: "end", gap: GAP }}>
          <Column style={{ gap: 12 }}>
            <Heading level={1} style={{ fontSize: 84, fontWeight: 300, lineHeight: 0.95, letterSpacing: -2.5 }}>
              Invoice
            </Heading>
            <Text style={{ fontSize: 18, fontStyle: "italic", color: QUIET, lineHeight: 1.35 }}>
              Hawthorn Lane House, Stage 4
              <LineBreak />1 September to 31 October 2026
            </Text>
          </Column>
          <Column style={{ width: HALF }}>
            {field(
              "Billed to",
              <>
                Clara Wendt, Wendt Family Trust
                <LineBreak />3 Hawthorn Lane, Saffron Walden CB11 4QE
              </>
            )}
          </Column>
        </Row>

        {/* The number, the dates and the amount, on the four columns */}
        <Grid columns={4} style={{ gap: GAP, padding: [12, 0, 0], border: { top: hairline(INK) } }}>
          {field("Invoice", "PA-0114")}
          {field("Issued", "4 November 2026")}
          {field("Due", "4 December 2026")}
          {field("Amount due", "£17,731.20", true)}
        </Grid>

        {/* The work, and what it comes to */}
        <Table style={{ fontSize: 14, lineHeight: 1.45 }}>
          <TableRow header>
            <TableCell style={{ ...label, padding: [0, 0, 8], border: { bottom: hairline(INK) } }}>Work</TableCell>
            <TableCell style={{ ...label, padding: [0, 0, 8], textAlign: "right", border: { bottom: hairline(INK) } }}>Hours</TableCell>
            <TableCell style={{ ...label, padding: [0, 0, 8], textAlign: "right", border: { bottom: hairline(INK) } }}>Rate</TableCell>
            <TableCell style={{ ...label, padding: [0, 0, 8], textAlign: "right", border: { bottom: hairline(INK) } }}>Amount</TableCell>
          </TableRow>
          {line("Technical design drawings", "Plans, sections and elevations at 1:50; key details at 1:5", "64", "£95", "6,080.00")}
          {line("Specification and schedules", "Doors, windows, finishes and ironmongery", "36", "£85", "3,060.00")}
          {line("Structural coordination", "With Hale Engineering: steel frame and foundations", "22", "£95", "2,090.00")}
          {line("Planning conditions", "Materials, landscaping and drainage: conditions 3, 5 and 9", "18", "£95", "1,710.00")}
          {line("Site visits and minutes", "Four visits, 2 September to 28 October", "16", "£95", "1,520.00")}
          {line("Expenses, at cost", "Printing and rail travel; receipts attached", "—", "—", "316.00")}
          {total("Subtotal", "14,776.00")}
          {total("VAT at 20%", "2,955.20")}
          {total("Total due", "£17,731.20", true)}
        </Table>

        {/* How to pay, on the same four columns */}
        <Grid columns={4} style={{ gap: GAP, padding: [12, 0, 0], border: { top: hairline(INK) } }}>
          {field("Pay by transfer", "Within 30 days, please")}
          {field("Account name", "Pell & Ashby Ltd")}
          {field("Sort code · Account", "20-45-77 · 63418820")}
          {field("Reference", "PA-0114")}
        </Grid>
      </Document.Page>

      <Document.Page style={{ gap: 36 }}>
        <Row style={{ alignItems: "end", gap: GAP, padding: [0, 0, 12], border: { bottom: hairline() } }}>
          <Column>
            <Text style={{ fontSize: 17, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1 }}>Pell & Ashby</Text>
          </Column>
          <Column>
            <Text style={{ ...label, textAlign: "right" }}>Invoice PA-0114 · Time summary</Text>
          </Column>
        </Row>

        <Column style={{ gap: 12 }}>
          <Heading level={2} style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.05, letterSpacing: -1.1 }}>
            Where the hours went
          </Heading>
          <Text style={{ fontSize: 17, fontStyle: "italic", lineHeight: 1.45, color: QUIET, maxWidth: 520 }}>
            Stage 4 took 156 hours between 1 September and 31 October. Here they are by phase, by week and by the people who worked them.
          </Text>
        </Column>

        {part("By phase", <Column style={{ gap: 14 }}>{PHASES.map(phase)}</Column>)}
        {part("By week", weeks)}
        {part(
          "By person",
          <Table style={{ fontSize: 14, lineHeight: 1.45, cellPadding: [9, 0], rowBorder: hairline() }}>
            {person("Ines Morrow", "Project architect", 74)}
            {person("Sam Okafor", "Architectural assistant", 34)}
            {person("Hannah Pell", "Director", 28)}
            {person("Oliver Ashby", "Director", 20)}
          </Table>
        )}

        <Text style={{ fontFamily: SANS, fontSize: 10.5, lineHeight: 1.6, color: QUIET, maxWidth: 480 }}>
          Hours are recorded to the quarter hour and rounded here, so the phases add up to the total. The full timesheet is yours on request.
        </Text>
      </Document.Page>

      <PageFooter style={{ padding: [12, 0, 0], border: { top: hairline() } }}>
        <Row style={{ gap: GAP }}>
          <Column>
            <Text style={{ fontFamily: SANS, fontSize: 9.5, color: QUIET }}>Pell & Ashby Architects Ltd · Registered in England and Wales, 09412873 · VAT GB 318 4471 02</Text>
          </Column>
          <Column style={{ width: 64 }}>
            <Text style={{ fontFamily: SANS, fontSize: 9.5, color: QUIET, textAlign: "right" }}>
              <PageNumber /> of <PageNumber total />
            </Text>
          </Column>
        </Row>
      </PageFooter>
    </Document>
  );
}
