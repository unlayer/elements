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
});
