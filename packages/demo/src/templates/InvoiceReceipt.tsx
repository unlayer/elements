import type { ReactElement } from "react";
import {
  Column,
  Divider,
  Document,
  Heading,
  Paragraph,
  Row,
  Section,
  Span,
  Table,
  TableCell,
  TableRow,
} from "@unlayer/react-elements";

//   import { render } from "@unlayer/react-elements";
//   import { toDesign } from "@unlayer/react-elements/builder";
//   const { html } = await render(<InvoiceReceipt />);
//
// Cloud PDF export (server only):
//   const { design } = toDesign(<InvoiceReceipt />);
//   const apiKey = process.env.UNLAYER_API_KEY;
//   if (!apiKey) throw new Error("UNLAYER_API_KEY is required");
//   const authorization = Buffer.from(`${apiKey}:`).toString("base64");
//   const response = await fetch("https://api.unlayer.com/v2/export/pdf", {
//     method: "POST",
//     headers: {
//       Authorization: `Basic ${authorization}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ design, displayMode: "web" }),
//   });
//   if (!response.ok) throw new Error(`PDF export failed: ${response.status}`);
//   const result = await response.json();
//   if (typeof result?.data?.url !== "string") throw new Error("PDF export returned no URL");
//   const pdfUrl = result.data.url;
//
// The PDF endpoint accepts displayMode "web", not "document".

const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

const tableHeaders = ["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"];
const tableRows = [
  ["Design system audit", "1", "$2,400.00", "$2,400.00"],
  ["Component library development", "40", "$120.00", "$4,800.00"],
  ["Accessibility review", "1", "$950.00", "$950.00"],
];
const tableColumns = [262, 78, 114, 114];
const tableCell = (column: number) =>
  ({
    width: tableColumns[column],
    border: "1px solid #cccccc",
    verticalAlign: "middle",
    textAlign: column === 0 ? "left" : "right",
  }) as const;

export default function InvoiceReceipt(): ReactElement {
  return (
    <Document
      size="A4"
      margin={[0, 47]}
      title="Invoice INV-2041"
      style={{ backgroundColor: "#ffffff", color: "#1a1f36", fontFamily: sansFont }}
    >
      <Section style={{ backgroundColor: "#ffffff", padding: [40, 56, 28, 56] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Paragraph
              style={{
                padding: 10,
                fontSize: 18,
                fontWeight: 700,
                color: "#1a1f36",
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              ACME
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 12, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
              1 Infinite Loop, Cupertino, CA 95014
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              style={{
                padding: 10,
                fontSize: 20,
                fontWeight: 700,
                color: "#635bff",
                textAlign: "right",
                lineHeight: 1.3,
              }}
            >
              INVOICE
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 12, color: "#697386", textAlign: "right", lineHeight: 1.5 }}>
              INV-2041
            </Paragraph>
          </Column>
        </Row>
      </Section>

      <Section style={{ backgroundColor: "#635bff" }}>
        <Divider style={{ borderTop: "3px solid #635bff", padding: 10 }} />
      </Section>

      <Section style={{ backgroundColor: "#ffffff", padding: [28, 56, 0, 56] }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Heading
              level={2}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#596579",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              BILLED TO
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#1a1f36", textAlign: "left", lineHeight: 1.5 }}>
              Maple Studio LLC
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
              510 Townsend Street
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
              San Francisco, CA 94103
            </Paragraph>
          </Column>
          <Column style={{ width: "50%" }}>
            <Heading
              level={2}
              style={{
                padding: 10,
                fontSize: 10,
                fontWeight: 700,
                color: "#596579",
                textAlign: "left",
                lineHeight: 1.4,
              }}
            >
              DETAILS
            </Heading>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
              Issue date: June 30, 2026
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
              Due date: July 30, 2026
            </Paragraph>
            <Paragraph style={{ padding: 10, fontSize: 14, color: "#228403", textAlign: "left", lineHeight: 1.5 }}>
              {"Status: "}
              <Span style={{ fontWeight: 700 }}>Paid</Span>
            </Paragraph>
          </Column>
        </Row>
      </Section>

      <Section style={{ backgroundColor: "#ffffff", padding: [32, 56, 24, 56] }}>
        <Column style={{ padding: 10 }}>
          <Table style={{ fontSize: 13, lineHeight: 1.4, cellPadding: 10, borderCollapse: "collapse" }}>
            <TableRow header style={{ backgroundColor: "#f6f8fa", color: "#687385", fontSize: 11 }}>
              {tableHeaders.map((text, column) => (
                <TableCell key={text} style={tableCell(column)}>
                  {text}
                </TableCell>
              ))}
            </TableRow>
            {tableRows.map((row) => (
              <TableRow key={row[0]}>
                {row.map((text, column) => (
                  <TableCell key={column} style={tableCell(column)}>
                    {text}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </Table>
        </Column>
      </Section>

      <Section style={{ backgroundColor: "#f7f6ff", padding: [20, 56, 24, 56] }}>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "right", lineHeight: 1.6 }}>
          Subtotal: $8,150.00
        </Paragraph>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "right", lineHeight: 1.6 }}>
          Tax (8.5%): $692.75
        </Paragraph>
        <Divider style={{ borderTop: "1px solid #1a1f36", padding: 10 }} />
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 24, fontWeight: 700, color: "#1a1f36", textAlign: "right", lineHeight: 1.3 }}
        >
          $8,842.75
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#596579", textAlign: "right", lineHeight: 1.4 }}>
          Invoice total (USD)
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: "#ffffff", padding: [24, 56, 32, 56] }}>
        <Divider style={{ borderTop: "1px solid #e3e8ee", padding: 10 }} />
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 10, fontWeight: 700, color: "#596579", textAlign: "left", lineHeight: 1.4 }}
        >
          PAYMENT
        </Heading>
        <Paragraph style={{ padding: 10, fontSize: 14, color: "#697386", textAlign: "left", lineHeight: 1.5 }}>
          Paid on July 2, 2026 · Visa ending in 4242 · Reference PAY-88213
        </Paragraph>
      </Section>

      <Section style={{ backgroundColor: "#f6f8fa", padding: [24, 56, 32, 56] }}>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#697386", textAlign: "center", lineHeight: 1.6 }}>
          Thank you for your business.
        </Paragraph>
        <Paragraph style={{ padding: 10, fontSize: 12, color: "#596579", textAlign: "center", lineHeight: 1.6 }}>
          Questions about this invoice? Contact billing@acme.com
        </Paragraph>
      </Section>
    </Document>
  );
}
