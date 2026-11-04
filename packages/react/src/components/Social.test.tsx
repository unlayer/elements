import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Social from "./Social";

describe("Social Component", () => {
  it("renders icon images with correct URLs", () => {
    const { container } = render(
      <Social icons={[{ name: "Facebook", url: "https://facebook.com/page" }]} />
    );
    const facebookLink = container.querySelector("a");
    expect(facebookLink?.getAttribute("href")).toBe("https://facebook.com/page");
    expect(facebookLink?.querySelector("img")?.getAttribute("alt")).toBe("Facebook icon");
  });

  it("renders img elements for icons", () => {
    const { container } = render(
      <Social icons={[{ name: "Facebook", url: "https://facebook.com" }]} />
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders a placeholder icon when it has none", () => {
    const { container } = render(<Social />);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("social/icons/default");
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
    const links = Array.from(container.querySelectorAll("a"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://facebook.com", "https://x.com"]);
  });

  it("has correct displayName", () => {
    expect(Social.displayName).toBe("Social");
  });
});
