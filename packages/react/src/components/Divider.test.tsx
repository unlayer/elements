import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Divider from "./Divider";

describe("Divider Component", () => {
  it("renders a divider with border-top in web mode", () => {
    const { container } = render(<Divider mode="web" />);
    expect(container.innerHTML).toContain("border-top");
    expect(container.querySelector('[aria-label="divider"]')).not.toBeNull();
  });

  it("renders a table-based divider in email mode", () => {
    const { container } = render(<Divider mode="email" />);
    const table = container.querySelector('table[role="presentation"]');
    expect(table).not.toBeNull();
    expect(table!.getAttribute("aria-label")).toBe("divider");
    expect(container.innerHTML).toContain("border-top");
  });

  it("applies border color", () => {
    const { container } = render(<Divider borderTopColor="#ff0000" />);
    expect(container.innerHTML).toContain("#ff0000");
  });

  it("applies border width", () => {
    const { container } = render(<Divider borderTopWidth="3px" />);
    expect(container.innerHTML).toContain("3px");
  });

  it("uses different HTML structures for web vs email", () => {
    const { container: web } = render(<Divider mode="web" />);
    const { container: email } = render(<Divider mode="email" />);
    // Web uses div-based layout
    expect(web.querySelector("table")).toBeNull();
    // Email uses table-based layout
    expect(email.querySelector('table[role="presentation"]')).not.toBeNull();
  });

  it("has correct displayName", () => {
    expect(Divider.displayName).toBe("Divider");
  });
});
