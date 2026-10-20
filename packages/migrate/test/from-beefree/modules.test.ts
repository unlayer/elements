import { describe, expect, it } from "vitest";
import { beefreeToDesign } from "../../src/from-beefree";
import { blocks, column, module, page, row, single } from "./builders";

type Plain = Record<string, any>;

/** The one block a single-module template converts to, and the conversion. */
function convert(mod: Plain, options?: Parameters<typeof single>[1]) {
  const result = beefreeToDesign(single(mod, options));
  return { ...result, blocks: blocks(result.design), block: blocks(result.design)[0] };
}

const pad = (t: number, r = t, b = t, l = r) => ({ "padding-top": `${t}px`, "padding-right": `${r}px`, "padding-bottom": `${b}px`, "padding-left": `${l}px` });

describe("text modules", () => {
  it("the legacy `text` module: TinyMCE's wrapper lifted into the block, line heights left to it, paragraphs without margins", () => {
    const html =
      '<div class="txtTinyMce-wrapper" style="line-height: 14px; font-size: 12px; font-family: &#39;Montserrat&#39;, sans-serif;" data-mce-style="line-height: 14px;">' +
      '<p style="font-size: 14px; line-height: 16px; text-align: center; word-break: break-word;" data-mce-style="font-size: 14px;"><!--(figmeta)eyJmaWxl(/figmeta)--><span style="font-size: 28px; line-height: 33px;">Good Times</span></p>' +
      '<p style="line-height: 16px;"><a href="https://example.com" style="text-decoration: underline;">Read more</a></p></div>';
    const { block, warnings } = convert(module("text", { text: { html, style: { color: "#3f3a7d", "font-family": "inherit", "line-height": "120%" }, computedStyle: { linkColor: "#8a3b8f" } }, style: pad(10, 20) }), {
      webFonts: [{ name: "Montserrat", fontFamily: "'Montserrat', sans-serif", url: "https://fonts.googleapis.com/css?family=Montserrat" }],
    });
    expect(block.type).toBe("text");
    expect(block.values).toMatchObject({
      containerPadding: "10px 20px 10px 20px",
      fontSize: "12px",
      lineHeight: "120%",
      color: "#3f3a7d",
      fontFamily: { label: "Montserrat", value: "'Montserrat', sans-serif", url: "https://fonts.googleapis.com/css?family=Montserrat" },
      linkStyle: { inherit: false, linkColor: "#8a3b8f" },
    });
    expect(block.values.text).toBe(
      '<p style="margin: 0; font-size: 14px; text-align: center;"><span style="font-size: 28px;">Good Times</span></p>' +
        '<p style="margin: 0;"><a href="https://example.com" style="text-decoration: underline; color: #8a3b8f;">Read more</a></p>'
    );
    expect(warnings).toEqual([]);
  });

  it("the legacy `text` module's links keep their own color, as Beefree exports them; its link color is for links without one", () => {
    const html = '<p><a href="https://example.com/a" style="color: #000000;">Own</a> and <a href="https://example.com/b">module</a></p>';
    const linked = (linkColor?: string) => convert(module("text", { text: { html, style: {}, computedStyle: linkColor ? { linkColor } : {} }, style: {} }), { computed: { linkColor: "#0068A5" } }).block;
    expect(linked("#f7dd72").values.text).toBe('<p style="margin: 0;"><a href="https://example.com/a" style="color: #000000;">Own</a> and <a href="https://example.com/b" style="color: #f7dd72;">module</a></p>');
    // Without a link color of its own, the body's.
    expect(linked().values.text).toBe('<p style="margin: 0;"><a href="https://example.com/a" style="color: #000000;">Own</a> and <a href="https://example.com/b" style="color: #0068A5;">module</a></p>');
  });

  it("keeps a wrapper that sets more than the block can hold", () => {
    const { block } = convert(module("text", { text: { html: '<div style="direction: rtl; font-size: 13px;"><p>שלום</p></div>', style: {} }, style: {} }));
    expect(block.values.text).toBe('<div style="direction: rtl; font-size: 13px;"><p style="margin: 0;">שלום</p></div>');
  });

  it("merge tags and special links are the text they stand for (Beefree's export writes them so)", () => {
    const html =
      '<p>Hi <code spellcheck="false" data-bee-type="mergetag" data-bee-code="" data-bee-name="First name">{{contact.first_name}}</code>, ' +
      '<code data-bee-code="" data-bee-type="speciallink" data-bee-name="unsubscribe" data-bee-value="unsubscribe"><q>no-content</q></code> ' +
      '<code data-bee-code="" data-bee-type="mergetag" data-bee-value="{{ site.city }}"><q>no-content</q></code></p>';
    const { block } = convert(module("paragraph", { paragraph: { html, style: {}, computedStyle: {} }, style: {} }));
    expect(block.values.text).toBe('<p style="margin: 0;">Hi {{contact.first_name}}, unsubscribe {{ site.city }}</p>');
  });

  it("`paragraph`: its styles as the block's, paragraph spacing between paragraphs, links in its link color", () => {
    const { block } = convert(
      module("paragraph", {
        paragraph: {
          html: '<p>One</p><p>Two <a href="#" style="color: #f75c03;">link</a></p>',
          style: { color: "#555555", "font-family": "inherit", "font-size": "16px", "font-weight": "700", "letter-spacing": "1px", "line-height": "150%", "text-align": "center" },
          computedStyle: { linkColor: "#0068A5", paragraphSpacing: "16px" },
        },
        style: pad(5),
        mobileStyle: { "font-size": "14px", "text-align": "left", ...pad(2) },
      })
    );
    expect(block.values).toMatchObject({ fontSize: "16px", color: "#555555", fontWeight: 700, letterSpacing: "1px", lineHeight: "150%", textAlign: "center", containerPadding: "5px" });
    expect(block.values.fontFamily).toBeUndefined();
    expect(block.values.text).toBe('<p style="margin: 0; margin-bottom: 16px;">One</p><p style="margin: 0;">Two <a href="#" style="color: #0068A5;">link</a></p>');
    expect(block.values._override).toEqual({ mobile: { containerPadding: "2px", fontSize: "14px", textAlign: "left" } });
  });

  it("a text block without a color of its own takes the body's (Elements writes a color)", () => {
    const { block } = convert(module("paragraph", { paragraph: { html: "<p>x</p>", style: {} } }), { body: { color: "#123456" } });
    expect(block.values.color).toBe("#123456");
  });

  it("`heading`: its level, text and styles; the editor's placeholder span dropped", () => {
    const { block } = convert(
      module("heading", {
        heading: {
          title: "h2",
          text: '<span class="tinyMce-placeholder">Small Actions.<br/>Big Impact.</span>',
          style: { color: "#0c3c36", "font-size": "64px", "font-family": "'Plus Jakarta Sans','Helvetica'", "font-weight": "700", "letter-spacing": "-2px", "line-height": "100%", "link-color": "#0c3c36", "text-align": "center" },
        },
        style: { ...pad(4, 10, 14, 10), "text-align": "center", width: "100%" },
        mobileStyle: { "font-size": "32px" },
      })
    );
    expect(block.type).toBe("heading");
    expect(block.values).toMatchObject({ headingType: "h2", text: "Small Actions.<br />Big Impact.", fontSize: "64px", fontWeight: 700, letterSpacing: "-2px", lineHeight: "100%", textAlign: "center", color: "#0c3c36" });
    expect(block.values.fontFamily).toEqual({ label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', 'Helvetica'" });
    // No links: no link setting.
    expect(block.values.linkStyle).toEqual({ inherit: true, linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true });
    expect(block.values._override).toEqual({ mobile: { fontSize: "32px" } });
  });

  it("`list`: a text block with the list, its marker style, and no browser margins", () => {
    const { block } = convert(
      module("list", {
        list: { html: '<ul start="1"><li>One</li><li>Two</li></ul>', tag: "ul", style: { color: "#26045D", "font-size": "16px", "line-height": "150%" }, computedStyle: { listStyleType: "square", liSpacing: "4px" } },
        style: pad(0, 15, 9, 20),
      })
    );
    expect(block.type).toBe("text");
    expect(block.values.text).toBe('<ul start="1" style="margin-top: 0; margin-bottom: 0; list-style-type: square;"><li style="margin-bottom: 4px;">One</li><li style="margin-bottom: 4px;">Two</li></ul>');
  });
});

describe("buttons", () => {
  it("label, link, colors (hover as normal without a hover style), padding, border, radius and alignment", () => {
    const { block } = convert(
      module("button", {
        button: {
          href: "https://example.com",
          target: "_self",
          label: '<div class="txtTinyMce-wrapper" style="font-size: 12px; line-height: 24px;"><p style="font-family: inherit; font-size: 16px; line-height: 32px;"><strong>GET IT</strong></p><p>NOW</p></div>',
          style: {
            "background-color": "#eb3f1c",
            color: "#ffffff",
            "border-top": "2px solid #B21420",
            "border-right": "2px solid #B21420",
            "border-bottom": "2px solid #B21420",
            "border-left": "2px solid #B21420",
            "border-radius": "34px",
            "font-family": "inherit",
            "line-height": "200%",
            ...pad(5, 20),
            width: "auto",
          },
        },
        style: { ...pad(10), "text-align": "left" },
      })
    );
    expect(block.type).toBe("button");
    expect(block.values).toMatchObject({
      href: { name: "web", values: { href: "https://example.com", target: "_blank" } },
      buttonColors: { color: "#ffffff", backgroundColor: "#eb3f1c", hoverColor: "#ffffff", hoverBackgroundColor: "#eb3f1c" },
      fontSize: "12px",
      lineHeight: "200%",
      textAlign: "left",
      padding: "5px 20px 5px 20px",
      borderRadius: "34px",
      size: { autoWidth: true, width: "100%" },
      border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#B21420", borderLeftWidth: "2px" },
      // Paragraphs as spans, a line break between; a span left with nothing to set isn't kept.
      text: '<span style="font-size: 16px;"><strong>GET IT</strong></span><br>NOW',
    });
  });

  it("a hover style, a fixed width as the percent of its column it is (290px of 590px), and a plain label", () => {
    const { block } = convert(
      module("button", {
        button: { href: "", label: "Shop", style: { "background-color": "#000", color: "#fff", "font-size": "18px", "font-weight": "600", width: "290px" } },
        hoverStyle: { "background-color": "#333", color: "#eee" },
        style: pad(5),
      })
    );
    expect(block.values).toMatchObject({ text: "Shop", fontSize: "18px", fontWeight: 600, size: { autoWidth: false, width: "49.15%" } });
    expect(block.values.buttonColors).toEqual({ color: "#fff", backgroundColor: "#000", hoverColor: "#eee", hoverBackgroundColor: "#333" });
  });
});

describe("images", () => {
  const image = (computedStyle: Plain, image: Plain = {}, extra: Plain = {}) =>
    convert(module("image", { image: { src: "https://cdn.example.com/a.png", alt: "A", href: "", width: "300px", height: "150px", ...image }, computedStyle, style: { ...pad(0), width: "100%" }, ...extra }));

  it("`autowidth`: its natural size, up to its column (Unlayer's automatic width)", () => {
    const { block } = image({ class: "center autowidth", width: "300px" }, { href: "https://example.com", target: "_self" });
    expect(block.values).toMatchObject({
      src: { url: "https://cdn.example.com/a.png", width: 300, height: 150, autoWidth: true, maxWidth: "100%" },
      altText: "A",
      textAlign: "center",
      action: { name: "web", values: { href: "https://example.com", target: "_blank" } },
    });
  });

  it("`fixedwidth`: the width it's shown at, as the percent of its column the editor keeps", () => {
    const { block } = image({ class: "left fixedwidth", width: "150px" });
    expect(block.values.src).toMatchObject({ autoWidth: false, maxWidth: "25%" });
    expect(block.values.textAlign).toBe("left");
  });

  it("`fullwidth` across its column, `fullwidthOnMobile` across it on phones", () => {
    expect(image({ class: "center fullwidth" }).block.values.src).toMatchObject({ autoWidth: false, maxWidth: "100%" });
    const { block } = image({ class: "right fixedwidth fullwidthOnMobile", width: "300px" });
    expect(block.values.src.maxWidth).toBe("50%");
    expect(block.values.textAlign).toBe("right");
    expect(block.values._override).toEqual({ mobile: { src: { autoWidth: false, maxWidth: "100%" } } });
  });

  it("rounded corners are reported; an image without a source is left out and reported", () => {
    expect(image({ class: "center" }, {}, { style: { "border-radius": "15px" } }).warnings.map((w) => w.reason)).toContain("image-radius");
    const empty = image({ class: "center" }, { src: "" });
    expect(empty.blocks).toEqual([]);
    expect(empty.warnings[0].message).toMatch(/^Row 1, column 1, module 1 \(image\): the image has no source/);
  });
});

describe("dividers and space", () => {
  it("a divider Beefree draws: its line, width and alignment", () => {
    const { block } = convert(module("divider", { divider: { style: { "border-top": "1px dotted #CCCCCC", width: "55%" } }, computedStyle: { align: "left" }, style: pad(10) }));
    expect(block.values).toMatchObject({ width: "55%", textAlign: "left", containerPadding: "10px", border: { borderTopWidth: "1px", borderTopStyle: "dotted", borderTopColor: "#CCCCCC" } });
  });

  it("an invisible divider (Beefree's space) and a spacer: an invisible Divider whose padding is the height", () => {
    const divider = convert(module("divider", { divider: { style: { "border-top": "0px solid transparent", height: "20px", width: "100%" } }, style: pad(5) })).block;
    expect(divider.values.containerPadding).toBe("25px 5px 5px 5px");
    expect(divider.values.border).toEqual({ borderTopWidth: "0px", borderTopStyle: "solid", borderTopColor: "transparent" });
    // 0.0.1 dividers have no height: a transparent border's width is the space.
    expect(convert(module("divider", { divider: { style: { "border-top": "10px solid transparent", width: "100%" } }, style: pad(0) })).block.values.containerPadding).toBe("10px 0px 0px 0px");
    const spacer = convert(module("spacer", { spacer: { style: { height: "60px" } }, mobileStyle: { height: "20px" } })).block;
    expect(spacer.values).toMatchObject({ containerPadding: "60px 0px 0px 0px", border: { borderTopWidth: "0px" }, _override: { mobile: { containerPadding: "20px 0px 0px 0px" } } });
  });

  it("a spacer with a background color: a Divider that thick, in that color", () => {
    const { block } = convert(module("spacer", { spacer: { style: { height: "20px", "background-color": "#7747FF" } } }));
    expect(block.values).toMatchObject({ containerPadding: "0px", border: { borderTopWidth: "20px", borderTopStyle: "solid", borderTopColor: "#7747FF" } });
  });
});

describe("social icons and menus", () => {
  it("social: networks named as the editor names them, each keeping its image, the set's shape as the icon type", () => {
    const icon = (name: string, set: string, file: string, href: string, extra: Plain = {}) => ({
      name,
      type: "follow",
      image: { prefix: "", alt: name, title: name, src: `https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/${set}/${file}@2x.png`, href },
      text: "",
      ...extra,
    });
    const { block, warnings } = convert(
      module("social", {
        iconsList: { icons: [icon("facebook", "circle-white", "facebook", "https://facebook.com/x"), icon("social icon", "circle-white", "linkedin", "https://linkedin.com/x"), icon("Xbox", "circle-white", "xbox", "https://xbox.com")] },
        computedStyle: { iconsDefaultWidth: 32, padding: "0 5px 0 5px" },
        style: { ...pad(10), "text-align": "left" },
      })
    );
    expect(block.type).toBe("social");
    expect(block.values).toMatchObject({ align: "left", iconSize: 32, spacing: 10 });
    expect(block.values.icons.iconType).toBe("circle-white");
    expect(block.values.icons.icons.map((i: Plain) => [i.name, i.url])).toEqual([
      ["Facebook", "https://facebook.com/x"],
      ["LinkedIn", "https://linkedin.com/x"],
      ["Xbox", "https://xbox.com"],
    ]);
    expect(block.values.icons.icons[0].imgUrl).toMatch(/circle-white\/facebook@2x\.png$/);
    expect(warnings.map((w) => w.reason)).toEqual(["social-custom-icon"]);
  });

  it("menu: items with their links, colors, spacing and layout; a phone hamburger reported", () => {
    const { block, warnings } = convert(
      module("menu", {
        menuItemsList: { items: [{ text: "Girls", link: { href: "https://example.com/g", target: "_self", title: "" } }, { text: "Boys", link: { href: "https://example.com/b" } }] },
        computedStyle: { layout: "vertical", linkColor: "#a97f6f", separator: "|", menuItemsSpacing: pad(10, 20), hamburger: { mobile: true } },
        style: { color: "#000000", "font-family": "inherit", "font-size": "14px", "text-align": "right", ...pad(0) },
      })
    );
    expect(block.values).toMatchObject({
      menu: {
        items: [
          { key: "1", text: "Girls", link: { name: "web", values: { href: "https://example.com/g", target: "_self" } } },
          { key: "2", text: "Boys", link: { name: "web", values: { href: "https://example.com/b", target: "_blank" } } },
        ],
      },
      textColor: "#000000",
      linkColor: "#a97f6f",
      align: "right",
      layout: "vertical",
      separator: "|",
      padding: "10px 20px 10px 20px",
      containerPadding: "0px",
    });
    expect(warnings.map((w) => w.reason)).toEqual(["menu-hamburger"]);
  });
});

describe("HTML, video and modules kept as HTML", () => {
  it("`html` is an HTML block, not counted as a fallback", () => {
    const result = convert(module("html", { html: { html: "<table><tr><td>Hi</td></tr></table>" }, style: pad(0) }));
    expect(result.block).toMatchObject({ type: "html", values: { html: "<table><tr><td>Hi</td></tr></table>", containerPadding: "0px" } });
    expect(result.fallbacks).toEqual([]);
  });

  it("video: a YouTube or Vimeo one is a Video with the template's thumbnail; another is its thumbnail as a linked image", () => {
    const youtube = convert(module("video", { video: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbSrc: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", mode: "thumbnail" }, style: pad(10) })).block;
    expect(youtube).toMatchObject({ type: "video", values: { video: { type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", loading: false } } });
    expect(convert(module("video", { video: { src: "https://vimeo.com/76979871" }, style: {} })).block.values.video).toMatchObject({ type: "vimeo", videoId: "76979871" });
    const other = convert(module("video", { video: { src: "https://example.com/v.mp4", thumbSrc: "https://example.com/t.jpg" }, style: {} }));
    expect(other.block).toMatchObject({ type: "image", values: { src: { url: "https://example.com/t.jpg" }, action: { values: { href: "https://example.com/v.mp4" } } } });
    expect(other.warnings.map((w) => w.reason)).toEqual(["video-unknown"]);
  });

  it("icons: one picture is an Image; pictures with text are an HTML block, counted as a fallback", () => {
    const one = convert(module("icons", { iconsList: { icons: [{ image: "https://example.com/star.png", alt: "Star", href: "", width: "128px", height: "128px", text: "" }] }, computedStyle: { iconHeight: "32px" }, style: { "text-align": "center", ...pad(0) } }));
    expect(one.block).toMatchObject({ type: "image", values: { src: { url: "https://example.com/star.png", width: 128, autoWidth: false }, altText: "Star" } });
    expect(one.fallbacks).toEqual([]);
    const many = convert(
      module("icons", {
        iconsList: { icons: [{ image: "https://example.com/a.png", alt: "Account", href: "https://example.com", text: "Account", textPosition: "bottom", width: "64px", height: "64px" }, { image: "https://example.com/b.png", text: "Cart" }] },
        computedStyle: { iconHeight: "32px", iconSpacing: pad(5) },
        style: { color: "#333333", "font-size": "12px", "text-align": "center", ...pad(0) },
      })
    );
    expect(many.block.type).toBe("html");
    expect(many.block.values.html).toContain('<img src="https://example.com/a.png" alt="Account" width="32" height="32"');
    expect(many.block.values.html).toContain(">Cart</span>");
    expect(many.fallbacks).toEqual([{ where: "Row 1, column 1, module 1 (icons)", module: "icons", reason: "icons module" }]);
  });

  it("merge content, forms, tables and carousels are HTML blocks with their content", () => {
    expect(convert(module("merge-content", { mergeContent: { name: "Order", value: "[Order]" }, style: pad(0) })).block.values.html).toBe("[Order]");
    const form = convert(
      module("form", {
        form: {
          structure: {
            attributes: { action: "{{form.action}}", method: "post" },
            fields: {
              email: { type: "email", label: "EMAIL ADDRESS", removeFromLayout: false },
              hidden: { type: "text", label: "Gone", removeFromLayout: true },
              choice: { type: "radio", options: [{ label: "Women", value: "Women" }, { label: "Men", value: "Men" }] },
              submit: { type: "submit", attributes: { value: "GET MY 15% OFF" } },
            },
            layout: [["email", "hidden"], ["choice"], ["submit"]],
          },
        },
        style: pad(10),
      })
    );
    expect(form.block.type).toBe("html");
    expect(form.block.values.html).toMatch(/^<form action="\{\{form\.action\}\}" method="post">/);
    for (const text of ["EMAIL ADDRESS", "Women", "Men", ">GET MY 15% OFF</button>"]) expect(form.block.values.html).toContain(text);
    expect(form.block.values.html).not.toContain("Gone");
    const table = convert(module("table", { table: { content: { headers: [{ cells: [{ html: "Item" }] }], rows: [{ cells: [{ html: "<b>Hat</b>" }] }] } }, style: {} })).block;
    expect(table.values.html).toContain("<th");
    expect(table.values.html).toContain("<b>Hat</b>");
    const carousel = convert(module("carousel", { carousel: { slides: [{ src: "https://example.com/1.png", alt: "One", href: "https://example.com" }, { src: "https://example.com/2.png" }] }, style: {} })).block;
    expect(carousel.values.html.match(/<img /g)).toHaveLength(2);
  });

  it("an image addon (a GIF) is an Image; a module this converter doesn't know is HTML where it holds some, else left out and reported", () => {
    const gif = convert(module("addon", { image: { alt: "Image", src: "https://media.giphy.com/x.gif", href: "", width: "480px", height: "480px" }, style: { width: "100%" }, computedStyle: { class: "center fixedwidth", width: "354.75px" } }, { contentType: "image" }));
    expect(gif.block).toMatchObject({ type: "image", values: { src: { url: "https://media.giphy.com/x.gif", width: 480, height: 480, autoWidth: false } } });
    const held = convert(module("timer", { timer: { html: "<b>00:10</b>" }, style: {} }));
    expect(held.block).toMatchObject({ type: "html", values: { html: "<b>00:10</b>" } });
    expect(held.fallbacks).toHaveLength(1);
    const nothing = convert(module("mystery", { style: {} }));
    expect(nothing.blocks).toEqual([]);
    expect(nothing.warnings.map((w) => w.message)).toEqual(['Row 1, column 1, module 1 (mystery): the "mystery" module is one this converter doesn\'t know and holds no HTML, so it\'s left out.']);
  });

  it("an `empty` module (an empty column's placeholder) is nothing", () => {
    expect(convert(module("empty", {})).blocks).toEqual([]);
  });
});

describe("visibility per device", () => {
  it("modules hidden on phones or desktops", () => {
    const { block } = convert(module("paragraph", { paragraph: { html: "<p>x</p>" }, computedStyle: { hideContentOnMobile: true } }));
    expect(block.values._override).toEqual({ mobile: { hideMobile: true } });
    const desktop = convert(module("paragraph", { paragraph: { html: "<p>x</p>" }, computedStyle: { hideContentOnDesktop: true } })).block;
    expect(desktop.values._override).toEqual({ desktop: { hideDesktop: true } });
  });

  it("a phone setting Unlayer has no place for is reported", () => {
    const { warnings } = convert(module("paragraph", { paragraph: { html: "<p>x</p>" }, mobileStyle: { "letter-spacing": "2px" } }));
    expect(warnings.map((w) => w.message)).toEqual(["Row 1, column 1, module 1 (paragraph): its phone setting `letter-spacing: 2px` has no Unlayer equivalent, so phones show the desktop one."]);
  });
});

describe("where warnings point", () => {
  it("each names its row, column and module", () => {
    const template = page([
      row([column([])]),
      row([column([]), column([module("paragraph", { paragraph: { html: "<p>x</p>" } }), module("menu", { menuItemsList: { items: [{ text: "A" }] }, computedStyle: { hamburger: { mobile: true } } })], 6)]),
    ]);
    const { warnings } = beefreeToDesign(template);
    expect(warnings).toEqual([
      { reason: "menu-hamburger", where: "Row 2, column 2, module 2 (menu)", message: expect.stringMatching(/^Row 2, column 2, module 2 \(menu\): Beefree folds this menu/) },
    ]);
  });
});
