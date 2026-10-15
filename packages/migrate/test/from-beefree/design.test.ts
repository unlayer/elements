/**
 * The design is in the shape renderToJson writes: each node with the values Elements writes for it, so its code
 * (designToElements) holds only what the template changed, and renders back to the same design.
 */
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { beefreeToDesign } from "../../src/from-beefree";
import { DesignBuilder, SCHEMA_VERSION } from "../../src/from-beefree/design";
import { column, module, page, row } from "./builders";
import { render, renderToJson, roundTripDifferences, typecheck } from "./harness";

const require = createRequire(import.meta.url);
const React = createRequire(require.resolve("@unlayer/react-elements"))("react") as typeof import("react");
const E = require("@unlayer/react-elements") as typeof import("@unlayer/react-elements");

describe("the design's shape", () => {
  it("each block, row, column and the body hold the values renderToJson writes", () => {
    const h = React.createElement;
    const written = renderToJson(
      h(
        E.Email,
        { contentWidth: "600px" },
        h(
          E.Row,
          {},
          h(
            E.Column,
            {},
            h(E.Paragraph, { html: "<p>x</p>" }),
            h(E.Heading, {}, "H"),
            h(E.Button, {}, "B"),
            h(E.Image, { src: { url: "https://example.com/a.png", width: 10, height: 10, autoWidth: true } }),
            h(E.Divider),
            h(E.Html, { html: "<b>x</b>" }),
            h(E.Menu, { items: [{ text: "A", href: "https://example.com" }] }),
            h(E.Social, { icons: [{ name: "Facebook", url: "https://facebook.com" }] }),
            h(E.Video, { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
          )
        )
      )
    ) as Record<string, any>;

    const b = new DesignBuilder();
    const contents = [
      b.content("text", { text: "<p>x</p>" }),
      b.content("heading", { text: "H" }),
      b.content("button", { text: "B" }),
      b.content("image", { src: { url: "https://example.com/a.png", width: 10, autoWidth: true, maxWidth: "100%", height: 10 } }),
      b.content("divider", {}),
      b.content("html", { html: "<b>x</b>" }),
      b.content("menu", { menu: { items: [{ key: "1", text: "A", link: { name: "web", values: { href: "https://example.com", target: "_blank" } } }] } }),
      b.content("social", { icons: { iconType: "circle", icons: [{ name: "Facebook", url: "https://facebook.com" }] } }),
      b.content("video", { video: { type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg", loading: false } }),
    ];
    const built = b.design([b.row([1], [b.column(contents, {})], {})], { contentWidth: "600px" });
    expect(built).toEqual(written);
    expect(built.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

/** A template with every module the converter maps, as Beefree writes them. */
const kitchenSink = page(
  [
    row(
      [
        column(
          [
            module("text", { text: { html: '<div class="txtTinyMce-wrapper" style="font-size: 12px; line-height: 14px;"><p style="font-size: 14px; line-height: 16px;">Legacy <a href="https://example.com">text</a></p></div>', style: { color: "#333333", "line-height": "120%", "font-family": "inherit" }, computedStyle: { linkColor: "#8a3b8f" } }, style: { "padding-top": "10px" } }),
            module("heading", { heading: { title: "h2", text: "A heading", style: { color: "#111111", "font-size": "30px", "font-weight": "700", "font-family": "'Montserrat', sans-serif", "line-height": "120%", "text-align": "center" } }, style: { "padding-top": "5px" }, mobileStyle: { "font-size": "22px" } }),
            module("paragraph", { paragraph: { html: "<p>One</p><p>Two</p>", style: { "font-size": "16px", "line-height": "150%" }, computedStyle: { paragraphSpacing: "12px" } }, style: {}, computedStyle: { hideContentOnMobile: true } }),
            module("list", { list: { html: "<ol><li>A</li></ol>", tag: "ol", style: {}, computedStyle: { listStyleType: "decimal" } }, style: {} }),
          ],
          6,
          { "background-color": "#eeeeee", "padding-left": "10px" }
        ),
        column(
          [
            module("image", { image: { src: "https://example.com/a.png", alt: "A", href: "https://example.com", width: "600px", height: "300px" }, computedStyle: { class: "center fixedwidth fullwidthOnMobile", width: "150px" }, style: { width: "100%" } }),
            module("button", { button: { href: "https://example.com", label: "<p>Go</p>", style: { "background-color": "#000000", color: "#ffffff", "border-radius": "4px", width: "100%", "padding-top": "8px", "padding-bottom": "8px" } }, hoverStyle: { "background-color": "#222222" }, style: { "text-align": "center" } }),
            module("divider", { divider: { style: { "border-top": "2px dashed #cccccc", width: "60%" } }, computedStyle: { align: "left" }, style: {} }),
            module("spacer", { spacer: { style: { height: "30px" } } }),
            module("spacer", { spacer: { style: { height: "10px", "background-color": "#7747FF" } } }),
          ],
          6
        ),
      ],
      { container: { "background-color": "#cf9d88" }, content: { "background-color": "#ffffff" }, computed: { rowColStackOnMobile: false } }
    ),
    row(
      [
        column([
          module("social", { iconsList: { icons: [{ name: "facebook", image: { src: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/circle-color/facebook@2x.png", href: "https://facebook.com", alt: "Facebook" } }] }, computedStyle: { iconsDefaultWidth: 32, padding: "0 5px 0 5px" }, style: { "text-align": "center" } }),
          module("menu", { menuItemsList: { items: [{ text: "Home", link: { href: "https://example.com" } }] }, computedStyle: { linkColor: "#ff0000", menuItemsSpacing: { "padding-top": "5px", "padding-right": "10px", "padding-bottom": "5px", "padding-left": "10px" } }, style: { color: "#333333", "font-size": "13px" } }),
          module("html", { html: { html: "<table><tr><td>Raw</td></tr></table>" }, style: {} }),
          module("video", { video: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbSrc: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" }, style: {} }),
          module("icons", { iconsList: { icons: [{ image: "https://example.com/i.png", text: "Icon", href: "https://example.com" }] }, computedStyle: { iconHeight: "32px" }, style: {} }),
          module("merge-content", { mergeContent: { name: "Order", value: "[Order]" }, style: {} }),
        ]),
      ],
      { content: { "background-image": "url('https://example.com/bg.png')", "padding-top": "20px", "padding-left": "15px" }, computed: { hideContentOnDesktop: false } }
    ),
  ],
  {
    computed: { messageWidth: "640px" },
    webFonts: [{ name: "Montserrat", fontFamily: "'Montserrat', sans-serif", url: "https://fonts.googleapis.com/css?family=Montserrat" }],
  }
);

describe("the design's code", () => {
  it("renders back to the same design, with no codegen warnings, and type-checks", () => {
    const { design, fallbacks } = beefreeToDesign(kitchenSink);
    expect(fallbacks.map((f) => f.module)).toEqual(["icons", "merge-content"]);
    const rendered = render(design, "KitchenSink");
    expect(rendered.codegenWarnings).toEqual([]);
    expect(roundTripDifferences(design, rendered.back)).toEqual([]);
    expect(typecheck(new Map([["KitchenSink", rendered.code]]))).toEqual([]);
    for (const words of ["Legacy", "A heading", "One", "Two", "Go", "Home", "Raw", "[Order]", "Icon"]) expect(rendered.html).toContain(words);
    // Written as props, not `values`.
    expect(rendered.code).not.toContain("values=");
  });
});
