import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Column } from "./Column";
import Document from "./Document";
import Email from "./Email";
import Page from "./Page";
import PageBreak from "./PageBreak";
import Paragraph from "./Paragraph";
import Row from "./Row";
import { renderToHtml } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";

describe("PageBreak", () => {
  it("renders the core document page-break contract", () => {
    const { container } = render(<PageBreak mode="document" />);

    expect(
      container.querySelector('.u-content-page-break[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it("is inert inside web and email columns", () => {
    const tree = (
      <Row>
        <Column>
          <Paragraph>Before</Paragraph>
          <PageBreak />
          <Paragraph>After</Paragraph>
        </Column>
      </Row>
    );
    const { container: web } = render(<Page>{tree}</Page>);
    const { container: email } = render(<Email>{tree}</Email>);

    // Nothing between the words: no break, and no empty box of its padding.
    expect(web.innerHTML).not.toContain("break-after");
    expect(email.innerHTML).not.toContain("break-after");
    expect(web.querySelector("p")?.nextElementSibling?.textContent).toBe("After");
    expect(email.querySelectorAll('td[style*="padding"]')).toHaveLength(2);
  });

  it("adds print break rules to document HTML", () => {
    const html = renderToHtml(
      <Document>
        <Row>
          <Column>
            <Paragraph>Page one</Paragraph>
            <PageBreak />
            <Paragraph>Page two</Paragraph>
          </Column>
        </Row>
      </Document>,
    );

    expect(html).toContain("break-after:page");
    expect(html).toContain("page-break-after:always");
  });

  it("round-trips to the editor page_break content type", () => {
    const design = renderToJson(
      <Document>
        <Row>
          <Column>
            <PageBreak color="#123456" />
          </Column>
        </Row>
      </Document>,
    );

    expect(design.body.rows[0]?.columns[0]?.contents[0]).toMatchObject({
      type: "page_break",
      values: { color: "#123456" },
    });
  });
});
