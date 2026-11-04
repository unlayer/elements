import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { ColumnLayouts } from "../layouts/ColumnLayouts";
import { createItemComponent } from "../utils/create-component";

/** On a page, each column's share of the row, in the order of its words. */
const columnShares = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("p")).map((p) => [p.textContent, p.parentElement!.style.flex.split(" ")[2]]);

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
    expect(columnShares(container)).toEqual([["Left", "50%"], ["Right", "50%"]]);
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
    expect(columnShares(container)).toEqual([["Col A", "50%"], ["Col B", "50%"]]);
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
    expect(columnShares(container)).toEqual([["One", "33.3333%"], ["Two", "33.3333%"], ["Three", "33.3333%"]]);
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
    expect(columnShares(container)).toEqual([["Wide", "66.6667%"], ["Narrow", "33.3333%"]]);
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
    // Half of the content width each, in modern clients and in Outlook's comments.
    expect(container.querySelectorAll('div[style*="max-width:250px"]')).toHaveLength(2);
    expect(container.innerHTML.match(/<td width="250" valign="top"/g)).toHaveLength(2);
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
    const link = container.querySelector("a")!;
    expect(link.style.fontSize).toBe("24px");
    expect(link.textContent).toBe("Big");
  });

  it("Paragraph values prop applies color to output", () => {
    const { container } = render(
      <Paragraph values={{ color: "#ff0000", textJson: null }} />
    );
    expect(container.querySelector("p")!.style.color).toBe("rgb(255, 0, 0)");
  });

  it("values prop merges with defaults", () => {
    const { container } = render(
      <Button values={{ fontSize: "20px" }}>Custom size</Button>
    );
    const link = container.querySelector("a")!;
    // Should have custom fontSize
    expect(link.style.fontSize).toBe("20px");
    // Should still have default colors from merge
    expect(link.style.backgroundColor).toBe("rgb(8, 121, 161)");
  });
});

describe("Error fallback", () => {
  it("renders error fallback when exporter throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = () => {
      throw new Error("boom");
    };
    const Broken = createItemComponent({
      name: "Broken",
      contentType: "custom",
      metaName: "custom",
      defaultValues: {},
      propMapper: (props) => props,
      displayName: "Broken",
      exporters: { web: boom, email: boom, document: boom },
    });

    const { container } = render(<Broken />);

    expect(container.textContent).toContain("Broken failed to render.");
    expect(errorSpy).toHaveBeenCalledWith("Broken rendering failed:", expect.objectContaining({ message: "boom" }));

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
