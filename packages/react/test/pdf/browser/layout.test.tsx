/**
 * The PDF laid out as the print HTML is: the same Document rendered both ways, where each line's words start across
 * the page compared (Chromium measuring the HTML, pdf.js reading the PDF). Arial, the HTML's font, and Helvetica, the
 * PDF's, have the same widths, so lines break in the same places; within a point of each other, the columns, padding
 * and alignment are the same.
 */
import { chromium } from "playwright";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Button, Column, Document, Heading, PageFooter, PageHeader, PageNumber, Text, render, Row, Section } from "@hyper-elements/react";
import { renderPdf } from "../../../src/pdf";

/** Each line by its first word (each a different one). */
const LINES = ["Quarterly", "Results", "Region", "Revenue", "North", "$1.2M", "South", "$0.9M", "Growth", "Read", "Page"];

const report = (
  <Document size="Letter" margin={[48, 64]} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: 1.4 }}>
    <PageHeader style={{ padding: [0, 0, 16, 0] }}>
      <Text style={{ fontSize: 10, color: "#555555", textAlign: "center" }}>Quarterly report</Text>
    </PageHeader>
    <Heading level={2}>Results</Heading>
    <Section style={{ padding: [16, 24], backgroundColor: "#f3f4f6", gap: 8 }}>
      <Row style={{ gap: 24 }}>
        <Column style={{ width: "40%" }}>
          <Text style={{ fontWeight: 700 }}>Region</Text>
        </Column>
        <Column>
          <Text style={{ fontWeight: 700, textAlign: "right" }}>Revenue</Text>
        </Column>
      </Row>
      <Row style={{ gap: 24 }}>
        <Column style={{ width: "40%" }}>
          <Text>North</Text>
        </Column>
        <Column>
          <Text style={{ textAlign: "right" }}>$1.2M</Text>
        </Column>
      </Row>
      <Row style={{ gap: 24 }}>
        <Column style={{ width: "40%" }}>
          <Text>South</Text>
        </Column>
        <Column>
          <Text style={{ textAlign: "right" }}>$0.9M</Text>
        </Column>
      </Row>
    </Section>
    <Text style={{ padding: [0, 48] }}>Growth was strong in every region this quarter.</Text>
    <Column style={{ alignItems: "center" }}>
      <Button href="https://acme.test/report" style={{ backgroundColor: "#111827", color: "#ffffff", padding: [8, 16] }}>
        Read the full report
      </Button>
    </Column>
    <PageFooter>
      <Text style={{ fontSize: 10, textAlign: "right" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

/** Where each line starts across the page, in points: in the print HTML, from the page's box. */
async function htmlStarts(html: string): Promise<Record<string, number>> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
    await page.setContent(html);
    return await page.evaluate((lines) => {
      const sheet = document.querySelector(".elements-page")!.getBoundingClientRect();
      const out: Record<string, number> = {};
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const block = node.parentElement!.closest("div, p, h1, h2, h3, a") ?? node.parentElement!;
        const first = block.textContent!.trim().split(/\s+/)[0];
        const line = lines.find((l) => l === first);
        if (!line || line in out || node.textContent!.trim().split(/\s+/)[0] !== first) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        out[line] = Math.round((range.getClientRects()[0].left - sheet.left) * 0.75 * 10) / 10;
      }
      return out;
    }, LINES);
  } finally {
    await browser.close();
  }
}

/** Where each line starts across the page, in points: in the PDF. */
async function pdfStarts(pdf: Uint8Array): Promise<Record<string, number>> {
  const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
  const items = (await (await document.getPage(1)).getTextContent()).items.filter((item): item is { str: string; transform: number[] } & typeof item => "str" in item && item.str.trim() !== "");
  const out: Record<string, number> = {};
  for (const item of items) {
    const line = LINES.find((l) => l === item.str.trim().split(/\s+/)[0]);
    if (line && !(line in out)) out[line] = Math.round(item.transform[4] * 10) / 10;
  }
  return out;
}

describe("a Document's PDF and its print HTML", () => {
  it("start each line at the same place across the page, within a point", async () => {
    const [html, pdf] = await Promise.all([htmlStarts((await render(report)).html), renderPdf(report).then((r) => pdfStarts(r.pdf))]);
    expect(Object.keys(pdf).sort()).toEqual([...LINES].sort());
    for (const line of LINES) expect(Math.abs(pdf[line] - html[line]), `${line}: ${pdf[line]} in the PDF, ${html[line]} in the HTML`).toBeLessThanOrEqual(1);
  });
});
