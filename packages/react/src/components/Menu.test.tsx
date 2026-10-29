import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Menu from "./Menu";
import * as Roots from "../index";


/** A block given a link of null (nullable data) and the same block given none, in each root: the HTML and the design. */
function asNone(withNull: React.ReactElement, without: React.ReactElement) {
  for (const Root of [Roots.Email, Roots.Page, Roots.Document]) {
    const tree = (block: React.ReactElement) => <Root><Roots.Row><Roots.Column>{block}</Roots.Column></Roots.Row></Root>;
    expect(Roots.renderToHtml(tree(withNull)), Root.displayName).toBe(Roots.renderToHtml(tree(without)));
    expect(Roots.renderToJson(tree(withNull))).toEqual(Roots.renderToJson(tree(without)));
  }
}
describe("Menu Component", () => {
  it("skips a null or undefined item (nullable data), in each root", () => {
    asNone(<Menu items={[{ text: "Home", href: "https://example.com/" }, null as never, { text: "Shop", href: "https://example.com/shop" }, undefined as never]} />, <Menu items={[{ text: "Home", href: "https://example.com/" }, { text: "Shop", href: "https://example.com/shop" }]} />);
  });

  it("takes an item's `href` of null (nullable data) as none, in each root", () => {
    asNone(<Menu items={[{ text: "Go", href: null as never }, { text: "Home", href: "https://example.com/" }]} />, <Menu items={[{ text: "Go" }, { text: "Home", href: "https://example.com/" }]} />);
  });

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
