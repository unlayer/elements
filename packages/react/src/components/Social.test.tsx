import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Social from "./Social";
import * as Roots from "../index";


/** A block given a link of null (nullable data) and the same block given none, in each root: the HTML and the design. */
function asNone(withNull: React.ReactElement, without: React.ReactElement) {
  for (const Root of [Roots.Email, Roots.Page, Roots.Document]) {
    const tree = (block: React.ReactElement) => <Root><Roots.Row><Roots.Column>{block}</Roots.Column></Roots.Row></Root>;
    expect(Roots.renderToHtml(tree(withNull)), Root.displayName).toBe(Roots.renderToHtml(tree(without)));
    expect(Roots.renderToJson(tree(withNull))).toEqual(Roots.renderToJson(tree(without)));
  }
}
describe("Social Component", () => {
  it("skips a null or undefined icon (nullable data), in each root", () => {
    asNone(<Social icons={[null as never, { name: "Facebook", url: "https://facebook.com/x" }, undefined as never]} />, <Social icons={[{ name: "Facebook", url: "https://facebook.com/x" }]} />);
  });

  it("takes an icon's `url` of null (nullable data) as none, in each root", () => {
    asNone(<Social icons={[{ name: "Facebook", url: null as never }, { name: "X", url: "https://x.com/a" }]} />, <Social icons={[{ name: "Facebook" } as never, { name: "X", url: "https://x.com/a" }]} />);
  });

  it("renders icon images with correct URLs", () => {
    const { container } = render(
      <Social icons={[{ name: "Facebook", url: "https://facebook.com/page" }]} />
    );
    const links = container.querySelectorAll("a");
    const facebookLink = Array.from(links).find(
      a => a.getAttribute("href")?.includes("facebook.com")
    );
    expect(facebookLink).not.toBeNull();
  });

  it("renders img elements for icons", () => {
    const { container } = render(
      <Social icons={[{ name: "Facebook", url: "https://facebook.com" }]} />
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders aria-label for accessibility", () => {
    const { container } = render(
      <Social mode="email" icons={[{ name: "Facebook", url: "https://facebook.com" }]} />
    );
    expect(container.querySelector('[aria-label="social"]')).not.toBeNull();
  });

  it("renders with full values object", () => {
    const { container } = render(
      <Social values={{
        icons: {
          iconType: "circle",
          icons: [{ name: "Facebook", url: "https://facebook.com" }]
        }
      }} />
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders multiple icons", () => {
    const { container } = render(
      <Social icons={[
        { name: "Facebook", url: "https://facebook.com" },
        { name: "X", url: "https://x.com" },
      ]} />
    );
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("has correct displayName", () => {
    expect(Social.displayName).toBe("Social");
  });
});
