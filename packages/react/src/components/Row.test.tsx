import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";

describe("Row Component", () => {
  it("renders row container with correct ID", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Content</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("#u_row_1")).not.toBeNull();
  });

  it("renders column children inside the row", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Row content</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Row content");
    expect(container.querySelector("#u_column_1")).not.toBeNull();
  });

  it("applies backgroundColor", () => {
    const { container } = render(
      <Body>
        <Row backgroundColor="#eeeeee">
          <Column><Paragraph>Styled row</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.innerHTML).toContain("#eeeeee");
  });

  it("renders responsive CSS with media queries", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Responsive</Paragraph></Column>
        </Row>
      </Body>
    );
    const style = container.querySelector("style");
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain("@media");
    expect(style!.textContent).toContain("u-row");
  });

  it("uses table layout in email mode", () => {
    const { container } = render(
      <Body mode="email">
        <Row>
          <Column><Paragraph>Email</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.innerHTML).toContain("mso");
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
  });

  it("has correct displayName", () => {
    expect(Row.displayName).toBe("Row");
  });
});
