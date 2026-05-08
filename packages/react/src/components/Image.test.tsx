import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Image from "./Image";

describe("Image Component", () => {
  it("renders an img element", () => {
    const { container } = render(<Image src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });

  it("sets src attribute from shorthand prop", () => {
    const { container } = render(<Image src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img");
    expect(img!.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("sets alt attribute from shorthand prop", () => {
    const { container } = render(
      <Image src="https://example.com/photo.jpg" alt="A photo" />
    );
    const img = container.querySelector("img");
    expect(img!.getAttribute("alt")).toBe("A photo");
  });

  it("sets src from values.src.url", () => {
    const { container } = render(
      <Image values={{ src: { url: "https://example.com/image.jpg", width: 600 } }} />
    );
    const img = container.querySelector("img");
    expect(img!.getAttribute("src")).toBe("https://example.com/image.jpg");
  });

  it("renders table-based layout in email mode", () => {
    const { container } = render(
      <Image mode="email" src="https://example.com/photo.jpg" />
    );
    const table = container.querySelector('table[role="presentation"]');
    expect(table).not.toBeNull();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });

  it("does not use table layout in web mode", () => {
    const { container } = render(
      <Image mode="web" src="https://example.com/photo.jpg" />
    );
    const table = container.querySelector('table[role="presentation"]');
    expect(table).toBeNull();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });

  it("applies max-width style", () => {
    const { container } = render(<Image src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img");
    expect(img!.style.maxWidth).toBeTruthy();
  });

  it("has correct displayName", () => {
    expect(Image.displayName).toBe("Image");
  });

  // Regression: action shapes (string / storage / render) must all wrap the
  // image in a working <a>. Previously the storage shape silently produced
  // no anchor at all because the exporter read `e.url` on `{ name, values }`.
  describe("action wraps the image in an anchor (regression)", () => {
    const URL = "https://example.com";
    const SRC = "https://example.com/photo.jpg";

    function getAnchorHref(container: HTMLElement): string | null {
      return container.querySelector("a")?.getAttribute("href") ?? null;
    }

    it("renders anchor href from string action", () => {
      const { container } = render(
        <Image src={SRC} action={URL as any} />
      );
      expect(getAnchorHref(container)).toBe(URL);
    });

    it("renders anchor href from storage-shape action", () => {
      const { container } = render(
        <Image
          src={SRC}
          action={
            { name: "web", values: { href: URL, target: "_blank" } } as any
          }
        />
      );
      expect(getAnchorHref(container)).toBe(URL);
    });

    it("renders anchor href in email mode", () => {
      const { container } = render(
        <Image
          mode="email"
          src={SRC}
          action={
            { name: "web", values: { href: URL, target: "_blank" } } as any
          }
        />
      );
      expect(getAnchorHref(container)).toBe(URL);
    });
  });
});
