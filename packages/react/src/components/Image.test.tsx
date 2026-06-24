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

  // Image sizing mirrors Unlayer's value model: src.width/height are the NATURAL
  // size and never set the display width. The default is responsive
  // (autoWidth:true); a fixed display size is autoWidth:false + maxWidth as a
  // percent of the container.
  describe("image sizing follows Unlayer's autoWidth/maxWidth model", () => {
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

    it("a natural width (object src) stays responsive — not pinned", () => {
      const src = imageSrc(
        <Image src={{ url: "https://x/p.jpg", width: 300, height: 200 } as any} />
      );
      expect(src.autoWidth).toBe(true);
      expect(src.width).toBe(300);
      expect(src.maxWidth).toBe("100%");
    });

    it("no width / string src stays responsive (autoWidth:true)", () => {
      expect(imageSrc(<Image src="https://x/p.jpg" />).autoWidth).toBe(true);
      expect(imageSrc(<Image src={{ url: "https://x/p.jpg" } as any} />).autoWidth).toBe(true);
    });

    it("a flat px / number width is the natural size, still responsive", () => {
      const src = imageSrc(<Image src="https://x/p.jpg" width={300 as any} />);
      expect(src.autoWidth).toBe(true);
      expect(src.width).toBe(300);
    });

    it("a percent maxWidth is a fixed display size (autoWidth:false)", () => {
      const src = imageSrc(<Image src="https://x/p.jpg" maxWidth={"50%" as any} />);
      expect(src.maxWidth).toBe("50%");
      expect(src.autoWidth).toBe(false);
    });

    it("a percent width also sets a fixed display size (autoWidth:false)", () => {
      const src = imageSrc(<Image src="https://x/p.jpg" width={"50%" as any} />);
      expect(src.maxWidth).toBe("50%");
      expect(src.autoWidth).toBe(false);
    });

    it("a natural width plus a percent maxWidth keeps both", () => {
      const src = imageSrc(
        <Image src={{ url: "https://x/p.jpg", width: 1600, maxWidth: "50%" } as any} />
      );
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("50%");
      expect(src.width).toBe(1600);
    });

    it("honors an explicit autoWidth", () => {
      const src = imageSrc(
        <Image
          src={{ url: "https://x/p.jpg", width: 300, autoWidth: false, maxWidth: "40%" } as any}
        />
      );
      expect(src.autoWidth).toBe(false);
    });

    it("tolerates a string values.src (no character-spread)", () => {
      const src = imageSrc(<Image values={{ src: "https://x/p.jpg" } as any} />);
      expect(src.url).toBe("https://x/p.jpg");
      expect(src.autoWidth).toBe(true);
    });

    // A string values.src combined with a flat src prop must NOT character-spread
    // the URL (mapSemanticProps merges flat props onto the src group by spreading).
    it("keeps the url when a string values.src is mixed with a flat prop", () => {
      const src = imageSrc(
        <Image values={{ src: "https://x/p.jpg" } as any} maxWidth={"50%" as any} />
      );
      expect(src.url).toBe("https://x/p.jpg");
      expect(src["0"]).toBeUndefined();
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("50%");
    });
  });
});
