import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Divider from "./Divider";

describe("Divider Component", () => {
  it("renders a divider with border-top in web mode", () => {
    const { container } = render(<Divider mode="web" />);
    expect(container.querySelector<HTMLElement>('hr[aria-label="divider"]')?.style.borderTopStyle).toBe("solid");
  });

  it("renders a table-based divider in email mode", () => {
    const { container } = render(<Divider mode="email" />);
    const table = container.querySelector('table[role="presentation"][aria-label="divider"]');
    expect(table?.querySelector("td")?.style.borderTopStyle).toBe("solid");
  });

  it("applies border color", () => {
    const { container } = render(<Divider borderTopColor="#ff0000" />);
    expect(container.querySelector("hr")!.style.borderTopColor).toBe("rgb(255, 0, 0)");
  });

  it("applies border width", () => {
    const { container } = render(<Divider borderTopWidth="3px" />);
    expect(container.querySelector("hr")!.style.borderTopWidth).toBe("3px");
  });

  it("uses different HTML structures for web vs email", () => {
    const { container: web } = render(<Divider mode="web" />);
    const { container: email } = render(<Divider mode="email" />);
    // Web has a rule, in no table
    expect(web.querySelector("table")).toBeNull();
    expect(web.querySelector("hr")).not.toBeNull();
    // Email uses table-based layout
    expect(email.querySelector('table[role="presentation"]')).not.toBeNull();
    expect(email.querySelector("hr")).toBeNull();
  });

  it("has correct displayName", () => {
    expect(Divider.displayName).toBe("Divider");
  });
});
