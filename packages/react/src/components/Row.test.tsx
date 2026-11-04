import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";

describe("Row Component", () => {
  it("renders column children inside the row, at the content width", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Row content</Paragraph></Column>
        </Row>
      </Body>
    );
    const paragraph = container.querySelector("p")!;
    expect(paragraph.textContent).toBe("Row content");
    expect(paragraph.closest('[style*="max-width:500px"]')).not.toBeNull();
  });

  it("applies backgroundColor", () => {
    const { container } = render(
      <Body>
        <Row backgroundColor="#eeeeee">
          <Column><Paragraph>Styled row</Paragraph></Column>
        </Row>
      </Body>
    );
    const box = container.querySelector("p")!.closest('[style*="background-color"]') as HTMLElement;
    expect(box.style.backgroundColor).toBe("rgb(238, 238, 238)");
  });

  it("stacks its columns on phones by a media query on the row", () => {
    const { container } = render(
      <Body>
        <Row cells={[1, 1]}>
          <Column><Paragraph>Left</Paragraph></Column>
          <Column><Paragraph>Right</Paragraph></Column>
        </Row>
      </Body>
    );
    const rule = /@media \(max-width: 480px\)\{\.(\w+)\{flex-direction:column!important/.exec(container.querySelector("style")!.textContent!);
    const row = container.querySelector(`.${rule![1]}`)!;
    expect(row.textContent).toBe("LeftRight");
    expect(row.children).toHaveLength(2);
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

  it("keeps columns side by side on phones with noStackMobile, in both modes", () => {
    const tree = (mode: "email" | "web", noStackMobile: boolean) => (
      <Body mode={mode}>
        <Row cells={[1, 1]} noStackMobile={noStackMobile}>
          <Column><Paragraph>A</Paragraph></Column>
          <Column><Paragraph>B</Paragraph></Column>
        </Row>
      </Body>
    );

    // A page: no rule that stacks them.
    const STACKS_ON_A_PAGE = "flex-direction:column!important";
    expect(render(tree("web", false)).container.innerHTML).toContain(STACKS_ON_A_PAGE);
    expect(render(tree("web", true)).container.innerHTML).not.toContain(STACKS_ON_A_PAGE);

    // An email: not blocks that stack, but cells of one table row, each keeping its share on phones.
    const STACKS_IN_AN_EMAIL = ">div{width:100%!important";
    expect(render(tree("email", false)).container.innerHTML).toContain(STACKS_IN_AN_EMAIL);
    const { container } = render(tree("email", true));
    expect(container.innerHTML).not.toContain(STACKS_IN_AN_EMAIL);
    const [a, b] = Array.from(container.querySelectorAll("p")).map((p) => p.closest('td[width="250"]')!);
    expect(a.parentElement).toBe(b.parentElement);
    expect(container.innerHTML).toContain(`.${a.className}{width:50%!important`);
    expect(b.className).toBe(a.className);
  });

  it("has correct displayName", () => {
    expect(Row.displayName).toBe("Row");
  });
});

describe("Row layout with columns from components", () => {
  it("counts the columns a Fragment or a component gives", async () => {
    const { Email, renderToHtml, ColumnLayouts } = await import("../index");
    const Pair = () => (
      <>
        <Column><Paragraph>Left column words</Paragraph></Column>
        <Column><Paragraph>Right column words</Paragraph></Column>
      </>
    );
    const html = renderToHtml(<Email><Row layout={ColumnLayouts.TwoEqual}><Pair /></Row></Email>);
    expect(html).toContain("Left column words");
    expect(html).toContain("Right column words");
  });
});
