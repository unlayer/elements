import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Paragraph from "./Paragraph";

describe("Paragraph Component", () => {
  it("renders text content", () => {
    const { container } = render(<Paragraph>Hello paragraph</Paragraph>);
    expect(container.textContent).toContain("Hello paragraph");
  });

  it("applies color style", () => {
    const { container } = render(<Paragraph color="#555555">Styled</Paragraph>);
    expect(container.innerHTML).toContain("#555555");
    expect(container.innerHTML).toContain("color");
  });

  it("applies fontSize style", () => {
    const { container } = render(<Paragraph fontSize="18px">Big text</Paragraph>);
    expect(container.innerHTML).toContain("font-size: 18px");
  });

  it("applies textAlign style", () => {
    const { container } = render(<Paragraph textAlign="center">Centered</Paragraph>);
    expect(container.innerHTML).toContain("text-align: center");
  });

  it("renders default styles (14px, #000000, left)", () => {
    const { container } = render(<Paragraph>Default</Paragraph>);
    expect(container.innerHTML).toContain("font-size: 14px");
    expect(container.innerHTML).toContain("#000000");
    expect(container.innerHTML).toContain("text-align: left");
  });

  it("produces same structure in web and email modes", () => {
    const { container: web } = render(<Paragraph mode="web">Text</Paragraph>);
    const { container: email } = render(<Paragraph mode="email">Text</Paragraph>);
    // Paragraph renders the same div-based structure in both modes
    expect(web.querySelector("div")).not.toBeNull();
    expect(email.querySelector("div")).not.toBeNull();
    expect(web.textContent).toContain("Text");
    expect(email.textContent).toContain("Text");
  });

  it("has correct displayName", () => {
    expect(Paragraph.displayName).toBe("Paragraph");
  });
});
