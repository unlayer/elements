import { Button, Column, Email, Heading, Image, Text, Row, Section, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = {
  title: "Event invite",
  description: "A dark invitation with a full-width banner, the details at a glance and a schedule table.",
  root: "Email",
};

const details = [
  { label: "WHEN", value: "March 18, 2027" },
  { label: "WHERE", value: "Pier 27, San Francisco" },
  { label: "SEATS", value: "400, first come" },
];

export default function EventInvite() {
  return (
    <Email
      previewText="You're invited to Lumen Conf, March 18"
      style={{ backgroundColor: "#0b0b14", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#e5e7eb" }}
    >
      <Image
        src={{ src: "https://hyperelements.dev/img/event-hero.png", width: 1200, height: 600 }}
        alt="Lumen Conf 2027: Build what's next."
      />
      <Section style={{ padding: [40, 32, 16, 32], gap: 16 }}>
        <Heading level={1} style={{ fontSize: 34, letterSpacing: -1, color: "#ffffff" }} mobile={{ fontSize: 26 }}>
          One day. Forty talks. Zero slide decks about synergy.
        </Heading>
        <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#9ca3af" }}>
          Lumen Conf is a single-track day for people who build developer tools. You're on the early list.
        </Text>
      </Section>
      <Section style={{ padding: [8, 32] }}>
        <Row style={{ gap: 12 }}>
          {details.map((d) => (
            <Column key={d.label} style={{ backgroundColor: "#151523", border: "1px solid #26263a", borderRadius: 10, padding: 16, gap: 4 }}>
              <Text style={{ fontSize: 11, letterSpacing: 2, color: "#ef4638" }}>{d.label}</Text>
              <Text style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{d.value}</Text>
            </Column>
          ))}
        </Row>
      </Section>
      <Section style={{ padding: [24, 32], gap: 16 }}>
        <Heading level={2} style={{ fontSize: 18, color: "#ffffff" }}>Schedule</Heading>
        <Table style={{ cellPadding: [10, 0], rowBorder: "1px solid #26263a", fontSize: 14, color: "#d1d5db" }}>
          <TableRow header>
            <TableCell style={{ width: 90, color: "#9ca3af" }}>Time</TableCell>
            <TableCell style={{ color: "#9ca3af" }}>Session</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>09:30</TableCell>
            <TableCell>Doors, coffee, badge pickup</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10:00</TableCell>
            <TableCell>Keynote: the next ten years of developer tools</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>13:00</TableCell>
            <TableCell>Lightning talks, round one</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>18:00</TableCell>
            <TableCell>Demos and dinner on the pier</TableCell>
          </TableRow>
        </Table>
        <Button
          href="https://example.com/rsvp"
          style={{ backgroundColor: "#ef4638", borderRadius: 8, padding: [14, 28], fontWeight: 700, width: "100%" }}
          hover={{ backgroundColor: "#dc2f21" }}
        >
          Save my seat
        </Button>
      </Section>
      <Section style={{ padding: [8, 32, 40, 32] }}>
        <Text style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
          Lumen Conf · Pier 27, The Embarcadero, San Francisco
        </Text>
      </Section>
    </Email>
  );
}
