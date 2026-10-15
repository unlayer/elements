import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Heading from "./Heading";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import { renderToJson } from "../utils/render-to-json";
import { renderToHtml } from "../utils/render-to-html";

describe("Heading Component", () => {
  it("renders an h1 element by default", () => {
    const { container } = render(<Heading>Title</Heading>);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe("Title");
  });

  it("applies color style", () => {
    const { container } = render(<Heading color="#ff0000">Red</Heading>);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.style.color).toBeTruthy();
    expect(container.innerHTML).toContain("#ff0000");
  });

  it("applies fontSize", () => {
    const { container } = render(<Heading fontSize="36px">Big</Heading>);
    expect(container.innerHTML).toContain("font-size: 36px");
  });

  it("applies textAlign", () => {
    const { container } = render(<Heading textAlign="center">Centered</Heading>);
    expect(container.innerHTML).toContain("text-align: center");
  });

  it("wraps in conditional comment table for email mode", () => {
    const { container } = render(<Heading mode="email">Email Title</Heading>);
    // Email mode includes MSO conditional for table wrapping
    expect(container.innerHTML).toContain("[if mso]");
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe("Email Title");
  });

  it("does not include MSO conditionals in web mode", () => {
    const { container } = render(<Heading mode="web">Web Title</Heading>);
    expect(container.innerHTML).not.toContain("[if mso]");
  });

  it("has correct displayName", () => {
    expect(Heading.displayName).toBe("Heading");
  });

  describe("margin shortcuts (m, mx, my, mt, mr, mb, ml): its containerPadding", () => {
    const padding = (props: Record<string, unknown>) =>
      (renderToJson(
        <Body>
          <Row>
            <Column>
              <Heading {...props}>Title</Heading>
            </Column>
          </Row>
        </Body>
      ).body.rows[0].columns[0].contents[0].values as Record<string, unknown>).containerPadding;

    it("sets the sides given, the others its default (10px); a number in px", () => {
      expect(padding({ m: 0 })).toBe("0px 0px 0px 0px");
      expect(padding({ my: 24, mx: "16px" })).toBe("24px 16px 24px 16px");
      expect(padding({ mt: 32, mb: 8 })).toBe("32px 10px 8px 10px");
      expect(padding({ m: 4, ml: 0 })).toBe("4px 4px 4px 0px");
    });

    it("gives way to an explicit containerPadding, and changes nothing without them", () => {
      expect(padding({ mt: 32, containerPadding: "2px" })).toBe("2px");
      expect(padding({})).toBe("10px");
    });

    it("is in the HTML as in the design, and not said as a prop it ignores", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const html = renderToHtml(
          <Body>
            <Row>
              <Column>
                <Heading mt={32} mb={8}>Title</Heading>
              </Column>
            </Row>
          </Body>
        );
        expect(html).toContain("padding: 32px 10px 8px 10px");
        expect(warn).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
      }
    });
  });
});

