import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";
import Button from "./Button";

describe("Column Component", () => {
  it("renders the column's box with its own background and padding, in both modes", () => {
    const tree = (mode: "web" | "email") => (
      <Body mode={mode}>
        <Row>
          <Column backgroundColor="#abcdef" padding="20px"><Paragraph>Content</Paragraph></Column>
        </Row>
      </Body>
    );
    const { container: web } = render(tree("web"));
    const box = web.querySelector("p")!.parentElement!;
    expect(box.style.backgroundColor).toBe("rgb(171, 205, 239)");
    expect(box.style.padding).toBe("20px");

    const { container: email } = render(tree("email"));
    const cell = email.querySelector("p")!.closest('td[bgcolor="#abcdef"]') as HTMLElement;
    expect(cell.style.padding).toBe("20px");
  });

  it("renders multiple children, each in its own padding, in order", () => {
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
    const first = container.querySelector("p")!;
    const second = container.querySelector("a")!;
    expect(first.textContent).toBe("First");
    expect(second.textContent).toBe("Second");
    expect(first.style.padding).toBe("10px");
    expect(second.parentElement!.style.padding).toBe("10px");
    expect(first.nextElementSibling).toBe(second.parentElement);
  });

  it("has correct displayName", () => {
    expect(Column.displayName).toBe("Column");
  });

  // Regression: each content block must render its OWN containerPadding, not
  // collapse to the column's padding. Column once read the always-undefined
  // `child.props.values?.containerPadding` for the flat-prop API and fell back to
  // the column default, so every block lost its spacing.
  it("honors each block's explicit containerPadding (flat prop), not the column padding", () => {
    const tree = (mode: "web" | "email") => (
      <Body mode={mode}>
        <Row>
          <Column padding="1px">
            <Heading containerPadding="0px 0px 28px 0px">Welcome</Heading>
            <Paragraph containerPadding="4px 12px">Body copy</Paragraph>
            <Button containerPadding="0px 28px 36px 12px">Go</Button>
          </Column>
        </Row>
      </Body>
    );
    const { container: web } = render(tree("web"));
    expect(web.querySelector("h1")!.style.padding).toBe("0px 0px 28px 0px");
    expect(web.querySelector("p")!.style.padding).toBe("4px 12px");
    expect(web.querySelector("a")!.parentElement!.style.padding).toBe("0px 28px 36px 12px");

    const { container: email } = render(tree("email"));
    expect(email.querySelector("h1")!.closest("td")!.style.padding).toBe("0px 0px 28px 0px");
    expect(email.querySelector("p")!.closest("td")!.style.padding).toBe("4px 12px");
    const padded = Array.from(email.querySelectorAll("td")).filter((td) => td.contains(email.querySelector("a")) && td.style.padding);
    expect(padded.map((td) => td.style.padding)).toEqual(["1px", "0px 28px 36px 12px"]);
  });

  it("defaults a block with no containerPadding to 10px (not the column's 0px)", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Heading>No padding set</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("h1")!.style.padding).toBe("10px");
  });

  it("preserves an explicit zero containerPadding instead of forcing the default", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            <Heading containerPadding="0px">Flush</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(parseInt(container.querySelector("h1")!.style.padding || "0", 10)).toBe(0);
  });

  it("honors containerPadding supplied via the `values` escape hatch", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Heading values={{ containerPadding: "7px 9px" } as any}>Hi</Heading>
          </Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("h1")!.style.padding).toBe("7px 9px");
  });
});
