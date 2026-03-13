import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import { expectNoRenderError } from "../test-utils";

describe("Body previewText prop", () => {
  it("renders preview div in email mode", () => {
    const { container } = render(
      <Body mode="email" previewText="Check out our new features!">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expectNoRenderError(container);
    expect(container.innerHTML).toContain("Check out our new features!");
    expect(container.innerHTML).toContain('data-skip-in-text="true"');
    expect(container.innerHTML).toContain("display:none");
  });

  it("does not render preview div in web mode", () => {
    const { container } = render(
      <Body mode="web" previewText="This should not appear">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expectNoRenderError(container);
    expect(container.innerHTML).not.toContain("This should not appear");
    expect(container.innerHTML).not.toContain('data-skip-in-text="true"');
  });

  it("does not render preview div when previewText is empty", () => {
    const { container } = render(
      <Body mode="email" previewText="">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expectNoRenderError(container);
    expect(container.innerHTML).not.toContain('data-skip-in-text="true"');
  });

  it("does not render preview div when previewText is undefined", () => {
    const { container } = render(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expectNoRenderError(container);
    expect(container.innerHTML).not.toContain('data-skip-in-text="true"');
  });

  it("still renders body content alongside preview", () => {
    const { container } = render(
      <Body mode="email" previewText="Preview text here">
        <Row>
          <Column>
            <Paragraph>Body content here</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expectNoRenderError(container);
    expect(container.innerHTML).toContain("Preview text here");
    expect(container.innerHTML).toContain("Body content here");
  });
});
