import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Image from "./Image";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import { renderToJson } from "../utils/render-to-json";

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

  // Regression: an explicit image width must pin the DISPLAY width so
  // it survives the Builder round-trip. With autoWidth:true the Builder
  // auto-sizes to the natural src.width and the intended width is dropped on
  // selection. An explicit width must emit autoWidth:false + maxWidth:"<w>px";
  // no explicit width stays responsive (autoWidth:true).
  describe("explicit width pins display width for Builder round-trip", () => {
    function imageSrc(el: React.ReactElement): any {
      const json = renderToJson(
        <Body>
          <Row>
            <Column>{el}</Column>
          </Row>
        </Body>
      );
      return (json as any).body.rows[0].columns[0].contents[0].values.src;
    }

    it("explicit width → autoWidth:false + maxWidth in px", () => {
      const src = imageSrc(
        <Image src={{ url: "https://x/p.jpg", width: 300, height: 200 } as any} />
      );
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("300px");
    });

    it("no explicit width → stays responsive (autoWidth:true)", () => {
      expect(imageSrc(<Image src="https://x/p.jpg" />).autoWidth).toBe(true);
      expect(imageSrc(<Image src={{ url: "https://x/p.jpg" } as any} />).autoWidth).toBe(true);
    });

    // The fix must apply regardless of how width is passed, and flat src props
    // (width/maxWidth) must not be clobbered by the src mapping.
    it("flat width prop also pins the width (string and object src)", () => {
      expect(imageSrc(<Image src="https://x/p.jpg" width={300 as any} />).autoWidth).toBe(false);
      expect(imageSrc(<Image src="https://x/p.jpg" width={300 as any} />).maxWidth).toBe("300px");
      expect(imageSrc(<Image src={{ url: "https://x/p.jpg" } as any} width={300 as any} />).maxWidth).toBe("300px");
    });

    it("flat maxWidth prop is preserved (not clobbered) and pins the size", () => {
      const src = imageSrc(<Image src="https://x/p.jpg" maxWidth={"50%" as any} />);
      expect(src.maxWidth).toBe("50%");
      expect(src.autoWidth).toBe(false);
    });

    it("honors an explicit autoWidth even with a width", () => {
      const src = imageSrc(
        <Image src={{ url: "https://x/p.jpg", width: 300, autoWidth: true } as any} />
      );
      expect(src.autoWidth).toBe(true);
    });

    it("width via the values escape hatch also pins the width", () => {
      const src = imageSrc(
        <Image values={{ src: { url: "https://x/p.jpg", width: 300 } } as any} />
      );
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("300px");
    });

    it("tolerates a string values.src (no character-spread)", () => {
      const src = imageSrc(<Image values={{ src: "https://x/p.jpg" } as any} />);
      expect(src.url).toBe("https://x/p.jpg");
      expect(src.autoWidth).toBe(true);
    });

    // A string values.src combined with a flat src prop must NOT character-spread
    // the URL (mapSemanticProps merges flat props onto the src group by spreading).
    it("keeps the url when a string values.src is mixed with a flat width", () => {
      const src = imageSrc(
        <Image values={{ src: "https://x/p.jpg" } as any} width={300 as any} />
      );
      expect(src.url).toBe("https://x/p.jpg");
      expect(src["0"]).toBeUndefined();
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("300px");
    });
  });
});
