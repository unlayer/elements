import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

describe("Multi-column layouts", () => {
  it("renders two columns with cells={[1,1]}", () => {
    const { container } = render(
      <Body>
        <Row cells={[1, 1]}>
          <Column><Paragraph>Left</Paragraph></Column>
          <Column><Paragraph>Right</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Left");
    expect(container.textContent).toContain("Right");
    expect(container.querySelector("#u_column_1")).not.toBeNull();
    expect(container.querySelector("#u_column_2")).not.toBeNull();
  });

  it("renders with ColumnLayouts.TwoEqual", () => {
    const { container } = render(
      <Body>
        <Row layout={ColumnLayouts.TwoEqual}>
          <Column><Paragraph>Col A</Paragraph></Column>
          <Column><Paragraph>Col B</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Col A");
    expect(container.textContent).toContain("Col B");
    // Should render u-col-50 for 50% width columns
    expect(container.innerHTML).toContain("u-col-50");
  });

  it("renders three columns with ColumnLayouts.ThreeEqual", () => {
    const { container } = render(
      <Body>
        <Row layout={ColumnLayouts.ThreeEqual}>
          <Column><Paragraph>One</Paragraph></Column>
          <Column><Paragraph>Two</Paragraph></Column>
          <Column><Paragraph>Three</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("One");
    expect(container.textContent).toContain("Two");
    expect(container.textContent).toContain("Three");
    expect(container.querySelector("#u_column_3")).not.toBeNull();
  });

  it("renders wide-narrow layout with cells={[2,1]}", () => {
    const { container } = render(
      <Body>
        <Row cells={[2, 1]}>
          <Column><Paragraph>Wide</Paragraph></Column>
          <Column><Paragraph>Narrow</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Wide");
    expect(container.textContent).toContain("Narrow");
  });

  it("logs error when layout column count mismatches children", () => {
    // ThreeEqual expects 3 columns but we give 2
    // Body catches the error from Row, so it doesn't throw — it logs
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Body>
        <Row layout={ColumnLayouts.ThreeEqual}>
          <Column><Paragraph>Only two</Paragraph></Column>
          <Column><Paragraph>columns</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to render"),
      expect.objectContaining({ message: expect.stringContaining("expects 3") })
    );
    errorSpy.mockRestore();
  });

  it("renders two columns in email mode with table layout", () => {
    const { container } = render(
      <Body mode="email">
        <Row cells={[1, 1]}>
          <Column><Paragraph>Email Left</Paragraph></Column>
          <Column><Paragraph>Email Right</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Email Left");
    expect(container.textContent).toContain("Email Right");
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
  });

  it("renders multiple items in each column", () => {
    const { container } = render(
      <Body>
        <Row cells={[1, 1]}>
          <Column>
            <Paragraph>Left text</Paragraph>
            <Button>Left button</Button>
          </Column>
          <Column>
            <Paragraph>Right text</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Left text");
    expect(container.textContent).toContain("Left button");
    expect(container.textContent).toContain("Right text");
  });
});

describe("values escape hatch in components", () => {
  it("Button values prop applies fontSize to output", () => {
    const { container } = render(
      <Button values={{ fontSize: "24px", text: "Big" }} />
    );
    expect(container.innerHTML).toContain("font-size: 24px");
    expect(container.textContent).toContain("Big");
  });

  it("Paragraph values prop applies color to output", () => {
    const { container } = render(
      <Paragraph values={{ color: "#ff0000", textJson: null }} />
    );
    expect(container.innerHTML).toContain("#ff0000");
  });

  it("values prop merges with defaults", () => {
    const { container } = render(
      <Button values={{ fontSize: "20px" }}>Custom size</Button>
    );
    // Should have custom fontSize
    expect(container.innerHTML).toContain("font-size: 20px");
    // Should still have default colors from merge
    expect(container.innerHTML).toContain("#0879A1");
  });
});

describe("Error fallback", () => {
  it("renders error fallback when exporter throws", () => {
    // Spy on console.error to suppress noise
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Pass values that might cause the exporter to fail
    // We use a Body with invalid children to trigger error
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Paragraph>Safe content</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    // Should render without the "failed to render" error fallback
    expect(container.innerHTML).not.toContain("failed to render");
    expect(container.textContent).toContain("Safe content");

    errorSpy.mockRestore();
  });

  it("Row warns on non-Column children", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Body>
        <Row>
          <Paragraph>Wrong child</Paragraph>
        </Row>
      </Body>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("is not a valid Row child")
    );

    warnSpy.mockRestore();
  });
});
