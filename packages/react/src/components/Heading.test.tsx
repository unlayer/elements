import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Heading from "./Heading";

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
});
