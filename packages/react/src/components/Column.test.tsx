import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { renderToHtml } from "../utils/render-to-html";

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

  // Regression: each content block must render its OWN containerPadding, not
  // collapse to the column's padding. Previously Column read the always-undefined
  // `child.props.values?.containerPadding` for the flat-prop API and fell back to
  // the column default, so every block lost its spacing.
  it("honors each block's explicit containerPadding (flat prop), not the column padding", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            <Heading containerPadding="0px 0px 28px 0px">Welcome</Heading>
            <Paragraph containerPadding="4px 12px">Body copy</Paragraph>
            <Button containerPadding="0px 28px 36px 28px">Go</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("padding: 0px 0px 28px 0px");
    expect(html).toContain("padding: 4px 12px");
    expect(html).toContain("padding: 0px 28px 36px 28px");
  });

  it("defaults a block with no containerPadding to 10px (not the column's 0px)", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            <Heading>No padding set</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("padding: 10px");
  });

  it("preserves an explicit zero containerPadding instead of forcing the default", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            <Heading containerPadding="0px">Flush</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("padding: 0px");
    expect(html).not.toContain("padding: 10px");
  });

  it("honors containerPadding supplied via the `values` escape hatch", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Heading values={{ containerPadding: "7px 9px" } as any}>Hi</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("padding: 7px 9px");
  });
});
