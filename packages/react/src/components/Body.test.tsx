import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { renderToHtml } from "../utils/render-to-html";

const maxWidths = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("*")).map((el) => el.style.maxWidth).filter(Boolean);

describe("Body Component", () => {
  it("renders a root in the body's font", () => {
    const { container } = render(<Body />);
    expect(container.querySelector<HTMLElement>("main")?.style.fontFamily).toContain("arial");
  });

  it("renders children through the full tree", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("main p")?.textContent).toBe("Hello");
  });

  it("applies backgroundColor in email mode", () => {
    const { container } = render(<Body mode="email" backgroundColor="#ff0000" />);
    // Email mode renders background-color inline on the table
    expect(container.innerHTML).toContain("#ff0000");
  });

  it("uses flexbox layout in web mode", () => {
    const { container } = render(<Body mode="web" />);
    expect(container.innerHTML).toContain("flex");
    // No table-based layout
    expect(container.querySelector('table[role="presentation"]')).toBeNull();
  });

  it("uses table layout in email mode", () => {
    const { container } = render(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>Email</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
    expect(container.innerHTML).toContain("mso");
  });

  it("threads mode to children", () => {
    const { container } = render(
      <Body mode="email">
        <Row>
          <Column>
            <Button>CTA</Button>
          </Column>
        </Row>
      </Body>
    );
    // An email's Button has its background on a table cell, which Outlook draws: a page's has it on the link.
    expect(container.querySelector("a")?.closest("td")?.getAttribute("bgcolor")).toBe("#0879a1");
  });

  // Regression: <Body contentWidth> must drive the row container width.
  // Previously Body cloned children with only `_config`, so Row fell back to
  // BODY_DEFAULTS.contentWidth ("500px") and the prop was ignored for layout —
  // which made multi-column web layouts compute the wrong column widths.
  it("threads contentWidth to the row container (web)", () => {
    const { container } = render(
      <Body contentWidth="960px" mode="web">
        <Row><Column><Paragraph>x</Paragraph></Column></Row>
      </Body>
    );
    expect(maxWidths(container)).toContain("960px");
    expect(maxWidths(container)).not.toContain("500px");
  });

  it("falls back to the default contentWidth when unset", () => {
    const { container } = render(
      <Body mode="web">
        <Row><Column><Paragraph>x</Paragraph></Column></Row>
      </Body>
    );
    expect(maxWidths(container)).toContain("500px");
  });

  // Email is the primary channel: the columns, in modern clients and in Outlook,
  // must be sized to the real contentWidth, not a hardcoded 600px.
  it("scales email grid column widths to contentWidth (not a hardcoded 600px)", () => {
    const { container } = render(
      <Body contentWidth="700px" mode="email">
        <Row cells={[1, 1]}>
          <Column><Paragraph mode="email">A</Paragraph></Column>
          <Column><Paragraph mode="email">B</Paragraph></Column>
        </Row>
      </Body>
    );
    // The row at 700, each 50% column at 350, in Outlook's comments too: not 600/300.
    expect(maxWidths(container)).toContain("700px");
    expect(maxWidths(container).filter((width) => width === "350px")).toHaveLength(2);
    expect(maxWidths(container)).not.toContain("600px");
    expect(container.innerHTML.match(/<td width="350" valign="top"/g)).toHaveLength(2);
  });

  it("has correct displayName", () => {
    expect(Body.displayName).toBe("Body");
  });
});

describe("Integration: Body > Row > Column > Items", () => {
  it("renders full layout with correct structure", () => {
    const tree = (
      <Body backgroundColor="#f4f4f4">
        <Row>
          <Column>
            <Paragraph>First column</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    const { container } = render(tree);
    expect(container.querySelector("main p")?.textContent).toBe("First column");
    // A page's background is its <body>'s, which only a whole document has.
    expect(renderToHtml(tree)).toMatch(/<body[^>]*background-color:#f4f4f4/);
  });

  it("renders multiple items in order", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>Line 1</Paragraph>
            <Button>Click me</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("p")?.textContent).toBe("Line 1");
    expect(container.querySelector("a")?.textContent).toBe("Click me");
    expect(container.querySelector("main")?.textContent).toBe("Line 1Click me");
  });

  it("renders document mode without a synthetic trailing page break", () => {
    const { container } = render(
      <Body mode="document">
        <Row>
          <Column>
            <Paragraph>Document content</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Document content");
    expect(container.innerHTML).not.toContain("page-break-before");
  });
});
