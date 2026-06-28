import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Image from "./Image";
import Body from "./Body";
import Email from "./Email";
import Row from "./Row";
import { Column } from "./Column";
import { ColumnLayouts, type ColumnLayout } from "../layouts/ColumnLayouts";
import { renderToJson } from "../utils/render-to-json";
import { renderToHtml } from "../utils/render-to-html";

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

    it("an object-src width pins as display intent (like the flat width prop)", () => {
      // The documented full-control form `src={{ width }}` must pin and survive a
      // round-trip, same as `width={…}` — not serialize autoWidth:true.
      const src = imageSrc(
        <Image src={{ url: "https://x/p.jpg", width: 300, height: 200 } as any} />
      );
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("62.5%"); // 300 / (500 default − 20px slot)
      expect(src.width).toBe(300); // natural/aspect fields preserved
      expect(src.height).toBe(200);
    });

    it("no width / string src stays responsive (autoWidth:true)", () => {
      expect(imageSrc(<Image src="https://x/p.jpg" />).autoWidth).toBe(true);
      expect(imageSrc(<Image src={{ url: "https://x/p.jpg" } as any} />).autoWidth).toBe(true);
    });

    it("a flat px / number width pins to a percent of the content slot", () => {
      // Display intent, not natural size: 300 / (500 default contentWidth − 20px
      // container padding) = 62.5%, stored as autoWidth:false so it survives a
      // Builder round-trip.
      const src = imageSrc(<Image src="https://x/p.jpg" width={300 as any} />);
      expect(src.autoWidth).toBe(false);
      expect(src.maxWidth).toBe("62.5%");
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

  // Regression: an image must size against the real available width
  // (contentWidth × column fraction), not a fixed fallback. The Column threads
  // its body/column context to the exporter so this matches the editor.
  describe("sizes against contentWidth × column width (threaded to the exporter)", () => {
    const big = { url: "https://x/p.jpg", width: 1200, height: 600 };
    const imgWidth = (html: string) => {
      const m = html.match(/<img[^>]*\bwidth="(\d+)"/);
      return m ? Number(m[1]) : null;
    };
    const renderImg = (contentWidth: string, layout: ColumnLayout, cols: number) => {
      const columns = Array.from({ length: cols }, (_, i) => (
        <Column key={i}>
          <Image src={big} />
        </Column>
      ));
      return renderToHtml(
        <Email contentWidth={contentWidth}>
          <Row layout={layout}>{columns}</Row>
        </Email>
      );
    };

    it("a full-width image fills the content width (not the 500 fallback)", () => {
      expect(imgWidth(renderImg("600px", ColumnLayouts.OneColumn, 1))).toBe(600);
    });

    it("an image in a 3-column row sizes to its column (~1/3), staying responsive", () => {
      expect(imgWidth(renderImg("600px", ColumnLayouts.ThreeEqual, 3))).toBe(200);
    });

    it("respects a wider contentWidth", () => {
      expect(imgWidth(renderImg("900px", ColumnLayouts.OneColumn, 1))).toBe(900);
    });
  });
});
