/**
 * The MJML converter, tag by tag: the design each MJML component becomes, with MJML's cascade resolved first, and what
 * it reports (approximations as warnings, blocks kept as MJML's HTML as fallbacks).
 */
import { describe, expect, it } from "vitest";
import { componentDefaults } from "../../src/from-mjml/attributes";
import { cellsFor } from "../../src/from-mjml/layout";
import { mjmlToDesign, MjmlVersionError, type Design, type IncludeResolver } from "../../src/from-mjml";

/** A resolver over in-memory files, by path relative to the template. */
function files(map: Record<string, string>): IncludeResolver {
  return (path) => {
    const key = path.replace(/^\.\//, "");
    return key in map ? { file: `/virtual/${key}`, source: map[key] } : { error: "not found" };
  };
}

const doc = (body: string, head = "") => `<mjml><mj-head>${head}</mj-head><mj-body>${body}</mj-body></mjml>`;
const section = (columns: string, attributes = "") => `<mj-section ${attributes}>${columns}</mj-section>`;
const column = (content: string, attributes = "") => `<mj-column ${attributes}>${content}</mj-column>`;

type Block = { type: string; values: Record<string, any> };
const blocks = (design: Design): Block[] => design.body.rows.flatMap((r) => r.columns.flatMap((c) => c.contents as Block[]));
const first = (design: Design) => blocks(design)[0];

async function convert(mjml: string, include?: Record<string, string>) {
  return mjmlToDesign(mjml, { filePath: "/virtual/template.mjml", ...(include ? { resolveInclude: files(include) } : {}) });
}

describe("mjml-core defaults", () => {
  // Read from the installed MJML (pinned): an upgrade that changes them shows here.
  it("are MJML 5.4.1's for the components the converter maps", () => {
    expect(componentDefaults("mj-text")).toEqual({ align: "left", color: "#000000", "font-family": "Ubuntu, Helvetica, Arial, sans-serif", "font-size": "13px", "line-height": "1", padding: "10px 25px" });
    expect(componentDefaults("mj-button")).toMatchObject({ "background-color": "#414141", "border-radius": "3px", color: "#ffffff", "font-size": "13px", "inner-padding": "10px 25px", "line-height": "120%", padding: "10px 25px", target: "_blank" });
    expect(componentDefaults("mj-section")).toMatchObject({ padding: "20px 0", "text-align": "center" });
    expect(componentDefaults("mj-divider")).toMatchObject({ "border-width": "4px", "border-color": "#000000", width: "100%" });
    expect(componentDefaults("mj-spacer")).toEqual({ height: "20px" });
    expect(componentDefaults("mj-body")).toEqual({ width: "600px" });
  });
});

describe("mj-body and mj-head", () => {
  it("becomes the body's width, background, preview text and font (MJML's default page is white)", async () => {
    const { design } = await convert(doc(section(column("<mj-text>Hi</mj-text>")), "<mj-preview>Your order shipped</mj-preview><mj-title>Order</mj-title>"));
    expect(design.body.values).toMatchObject({ contentWidth: "600px", backgroundColor: "#ffffff", preheaderText: "Your order shipped", textColor: "#000000" });
    expect(design.body.values.fontFamily).toEqual({ label: "Ubuntu", value: "Ubuntu, Helvetica, Arial, sans-serif", url: "https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" });
    const custom = await convert(`<mjml><mj-head><mj-font name="Work Sans" href="https://fonts.example.com/work-sans.css" /><mj-attributes><mj-all font-family="Work Sans, Arial" /></mj-attributes></mj-head><mj-body width="500px" background-color="#eee">${section(column("<mj-text>Hi</mj-text>"))}</mj-body></mjml>`);
    expect(custom.design.body.values).toMatchObject({ contentWidth: "500px", backgroundColor: "#eeeeee", fontFamily: { label: "Work Sans", value: "Work Sans, Arial", url: "https://fonts.example.com/work-sans.css" } });
    expect(custom.title).toBeUndefined();
    expect((await convert(doc("", "<mj-title>Order</mj-title>"))).title).toBe("Order");
  });

  it("writes the right-to-left direction of <mjml dir>", async () => {
    const { design, warnings } = await convert(`<mjml dir="rtl"><mj-body>${section(column("<mj-text>مرحبا</mj-text>"))}</mj-body></mjml>`);
    expect(design.body.values.textDirection).toBe("rtl");
    expect(warnings).toEqual([]);
  });

  it("<mjml dir=\"rtl\">: right to left only where no section shows its columns left to right (Elements would reverse them)", async () => {
    const rtl = (body: string) => convert(`<mjml dir="rtl"><mj-body>${body}</mj-body></mjml>`);
    const two = column("<mj-text>א</mj-text>") + column("<mj-text>ב</mj-text>");
    // MJML's sections lay their columns out left to right whatever <mjml dir> says.
    const page = await rtl(section(column("<mj-text>א</mj-text>")) + section(two));
    expect(page.design.body.values.textDirection).toBeUndefined();
    expect(page.warnings).toContainEqual({ reason: "mjml dir rtl not kept: its sections show their columns left to right, which Elements would reverse in a right-to-left email" });
    expect(page.design.body.rows[1].columns.map((c) => (c.contents[0] as Block).values.text)).toEqual(["א", "ב"]);
    // Sections (and groups) that show their columns right to left: a right-to-left email, which shows them so.
    const sections = await rtl(section(two, 'direction="rtl"') + section(`<mj-group direction="rtl">${two}</mj-group>`));
    expect(sections.design.body.values.textDirection).toBe("rtl");
    expect(sections.warnings.filter((w) => /direction|dir/.test(w.reason))).toEqual([]);
    // A group left to right is one too.
    expect((await rtl(section(`<mj-group>${two}</mj-group>`))).design.body.values.textDirection).toBeUndefined();
  });

  it("reports a breakpoint other than Elements' stacking width, and CSS for other widths or states", async () => {
    const { warnings } = await convert(
      doc(section(column("<mj-text>A</mj-text>") + column("<mj-text>B</mj-text>")), '<mj-breakpoint width="320px" /><mj-style>@media (max-width: 480px) { .x { color: red } } a:hover { color: blue }</mj-style>'),
    );
    expect(warnings).toContainEqual({ reason: "columns stack on narrower screens", detail: "MJML stacks them below 320px, Elements below 620px" });
    expect(warnings).toContainEqual({ reason: "mj-style rule for some screens not kept", detail: "@media (max-width: 480px)" });
    expect(warnings).toContainEqual({ reason: "mj-style rule for a state (hover, focus) not kept", detail: "a:hover" });
  });

  it("refuses MJML 3 (mj-container), naming mjml-migrate", async () => {
    await expect(convert("<mjml><mj-body><mj-container><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-container></mj-body></mjml>")).rejects.toThrow(MjmlVersionError);
    await expect(convert("<mjml><mj-body><mj-container></mj-container></mj-body></mjml>")).rejects.toThrow(/npx mjml-migrate/);
  });

  it("refuses what isn't an MJML document", async () => {
    await expect(convert("<mj-section></mj-section>")).rejects.toThrow(/not an MJML document/);
  });
});

describe("the attribute cascade", () => {
  it("applies mj-all, per-tag mj-attributes, mj-class (in order) and inline attributes, inline last", async () => {
    const head = `<mj-attributes>
      <mj-all font-family="Arial" />
      <mj-text color="#111111" font-size="15px" />
      <mj-class name="big" font-size="30px" css-class="a" />
      <mj-class name="red" color="#ff0000" css-class="b" />
    </mj-attributes>`;
    const { design } = await convert(doc(section(column('<mj-text mj-class="big red" line-height="2">X</mj-text><mj-text mj-class="big" font-size="12px">Y</mj-text>')), head));
    const [x, y] = blocks(design);
    expect(x.values).toMatchObject({ fontSize: "30px", color: "#ff0000", lineHeight: "2" });
    expect(y.values).toMatchObject({ fontSize: "12px", color: "#111111" });
    // mj-all's font is the body's: blocks don't repeat it.
    expect(design.body.values.fontFamily).toMatchObject({ value: "Arial" });
    expect(x.values.fontFamily).toBeUndefined();
  });

  it("applies the defaults an ancestor's mj-class gives its descendants' tags", async () => {
    const head = `<mj-attributes><mj-class name="dark"><mj-text color="#ffffff" /></mj-class></mj-attributes>`;
    const { design } = await convert(doc(section(column("<mj-text>White</mj-text>"), 'mj-class="dark"'), head));
    expect(first(design).values.color).toBe("#ffffff");
  });
});

describe("mj-include", () => {
  it("resolves a partial's body in place and its head into the template's", async () => {
    const { design, info } = await convert(doc('<mj-include path="./header.mjml" />' + section(column("<mj-text>Body</mj-text>")), '<mj-include path="./base.mjml" />'), {
      "header.mjml": section(column('<mj-text css-class="h">Header</mj-text>')),
      "base.mjml": '<mj-attributes><mj-text color="#123456" /></mj-attributes>',
    });
    const texts = blocks(design).map((b) => b.values.text);
    expect(texts).toEqual(["Header", "Body"]);
    expect(blocks(design).every((b) => b.values.color === "#123456")).toBe(true);
    expect(info).toContainEqual({ reason: "mj-include followed", detail: "./header.mjml" });
  });

  it("includes CSS as mj-style and HTML as mj-raw", async () => {
    const { design, fallbacks } = await convert(doc(section(column('<mj-text><p class="lead">Hi</p></mj-text><mj-include path="./note.html" type="html" />')), '<mj-include path="./style.css" type="css" />'), {
      "style.css": ".lead { color: #abcdef; }",
      "note.html": "<p>Raw note</p>",
    });
    const [text, raw] = blocks(design);
    expect(text.values.text).toContain("color: #abcdef");
    expect(raw).toMatchObject({ type: "html", values: { html: expect.stringContaining("Raw note") } });
    expect(fallbacks).toContainEqual({ tag: "mj-raw", reason: "mj-raw: the template's own HTML" });
  });

  it("reports an include it can't read (missing, refused, or including itself) and leaves it out", async () => {
    const { warnings } = await convert(doc('<mj-include path="./gone.mjml" />' + '<mj-include path="./loop.mjml" />'), { "loop.mjml": '<mj-include path="./loop.mjml" />' });
    expect(warnings).toContainEqual({ reason: "mj-include left out", detail: "./gone.mjml (not found)" });
    expect(warnings.some((w) => w.reason === "mj-include left out" && /includes itself/.test(w.detail ?? ""))).toBe(true);
    const unresolved = await convert(doc('<mj-include path="./header.mjml" />'));
    expect(unresolved.warnings).toContainEqual({ reason: "mj-include not followed", detail: "./header.mjml" });
  });
});

describe("mj-section and mj-column", () => {
  it("puts the section's padding and background inside the row's columns, as wide as MJML makes them", async () => {
    const { design } = await convert(doc(section(column("<mj-text>A</mj-text>") + column("<mj-text>B</mj-text>"), 'background-color="#fff" padding="20px 30px"')));
    const [row] = design.body.rows;
    expect(row.cells).toEqual([1, 1]);
    expect(row.values.columnsBackgroundColor).toBe("#ffffff");
    expect(row.columns.map((c) => c.values.padding)).toEqual(["20px 0px 20px 30px", "20px 30px 20px 0px"]);
    // On phones both stack, each with the section's sides (and its top, bottom on the first and last).
    expect(row.columns.map((c) => (c.values._override as any)?.mobile?.padding)).toEqual(["20px 30px 0px 30px", "0px 30px 20px 30px"]);
  });

  it("sizes columns by their widths (px or %), and leaves the space a narrow column doesn't fill around it", async () => {
    const { design } = await convert(doc(section(column("<mj-text>A</mj-text>", 'width="25%"') + column("<mj-text>B</mj-text>", 'width="450px"'), 'padding="0"')));
    expect(design.body.rows[0].cells).toEqual([1, 3]);
    const narrow = await convert(doc(section(column("<mj-text>Centered</mj-text>", 'width="50%"'), 'padding="0"')));
    expect(narrow.design.body.rows[0].columns[0].values.padding).toBe("0px 150px");
    expect(cellsFor([210, 180, 210])).toEqual([7, 6, 7]);
  });

  it("wraps columns wider together than the section onto rows of their own", async () => {
    const { design, warnings } = await convert(doc(section(column("<mj-text>A</mj-text>", 'width="100%"') + column("<mj-text>B</mj-text>", 'width="100%"'))));
    expect(design.body.rows).toHaveLength(2);
    expect(warnings.map((w) => w.reason)).toContain("columns wider together than their section: a row for each line they wrap onto");
  });

  it("keeps column backgrounds, borders and corner radii, and approximates the section's on its columns", async () => {
    const { design, warnings } = await convert(
      doc(section(column("<mj-text>A</mj-text>", 'background-color="#f00" border="1px solid #000" border-radius="4px" vertical-align="middle"') + column("<mj-text>B</mj-text>", 'background-color="transparent"'), 'background-color="#eee" border-radius="8px"')),
    );
    const [a, b] = design.body.rows[0].columns;
    expect(a.values).toMatchObject({ backgroundColor: "#ff0000", borderRadius: "4px", border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#000000" } });
    // The section's background moves onto its columns so its rounded corners show.
    expect(b.values).toMatchObject({ backgroundColor: "#eeeeee", borderRadius: "0px 8px 8px 0px" });
    expect(warnings.map((w) => w.reason)).toEqual(expect.arrayContaining(["column vertical alignment not kept (columns sit at the top)", "section border radius approximated on its columns"]));
  });

  it("gives a full-width section's background to the whole row, and a background image to the row", async () => {
    const { design } = await convert(doc(section(column("<mj-text>A</mj-text>"), 'full-width="full-width" background-color="#000" background-url="https://example.com/bg.jpg" background-size="cover" background-repeat="no-repeat"')));
    expect(design.body.rows[0].values).toMatchObject({ backgroundColor: "#000000", backgroundImage: { url: "https://example.com/bg.jpg", fullWidth: true, size: "cover", repeat: "no-repeat", position: "top-center" } });
  });

  it("reports a section or group whose columns MJML shows right to left in a left-to-right email (phones stack them as written)", async () => {
    const two = column("<mj-text>A</mj-text>") + column("<mj-text>B</mj-text>");
    const { design, warnings } = await convert(doc(section(two, 'direction="rtl"') + section(`<mj-group direction="rtl">${two}</mj-group>`) + section(column("<mj-text>C</mj-text>"), 'direction="rtl"')));
    expect(design.body.values.textDirection).toBeUndefined();
    expect(design.body.rows[0].columns.map((c) => (c.contents[0] as Block).values.text)).toEqual(["A", "B"]);
    // Once each, and not for a section with one column, whose direction shows nothing.
    expect(warnings.filter((w) => /direction/.test(w.reason))).toEqual([
      { reason: "section direction rtl not kept: its columns show left to right" },
      { reason: "group direction rtl not kept: its columns show left to right" },
    ]);
  });

  it("keeps an mj-group's columns side by side on phones", async () => {
    const { design } = await convert(doc(section("<mj-group>" + column("<mj-text>A</mj-text>") + column("<mj-text>B</mj-text>") + "</mj-group>")));
    expect(design.body.rows[0].values._override).toEqual({ mobile: { noStackMobile: true } });
    expect(design.body.rows[0].columns.every((c) => !(c.values._override as any)?.mobile?.padding)).toBe(true);
  });
});

describe("mj-wrapper", () => {
  it("makes each section a row with the wrapper's background and padding around them", async () => {
    const { design, warnings } = await convert(
      doc(`<mj-wrapper background-color="#000" padding="40px 30px" border-radius="6px">${section(column("<mj-text>One</mj-text>"), 'padding="0"')}${section(column("<mj-text>Two</mj-text>"), 'padding="0" background-color="#fff"')}</mj-wrapper>`),
    );
    const [one, two] = design.body.rows;
    expect(one.values.columnsBackgroundColor).toBe("#000000");
    expect(two.values.columnsBackgroundColor).toBe("#ffffff");
    expect(one.columns[0].values.padding).toBe("40px 30px 0px 30px");
    expect(two.columns[0].values.padding).toBe("0px 30px 40px 30px");
    expect(warnings.map((w) => w.reason)).toContain("mj-wrapper border radius not kept");
    const full = await convert(doc(`<mj-wrapper full-width="full-width" background-color="#123">${section(column("<mj-text>X</mj-text>"))}</mj-wrapper>`));
    expect(full.design.body.rows[0].values.backgroundColor).toBe("#112233");
  });
});

describe("content blocks", () => {
  it("mj-text: a Paragraph with its HTML and styles; what it has no setting for wraps the HTML", async () => {
    const { design } = await convert(doc(section(column('<mj-text font-size="16px" color="#333" line-height="24px" align="center" padding="5px 10px" font-weight="bold" letter-spacing="0.1em" text-transform="uppercase">Hello <b>{{name}}</b> *|FNAME|*</mj-text>'))));
    expect(first(design)).toEqual({
      type: "text",
      values: expect.objectContaining({
        text: '<div style="text-transform:uppercase">Hello <b>{{name}}</b> *|FNAME|*</div>',
        fontSize: "16px",
        color: "#333333",
        lineHeight: "24px",
        textAlign: "center",
        fontWeight: 700,
        letterSpacing: "1.6px",
        containerPadding: "5px 10px",
      }),
    });
  });

  it("mj-text: keeps MJML's paragraph margins and a cell background around the text", async () => {
    const { design } = await convert(doc(section(column('<mj-text container-background-color="#eee" padding="8px"><p>One</p></mj-text>'))));
    expect(first(design).values).toMatchObject({ text: '<div style="background-color:#eee;padding:8px"><p style="display: block; margin: 13px 0;">One</p></div>', containerPadding: "0px" });
  });

  it("mj-text: one heading becomes a Heading, sized as the browser sizes it (or as its own style says)", async () => {
    const { design } = await convert(doc(section(column('<mj-text font-size="20px"><h2>Title</h2></mj-text><mj-text font-size="20px"><h3 style="font-size: inherit; margin: 0">Small</h3></mj-text>'))));
    const [h2, h3] = blocks(design);
    expect(h2).toMatchObject({ type: "heading", values: { headingType: "h2", text: "Title", fontSize: "30px", fontWeight: 700, containerPadding: "34.9px 25px" } });
    expect(h3).toMatchObject({ type: "heading", values: { headingType: "h3", fontSize: "20px", containerPadding: "10px 25px" } });
  });

  it("mj-text: the template's mj-style rules are written on its HTML, and an !important one on its box wins", async () => {
    const head = "<mj-style>a { color: #2f89fc; } .note a { font-weight: bold; } .red div { color: red !important; }</mj-style><mj-style inline=\"inline\">.accent { color: #ff00ff; }</mj-style>";
    const { design } = await convert(doc(section(column('<mj-text css-class="note"><a href="#">Link</a> <span class="accent">pink</span></mj-text><mj-text css-class="red">Red</mj-text>')), head));
    const [note, red] = blocks(design);
    expect(note.values.text).toBe('<a href="#" style="color: #2f89fc; font-weight: bold;">Link</a> <span class="accent" style="color: #ff00ff;">pink</span>');
    expect(red.values.color).toBe("red");
  });

  it("mj-button: a Button with its link, colors, padding, radius and width", async () => {
    const { design } = await convert(doc(section(column('<mj-button href="https://example.com/go" background-color="#f00" color="#fff" inner-padding="12px 24px" padding="5px" border-radius="20px" width="200px" align="left" font-size="16px">Go</mj-button>'))));
    expect(first(design)).toEqual({
      type: "button",
      values: expect.objectContaining({
        text: "Go",
        href: { name: "web", values: { href: "https://example.com/go", target: "_blank" } },
        buttonColors: { color: "#ffffff", backgroundColor: "#ff0000", hoverColor: "#ffffff", hoverBackgroundColor: "#ff0000" },
        size: { autoWidth: false, width: "200px" },
        padding: "12px 24px",
        borderRadius: "20px",
        textAlign: "left",
        fontSize: "16px",
        containerPadding: "5px",
      }),
    });
  });

  it("reads attributes as the browser does: a link's `&amp;` is `&` in the design (Elements escapes it again)", async () => {
    const { design } = await convert(doc(section(column('<mj-button href="https://example.com/?a=1&amp;b=2">Go</mj-button>')), '<mj-font name="Inter" href="https://fonts.example.com/css?family=Inter&amp;display=swap" /><mj-attributes><mj-all font-family="Inter, Arial" /></mj-attributes>'));
    expect(first(design).values.href).toEqual({ name: "web", values: { href: "https://example.com/?a=1&b=2", target: "_blank" } });
    expect(design.body.values.fontFamily).toMatchObject({ url: "https://fonts.example.com/css?family=Inter&display=swap" });
  });

  it("mj-image: an Image as wide as MJML shows it, with its link and text", async () => {
    const { design, warnings } = await convert(doc(section(column('<mj-image src="https://example.com/a.png" alt="A" href="https://example.com" width="275px" border-radius="8px" /><mj-image src="https://example.com/b.png" />'), 'padding="0"')));
    const [a, b] = blocks(design);
    expect(a.values).toMatchObject({ src: { url: "https://example.com/a.png", width: 275, autoWidth: false, maxWidth: "50%" }, altText: "A", action: { name: "web", values: { href: "https://example.com", target: "_blank" } } });
    expect(b.values.src).toMatchObject({ width: 550, maxWidth: "100%" });
    expect(warnings).toContainEqual({ reason: "image border radius dropped", detail: "8px" });
  });

  it("mj-divider and mj-spacer: a Divider, and an empty one as tall as the space", async () => {
    const { design } = await convert(doc(section(column('<mj-divider border-color="#ccc" border-width="2px" width="50%" /><mj-spacer height="30px" />'))));
    const [divider, spacer] = blocks(design);
    expect(divider.values).toMatchObject({ border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#cccccc" }, width: "50%", containerPadding: "10px 25px" });
    expect(spacer).toMatchObject({ type: "divider", values: { border: { borderTopWidth: "0px" }, containerPadding: "30px 0px 0px 0px" } });
  });

  it("mj-navbar: a Menu; one with a hamburger is kept as MJML's HTML", async () => {
    const { design } = await convert(doc(section(column('<mj-navbar base-url="https://example.com"><mj-navbar-link href="/a" color="#333">About</mj-navbar-link><mj-navbar-link href="/b" color="#333">Blog</mj-navbar-link></mj-navbar>'))));
    expect(first(design)).toMatchObject({
      type: "menu",
      values: { menu: { items: [{ text: "About", link: { values: { href: "https://example.com/a" } } }, { text: "Blog", link: { values: { href: "https://example.com/b" } } }] }, textColor: "#333333", padding: "15px 10px" },
    });
    const burger = await convert(doc(section(column('<mj-navbar hamburger="hamburger"><mj-navbar-link href="/a">About</mj-navbar-link></mj-navbar>'))));
    expect(first(burger.design).type).toBe("html");
    expect(burger.fallbacks.map((f) => f.tag)).toEqual(["mj-navbar"]);
  });

  it("mj-table: a Table when it's a plain grid, else MJML's HTML", async () => {
    const plain = await convert(doc(section(column('<mj-table><tr><th>Year</th><th>Language</th></tr><tr><td style="padding: 0 15px">1995</td><td>PHP</td></tr></mj-table>'))));
    expect(first(plain.design)).toMatchObject({ type: "table", values: { table: { headers: [{ cells: [{ text: "Year" }, { text: "Language" }] }], rows: [{ cells: [{ text: "1995" }, { text: "PHP" }] }] }, enableHeader: true } });
    const styled = await convert(doc(section(column('<mj-table><tr><td style="color:red">Red</td></tr></mj-table>'))));
    expect(first(styled.design)).toMatchObject({ type: "html", values: { html: expect.stringContaining("Red") } });
  });

  it("mj-social: a Social block with MJML's links, declaring the alt text the editor writes and the icons it swaps in", async () => {
    const { design, declared, fallbacks } = await convert(
      doc(section(column('<mj-social icon-size="28px" align="left"><mj-social-element name="facebook" href="https://example.com/acme" /><mj-social-element href="https://example.com/shop" src="https://example.com/cart.png" alt="Shop" /></mj-social>'))),
    );
    expect(fallbacks).toEqual([]);
    expect(first(design)).toMatchObject({
      type: "social",
      values: {
        icons: {
          iconType: "circle",
          icons: [
            // MJML's share URL, and the editor's own icon for the network (MJML's is white, for its colored square).
            { name: "Facebook", url: "https://www.facebook.com/sharer/sharer.php?u=https://example.com/acme" },
            // An icon of the template's own keeps its image.
            { name: "Shop", url: "https://example.com/shop", imgUrl: "https://example.com/cart.png" },
          ],
        },
        iconSize: 28,
        align: "left",
      },
    });
    expect(first(design).values.icons.icons[0].imgUrl).toBeUndefined();
    // Each change named exactly: which image, from what, to what.
    expect(declared).toEqual([
      { kind: "src", from: "https://www.mailjet.com/images/theme/v1/icons/ico-social/facebook.png", to: "https://cdn.tools.unlayer.com/social/icons/circle/facebook.png", reason: expect.stringContaining("MJML's own social icon") },
      { kind: "alt", src: "https://www.mailjet.com/images/theme/v1/icons/ico-social/facebook.png", from: "", to: "Facebook icon", reason: expect.stringContaining("social icon alt text") },
      { kind: "alt", src: "https://example.com/cart.png", from: "Shop", to: "Shop icon", reason: expect.stringContaining("social icon alt text") },
    ]);
  });

  it("mj-social: kept as MJML's HTML with labels, without links, or with MJML's icon for a network the editor has none for", async () => {
    for (const element of ['<mj-social-element name="facebook" href="https://example.com">Facebook</mj-social-element>', '<mj-social-element name="facebook" />', '<mj-social-element name="xing" href="https://example.com" />']) {
      const { design, fallbacks, declared } = await convert(doc(section(column(`<mj-social>${element}</mj-social>`))));
      expect(first(design).type, element).toBe("html");
      expect(fallbacks.map((f) => f.tag), element).toEqual(["mj-social"]);
      expect(declared, element).toEqual([]);
    }
  });

  it("mj-social, mj-carousel, mj-accordion and unknown tags: kept as the HTML MJML compiles them to", async () => {
    const { design, fallbacks } = await convert(
      doc(section(column('<mj-social><mj-social-element name="facebook" href="https://facebook.com/x">Facebook</mj-social-element></mj-social><mj-carousel><mj-carousel-image src="https://example.com/1.jpg" /></mj-carousel><mj-accordion><mj-accordion-element><mj-accordion-title>Q</mj-accordion-title><mj-accordion-text>A</mj-accordion-text></mj-accordion-element></mj-accordion><mj-unknown>?</mj-unknown>'))),
    );
    const html = blocks(design);
    expect(html.map((b) => b.type)).toEqual(["html", "html", "html", "html"]);
    expect(html[0].values.html).toContain("https://www.facebook.com/sharer/sharer.php?u=https://facebook.com/x");
    expect(html[0].values.html).toContain("Facebook");
    expect(html[1].values.html).toContain("<style");
    expect(fallbacks.map((f) => f.tag)).toEqual(["mj-social", "mj-carousel", "mj-accordion", "mj-unknown"]);
  });

  it("mj-hero: kept as MJML's HTML in a row of its own", async () => {
    const { design, fallbacks } = await convert(doc('<mj-hero background-url="https://example.com/hero.jpg" background-height="300px" height="300px" mode="fixed-height"><mj-text>Over the image</mj-text></mj-hero>'));
    expect(design.body.rows).toHaveLength(1);
    expect(first(design).values.html).toContain("Over the image");
    expect(first(design).values.html).toContain("hero.jpg");
    expect(fallbacks).toEqual([{ tag: "mj-hero", reason: "mj-hero: content over a background image" }]);
  });

  it("mj-raw: HTML as it is; markup no reader sees is left out", async () => {
    const { design, info } = await convert(doc('<mj-raw><!--[if mso]><table><tr><td><![endif]--></mj-raw>' + section(column("<mj-raw><p>Raw</p></mj-raw>")) + "<mj-raw><p>Between</p></mj-raw>"));
    expect(design.body.rows).toHaveLength(2);
    expect(blocks(design).map((b) => b.type)).toEqual(["html", "html"]);
    expect(info.map((i) => i.reason)).toContain("mj-raw with nothing a reader sees left out (comments, Outlook-only markup)");
  });
});

describe("the design", () => {
  it("is numbered as renderToJson numbers it", async () => {
    const { design } = await convert(doc(section(column("<mj-text>A</mj-text><mj-button>B</mj-button>"))));
    expect(design.counters).toEqual({ u_row: 1, u_column: 1, u_content_text: 1, u_content_button: 1 });
    expect(design.body.rows[0].values._meta).toEqual({ htmlID: "u_row_1", htmlClassNames: "u_row" });
    expect(first(design).values._meta).toEqual({ htmlID: "u_content_text_1", htmlClassNames: "u_content_text" });
  });
});
