import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";

describe("Column Component", () => {
  it("renders column container with correct ID", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Content</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("#u_column_1")).not.toBeNull();
  });

  it("wraps items in content containers with IDs", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>Text</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    // Items get wrapped in u_content_* divs
    expect(container.querySelector('[id^="u_content_paragraph"]')).not.toBeNull();
  });

  it("renders multiple children with separate content containers", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>First</Paragraph>
            <Button>Second</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
    expect(container.querySelector('[id^="u_content_paragraph"]')).not.toBeNull();
    expect(container.querySelector('[id^="u_content_button"]')).not.toBeNull();
  });

  it("applies container padding to items", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>Padded</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    // Content containers have padding style
    const contentDiv = container.querySelector('[id^="u_content_"]');
    expect(contentDiv).not.toBeNull();
    expect((contentDiv as HTMLElement).style.padding).toBeTruthy();
  });

  it("has correct displayName", () => {
    expect(Column.displayName).toBe("Column");
  });
});
