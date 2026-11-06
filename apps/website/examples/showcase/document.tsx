import { Column, Document, Heading, Image, Line, PageFooter, PageHeader, PageNumber, Text, Rect, Row, Svg, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = { title: "Growth report", root: "Document", component: "GrowthReport", file: "q3-growth-report.pdf" };

const kpis = [
  { label: "Annual recurring revenue", value: "$2.4M", delta: "+18% QoQ" },
  { label: "Active teams", value: "12,480", delta: "+9% QoQ" },
  { label: "Net retention", value: "127%", delta: "+4 pts" },
];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const revenue = [118, 131, 127, 149, 158, 171, 184, 192, 214];
const regions = [
  { name: "North America", revenue: "$1.21M", growth: "+16%" },
  { name: "Europe", revenue: "$0.74M", growth: "+22%" },
  { name: "Asia Pacific", revenue: "$0.33M", growth: "+31%" },
  { name: "Rest of world", revenue: "$0.12M", growth: "+12%" },
];

const W = 698;
const H = 170;
const bar = 46;
const step = W / months.length;

export default function GrowthReport() {
  return (
    <Document size="A4" margin={48} title="Q3 2026 growth report" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, color: "#0f172a", gap: 22 }}>
      <PageHeader style={{ padding: [0, 0, 14, 0], border: { bottom: "1px solid #e5e7eb" } }}>
        <Row style={{ alignItems: "center" }}>
          <Image src={{ src: "https://hyperelements.dev/img/orbit-logo.png", width: 252, height: 128 }} alt="Orbit" style={{ width: 66 }} />
          <Text style={{ textAlign: "right", fontSize: 10, color: "#94a3b8" }}>Q3 2026 · Board update · Confidential</Text>
        </Row>
      </PageHeader>
      <Column style={{ gap: 6 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#6d5efc" }}>QUARTERLY REPORT</Text>
        <Heading level={1} style={{ fontSize: 30, letterSpacing: -0.5 }}>Q3 growth report</Heading>
        <Text style={{ fontSize: 12, lineHeight: 1.6, color: "#475569" }}>
          Revenue grew for the ninth month in a row, led by Asia Pacific. Retention is the highest it has been since launch.
        </Text>
      </Column>
      <Row style={{ gap: 12 }}>
        {kpis.map((k) => (
          <Column key={k.label} style={{ backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 9, color: "#64748b" }}>{k.label}</Text>
            <Text style={{ fontSize: 22, fontWeight: 700 }}>{k.value}</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>{k.delta}</Text>
          </Column>
        ))}
      </Row>
      <Column style={{ gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: 700 }}>Monthly revenue ($K)</Text>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={f} x1={0} y1={H * f} x2={W} y2={H * f} style={{ stroke: "#eef0f4", strokeWidth: 1 }} />
          ))}
          {revenue.map((v, i) => {
            const h = (v / 220) * H;
            return (
              <Rect
                key={months[i]}
                x={i * step + (step - bar) / 2}
                y={H - h}
                width={bar}
                height={h}
                rx={4}
                style={{ fill: i === revenue.length - 1 ? "#ef4638" : "#8b7dff" }}
              />
            );
          })}
          <Line x1={0} y1={H} x2={W} y2={H} style={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
        </Svg>
        <Row>
          {months.map((m) => (
            <Text key={m} style={{ fontSize: 9, color: "#94a3b8", textAlign: "center" }}>{m}</Text>
          ))}
        </Row>
      </Column>
      <Table style={{ cellPadding: [7, 0], rowBorder: "1px solid #eef0f4", fontSize: 11 }}>
        <TableRow header>
          <TableCell>Region</TableCell>
          <TableCell style={{ textAlign: "right", width: 120 }}>Revenue</TableCell>
          <TableCell style={{ textAlign: "right", width: 90 }}>Growth</TableCell>
        </TableRow>
        {regions.map((r) => (
          <TableRow key={r.name}>
            <TableCell>{r.name}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{r.revenue}</TableCell>
            <TableCell style={{ textAlign: "right", color: "#16a34a" }}>{r.growth}</TableCell>
          </TableRow>
        ))}
      </Table>
      <PageFooter>
        <Row>
          <Text style={{ fontSize: 9, color: "#94a3b8" }}>Orbit Labs · orbit.dev</Text>
          <Text style={{ fontSize: 9, color: "#94a3b8", textAlign: "right" }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Row>
      </PageFooter>
    </Document>
  );
}
