import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Button,
  Divider,
  Image,
  Table,
  ColumnLayouts,
} from "@unlayer/react-elements";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function UsageReport(): ReactElement {
  return (
    <Email
      backgroundColor="#f8fafc"
      textColor="#0f172a"
      contentAlign="center"
      contentWidth="560px"
      fontFamily={sansFont}
      previewText="Your February usage report: 1.2M API calls, 99.97% uptime."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/100x24/6366f1/ffffff?text=PULSE", width: 100, height: 24 }}
            altText="Pulse"
            textAlign="left"
          />
        </Column>
        <Column>
          <Paragraph
            html="February 2026"
            fontSize="13px"
            color="#64748b"
            textAlign="right"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Title */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px 0px 40px">
        <Column>
          <Heading
            text="Monthly Usage Report"
            headingType="h1"
            fontSize="24px"
            fontWeight={700}
            color="#0f172a"
            textAlign="left"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html={"Here\u2019s your summary for <b>Acme Corp</b> \u2014 Pro Plan."}
            fontSize="14px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Key Metrics */}
      <Row layout={ColumnLayouts.ThreeEqual} backgroundColor="#ffffff" padding="0px 40px 8px 40px">
        <Column>
          <Heading
            text="1.2M"
            headingType="h2"
            fontSize="28px"
            fontWeight={700}
            color="#0f172a"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="API Calls"
            fontSize="12px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="↑ 18% vs Jan"
            fontSize="11px"
            color="#22c55e"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="99.97%"
            headingType="h2"
            fontSize="28px"
            fontWeight={700}
            color="#0f172a"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Uptime"
            fontSize="12px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="SLA: 99.9%"
            fontSize="11px"
            color="#22c55e"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="48ms"
            headingType="h2"
            fontSize="28px"
            fontWeight={700}
            color="#0f172a"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Avg Latency"
            fontSize="12px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="↓ 12ms vs Jan"
            fontSize="11px"
            color="#22c55e"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Usage Breakdown */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="16px 40px 0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
          />
          <Heading
            text="USAGE BY ENDPOINT"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#94a3b8"
            textAlign="left"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={sansFont}
          />
          <Table
            headers={["Endpoint", "Calls", "Avg (ms)", "Errors"]}
            data={[
              ["/api/v2/users", "482,100", "32", "0.01%"],
              ["/api/v2/orders", "358,200", "45", "0.03%"],
              ["/api/v2/products", "241,800", "38", "0.00%"],
              ["/api/v2/search", "118,900", "89", "0.12%"],
            ]}
          />
        </Column>
      </Row>

      {/* Billing Summary */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 40px 0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
          />
          <Heading
            text="BILLING SUMMARY"
            headingType="h4"
            fontSize="11px"
            fontWeight={700}
            color="#94a3b8"
            textAlign="left"
            lineHeight="1"
            letterSpacing="1px"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="0px 40px">
        <Column>
          <Paragraph
            html="Pro Plan (base)"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            lineHeight="2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="API overage (200K calls)"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            lineHeight="2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="<b>Total due Mar 1</b>"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            lineHeight="2"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Paragraph
            html="$299.00"
            fontSize="14px"
            color="#0f172a"
            textAlign="right"
            lineHeight="2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="$40.00"
            fontSize="14px"
            color="#0f172a"
            textAlign="right"
            lineHeight="2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="<b>$339.00</b>"
            fontSize="14px"
            color="#0f172a"
            textAlign="right"
            lineHeight="2"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px 36px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
          />
          <Button
            text="View Full Dashboard"
            buttonColors={{ backgroundColor: "#6366f1", color: "#ffffff" }}
            padding="12px 28px"
            borderRadius="6px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
          <Paragraph
            html='Need to upgrade? <a href="#">Compare plans</a>'
            fontSize="13px"
            color="#64748b"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Pulse API · This report is generated automatically on the 1st of each month."
            fontSize="12px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
