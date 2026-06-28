import { describe, it, expect } from "vitest";
import React from "react";
import Email from "./Email";
import Page from "./Page";
import Image from "./Image";
import Row from "./Row";
import { Column } from "./Column";
import { ColumnLayouts } from "../layouts/ColumnLayouts";
import { renderToJson } from "../utils/render-to-json";
import { renderToHtml } from "../utils/render-to-html";
import { bodyContentWidthPx } from "../utils/image-sizing";

// Regression guard for the design-JSON round-trip: a fixed image width must pin
// as autoWidth:false + a PERCENT maxWidth (of the column's content slot) so an
// editor keeps it instead of falling back to the image's natural dimensions. A
// responsive image (no width) must stay autoWidth:true.

/** Pull the first image's resolved src out of a renderToJson design. */
function imgSrc(element: React.ReactElement): Record<string, any> {
  const json = renderToJson(element);
  return json.body.rows[0].columns[0].contents[0].values.src as Record<string, any>;
}

describe("Image fixed-width round-trip (renderToJson)", () => {
  it("numeric width pins: autoWidth:false + percent of the column slot", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
        </Row>
      </Email>
    );
    // 600 content − 10px×2 default container padding = 580 slot → 300/580 ≈ 51.72%
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("px-string width pins identically to the numeric form", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width="300px" />
          </Column>
        </Row>
      </Email>
    );
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("a bare numeric-string contentWidth is treated as px, matching the renderer", () => {
    const src = imgSrc(
      <Email contentWidth={"600" as any}>
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
        </Row>
      </Email>
    );
    // "600" must size against 600 (not the 500 fallback) → same as "600px".
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("a percent contentWidth falls back to the responsive base width (not the % value)", () => {
    const src = imgSrc(
      <Email contentWidth={"50%" as any}>
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
        </Row>
      </Email>
    );
    // % isn't a fixed px slot → base 500 → 300/(500−20) = 62.5%.
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("62.5%");
  });

  it("percent width stays a percent (already canonical)", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width="50%" />
          </Column>
        </Row>
      </Email>
    );
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("50%");
  });

  it("no width stays responsive (autoWidth:true) — no regression", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
        </Row>
      </Email>
    );
    expect(src.autoWidth).toBe(true);
    expect(src.maxWidth).toBe("100%");
  });

  it("a pin wider than its column clamps to 100% (3-equal columns)", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.ThreeEqual}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
        </Row>
      </Email>
    );
    // 600/3 = 200 − 20 padding = 180 slot; 300 > 180 → clamps to 100%
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("100%");
  });

  it("the pin scales with column share (second of two columns)", () => {
    const json = renderToJson(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.TwoEqual}>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
          <Column>
            <Image src="https://x/p.png" width={120} />
          </Column>
        </Row>
      </Email>
    );
    const src = json.body.rows[0].columns[1].contents[0].values.src as Record<string, any>;
    // 600/2 = 300 − 20 = 280 slot → 120/280 ≈ 42.86%
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("42.86%");
  });

  it("leaves a non-px maxWidth on a pinned src untouched (no bogus percent)", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image
              values={{ src: { url: "https://x/p.png", autoWidth: false, maxWidth: "1.5em" } } as any}
            />
          </Column>
        </Row>
      </Email>
    );
    // A non-px unit is not a px pin → the conversion pass must leave it alone,
    // not parseFloat it into a tiny percent.
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("1.5em");
  });

  it("a px width does not pollute the natural src dimensions", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src={{ url: "https://x/p.png", width: 1200, height: 600 }} width={300} />
          </Column>
        </Row>
      </Email>
    );
    expect(src.width).toBe(1200); // natural width untouched
    expect(src.height).toBe(600);
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("an explicit percent maxWidth on the src escape hatch is preserved (not overwritten by natural width)", () => {
    const src = imgSrc(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image values={{ src: { url: "https://x/p.png", width: 1600, maxWidth: "50%" } }} />
          </Column>
        </Row>
      </Email>
    );
    expect(src.width).toBe(1600);
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("50%");
  });
});

describe("Image fixed-width rendering (renderToHtml)", () => {
  it("renders a responsive percent width, never a hard px that overflows", () => {
    const html = renderToHtml(
      <Page contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
        </Row>
      </Page>
    );
    // The pin renders as `width: <pct>%` (caps at the slot via max-width), so the
    // image shrinks with a narrow column instead of forcing a fixed 300px box.
    expect(html).toMatch(/width:\s*51\.72%/);
    expect(html).not.toMatch(/width:\s*300px/);
  });

  it("caps a too-wide pin at 100% in a narrow column", () => {
    const html = renderToHtml(
      <Page contentWidth="600px">
        <Row layout={ColumnLayouts.ThreeEqual}>
          <Column>
            <Image src="https://x/p.png" width={300} />
          </Column>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toMatch(/width:\s*100%/);
    expect(html).not.toMatch(/width:\s*300px/);
  });
});

describe("bodyContentWidthPx (one px-parse shared by Row grid CSS + image geometry)", () => {
  it("number / px-string / bare-numeric-string resolve to px", () => {
    expect(bodyContentWidthPx(600)).toBe(600);
    expect(bodyContentWidthPx("600px")).toBe(600);
    expect(bodyContentWidthPx("600")).toBe(600);
  });

  it("percent / auto / missing fall back (never a parseInt artifact like 50)", () => {
    expect(bodyContentWidthPx("50%")).toBe(500);
    expect(bodyContentWidthPx("auto")).toBe(500);
    expect(bodyContentWidthPx(undefined)).toBe(500);
  });

  it("honors a custom fallback", () => {
    expect(bodyContentWidthPx("50%", 600)).toBe(600);
  });
});

describe("renderToJson row cells default to the Column count", () => {
  it("a stray non-Column child is not counted as a cell (correct column-share math)", () => {
    const json = renderToJson(
      <Email contentWidth="600px">
        <Row>
          <Column>
            <Image src="https://x/p.png" width={120} />
          </Column>
          <Column>
            <Image src="https://x/p.png" />
          </Column>
          {/* invalid: a stray non-Column child (warned + skipped) */}
          <Image src="https://x/stray.png" />
        </Row>
      </Email>
    );
    const row = json.body.rows[0];
    expect(row.cells).toEqual([1, 1]); // 2 Columns, not 3 children
    // First column sized against the 2-col slot (600/2 − 20 = 280): 120/280 =
    // 42.86%, not 66.67% (which a 3-cell miscount would produce).
    const src = row.columns[0].contents[0].values.src as Record<string, any>;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("42.86%");
  });
});

describe("object-src width pins identically to the flat width prop (round-trip parity)", () => {
  const inOneCol = (img: React.ReactElement) => (
    <Email contentWidth="600px">
      <Row layout={ColumnLayouts.OneColumn}>
        <Column>{img}</Column>
      </Row>
    </Email>
  );

  it("src={{ width }} pins (autoWidth:false + percent), not autoWidth:true", () => {
    const src = imgSrc(inOneCol(<Image src={{ url: "https://x/p.png", width: 300 } as any} />));
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("the documented values={{ src: { width } }} full-control form pins too", () => {
    const src = imgSrc(inOneCol(<Image values={{ src: { url: "https://x/p.png", width: 300 } } as any} />));
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
  });

  it("src width + height pins and keeps the height for aspect", () => {
    const src = imgSrc(inOneCol(<Image src={{ url: "https://x/p.png", width: 300, height: 200 } as any} />));
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("51.72%");
    expect(src.height).toBe(200);
  });

  it("an explicit autoWidth on src is honored (escape hatch stays responsive)", () => {
    const src = imgSrc(inOneCol(<Image src={{ url: "https://x/p.png", width: 300, autoWidth: true } as any} />));
    expect(src.autoWidth).toBe(true);
  });
});
