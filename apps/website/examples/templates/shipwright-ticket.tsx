/**
 * Shipwright (a fictional one-day conference on developer tools) sends an attendee their ticket, as
 * a PDF to print or show at the door.
 *
 * The ticket is the top of the page: a deep indigo panel with the event, the date and the venue, and
 * a coral stub with who it's for and a code to scan, the way a printed ticket tears off. Under it,
 * what an attendee looks for on the day: the schedule, how to get there, and what to bring. Space
 * Grotesk for the words, JetBrains Mono for times, codes and labels.
 */
import { Column, Document, Grid, Heading, List, ListItem, PageFooter, Path, Rect, Row, Span, Svg, Table, TableCell, TableRow, Text } from "@hyper-elements/react";

export const meta = {
  title: "Shipwright conference ticket",
  description: "A conference e-ticket as a PDF: the ticket with a code to scan, then the day's schedule and how to get there.",
  root: "Document",
};

const INDIGO = "#1B1640";
const CORAL = "#FF6B4A";
const MINT = "#7CF0C4";
const INK = "#16141F";
const QUIET = "#6A6678";
const RULE = "#E4E2EA";
const WHITE = "#FFFFFF";

const SANS = "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', Menlo, Consolas, monospace";

const TICKET = "SW26-0418-K";

/** Small capitals in the mono: every label. */
const label = { fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: 1.4, textTransform: "uppercase", lineHeight: 1.4 } as const;

/** A label over a value, on the ticket. */
const field = (name: string, value: string, color: string) => (
  <Column style={{ gap: 4 }}>
    <Text style={{ ...label, color }}>{name}</Text>
    <Text style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{value}</Text>
  </Column>
);

/**
 * A stand-in for the ticket's code: a 25 by 25 grid with the three corner squares a scanner finds,
 * filled from the ticket number so it's the same every time. Give it your real QR code (as an Svg
 * or an Image) instead.
 */
const SIZE = 25;
const finder = (x: number, y: number) => (cx: number, cy: number) => {
  const dx = cx - x;
  const dy = cy - y;
  if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
  return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
};
const finders = [finder(0, 0), finder(SIZE - 7, 0), finder(0, SIZE - 7)];
const seed = [...TICKET].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const dark = (x: number, y: number) => {
  for (const f of finders) {
    const on = f(x, y);
    if (on !== null) return on;
  }
  // The quiet ring around each corner square stays light.
  if ((x <= 7 && y <= 7) || (x >= SIZE - 8 && y <= 7) || (x <= 7 && y >= SIZE - 8)) return false;
  return ((x * 73856093) ^ (y * 19349663) ^ seed) % 7 < 3;
};
const CODE = Array.from({ length: SIZE * SIZE }, (_, i) => [i % SIZE, Math.floor(i / SIZE)])
  .filter(([x, y]) => dark(x, y))
  .map(([x, y]) => `M${x} ${y}h1v1h-1z`)
  .join("");

/** The day, in order: when, what, and where. */
const DAY: Array<[string, string, string]> = [
  ["08:30", "Doors, badges and coffee", "Hall"],
  ["09:30", "Opening keynote: the tools we wish we had", "Main stage"],
  ["10:30", "Shipping a CLI people actually enjoy", "Main stage"],
  ["11:30", "Workshop: your first language server", "Room B"],
  ["13:00", "Lunch on the terrace", "Terrace"],
  ["14:00", "Lightning talks", "Main stage"],
  ["16:30", "Closing panel, then drinks", "Main stage"],
];

export default function ShipwrightTicket() {
  return (
    <Document
      size="A4"
      margin={[48, 56, 40, 56]}
      title={`Shipwright Conf 2026, ticket ${TICKET}`}
      lang="en"
      fonts={[
        { family: "Space Grotesk", src: "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2", format: "woff2", weight: "300 700" },
        { family: "JetBrains Mono", src: "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwgknk-4.woff2", format: "woff2", weight: "400 700" },
      ]}
      style={{ backgroundColor: WHITE, color: INK, fontFamily: SANS, fontSize: 13, lineHeight: 1.5, gap: 36 }}
    >
      {/* The ticket: the event on the left, who it's for and the code on the stub. */}
      <Row style={{ borderRadius: 16, overflow: "hidden", alignItems: "stretch" }}>
        <Column style={{ backgroundColor: INDIGO, color: WHITE, padding: [28, 30], gap: 22 }}>
          <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ flex: "none", fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>SHIPWRIGHT</Text>
            <Text style={{ flex: "none", ...label, color: INDIGO, backgroundColor: MINT, padding: [4, 10], borderRadius: 999 }}>Admit one</Text>
          </Row>
          <Column style={{ gap: 8 }}>
            <Heading level={1} style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1 }}>
              Shipwright Conf 2026
            </Heading>
            <Text style={{ fontSize: 14, lineHeight: 1.45, color: "#CFCBE6" }}>A day of talks on the tools developers build for each other.</Text>
          </Column>
          <Grid columns={3} style={{ gap: 16 }}>
            {field("Date", "Thu 12 March", MINT)}
            {field("Doors", "08:30 WET", MINT)}
            {field("Venue", "Armazém 16", MINT)}
          </Grid>
        </Column>
        <Column style={{ width: 200, backgroundColor: CORAL, color: INDIGO, padding: [28, 24], gap: 16, border: { left: `2px dashed ${INDIGO}` } }}>
          <Column style={{ gap: 4 }}>
            <Text style={label}>Attendee</Text>
            <Text style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>Ada Okafor</Text>
            <Text style={{ fontSize: 11.5, lineHeight: 1.3 }}>General admission</Text>
          </Column>
          <Svg width={148} height={148} viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} title={`The ticket's code, ${TICKET}, to scan at the door.`}>
            <Rect x={-2} y={-2} width={SIZE + 4} height={SIZE + 4} rx={1.5} style={{ fill: WHITE }} />
            <Path d={CODE} style={{ fill: INDIGO }} />
          </Svg>
          <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{TICKET}</Text>
        </Column>
      </Row>

      {/* The day. */}
      <Column style={{ gap: 12 }}>
        <Text style={{ ...label, color: QUIET }}>Your day</Text>
        <Table style={{ rowBorder: `1px solid ${RULE}`, cellPadding: [9, 0] }}>
          {DAY.map(([time, what, where]) => (
            <TableRow key={time}>
              <TableCell style={{ width: 72, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: CORAL }}>{time}</TableCell>
              <TableCell style={{ fontSize: 13.5, fontWeight: 500 }}>{what}</TableCell>
              <TableCell style={{ width: 110, textAlign: "right", fontFamily: MONO, fontSize: 11, color: QUIET }}>{where}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Column>

      {/* Getting there, and what to bring. */}
      <Row style={{ gap: 28, alignItems: "start" }}>
        <Column style={{ gap: 10, backgroundColor: "#F6F5FA", padding: [18, 20], borderRadius: 12 }}>
          <Text style={{ ...label, color: QUIET }}>Getting there</Text>
          <Text style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>
            Armazém 16
            <Span style={{ fontWeight: 400, color: QUIET }}> · Rua Pereira Henriques 16, 1950-242 Lisbon</Span>
          </Text>
          <Text style={{ fontSize: 12.5, lineHeight: 1.5, color: QUIET }}>
            Metro to Cais do Sodré, then the 15E tram to Pavilhão. Two minutes' walk from the stop, by the river.
          </Text>
        </Column>
        <Column style={{ gap: 10, padding: [18, 0] }}>
          <Text style={{ ...label, color: QUIET }}>Good to know</Text>
          <List style={{ gap: 6, fontSize: 12.5, lineHeight: 1.45, indent: 16 }}>
            <ListItem>Show this ticket on your phone or printed.</ListItem>
            <ListItem>Bring photo ID that matches the name above.</ListItem>
            <ListItem>Talks are recorded; slides follow next day.</ListItem>
            <ListItem>Wi-Fi: Shipwright, password buildtools.</ListItem>
          </List>
        </Column>
      </Row>

      <PageFooter style={{ padding: [12, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        <Row style={{ gap: 16 }}>
          <Text style={{ fontSize: 10, color: QUIET }}>Shipwright Conf · shipwright.example · hello@shipwright.example</Text>
          <Text style={{ width: 120, textAlign: "right", fontFamily: MONO, fontSize: 10, color: QUIET }}>{TICKET}</Text>
        </Row>
      </PageFooter>
    </Document>
  );
}
