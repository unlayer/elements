import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Link,
  Text,
  Row,
  Section,
  Span,
  Table,
  TableCell,
  TableRow,
} from "@unlayer/react-elements";

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

const tableHeaders = ["Endpoint", "Calls", "Avg (ms)", "Errors"];
const tableRows = [
  ["/api/v2/users", "482,100", "32", "0.01%"],
  ["/api/v2/orders", "358,200", "45", "0.03%"],
  ["/api/v2/products", "241,800", "38", "0.00%"],
  ["/api/v2/search", "118,900", "89", "0.12%"],
];
const tableCell = { width: "25%", border: "1px solid #cccccc", verticalAlign: "middle" } as const;

export default function UsageReport(): ReactElement {
  return (
    <Email
      width={560}
      previewText="Your February usage report: 1.2M API calls, 99.97% uptime."
      style={{ backgroundColor: "#f8fafc", color: "#0f172a", fontFamily: sansFont }}
    >
      {/* Header */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 24, 0] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Column style={{ padding: 10, alignItems: "start" }}>
              <Image
                src={{
                  src: "https://placehold.co/100x24/6366f1/ffffff?text=PULSE",
                  width: 100,
                  height: 24,
                }}
                alt="Pulse"
                style={{ width: 100 }}
              />
            </Column>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text style={{ padding: 10, fontSize: 13, color: "#64748b", textAlign: "right", lineHeight: 1.5 }}>
              February 2026
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Title */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 24, fontWeight: 700, color: "#0f172a", textAlign: "left", lineHeight: 1.2 }}
        >
          Monthly Usage Report
        </Heading>
        <Text style={{ padding: 10, fontSize: 14, color: "#64748b", textAlign: "left", lineHeight: 1.6 }}>
          {"Here’s your summary for "}
          <Span style={{ fontWeight: 700 }}>Acme Corp</Span>
          {" — Pro Plan."}
        </Text>
      </Section>

      {/* Key Metrics */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 8, 0] }}>
        <Row>
          <Column style={{ width: "33.33%" }}>
            <Heading
              level={2}
              style={{
                padding: 10,
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              1.2M
            </Heading>
            <Text style={{ padding: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
              API Calls
            </Text>
            <Text style={{ padding: 10, fontSize: 11, color: "#22c55e", textAlign: "center", lineHeight: 1.5 }}>
              ↑ 18% vs Jan
            </Text>
          </Column>
          <Column style={{ width: "33.33%" }}>
            <Heading
              level={2}
              style={{
                padding: 10,
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              99.97%
            </Heading>
            <Text style={{ padding: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
              Uptime
            </Text>
            <Text style={{ padding: 10, fontSize: 11, color: "#22c55e", textAlign: "center", lineHeight: 1.5 }}>
              SLA: 99.9%
            </Text>
          </Column>
          <Column style={{ width: "33.33%" }}>
            <Heading
              level={2}
              style={{
                padding: 10,
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              48ms
            </Heading>
            <Text style={{ padding: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
              Avg Latency
            </Text>
            <Text style={{ padding: 10, fontSize: 11, color: "#22c55e", textAlign: "center", lineHeight: 1.5 }}>
              ↓ 12ms vs Jan
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Usage Breakdown */}
      <Section style={{ backgroundColor: "#ffffff", padding: [16, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #e2e8f0", padding: 10 }} />
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textAlign: "left",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          USAGE BY ENDPOINT
        </Heading>
        <Column style={{ padding: 10 }}>
          <Table style={{ fontSize: 14, lineHeight: 1.4, cellPadding: 10, borderCollapse: "collapse" }}>
            <TableRow header style={{ backgroundColor: "#dddddd" }}>
              {tableHeaders.map((text) => (
                <TableCell key={text} style={tableCell}>
                  {text}
                </TableCell>
              ))}
            </TableRow>
            {tableRows.map((row) => (
              <TableRow key={row[0]}>
                {row.map((text, i) => (
                  <TableCell key={i} style={tableCell}>
                    {text}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </Table>
        </Column>
      </Section>

      {/* Billing Summary */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #e2e8f0", padding: 10 }} />
        <Heading
          level={4}
          style={{
            padding: 10,
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textAlign: "left",
            lineHeight: 1,
            letterSpacing: "1px",
          }}
        >
          BILLING SUMMARY
        </Heading>
      </Section>

      <Section style={{ backgroundColor: "#ffffff" }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "left", lineHeight: 2 }}>
              Pro Plan (base)
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "left", lineHeight: 2 }}>
              API overage (200K calls)
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "left", lineHeight: 2 }}>
              <Span style={{ fontWeight: 700 }}>Total due Mar 1</Span>
            </Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "right", lineHeight: 2 }}>
              $299.00
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "right", lineHeight: 2 }}>
              $40.00
            </Text>
            <Text style={{ padding: 10, fontSize: 14, color: "#0f172a", textAlign: "right", lineHeight: 2 }}>
              <Span style={{ fontWeight: 700 }}>$339.00</Span>
            </Text>
          </Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#ffffff", padding: [24, 0, 36, 0] }}>
        <Divider style={{ borderTop: "1px solid #e2e8f0", padding: 10 }} />
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 28px",
              borderRadius: 6,
            }}
          >
            View Full Dashboard
          </Button>
        </Column>
        <Text style={{ padding: 10, fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.5 }}>
          {"Need to upgrade? "}
          <Link href="#">Compare plans</Link>
        </Text>
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 40, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
          Pulse API · This report is generated automatically on the 1st of each month.
        </Text>
      </Section>
    </Email>
  );
}
