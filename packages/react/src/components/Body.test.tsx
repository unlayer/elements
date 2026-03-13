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
