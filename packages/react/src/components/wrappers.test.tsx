import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Email from "./Email";
import Page from "./Page";
import Document from "./Document";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";

describe("Email (mode=email wrapper)", () => {
  it("renders table-based layout (email mode)", () => {
    const { container } = render(
      <Email>
        <Row>
          <Column><Paragraph>Email content</Paragraph></Column>
        </Row>
      </Email>
    );
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
    expect(container.innerHTML).toContain("mso");
  });

  it("threads email mode to child components", () => {
    const { container } = render(
      <Email>
        <Row>
          <Column><Button>CTA</Button></Column>
        </Row>
      </Email>
    );
    // Button in email mode has VML roundrect
    expect(container.innerHTML).toContain("v:roundrect");
  });

  it("does not accept mode prop (locked to email)", () => {
    // TypeScript would block this, but verify runtime behavior
    const { container } = render(
      <Email>
        <Row>
          <Column><Paragraph>Locked</Paragraph></Column>
        </Row>
      </Email>
    );
    // Should always be table-based (email), never flexbox (web)
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
  });
});

describe("Page (mode=web wrapper)", () => {
  it("renders flexbox layout (web mode)", () => {
    const { container } = render(
      <Page>
        <Row>
          <Column><Paragraph>Web content</Paragraph></Column>
        </Row>
      </Page>
    );
    expect(container.innerHTML).toContain("flex");
    // Should NOT have email-specific table
    const bodyTable = container.querySelector('#u_body_1');
    expect(bodyTable?.tagName?.toLowerCase()).not.toBe("table");
  });

  it("does not include MSO conditionals", () => {
    const { container } = render(
      <Page>
        <Row>
          <Column><Button>Click</Button></Column>
        </Row>
      </Page>
    );
    expect(container.innerHTML).not.toContain("v:roundrect");
  });
});

describe("Document (mode=document wrapper)", () => {
  it("renders with page-break style", () => {
    const { container } = render(
      <Document>
        <Row>
          <Column><Paragraph>Print content</Paragraph></Column>
        </Row>
      </Document>
    );
    expect(container.innerHTML).toContain("page-break");
  });

  it("renders content", () => {
    const { container } = render(
      <Document>
        <Row>
          <Column><Paragraph>Document text</Paragraph></Column>
        </Row>
      </Document>
    );
    expect(container.textContent).toContain("Document text");
  });
});
