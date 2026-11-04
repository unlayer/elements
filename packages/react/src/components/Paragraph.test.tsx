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
    expect(container.querySelector("p")!.style.color).toBe("rgb(85, 85, 85)");
  });

  it("applies fontSize style", () => {
    const { container } = render(<Paragraph fontSize="18px">Big text</Paragraph>);
    expect(container.querySelector("p")!.style.fontSize).toBe("18px");
  });

  it("applies textAlign style", () => {
    const { container } = render(<Paragraph textAlign="center">Centered</Paragraph>);
    expect(container.querySelector("p")!.style.textAlign).toBe("center");
  });

  it("renders default styles (14px, #000000, left)", () => {
    // In an email every block has its own: on a page it takes what's around it.
    const { container } = render(<Paragraph mode="email">Default</Paragraph>);
    const paragraph = container.querySelector("p")!;
    expect(paragraph.style.fontSize).toBe("14px");
    expect(paragraph.style.color).toBe("rgb(0, 0, 0)");
    expect(paragraph.style.textAlign).toBe("left");
  });

  it("is a <p> of its words in web and email modes", () => {
    const { container: web } = render(<Paragraph mode="web">Text</Paragraph>);
    const { container: email } = render(<Paragraph mode="email">Text</Paragraph>);
    expect(web.querySelector("p")?.textContent).toBe("Text");
    expect(email.querySelector("p")?.textContent).toBe("Text");
  });

  // Known bug: compat/blocks/text.ts gives a block with no text a zero-width space, a line of its height. 0.2.1 draws
  // only its padding, so what follows sits 19.6px lower in Chromium, on a page and in an email. Measured with
  // <Paragraph /><Paragraph>then</Paragraph> in a Page: "then" at y=39 on 0.2.1, y=58.6 here. Remove `.fails` with the fix.
  it.fails("draws no line of its own with no text", () => {
    const { container } = render(<Paragraph />);
    expect(container.querySelector("p")?.textContent ?? "").toBe("");
  });

  it("has correct displayName", () => {
    expect(Paragraph.displayName).toBe("Paragraph");
  });
});
