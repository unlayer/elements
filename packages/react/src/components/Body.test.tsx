import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";

describe("Body Component", () => {
  it("renders body container with correct ID", () => {
    const { container } = render(<Body />);
    expect(container.querySelector("#u_body_1, .u_body")).not.toBeNull();
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
    expect(container.textContent).toContain("Hello");
    expect(container.querySelector("#u_row_1")).not.toBeNull();
    expect(container.querySelector("#u_column_1")).not.toBeNull();
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
    // Button in email mode should have VML roundrect
    expect(container.innerHTML).toContain("v:roundrect");
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
    expect(container.innerHTML).toContain("max-width: 960px");
    expect(container.innerHTML).not.toContain("max-width: 500px");
  });

  it("falls back to the default contentWidth when unset", () => {
    const { container } = render(
      <Body mode="web">
        <Row><Column><Paragraph>x</Paragraph></Column></Row>
      </Body>
    );
    expect(container.innerHTML).toContain("max-width: 500px");
  });

  // Email is the primary channel: the responsive grid CSS must size desktop
  // columns to the real contentWidth, not a hardcoded 600px. Previously
  // generateGridCSS ran with the 600 default, so a multi-column email's
  // media-query widths didn't match its table width.
  it("scales email grid column widths to contentWidth (not a hardcoded 600px)", () => {
    const { container } = render(
      <Body contentWidth="700px" mode="email">
        <Row cells={[1, 1]}>
          <Column><Paragraph mode="email">A</Paragraph></Column>
          <Column><Paragraph mode="email">B</Paragraph></Column>
        </Row>
      </Body>
    );
    // desktop media query: row at 700, each 50% column at 350 — not 600/300
    expect(container.innerHTML).toContain("width: 700px !important");
    expect(container.innerHTML).toContain("width: 350px !important");
    expect(container.innerHTML).not.toContain("width: 600px !important");
  });

  it("has correct displayName", () => {
    expect(Body.displayName).toBe("Body");
  });
});

describe("Integration: Body > Row > Column > Items", () => {
  it("renders full layout with correct structure", () => {
    const { container } = render(
      <Body backgroundColor="#f4f4f4">
        <Row>
          <Column>
            <Paragraph>First column</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    // Verify nested structure exists
    expect(container.querySelector("#u_body_1, .u_body")).not.toBeNull();
    expect(container.querySelector("#u_row_1")).not.toBeNull();
    expect(container.querySelector("#u_column_1")).not.toBeNull();
    expect(container.textContent).toContain("First column");
  });

  it("renders multiple items with sequential IDs", () => {
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
    expect(container.textContent).toContain("Line 1");
    expect(container.textContent).toContain("Click me");
    // Both items get content wrappers
    expect(container.querySelector('[id^="u_content_paragraph"]')).not.toBeNull();
    expect(container.querySelector('[id^="u_content_button"]')).not.toBeNull();
  });

  it("renders document mode with page-break", () => {
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
    expect(container.innerHTML).toContain("page-break");
  });
});
