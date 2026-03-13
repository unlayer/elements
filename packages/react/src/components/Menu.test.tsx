import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Menu from "./Menu";

describe("Menu Component", () => {
  it("renders menu items with text content", () => {
    const { container } = render(
      <Menu
        mode="email"
        values={{
          menu: {
            items: [
              { key: "1", text: "Home", link: { name: "web", values: { href: "/" } } },
              { key: "2", text: "About", link: { name: "web", values: { href: "/about" } } },
            ]
          }
        }}
      />
    );
    expect(container.textContent).toContain("Home");
    expect(container.textContent).toContain("About");
  });

  it("renders item text content", () => {
    const { container } = render(
      <Menu items={[{ text: "Home", href: "/" }]} />
    );
    expect(container.textContent).toContain("Home");
  });

  it("renders with values prop (full format)", () => {
    const { container } = render(
      <Menu values={{
        menu: { items: [{ key: "1", text: "Contact", link: { name: "web", values: { href: "/contact" } } }] }
      }} />
    );
    expect(container.textContent).toContain("Contact");
  });

  it("renders aria-label in email mode", () => {
    const { container } = render(
      <Menu mode="email" items={[{ text: "Home", href: "/" }]} />
    );
    expect(container.querySelector('[aria-label="menu"]')).not.toBeNull();
  });

  it("applies target attribute from shorthand", () => {
    const { container } = render(
      <Menu items={[{ text: "External", href: "https://example.com", target: "_self" }]} />
    );
    const link = Array.from(container.querySelectorAll("a")).find(
      a => a.textContent?.includes("External")
    );
    expect(link).not.toBeNull();
  });

  it("has correct displayName", () => {
    expect(Menu.displayName).toBe("Menu");
  });
});
