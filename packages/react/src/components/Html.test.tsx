import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Html from "./Html";

describe("Html Component", () => {
  it("renders custom HTML content preserving tags", () => {
    const { container } = render(<Html html="<strong>Bold text</strong>" />);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe("Bold text");
  });

  it("renders HTML from values prop", () => {
    const { container } = render(
      <Html values={{ html: "<em>Italic</em>" }} />
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em!.textContent).toBe("Italic");
  });

  it("renders link elements", () => {
    const { container } = render(
      <Html html='<a href="https://example.com">Link</a>' />
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("https://example.com");
    expect(link!.textContent).toBe("Link");
  });

  it("renders nested HTML structures", () => {
    const { container } = render(
      <Html html="<div><p>Paragraph</p><ul><li>Item</li></ul></div>" />
    );
    expect(container.querySelector("p")).not.toBeNull();
    expect(container.querySelector("li")).not.toBeNull();
  });

  it("renders empty when no html provided", () => {
    const { container } = render(<Html />);
    // Should render without crashing, even with no content
    expect(container.firstChild).toBeTruthy();
  });

  it("has correct displayName", () => {
    expect(Html.displayName).toBe("Html");
  });
});
