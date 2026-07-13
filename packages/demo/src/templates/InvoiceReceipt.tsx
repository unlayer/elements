import type { ReactElement } from "react";
import type { TableValues } from "@unlayer/react-elements";
import {
  Document,
  Row,
  Column,
  Paragraph,
  Heading,
  Divider,
  Table,
  ColumnLayouts,
} from "@unlayer/react-elements";

//   import { renderToHtml, renderToJson } from "@unlayer/react-elements";
//   const tree = InvoiceReceipt();
//   const html = renderToHtml(tree, { title: "Invoice INV-2041" });
//
// Cloud PDF export (server only):
//   const design = renderToJson(tree);
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

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const lineItemsTable: Partial<TableValues> = {
  columns: 4,
  rows: 3,
  enableHeader: true,
  table: {
    headers: [{
      height: 0,
      cells: [
        { text: "DESCRIPTION", width: 46, textAlign: "left" },
        { text: "QTY", width: 14, textAlign: "right" },
        { text: "UNIT PRICE", width: 20, textAlign: "right" },
        { text: "AMOUNT", width: 20, textAlign: "right" },
      ],
    }],
    rows: [
      {
        height: 0,
        cells: [
          { text: "Design system audit", width: 46, textAlign: "left" },
          { text: "1", width: 14, textAlign: "right" },
          { text: "$2,400.00", width: 20, textAlign: "right" },
          { text: "$2,400.00", width: 20, textAlign: "right" },
        ],
      },
      {
        height: 0,
        cells: [
          { text: "Component library development", width: 46, textAlign: "left" },
          { text: "40", width: 14, textAlign: "right" },
          { text: "$120.00", width: 20, textAlign: "right" },
          { text: "$4,800.00", width: 20, textAlign: "right" },
        ],
      },
      {
        height: 0,
        cells: [
          { text: "Accessibility review", width: 46, textAlign: "left" },
          { text: "1", width: 14, textAlign: "right" },
          { text: "$950.00", width: 20, textAlign: "right" },
          { text: "$950.00", width: 20, textAlign: "right" },
        ],
      },
    ],
    footers: [],
  },
};

export default function InvoiceReceipt(): ReactElement {
  return (
    <Document
      backgroundColor="#ffffff"
      textColor="#1a1f36"
      contentAlign="center"
      contentWidth="700px"
      fontFamily={sansFont}
    >
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="40px 56px 28px 56px">
        <Column>
          <Paragraph
            html="ACME"
            fontSize="18px"
            fontWeight={700}
            color="#1a1f36"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="1 Infinite Loop, Cupertino, CA 95014"
            fontSize="12px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="INVOICE"
            headingType="h1"
            fontSize="20px"
            fontWeight={700}
            color="#635bff"
            textAlign="right"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="INV-2041"
            fontSize="12px"
            color="#697386"
            textAlign="right"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#635bff" padding="0px">
        <Column>
          <Divider
            borderTopWidth="3px"
            borderTopColor="#635bff"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="28px 56px 0px 56px">
        <Column>
          <Heading
            text="BILLED TO"
            headingType="h2"
            fontSize="10px"
            fontWeight={700}
            color="#596579"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Maple Studio LLC"
            fontSize="14px"
            color="#1a1f36"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="510 Townsend Street"
            fontSize="14px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="San Francisco, CA 94103"
            fontSize="14px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="DETAILS"
            headingType="h2"
            fontSize="10px"
            fontWeight={700}
            color="#596579"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Issue date: June 30, 2026"
            fontSize="14px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Due date: July 30, 2026"
            fontSize="14px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Status: <b>Paid</b>"
            fontSize="14px"
            color="#228403"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 56px 24px 56px">
        <Column>
          <Table
            values={lineItemsTable as TableValues}
            headerBackgroundColor="#f6f8fa"
            headerColor="#687385"
            headerFontSize="11px"
            contentColor="#1a1f36"
            contentFontSize="13px"
            stripedRows={false}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f7f6ff" padding="20px 56px 24px 56px">
        <Column>
          <Paragraph
            html="Subtotal: $8,150.00"
            fontSize="14px"
            color="#697386"
            textAlign="right"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Tax (8.5%): $692.75"
            fontSize="14px"
            color="#697386"
            textAlign="right"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#1a1f36"
            borderTopStyle="solid"
          />
          <Heading
            text="$8,842.75"
            headingType="h2"
            fontSize="24px"
            fontWeight={700}
            color="#1a1f36"
            textAlign="right"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Invoice total (USD)"
            fontSize="12px"
            color="#596579"
            textAlign="right"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 56px 32px 56px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e3e8ee"
            borderTopStyle="solid"
          />
          <Heading
            text="PAYMENT"
            headingType="h2"
            fontSize="10px"
            fontWeight={700}
            color="#596579"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Paid on July 2, 2026 · Visa ending in 4242 · Reference PAY-88213"
            fontSize="14px"
            color="#697386"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f6f8fa" padding="24px 56px 32px 56px">
        <Column>
          <Paragraph
            html="Thank you for your business."
            fontSize="12px"
            color="#697386"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Questions about this invoice? Contact billing@acme.com"
            fontSize="12px"
            color="#596579"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Document>
  );
}
