import { describe, expect, it } from "vitest";
import { HtmlExporters } from "@unlayer/exporters";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Table, Video, registerTool, renderToHtml, renderToPlainText } from "../index";
import { recordingBlockHtml } from "../utils/block-html";
import { UNLAYER_RENDER_KEY } from "../utils/create-component";
import { legacyRenderToPlainText, renderBody } from "../utils/render-to-html";
import { withRenderScope } from "../utils/render-scope";
import type { TreeNode } from "./lower";
import { lowerTemplate, type Lowered } from "./template";

type Root = typeof Email;

/** The node a block lowers to, in an Email or a Page (its design column's first child). */
function lowered(block: React.ReactElement, Root: Root = Email): TreeNode | undefined {
  const result = withRenderScope(() => lowerTemplate(<Root><Row><Column>{block}</Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
  const find = (node: TreeNode): TreeNode | undefined => (node.type === "Column" && node.designColumn ? (node.children as TreeNode[])[0] : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
  return find(result.tree.root);
}

/** What a template lowers to, with what it says it drew otherwise. */
const whole = (block: React.ReactElement, Root: Root = Email) => withRenderScope(() => lowerTemplate(<Root><Row><Column>{block}</Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
/** What a block's lowering says, in words. */
const said = (block: React.ReactElement, Root: Root = Email) => whole(block, Root).diagnostics.filter((d) => d.severity === "warning").map((d) => d.message).join("\n");

/** The node a block lowers to and what it says, in an Email or a Page. */
function drawn(block: React.ReactElement, Root: Root = Email): { node: TreeNode | undefined; said: string[] } {
  const result = whole(block, Root);
  const find = (node: TreeNode): TreeNode | undefined => (node.type === "Column" && node.designColumn ? (node.children as TreeNode[])[0] : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
  return { node: find(result.tree.root), said: result.diagnostics.map((d) => d.message) };
}

describe("a text block", () => {
  it("is a Paragraph of its HTML's runs, in its padding and text styles", () => {
    const node = lowered(<Paragraph html='Hi <b>there</b>, <a href="https://example.com">a link</a>' color="#333" fontSize="15px" lineHeight="150%" letterSpacing="0.1em" containerPadding="4px 8px" />);
    expect(node).toEqual({
      type: "Paragraph",
      style: { fontSize: 15, lineHeight: "150%", color: "#333", textAlign: "left", letterSpacing: 1.5, padding: { top: 4, right: 8, bottom: 4, left: 8 } },
      children: ["Hi ", { type: "Span", style: { fontWeight: 700 }, children: ["there"] }, ", ", { type: "Link", props: { href: "https://example.com" }, children: ["a link"] }],
    });
  });

  it("draws an email service's tag in its words, as it is once written; a plain merge tag is words", () => {
    for (const html of ["{% if orders > 1 %}Thanks{% endif %}", "Hi {{ name | default: \"there\" }}", "{{ a > b }}", "<%= name %>"]) {
      expect(lowered(<Paragraph html={html} />)?.type).toBe("Paragraph");
      expect(renderToHtml(<Email><Row><Column><Paragraph html={html} /></Column></Row></Email>)).toContain(html);
    }
    expect(lowered(<Paragraph html="Hi {{name}}" />)).toMatchObject({ type: "Paragraph", children: ["Hi {{name}}"] });
    expect(renderToHtml(<Email><Row><Column><Paragraph html='A <a href="<%url%>">link</a>' /></Column></Row></Email>)).toContain('href="<%url%>"');
  });

  it("writes as it is a run's style that's an email service's tag: it's only known once it's filled in", () => {
    const html = '<span style="color:<%c%>">Words</span>';
    expect(lowered(<Paragraph html={html} />)?.type).toBe("Raw");
    expect(renderToHtml(<Email><Row><Column><Paragraph html={html} /></Column></Row></Email>)).toContain(html);
  });

  it("takes settings for desktop windows as its values, its own being the phones' (legacy's break at 480px); a printed document has only its desktop's, but its padding", () => {
    const override = { desktop: { fontSize: "23px", textAlign: "right", lineHeight: "200%", containerPadding: "21px", color: "#ff0000" } };
    const block = <Paragraph html="Hi" fontSize="15px" textAlign="center" lineHeight="150%" containerPadding="4px" color="#333" values={{ _override: override } as never} />;
    expect(lowered(block)).toMatchObject({
      style: { fontSize: 23, textAlign: "right", lineHeight: "200%", color: "#333", padding: { top: 21, right: 21, bottom: 21, left: 21 } },
      mobile: { fontSize: 15, textAlign: "center", lineHeight: "150%", padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    });
    const printed = lowered(block, Document as Root);
    expect(printed?.style).toMatchObject({ fontSize: 23, padding: { top: 4, right: 4, bottom: 4, left: 4 } });
    expect(printed?.mobile).toBeUndefined();
  });

  it("takes the settings for phones legacy's stylesheet reads, says one it can't read, and takes none for tablets", () => {
    const phone = { fontSize: "23px", lineHeight: "200%", textAlign: "center", containerPadding: "4px", color: "#ff0000", hideMobile: true };
    const node = lowered(<Paragraph html="Hi" values={{ _override: { mobile: phone, tablet: { fontSize: "41px", hideTablet: true } } } as never} />);
    expect(node?.mobile).toEqual({ fontSize: 23, lineHeight: "200%", textAlign: "center", padding: { top: 4, right: 4, bottom: 4, left: 4 } });
    expect(node?.hidden).toEqual({ mobile: true });
    expect(JSON.stringify(node)).not.toContain("41");
    expect(whole(<Paragraph html="Hi" values={{ _override: { mobile: { color: "#ff0000" } } } as never} />).diagnostics[0]).toMatchObject({ severity: "info", message: expect.stringContaining("color on phones") });
    for (const [key, value] of [["fontSize", "big"], ["lineHeight", "tall"], ["textAlign", "middle"], ["containerPadding", "wide"]]) {
      const block = <Paragraph html="Hi" values={{ _override: { mobile: { [key]: value } } } as never} />;
      expect(lowered(block)?.mobile).toBeUndefined();
      expect(said(block)).toContain(`${key} on phones "${value}"`);
    }
  });

  it("draws a value it can't read as the browser does without it, and says so", () => {
    const block = <Paragraph html="Hi" values={{ fontSize: "big", lineHeight: "tall", letterSpacing: "wide", fontWeight: "heavy", textAlign: "middle" } as never} />;
    const node = lowered(block);
    expect(node?.type).toBe("Paragraph");
    expect(node?.style).toEqual({ lineHeight: 1.15, color: "#000000", padding: { top: 10, right: 10, bottom: 10, left: 10 } });
    expect(lowered(block, Page)?.style?.lineHeight).toBe(1.5);
    for (const words of ['font size "big"', 'line height "tall"', 'letter spacing "wide"', 'font weight "heavy"', 'alignment "middle"']) expect(said(block)).toContain(words);
  });

  it("draws a font size in em, rem, % or pt at the px the browser works out, of what's around it; a line height of the font's own", () => {
    const size = (fontSize: string, Root: Root = Email) => lowered(<Paragraph html="Hi" values={{ fontSize } as never} />, Root)?.style?.fontSize;
    expect(size("1.5em")).toBe(24);
    expect(size("1.5em", Document as Root)).toBe(22.5);
    expect(size("1.25rem", Document as Root)).toBe(20);
    expect(size("120%")).toBe(19.2);
    expect(size("12pt")).toBe(16);
    expect(lowered(<Paragraph html="Hi" values={{ fontSize: "1.5em", lineHeight: "normal" } as never} />, Page)?.style?.lineHeight).toBe(1.15);
    expect(said(<Paragraph html="Hi" values={{ fontSize: "1.5em", lineHeight: "normal" } as never} />)).toBe("");
  });

  it("draws a padding in em or pt at its px; one it can't read at the default, and says so", () => {
    expect(lowered(<Paragraph html="Hi" values={{ containerPadding: "1em 3pt" } as never} />)?.style?.padding).toEqual({ top: 16, right: 4, bottom: 16, left: 4 });
    const block = <Paragraph html="Hi" values={{ containerPadding: "wide" } as never} />;
    expect(lowered(block)?.style?.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(said(block)).toContain('padding "wide"');
  });

  it("writes a padding that's a share of its place as it is, on desktop and on phones: no length is it on every window", () => {
    for (const Root of [Email, Page] as Root[]) {
      const block = <Paragraph html="Hi" values={{ containerPadding: "5%" } as never} />;
      expect(lowered(block, Root)?.type).toBe("Raw");
      expect(String(lowered(block, Root)?.props?.html)).toMatch(/padding: ?5%/);
      expect(said(block, Root)).toBe("");
    }
    const onPhones = lowered(<Paragraph html="Hi" values={{ _override: { mobile: { containerPadding: "2%" } } } as never} />, Page);
    expect(onPhones?.type).toBe("Raw");
    expect(String(onPhones?.props?.css)).toContain("padding: 2%");
  });

  it("draws a font weight that isn't a hundred at the nearest, and says so", () => {
    const block = <Paragraph html="Hi" values={{ fontWeight: 650 } as never} />;
    expect(lowered(block)?.style?.fontWeight).toBe(700);
    expect(said(block)).toContain("nearest hundred");
    expect(lowered(<Paragraph html="Hi" values={{ fontWeight: "bolder" } as never} />)?.style?.fontWeight).toBe(700);
  });

  it("leaves out a color it can't read in a run, and says so", () => {
    const block = <Paragraph html='<span style="color:notacolor">Hi</span>' />;
    expect(lowered(block)?.type).toBe("Paragraph");
    expect(JSON.stringify(lowered(block))).not.toContain("notacolor");
    expect(said(block)).toContain("notacolor");
  });
});

describe("a text block whose HTML no run holds", () => {
  const inHead = (block: React.ReactElement, Root: Root = Email) => lowered(block, Root)!.props as { html: string; css: string };

  it.each([
    ["an image", 'Before <img src="https://example.com/i.png" alt="i"> after'],
    ["a list", "<ul><li>One</li></ul>"],
    ["a paragraph's own style", '<p style="text-align:center;margin:0">Centered</p>'],
    ["a comment", "Hello <!-- note --> world"],
    ["an entity it doesn't know", "An &spades; here"],
    ["a link's other attributes", '<a href="https://example.com" data-x="1">A</a>'],
    ["a link with no address", '<a name="here">B</a>'],
  ])("is %s as it is, in the box today's components write around it", (_, html) => {
    for (const Root of [Email, Page, Document] as Root[]) {
      const node = lowered(<Paragraph html={html} />, Root);
      expect(node?.type).toBe("Raw");
      expect(node?.props?.html).toContain(html);
      expect(node?.props?.html).toContain('id="u_content_paragraph_1"');
    }
    expect(said(<Paragraph html={html} />)).toBe("");
  });

  it("has the block's text styles as they're written, for the browser to read; a paragraph's line height in % a multiple, as legacy writes it", () => {
    const { html } = inHead(<Paragraph html="<ul><li>A</li></ul>" fontSize="18px" lineHeight="150%" color="#123456" letterSpacing="1px" fontWeight={700} textAlign="center" fontFamily={{ label: "G", value: "Georgia, serif" } as never} />);
    expect(html).toContain('<div class="v-line-height v-font-size v-text-align" style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #123456; letter-spacing: 1px; line-height: 1.5; text-align: center; word-wrap: break-word;"><ul>');
    expect(inHead(<Paragraph html="<ul><li>A</li></ul>" values={{ fontSize: "x;y", color: 'red"><script>' } as never} />).html).not.toMatch(/x;y|<script>/);
  });

  it("is a heading's tag, with Outlook's table in an email", () => {
    const heading = <Heading values={{ text: "<ul><li>A</li></ul>", headingType: "h3" } as never} />;
    expect(inHead(heading).html).toMatch(/<!--\[if mso\]><table role="presentation" width="100%"><tr><td><!\[endif\]--><h3 class="v-line-height[^>]*style="margin: 0px; [^>]*><ul>.*<\/h3><!--\[if mso\]><\/td><\/tr><\/table><!\[endif\]-->/s);
    expect(inHead(heading, Page).html).not.toContain("mso");
    expect(inHead(<Heading values={{ text: "<ul><li>A</li></ul>" } as never} />).html).toContain('id="u_content_heading_1" class="u_content_heading');
  });

  it("selects its phone and desktop settings by its id, as legacy's stylesheet does, and its link style", () => {
    const links = { inherit: false, linkColor: "#00ff00", linkHoverColor: "#ff0000", linkUnderline: false, linkHoverUnderline: true };
    const block = <Paragraph html="<ul><li>A</li></ul>" linkStyle={links as never} values={{ _override: { mobile: { fontSize: "23px", containerPadding: "4px" }, desktop: { textAlign: "right" } } } as never} />;
    const { css } = inHead(block);
    expect(css).toContain("@media (max-width: 480px) { #u_content_paragraph_1 .v-container-padding-padding { padding: 4px !important; } #u_content_paragraph_1 .v-font-size { font-size: 23px !important; } }");
    expect(css).toContain("@media (min-width: 481px) { #u_content_paragraph_1 .v-text-align { text-align: right !important; } }");
    expect(css).toContain("#u_content_paragraph_1 a { color: #00ff00; text-decoration: none; }");
    expect(css).not.toContain("a:hover");
    expect(inHead(block, Page).css).toContain("#u_content_paragraph_1 a:hover { color: #ff0000; text-decoration: underline; }");
  });

  it("takes the id its author gave it, and the template's own CSS for its markup", () => {
    const { html, css } = inHead(<Paragraph html="<table><tr><td>A</td></tr></table>" values={{ _meta: { htmlID: "mine" }, _override: { mobile: { fontSize: "23px" } } } as never} />);
    expect(html).toContain('<table id="mine"');
    expect(css).toContain("#mine .v-font-size");
    expect(css).toContain("table, td { color: #000000; }");
  });

  it("is hidden by its box's classes", () => {
    const { html } = inHead(<Paragraph html="<ul><li>A</li></ul>" hideOnMobile />);
    expect(html).toContain('class="u_content_paragraph hide-mobile"');
    expect(inHead(<Paragraph html="<ul><li>A</li></ul>" hideOnMobile />).css).toContain(".hide-mobile");
  });

  it("is as it is where a paragraph's line height on phones reaches a run in another size, which legacy's CSS draws at that height", () => {
    const html = 'a <span style="font-size:28px">BIG</span>';
    expect(lowered(<Paragraph html={html} values={{ _override: { mobile: { lineHeight: "100%" } } } as never} />)?.type).toBe("Raw");
    expect(lowered(<Paragraph html={html} values={{ _override: { mobile: { fontSize: "11px" } } } as never} />)?.type).toBe("Paragraph");
  });
});

describe("a text block's link style", () => {
  const link = (Root: Root, linkStyle: Record<string, unknown>) => lowered(<Paragraph html='<a href="https://example.com">link</a> rest' linkStyle={linkStyle as never} />, Root);

  it("gives its links its color, and no underline where it says none", () => {
    expect(link(Email, { inherit: false, linkColor: "#00ff00", linkUnderline: false })?.children?.[0]).toMatchObject({ type: "Link", style: { color: "#00ff00", textDecoration: "none" } });
    expect(link(Page, { inherit: false, linkColor: "#00ff00", linkHoverColor: "#00ff00", linkUnderline: false, linkHoverUnderline: false })?.children?.[0]).toMatchObject({ type: "Link", style: { color: "#00ff00", textDecoration: "none" } });
  });

  it("gives them their style under the pointer on a page and in a printed document, what differs from it; an email's has none", () => {
    const style = { inherit: false, linkColor: "#00ff00", linkHoverColor: "#ff0000", linkUnderline: false, linkHoverUnderline: true };
    expect(link(Page, style)?.children?.[0]).toMatchObject({ type: "Link", style: { color: "#00ff00", textDecoration: "none" }, hover: { color: "#ff0000", textDecoration: "underline" } });
    expect(link(Document as Root, style)?.children?.[0]).toMatchObject({ hover: { color: "#ff0000", textDecoration: "underline" } });
    expect((link(Email, style)?.children?.[0] as TreeNode).hover).toBeUndefined();
    expect((link(Page, { ...style, linkHoverColor: "#00ff00", linkHoverUnderline: false })?.children?.[0] as TreeNode).hover).toBeUndefined();
  });
});

describe("a text block's direction and fonts", () => {
  const block = (element: React.ReactElement) => {
    const result = withRenderScope(() => lowerTemplate(element, undefined, "renderToHtml")) as Lowered;
    const find = (node: TreeNode): TreeNode | undefined => (node.type === "Column" && node.designColumn ? (node.children as TreeNode[])[0] : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
    return find(result.tree.root);
  };

  it("is in its template's direction where its own is another or can't be read, as legacy writes it; a direction that's the template's it says", () => {
    const own = <Paragraph textDirection="rtl">Hello (world)!</Paragraph>;
    expect(lowered(own)).toMatchObject({ type: "Paragraph" });
    expect(lowered(own)?.props).toBeUndefined();
    expect(whole(own).diagnostics[0]).toMatchObject({ severity: "info", message: expect.stringContaining('direction "rtl"') });
    const invalid = <Paragraph html="Hi" values={{ textDirection: "sideways" } as never} />;
    expect(lowered(invalid)?.props).toBeUndefined();
    expect(said(invalid)).toContain('direction "sideways"');
    expect(block(<Email textDirection="rtl"><Row><Column><Paragraph textDirection="rtl">مرحبا</Paragraph></Column></Row></Email>)).toMatchObject({ type: "Paragraph", props: { dir: "rtl" } });
  });

  it("is drawn in its template's output where it's given a mode of its own, as legacy's", () => {
    expect(lowered(<Paragraph html="Hi" values={{ mode: "web" } as never} />)).toMatchObject({ type: "Paragraph", children: ["Hi"] });
    expect(lowered(<Heading values={{ text: "Hi", mode: "document" } as never} />, Page)).toMatchObject({ type: "Heading" });
  });

  it("keeps a heading's line height in % one height for its text, a run in its own font size too (legacy's is the heading's)", () => {
    const heading = (values: Record<string, unknown>) => lowered(<Heading values={{ text: 'H <span style="font-size:60px">BIG</span>', ...values } as never} />);
    expect(heading({ fontSize: "22px", lineHeight: "140%" })).toMatchObject({ type: "Heading", style: { lineHeight: "30.8px" } });
    expect(lowered(<Heading values={{ text: "H", fontSize: "22px", lineHeight: "140%" } as never} />)?.style?.lineHeight).toBe("140%");
    expect(heading({ fontSize: "22px", lineHeight: "140%", _override: { mobile: { fontSize: "10px" } } })?.mobile).toEqual({ fontSize: 10, lineHeight: "14px" });
    expect(heading({ fontSize: "22px", lineHeight: "140%", _override: { mobile: { lineHeight: "200%" } } })?.mobile).toEqual({ lineHeight: "44px" });
    expect(lowered(<Paragraph html='a <span style="font-size:28px">BIG</span>' />)?.type).toBe("Paragraph");
  });
});

describe("an image block", () => {
  it("is an Image in a Column, its width a share of its place at most the width legacy works out", () => {
    const node = lowered(<Image src={{ url: "https://example.com/a.png", width: 1200, height: 600 }} altText="A" />);
    expect(node).toMatchObject({ type: "Column", style: { alignItems: "center" } });
    expect((node?.children as TreeNode[])[0]).toMatchObject({ type: "Image", props: { src: { src: "https://example.com/a.png", width: 1200, height: 600 }, alt: "A", title: "A" }, style: { width: "100%", maxWidth: 500 } });
  });

  const asset = { url: "https://example.com/a.png", width: 600, height: 300 };
  const inner = (node: TreeNode | undefined) => (node?.children as TreeNode[])[0];

  it("in a link on a page has its size on a box around the link, which fills it, as legacy's link holds it at the size its place gives it", () => {
    const linked = <Image src={asset} altText="A" width="40%" action={{ url: "https://example.com", target: "_self" } as never} />;
    for (const Root of [Page, Document as Root]) {
      expect(inner(lowered(linked, Root))).toEqual({
        type: "Column",
        style: { width: "40%", maxWidth: expect.any(Number), alignItems: "stretch" },
        children: [{ type: "Link", props: { href: { href: "https://example.com", target: "_self" } }, children: [{ type: "Image", props: expect.objectContaining({ alt: "A" }), style: { width: "100%" } }] }],
      });
    }
  });

  it("in a link in an email is the Image of its size in a Link, and reads as the link's address in plain text", () => {
    const node = lowered(<Image src={asset} altText="A" width="40%" action={{ url: "https://example.com", target: "_self" } as never} />);
    expect(inner(node)).toMatchObject({ type: "Link", props: { href: { href: "https://example.com", target: "_self" } }, children: [{ type: "Image", style: { width: "40%" } }] });
    expect(node?.textAs).toEqual({ type: "Paragraph", children: [{ type: "Link", props: { href: { href: "https://example.com", target: "_self" } }, children: [] }] });
  });

  it("keeps a target legacy writes though a link here has no such target", () => {
    const node = inner(lowered(<Image src={asset} action={{ url: "https://example.com", target: "_top" } as never} />));
    expect(node.props).toEqual({ href: { href: "https://example.com" }, attrs: { target: "_top" } });
  });

  it("in an email, drawn shorter than a line of text, sits in a line of the template's text: by its middle where it's centered, its top at a side", () => {
    const short = { url: "https://example.com/a.png", width: 100, height: 10 };
    expect(inner(lowered(<Image src={short} />))).toMatchObject({ type: "Text", style: { lineHeight: "normal", textAlign: "center" }, children: [{ type: "Image", style: { verticalAlign: "middle" } }] });
    expect(inner(lowered(<Image src={short} textAlign="left" />))).toMatchObject({ type: "Text", style: { textAlign: "left" }, children: [{ type: "Image", style: { verticalAlign: "top" } }] });
    expect(inner(lowered(<Image src={short} action={{ url: "https://example.com" } as never} />))).toMatchObject({ type: "Text", children: [{ type: "Link", children: [{ type: "Image" }] }] });
    // A line of its own height isn't one: a page's has none, nor does an image as tall as a line.
    expect(inner(lowered(<Image src={short} />, Page)).type).toBe("Image");
    expect(inner(lowered(<Image src={{ ...short, height: 24 }} />)).type).toBe("Image");
    expect(inner(lowered(<Image src={short} mode="web" />)).type).toBe("Image");
  });

  it("with no URL has its padding and nothing in it", () => {
    const { node, said } = drawn(<Image values={{ src: { url: "" } } as never} />);
    expect(node).toEqual({ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" } });
    expect(said).toEqual(["An image with no URL draws nothing."]);
  });

  it("with a URL that runs a script is left empty, and says so", () => {
    const { node, said } = drawn(<Image values={{ src: { url: "javascript:alert(1)" } } as never} />);
    expect(node?.children).toBeUndefined();
    expect(said.join()).toContain("isn't one Elements writes");
  });

  it("with a link that can't be read draws no link, and says so", () => {
    const { node, said } = drawn(<Image src={asset} values={{ action: 7 } as never} />, Page);
    expect(inner(node).type).toBe("Image");
    expect(said).toEqual(["A link 7 can't be read: it's a link to nothing."]);
  });

  it("with a link that runs a script links to nothing, and says so", () => {
    const { node, said } = drawn(<Image src={asset} action={{ url: "javascript:alert(1)" } as never} />);
    expect(inner(node)).toMatchObject({ type: "Link", props: { href: { href: "" } } });
    expect(said.join()).toContain("isn't a link Elements will write");
  });

  it("draws what's dynamic or full width as any other, its padding kept", () => {
    const plain = lowered(<Image src={asset} />);
    expect(lowered(<Image src={{ ...asset, dynamic: true } as never} />)).toEqual(plain);
    expect(lowered(<Image src={asset} values={{ fullWidth: true } as never} />)).toEqual(plain);
  });

  it("without what can't be read: padding and alignment, each said; an email's cell centers \"middle\", a page's aligns left", () => {
    const padded = drawn(<Image src={asset} containerPadding="lots" />);
    expect(padded.node?.style).toEqual({ alignItems: "center" });
    expect(padded.said).toEqual(['An image\'s padding "lots" can\'t be read: it\'s drawn without it.']);
    const align = (Root: Root) => drawn(<Image src={asset} values={{ textAlign: "middle" } as never} />, Root);
    expect(align(Email).node?.style?.alignItems).toBe("center");
    expect(align(Page).node?.style?.alignItems).toBe("start");
    expect(align(Page).said).toEqual(['An image\'s alignment "middle" can\'t be read: it\'s drawn without it.']);
  });

  it("with a width pinned that can't be read is as wide as its place, at most its own width, and says so", () => {
    const { node, said } = drawn(<Image values={{ src: { ...asset, autoWidth: false, maxWidth: "big" } } as never} />);
    expect(inner(node).style).toMatchObject({ width: "100%", maxWidth: 500 });
    expect(said).toEqual(['An image\'s width "big" can\'t be read: it\'s drawn without it.']);
  });

  it("takes phone settings: its padding, its width and where it sits; says what can't be read, and what isn't read", () => {
    const node = lowered(<Image src={asset} mobile={{ containerPadding: "30px", textAlign: "left", src: { autoWidth: false, maxWidth: "80%" } } as never} />, Page);
    expect(node?.mobile).toEqual({ padding: { top: 30, right: 30, bottom: 30, left: 30 } });
    expect(inner(node).mobile).toEqual({ alignSelf: "start", width: "80%", maxWidth: "80%" });
    expect(drawn(<Image src={asset} values={{ _override: { mobile: { src: "oops" } } } as never} />, Page).said).toEqual(['An image\'s width on phones "oops" can\'t be read: it\'s drawn without it.']);
    expect(drawn(<Image src={asset} mobile={{ containerPadding: "lots" } as never} />, Page).said).toEqual(['An image\'s padding on phones "lots" can\'t be read: it\'s drawn without it.']);
    expect(drawn(<Image src={asset} mobile={{ textAlign: "nowhere" } as never} />, Page).said).toEqual(['An image\'s alignment on phones "nowhere" can\'t be read: it\'s drawn without it.']);
    expect(drawn(<Image src={asset} values={{ _override: { mobile: { altText: "other" } } } as never} />, Page).said).toEqual(["An image's altText on phones isn't read: it's drawn without it."]);
  });

  it("reads as its alternate text in plain text, twice only where its own markup is an email's with a copy for Outlook", () => {
    const reads = (element: React.ReactElement, Root: Root) => ((lowered(element, Root)?.textAs?.children as TreeNode[] | undefined)?.[0]?.props?.html);
    expect(reads(<Image src={asset} altText="A" />, Email)).toBe('<img alt="A"><img alt="A">');
    expect(reads(<Image src={asset} altText="A" mode="web" />, Email)).toBe('<img alt="A">');
    expect(reads(<Image src={asset} altText="A" mode="email" />, Page)).toBe('<img alt="A"><img alt="A">');
    expect(lowered(<Image src={asset} altText="A" />, Page)?.textAs).toBeUndefined();
  });

  it("caps an email image at legacy's maximum where its row stacks, where that's past its width on desktop (a stacked column is wider)", () => {
    const image = (Root: Root) => {
      const result = withRenderScope(() => lowerTemplate(<Root><Row cells={[1, 1]}><Column><Image src={{ url: "https://example.com/a.png", width: 600, height: 300 }} altText="A" /></Column><Column><Paragraph>B</Paragraph></Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
      const find = (node: TreeNode): TreeNode | undefined => (node.type === "Image" ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
      return find(result.tree.root);
    };
    // A 500px email's half is 250px: legacy's image is at most that, drawn 230px wide in its padding on desktop.
    expect(image(Email)).toMatchObject({ style: { width: "100%", maxWidth: 250 }, compat: { stackedMaxWidth: 250 } });
    expect(image(Email)?.mobile).toBeUndefined();
    expect(image(Page)?.compat).toBeUndefined();
  });

  it("takes settings for desktop windows, its URL staying, and its padding on phones", () => {
    const image = (override: Record<string, unknown>, Root: Root = Email) => lowered(<Image src={{ url: "https://example.com/a.png", width: 300, height: 150 }} altText="A" values={{ _override: override } as never} />, Root);
    const desktop = image({ desktop: { src: { autoWidth: false, maxWidth: "50%" }, containerPadding: "21px" } });
    expect((desktop?.children as TreeNode[])[0]).toMatchObject({ props: { src: { src: "https://example.com/a.png" } }, style: { width: "50%" } });
    expect(desktop?.style?.padding).toEqual({ top: 21, right: 21, bottom: 21, left: 21 });
    expect(desktop?.mobile).toEqual({ padding: { top: 10, right: 10, bottom: 10, left: 10 } });
  });
});

describe("a video or social block's settings for devices", () => {
  const video = { video: { url: "https://www.youtube.com/watch?v=abc", videoId: "abc", type: "youtube", thumbnail: "https://example.com/t.png" } };

  it("has its padding set for phones and for desktop windows", () => {
    expect(lowered(<Video values={{ ...video, _override: { mobile: { containerPadding: "37px" } } } as never} />)?.mobile).toEqual({ padding: { top: 37, right: 37, bottom: 37, left: 37 } });
    expect(lowered(<Video values={{ ...video, _override: { desktop: { containerPadding: "21px" } } } as never} />)).toMatchObject({ style: { padding: { top: 21, right: 21, bottom: 21, left: 21 } }, mobile: { padding: { top: 10, right: 10, bottom: 10, left: 10 } } });
    const icons = { icons: { iconType: "circle", icons: [{ name: "Facebook", url: "https://facebook.com/x" }] } };
    expect(lowered(<Social values={{ ...icons, _override: { mobile: { containerPadding: "37px" } } } as never} />, Page)?.mobile).toEqual({ padding: { top: 37, right: 37, bottom: 37, left: 37 } });
    expect(lowered(<Social values={{ ...icons, _override: { desktop: { containerPadding: "21px" } } } as never} />, Page)).toMatchObject({ style: { padding: { top: 21, right: 21, bottom: 21, left: 21 } }, mobile: { padding: { top: 10, right: 10, bottom: 10, left: 10 } } });
  });
});

describe("a heading block", () => {
  it("is a Heading of its level, bold where it says no weight", () => {
    expect(lowered(<Heading headingType="h2" values={{ fontWeight: undefined } as never}>Title</Heading>)).toMatchObject({ type: "Heading", props: { level: 2 }, children: ["Title"] });
    expect(lowered(<Heading fontWeight={600}>Title</Heading>)?.style).toMatchObject({ fontSize: 22, lineHeight: "140%", fontWeight: 600 });
  });

  it("is bold where its weight is none or can't be read: its tag's own", () => {
    for (const fontWeight of ["", "heavy"]) expect(lowered(<Heading values={{ text: "Title", fontWeight } as never} />)?.style?.fontWeight).toBe(700);
  });

  it("is text in its styles where its level can't be read (no heading, to the browser or in plain text), and says so", () => {
    const block = <Heading values={{ text: "Title", headingType: "h7", fontWeight: undefined } as never} />;
    expect(lowered(block)).toMatchObject({ type: "Paragraph", children: ["Title"] });
    expect(lowered(block)?.style?.fontWeight).toBeUndefined();
    expect(lowered(block)?.props).toBeUndefined();
    expect(said(block)).toContain('heading level "h7"');
  });

  it("is in the browser's size for its level where its own can't be read: of a printed document's 15px there", () => {
    const size = (Root: Root, headingType: string) => lowered(<Heading values={{ text: "Title", fontSize: "big", headingType } as never} />, Root)?.style?.fontSize;
    expect(size(Email, "h1")).toBe(32);
    expect(size(Document as Root, "h1")).toBe(30);
    expect(size(Email, "h3")).toBe(18.72);
  });
});

describe("a button block", () => {
  it("is a Button in a Column with the block's padding, placed by its alignment; its hover on a page only", () => {
    const button = <Button href="https://example.com" backgroundColor="#111" color="#fff" hoverBackgroundColor="#222" borderRadius="6px" padding="12px 24px" textAlign="left">Go</Button>;
    expect(lowered(button)).toEqual({
      type: "Column",
      style: { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "start" },
      children: [
        {
          type: "Button",
          props: { href: { href: "https://example.com", target: "_blank" } },
          style: { color: "#fff", backgroundColor: "#111", fontSize: 14, lineHeight: "120%", padding: { top: 12, right: 24, bottom: 12, left: 24 }, borderRadius: 6 },
          children: ["Go"],
        },
      ],
    });
    expect((lowered(button, Page)?.children as TreeNode[])[0].hover).toEqual({ color: "#FFFFFF", backgroundColor: "#222" });
  });

  it("draws no background where its background is transparent or empty, as legacy, not the new Button's default", () => {
    for (const backgroundColor of ["transparent", ""]) {
      const node = lowered(<Button href="https://example.com" backgroundColor={backgroundColor}>Go</Button>);
      expect((node?.children as TreeNode[])[0].style?.backgroundColor).toBe("transparent");
    }
  });

  const drawn = (block: React.ReactElement, Root: Root = Email) => (lowered(block, Root)?.children as TreeNode[])[0];

  it("has its padding on top of its width on a page or in a printed document (300px draws 340px wide), as legacy; an email's width holds it", () => {
    const button = <Button href="https://example.com" width="300px" padding="10px 20px">Go</Button>;
    for (const Root of [Page, Document] as Root[]) expect(drawn(button, Root)).toMatchObject({ type: "Button", style: { width: 300, boxSizing: "content-box", maxWidth: "100%" } });
    expect(drawn(button).style).toMatchObject({ width: 300 });
    expect(drawn(button).style?.boxSizing).toBeUndefined();
  });

  it("links to nothing where it has no link, as legacy's href=\"\": said only for those who look", () => {
    expect(drawn(<Button>Go</Button>).props?.href).toEqual({ href: "", target: "_blank" });
    expect(drawn(<Button values={{ href: undefined } as never}>Go</Button>).props?.href).toEqual({ href: "" });
    expect(whole(<Button>Go</Button>).diagnostics).toMatchObject([{ severity: "info" }]);
    expect(said(<Button>Go</Button>)).toBe("");
  });

  it("is drawn in its template's output where it's given a mode of its own", () => {
    expect(drawn(<Button href="https://example.com" mode="email">Go</Button>, Page).type).toBe("Button");
    expect(drawn(<Button href="https://example.com" mode="web">Go</Button>).type).toBe("Button");
  });

  it("reads a label given as textJson, with its formatting", () => {
    const textJson = JSON.stringify({ root: { children: [{ children: [{ detail: 0, format: 1, mode: "normal", style: "", text: "Bold", type: "text", version: 1 }], direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1 }], direction: "ltr", format: "", indent: 0, type: "root", version: 1 } });
    expect(drawn(<Button href="https://example.com" values={{ textJson } as never} />).children).toEqual([{ type: "Raw", props: { html: generateHtmlFromTextJson(textJson) } }]);
    expect(generateHtmlFromTextJson(textJson)).toContain("Bold");
  });

  it.each([
    ["font size", { fontSize: "large" }, "large"],
    ["line height", { lineHeight: "tall" }, "tall"],
    ["letter spacing", { letterSpacing: "wide" }, "wide"],
    ["label's padding", { padding: "5%" }, "5%"],
    ["corner radius", { borderRadius: "50%" }, "50%"],
    ["font weight", { fontWeight: "heavy" }, "heavy"],
    ["width", { size: { autoWidth: false, width: "10em" } }, "10em"],
  ])("draws a %s it can't read as its default, and says so", (what, values, unread) => {
    const button = <Button href="https://example.com" values={values as never}>Go</Button>;
    for (const Root of [Email, Page, Document] as Root[]) {
      const node = drawn(button, Root);
      expect(node.type).toBe("Button");
      expect(node.children).toEqual(["Go"]);
      expect(JSON.stringify(node.style)).not.toContain(unread);
      expect(said(button, Root)).toContain(what);
    }
  });

  it("draws a block padding or an alignment it can't read as the default and at the start, and says so", () => {
    const button = <Button href="https://example.com" values={{ containerPadding: "1em", textAlign: "middle" } as never}>Go</Button>;
    expect(lowered(button)?.style).toEqual({ padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "start" });
    expect(said(button)).toContain("padding");
    expect(said(button)).toContain("alignment");
  });

  it("leaves out a color it can't read, and says so; a link that runs a script is a link to nothing", () => {
    const color = <Button href="https://example.com" color="not a color">Go</Button>;
    expect(drawn(color).style?.color).toBeUndefined();
    expect(said(color)).toContain("not a color");
    const script = <Button href="javascript:alert(1)">Go</Button>;
    expect(drawn(script).props?.href).toEqual({ href: "" });
    expect(said(script)).toContain("javascript:alert(1)");
  });

  it("draws a border's style it can't read as solid, and leaves out a side whose width it can't read, and says so", () => {
    const button = <Button href="https://example.com" border={{ borderTopWidth: "2px", borderTopStyle: "double", borderTopColor: "#111111", borderBottomWidth: "thin", borderBottomStyle: "solid", borderBottomColor: "#222222" } as never}>Go</Button>;
    expect(drawn(button).style?.border).toEqual({ top: { width: 2, style: "solid", color: "#111111" } });
    expect(said(button)).toContain("border's style");
    expect(said(button)).toContain("border's width");
  });

  it("draws a font weight that isn't a hundred at the nearest, and bolder and lighter as they are around 400", () => {
    const heavy = <Button href="https://example.com" fontWeight={650 as never}>Go</Button>;
    expect(drawn(heavy).style?.fontWeight).toBe(700);
    expect(said(heavy)).toContain("nearest");
    expect(drawn(<Button href="https://example.com" fontWeight={"lighter" as never}>Go</Button>).style?.fontWeight).toBe(100);
    expect(drawn(<Button href="https://example.com" fontWeight={"bolder" as never}>Go</Button>).style?.fontWeight).toBe(700);
  });

  it("writes a label's markup no run holds as it is, and its paragraphs (legacy's plain text reads them as one)", () => {
    for (const text of ['<img src="https://example.com/a.png" alt="A"> Icon', "<ul><li>One</li></ul>", "&notanentity; words", '<p style="margin:0">One</p><p style="margin:0">Two</p>']) {
      expect(drawn(<Button href="https://example.com" values={{ text } as never} />).children).toEqual([{ type: "Raw", props: { html: text } }]);
    }
  });

  it("keeps a link's own attributes and a target of another kind; a click handler is said", () => {
    expect(drawn(<Button href={{ url: "https://example.com", target: "_top", class: "cta", customAttrs: { "data-x": "1", onmouseover: "x()" } } as never}>Go</Button>).props).toEqual({ href: { href: "https://example.com" }, attrs: { "data-x": "1", class: "cta", target: "_top" } });
    const click = <Button href={{ url: "https://example.com", onClick: "track()" } as never}>Go</Button>;
    expect(drawn(click).props?.attrs).toBeUndefined();
    expect(said(click)).toContain("click handler");
  });

  it("takes the settings for phones legacy's stylesheet reads, and leaves those it doesn't", () => {
    const node = lowered(<Button href="https://example.com" values={{ _override: { mobile: { containerPadding: "1px", padding: "2px", fontSize: "3px", lineHeight: "4px", textAlign: "right", size: { autoWidth: false, width: "50%" }, color: "#111", letterSpacing: "5px", border: {}, fontWeight: 900 } } } as never}>Go</Button>, Page) as TreeNode;
    const side = (n: number) => ({ top: n, right: n, bottom: n, left: n });
    expect(node.mobile).toEqual({ padding: side(1) });
    expect((node.children as TreeNode[])[0].mobile).toEqual({ padding: side(2), fontSize: 3, lineHeight: "4px", alignSelf: "end", width: "50%" });
    // A width on phones has its padding on top too.
    expect((node.children as TreeNode[])[0].style).toMatchObject({ boxSizing: "content-box" });
  });

  it("says a setting for phones it can't read", () => {
    const button = <Button href="https://example.com" values={{ _override: { mobile: { fontSize: "large", containerPadding: "1em" } } } as never}>Go</Button>;
    expect(lowered(button)?.mobile).toBeUndefined();
    expect(said(button)).toContain("font size on phones");
    expect(said(button)).toContain("padding on phones");
  });

  it("takes settings for desktop windows as its values, its own being the phones' (legacy's break at 480px); a printed document has only its desktop's", () => {
    const button = <Button href="https://example.com" fontSize="12px" containerPadding="4px" values={{ _override: { desktop: { fontSize: "23px", containerPadding: "21px" } } } as never}>Go</Button>;
    const page = lowered(button, Page) as TreeNode;
    expect((page.children as TreeNode[])[0]).toMatchObject({ style: { fontSize: 23 }, mobile: { fontSize: 12 } });
    expect(page).toMatchObject({ style: { padding: { top: 21 } }, mobile: { padding: { top: 4 } } });
    const document = lowered(button, Document as Root) as TreeNode;
    expect((document.children as TreeNode[])[0].style?.fontSize).toBe(23);
    expect((document.children as TreeNode[])[0].mobile).toBeUndefined();
    // There, legacy's rule for the block's padding finds nothing.
    expect(document).toMatchObject({ style: { padding: { top: 4 } } });
    expect(document.mobile).toBeUndefined();
  });

  it("takes no settings for tablets (legacy writes no rule for them)", () => {
    const node = lowered(<Button href="https://example.com" values={{ _override: { tablet: { fontSize: "43px", containerPadding: "41px" } } } as never}>Go</Button>) as TreeNode;
    expect(node.type).toBe("Column");
    expect((node.children as TreeNode[])[0].style?.fontSize).toBe(14);
  });

  it("is hidden where it says, in an email too", () => {
    expect(lowered(<Button href="https://example.com" hideOnMobile>Go</Button>)?.hidden).toEqual({ mobile: true });
    expect(lowered(<Button href="https://example.com" hideOnDesktop>Go</Button>)?.hidden).toEqual({ desktop: true });
  });
});

describe("a divider block", () => {
  it("is a Divider of its line, padding and length, placed by its alignment where it's shorter than its column", () => {
    for (const Root of [Email, Page, Document] as Root[]) {
      expect(lowered(<Divider borderTopWidth="2px" borderTopColor="#ccc" />, Root)).toEqual({ type: "Divider", style: { borderTop: { width: 2, style: "solid", color: "#ccc" }, padding: { top: 10, right: 10, bottom: 10, left: 10 } } });
      expect(lowered(<Divider width="60%" textAlign="left" />, Root)).toMatchObject({ type: "Column", style: { textAlign: "left" }, children: [{ type: "Divider", style: { width: "60%" } }] });
    }
  });

  it("is drawn in its template's output where it's given a mode of its own", () => {
    expect(lowered(<Divider mode="email" />, Page)?.type).toBe("Divider");
    expect(lowered(<Divider mode="web" />)?.type).toBe("Divider");
  });

  it.each([
    ["line width", { border: { borderTopWidth: "thin" } }, { width: 1 }],
    ["line style", { border: { borderTopStyle: "double" } }, { style: "solid" }],
  ])("draws a %s it can't read as the default, and says so", (what, values, line) => {
    const divider = <Divider values={values as never} />;
    for (const Root of [Email, Page, Document] as Root[]) {
      expect(lowered(divider, Root)?.style?.borderTop).toMatchObject(line);
      expect(said(divider, Root)).toContain(what);
    }
  });

  it("draws a padding or a length it can't read as the default, and says so", () => {
    const divider = <Divider values={{ containerPadding: "1em", width: "auto" } as never} />;
    const node = lowered(divider) as TreeNode;
    expect(node).toMatchObject({ type: "Divider", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } } });
    expect(node.style?.width).toBeUndefined();
    expect(said(divider)).toContain("padding");
    expect(said(divider)).toContain("length");
  });

  it("leaves out a color it can't read, and says so", () => {
    const divider = <Divider borderTopColor="not a color" />;
    expect(lowered(divider)?.type).toBe("Divider");
    expect(said(divider)).toContain("not a color");
  });

  it("takes the padding set for phones and desktop windows, and leaves the settings legacy's stylesheet has no element for", () => {
    const divider = <Divider containerPadding="4px" values={{ _override: { desktop: { containerPadding: "21px" }, mobile: { width: "20%", textAlign: "right", border: { borderTopWidth: "9px" } }, tablet: { containerPadding: "41px" } } } as never} />;
    expect(lowered(divider, Page)).toMatchObject({ type: "Divider", style: { padding: { top: 21 }, borderTop: { width: 1 } }, mobile: { padding: { top: 4 } } });
    expect(lowered(<Divider values={{ _override: { mobile: { containerPadding: "1em" } } } as never} />)?.mobile).toBeUndefined();
    expect(said(<Divider values={{ _override: { mobile: { containerPadding: "1em" } } } as never} />)).toContain("padding on phones");
  });

  it("is hidden where it says, in an email too", () => {
    expect(lowered(<Divider hideOnMobile />)?.hidden).toEqual({ mobile: true });
  });
});

describe("a table block", () => {
  const cells = (...texts: Array<string | Record<string, unknown>>) => ({ cells: texts.map((text) => (typeof text === "string" ? { text } : text)) });
  const data = { headers: [cells("H1", "H2")], rows: [cells("A1", "A2"), cells("B1", "B2"), cells("C1", "C2")], footers: [cells("F1", "F2")] };
  const block = (values: Record<string, unknown>, Root: Root = Email) => lowered(<Table values={{ table: data, ...values } as never} />, Root) as TreeNode;
  const rowsOf = (node: TreeNode) => (node.children as TreeNode[])[0].children as TreeNode[];
  const cellOf = (row: TreeNode, index = 0) => (row.children as TreeNode[])[index];
  const textsOf = (node: TreeNode) => rowsOf(node).map((row) => (row.children as TreeNode[]).map((cell) => cell.children));

  it("is a Table of its rows in a Column with its padding, whose cells share their borders", () => {
    const node = lowered(<Table headers={["Name", "Mail"]} data={[["Ada", "a@x.com"]]} containerPadding="4px" />) as TreeNode;
    expect(node).toMatchObject({ type: "Column", style: { padding: { top: 4, right: 4, bottom: 4, left: 4 } }, children: [{ type: "Table", style: { borderCollapse: "collapse" } }] });
    expect(textsOf(node)).toEqual([[["Name"], ["Mail"]], [["Ada"], ["a@x.com"]]]);
    expect(rowsOf(node)[0].props).toEqual({ header: true });
    expect(rowsOf(node)[1].props).toBeUndefined();
  });

  it("gives a cell its section's styles: the header's, the rows' and the footer's", () => {
    const node = block({ enableFooter: true, headerColor: "#111111", headerFontSize: "18px", headerFontWeight: 400, headerTextAlign: "right", headerVerticalAlign: "bottom", headerPadding: "4px", headerBackgroundColor: "#aaaaaa", headerFontFamily: { value: "Georgia" }, contentColor: "#222222", contentFontSize: "12px", contentFontWeight: 700, contentTextAlign: "center", contentVerticalAlign: "top", contentPadding: "2px", contentBackgroundColor: "#bbbbbb", contentLineHeight: "200%", contentLetterSpacing: "2px", footerColor: "#333333", footerFontSize: "10px", footerFontWeight: 300, footerTextAlign: "justify", footerPadding: "20px", footerBackgroundColor: "#cccccc" });
    const [header, row, , , footer] = rowsOf(node);
    const side = (n: number) => ({ top: n, right: n, bottom: n, left: n });
    expect(cellOf(header).style).toMatchObject({ color: "#111111", fontSize: 18, fontWeight: 400, textAlign: "right", verticalAlign: "bottom", padding: side(4), backgroundColor: "#aaaaaa", fontFamily: "Georgia" });
    expect(cellOf(row).style).toMatchObject({ color: "#222222", fontSize: 12, fontWeight: 700, textAlign: "center", verticalAlign: "top", padding: side(2), backgroundColor: "#bbbbbb", lineHeight: "200%", letterSpacing: 2 });
    expect(cellOf(footer).style).toMatchObject({ color: "#333333", fontSize: 10, fontWeight: 300, textAlign: "justify", verticalAlign: "middle", padding: side(20), backgroundColor: "#cccccc" });
    expect(footer.props).toEqual({ footer: true });
    // A header's and a footer's text has no letter spacing of its own, whatever it says.
    expect(cellOf(rowsOf(block({ headerLetterSpacing: "9px" }))[0]).style?.letterSpacing).toBeUndefined();
  });

  it("gives a header and a footer the line height legacy leaves them: a page's, or the font's own elsewhere", () => {
    expect(cellOf(rowsOf(block({}))[0]).style?.lineHeight).toBe(1.15);
    expect(cellOf(rowsOf(block({}, Document as Root))[0]).style?.lineHeight).toBe(1.15);
    expect(cellOf(rowsOf(block({}, Page))[0]).style?.lineHeight).toBeUndefined();
  });

  it("gives what says no style the browser's own: 1px of padding, in the middle, a header's bold and centered", () => {
    const node = block({ headerFontWeight: "", headerTextAlign: "", headerPadding: "", headerVerticalAlign: "", contentPadding: "" });
    const one = { top: 1, right: 1, bottom: 1, left: 1 };
    expect(cellOf(rowsOf(node)[0]).style).toMatchObject({ fontWeight: 700, textAlign: "center", padding: one, verticalAlign: "middle" });
    expect(cellOf(rowsOf(node)[1]).style).toMatchObject({ padding: one });
  });

  it("gives a cell its own background, color, alignment and padding over its section's", () => {
    const own = { text: "A", backgroundColor: "#ff0000", color: "#00ff00", textAlign: "right", verticalAlign: "bottom", padding: "3px" };
    expect(cellOf(rowsOf(block({ table: { headers: [], rows: [cells(own)], footers: [] } }))[0]).style).toMatchObject({ backgroundColor: "#ff0000", color: "#00ff00", textAlign: "right", verticalAlign: "bottom", padding: { top: 3, right: 3, bottom: 3, left: 3 } });
  });

  it("draws its border on its cells, side by side", () => {
    const border = { borderTopWidth: "2px", borderTopStyle: "dashed", borderTopColor: "#111111", borderLeftWidth: "0px", borderRightWidth: "3px", borderRightStyle: "dotted", borderRightColor: "#222222", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#999999" };
    expect(cellOf(rowsOf(block({ border }))[1]).style?.border).toEqual({ top: { width: 2, style: "dashed", color: "#111111" }, right: { width: 3, style: "dotted", color: "#222222" }, bottom: { width: 1, style: "solid", color: "#999999" } });
    expect((block({ border }).children as TreeNode[])[0].style?.border).toBeUndefined();
  });

  it("stripes every other row from the first, under a cell's own background", () => {
    const node = block({ stripedRows: true, stripedRowsBackgroundColor: "#eeeeee", table: { headers: [cells("H")], rows: [cells("A"), cells("B"), cells({ text: "C", backgroundColor: "#ff0000" })], footers: [] } });
    const [header, a, b, c] = rowsOf(node);
    expect(cellOf(header).style?.backgroundColor).toBe("#DDDDDD");
    expect(a.style).toEqual({ backgroundColor: "#eeeeee" });
    expect(cellOf(a).style?.backgroundColor).toBe("#eeeeee");
    expect(b.style).toBeUndefined();
    expect(cellOf(b).style?.backgroundColor).toBe("#FFFFFF");
    expect(cellOf(c).style?.backgroundColor).toBe("#ff0000");
  });

  it("gives its columns the first row's shares (each 50 where it says none), in proportion", () => {
    const width = (node: TreeNode, cell: number) => cellOf(rowsOf(node)[0], cell).style?.width;
    const shares = block({ table: { headers: [cells({ text: "A", width: 20 }, { text: "B", width: 30 }, "C")], rows: [cells("1", "2", "3")], footers: [] } });
    expect([width(shares, 0), width(shares, 1), width(shares, 2)]).toEqual(["20%", "30%", "50%"]);
    expect(cellOf(rowsOf(shares)[1]).style?.width).toBeUndefined();
    // The first row's are the header's, drawn or not; a table with none shares evenly.
    expect(width(block({ table: { headers: [], rows: [cells({ text: "A", width: 70 }, { text: "B", width: 30 })], footers: [] } }), 0)).toBe("70%");
    expect(width(block({}), 0)).toBeUndefined();
    // Past the first row's, a row's cells share what's left.
    const more = block({ table: { headers: [cells("H")], rows: [cells("1", "2", "3")], footers: [] } });
    expect(cellOf(rowsOf(more)[1], 0).style?.width).toBe("50%");
    expect(cellOf(rowsOf(more)[1], 1).style?.width).toBe("25%");
    expect(said(<Table values={{ table: { headers: [cells("H")], rows: [cells("1", "2", "3")], footers: [] } } as never} />)).toContain("more cells");
    // Where nothing is left, they all share the table.
    expect(width(block({ table: { headers: [cells({ text: "A", width: 60 }, { text: "B", width: 40 })], rows: [cells("1", "2", "3")], footers: [] } }), 0)).toBeUndefined();
  });

  it("gives a row its height", () => {
    const node = block({ table: { headers: [], rows: [{ height: 80, ...cells("A") }, { height: 0, ...cells("B") }], footers: [] } });
    expect(rowsOf(node)[0].style).toEqual({ height: 80 });
    expect(rowsOf(node)[1].style).toBeUndefined();
  });

  it("reads a cell's markup as runs, a textJson's too; one that says nothing is a line of its height", () => {
    const textJson = JSON.stringify({ root: { children: [{ children: [{ detail: 0, format: 1, mode: "normal", style: "", text: "Bold", type: "text", version: 1 }], direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1 }], direction: "ltr", format: "", indent: 0, type: "root", version: 1 } });
    const node = block({ table: { headers: [], rows: [cells("<b>A</b> b", { textJson }, "", " ")], footers: [] } });
    const text = generateHtmlFromTextJson(textJson);
    expect(textsOf(node)[0]).toEqual([[{ type: "Span", style: { fontWeight: 700 }, children: ["A"] }, " b"], [{ type: "Raw", props: { html: text } }], ["​"], ["​"]]);
    expect(text).toContain("Bold");
  });

  it("reads a space that isn't breaking before a tag as a space, as legacy's cells do", () => {
    expect(textsOf(block({ table: { headers: [], rows: [cells("A&nbsp;<b>B</b>")], footers: [] } }))[0][0]).toEqual(["A ", { type: "Span", style: { fontWeight: 700 }, children: ["B"] }]);
  });

  it("writes a cell's markup no run holds as it is", () => {
    for (const text of ['<img src="https://example.com/a.png" alt="A"> Icon', "<ul><li>One</li></ul>", "<p>Para</p>"]) {
      expect(textsOf(block({ table: { headers: [], rows: [cells(text)], footers: [] } }))[0][0]).toEqual([{ type: "Raw", props: { html: text } }]);
    }
  });

  it("gives its links its link style where it's the table's own: on a page, under the pointer too", () => {
    const table = { headers: [], rows: [cells('<a href="https://example.com">a</a>')], footers: [] };
    const linkStyle = { linkColor: "#00ff00", linkHoverColor: "#ff0000", linkUnderline: false, linkHoverUnderline: true };
    const link = (values: Record<string, unknown>, Root: Root = Email) => textsOf(block({ table, ...values }, Root))[0][0]![0] as TreeNode;
    expect(link({ linkStyle })).toEqual({ type: "Link", props: { href: "https://example.com" }, style: { color: "#00ff00", textDecoration: "none" }, children: ["a"] });
    expect(link({ linkStyle }, Page)).toMatchObject({ style: { color: "#00ff00", textDecoration: "none" }, hover: { color: "#ff0000", textDecoration: "underline" } });
    expect(link({ linkStyle: { ...linkStyle, inherit: true } })).toEqual({ type: "Link", props: { href: "https://example.com" }, children: ["a"] });
    // The body's own, what the browser draws, is no style.
    expect(link({})).toEqual({ type: "Link", props: { href: "https://example.com" }, children: ["a"] });
  });

  it("in a printed document, has a space where it has no header or footer of its own, which a page repeats", () => {
    const rows = (values: Record<string, unknown>) => rowsOf(block(values, Document as Root));
    const [header, , , , footer] = rows({});
    expect(header.props).toEqual({ header: true });
    expect(footer).toMatchObject({ props: { footer: true }, style: { height: 6.5 } });
    expect(cellOf(footer).children).toBeUndefined();
    const none = rows({ enableHeader: false, enableFooter: true });
    expect(none[0]).toMatchObject({ props: { header: true }, style: { height: 6.5 } });
    expect(cellOf(none[4]).children).toEqual(["F1"]);
    // Not in an email or on a page, or in a block given another mode.
    expect(rowsOf(block({ enableHeader: false }))[0].children?.length).toBe(2);
    expect(cellOf(rowsOf(block({ enableHeader: false }))[0]).children).toEqual(["A1"]);
    expect(rowsOf(block({ mode: "email", enableHeader: false }, Document as Root)).length).toBe(3);
  });

  it("in a printed document, keeps a header or footer that doesn't repeat among its rows", () => {
    const rows = rowsOf(block({ enableFooter: true, repeatHeaderOnEachPage: false, repeatFooterOnEachPage: false }, Document as Root));
    expect(rows.map((row) => row.props?.header)).toEqual([true, undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(cellOf(rows[1]).children).toEqual(["H1"]);
    expect(rows[0].style?.height).toBe(6.5);
    expect(rows.at(-1)!.props).toEqual({ footer: true });
    expect(cellOf(rows.at(-2)!).children).toEqual(["F1"]);
  });

  it("writes what a merge tag rule puts around its rows as it is", () => {
    const state = { mergeTagState: { mergeTagGroup: "group", mergeTagRule: "rule", mergeTags: { group: { rules: { rule: { before: "{{#each}}", after: "{{/each}}" } } } } } };
    const tableOf = (values: Record<string, unknown>) => {
      const result = withRenderScope(() => lowerTemplate(<Email><Row><Column><Table values={{ table: data, ...values } as never} /></Column></Row></Email>, state, "renderToHtml")) as Lowered;
      const find = (node: TreeNode): TreeNode | undefined => (node.type === "Table" ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
      return find(result.tree.root)!.children as TreeNode[];
    };
    const rows = tableOf({ mergeTagGroup: "group", mergeTagRule: "rule" });
    expect(rows[1]).toEqual({ type: "Raw", props: { html: "{{#each}}\n" } });
    expect(rows[5]).toEqual({ type: "Raw", props: { html: "{{/each}}\n" } });
    // Only a table that says so.
    expect(tableOf({}).some((row) => row.type === "Raw")).toBe(false);
    // Legacy's plain text reads them among its cells.
    const template = <Email><Row><Column><Table values={{ table: data, mergeTagGroup: "group", mergeTagRule: "rule" } as never} /></Column></Row></Email>;
    expect(renderToPlainText(template, state)).toBe(legacyRenderToPlainText(template, state));
    expect(renderToPlainText(template, state)).toContain("{{#each}}");
  });

  it("takes the padding set for phones and desktop windows, and no others", () => {
    const node = block({ containerPadding: "4px", _override: { desktop: { containerPadding: "21px" }, mobile: { contentFontSize: "30px" }, tablet: { containerPadding: "41px" } } }, Page);
    expect(node).toMatchObject({ style: { padding: { top: 21 } }, mobile: { padding: { top: 4 } } });
    expect(cellOf(rowsOf(node)[1]).style?.fontSize).toBe(14);
    expect(cellOf(rowsOf(node)[1]).mobile).toBeUndefined();
    expect(block({ _override: { desktop: { containerPadding: "21px" } } }, Document as Root).style?.padding).toMatchObject({ top: 10 });
  });

  it.each([
    ["font size", { contentFontSize: "large" }],
    ["font weight", { headerFontWeight: "heavy" }],
    ["alignment", { footerTextAlign: "middle" }],
    ["vertical alignment", { contentVerticalAlign: "baseline" }],
    ["padding", { headerPadding: "5%" }],
    ["line height", { contentLineHeight: "tall" }],
    ["letter spacing", { contentLetterSpacing: "wide" }],
  ])("draws a %s it can't read as if unset, and says so", (what, values) => {
    const table = <Table values={{ table: data, enableFooter: true, ...values } as never} />;
    for (const Root of [Email, Page, Document] as Root[]) {
      expect((lowered(table, Root) as TreeNode).type).toBe("Column");
      expect(said(table, Root)).toContain(what);
    }
  });

  it("leaves out a color or a padding of its own it can't read, and says so", () => {
    const table = <Table values={{ table: { headers: [], rows: [cells({ text: "A", padding: "5%" })], footers: [] }, contentColor: "not a color" } as never} />;
    const cell = cellOf(rowsOf(lowered(table) as TreeNode)[0]);
    expect(cell.style?.color).toBeUndefined();
    expect(cell.children).toEqual(["A"]);
    expect(said(table)).toContain("not a color");
    expect(said(table)).toContain("padding");
  });

  it("draws a border's style it can't read as solid, and says a value it can't read once, for all its cells", () => {
    const table = <Table values={{ table: data, contentColor: "not a color", border: { borderTopWidth: "2px", borderTopStyle: "double", borderTopColor: "#111111" } } as never} />;
    expect(cellOf(rowsOf(lowered(table) as TreeNode)[1]).style?.border).toMatchObject({ top: { style: "solid" } });
    const lines = said(table).split("\n");
    expect(lines.filter((line) => line.includes("border's style")).length).toBe(1);
    expect(lines.filter((line) => line.includes("not a color")).length).toBe(1);
  });

  it("draws a block padding it can't read as the default, and says so", () => {
    const table = <Table values={{ table: data, containerPadding: "1em", _override: { mobile: { containerPadding: "2em" } } } as never} />;
    const node = lowered(table) as TreeNode;
    expect(node.style?.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(node.mobile).toBeUndefined();
    expect(said(table)).toContain('padding "1em"');
    expect(said(table)).toContain('padding on phones "2em"');
  });

  it("is drawn in its template's output where it's given a mode of its own, and hidden where it says", () => {
    expect(lowered(<Table mode="email" />, Page)?.type).toBe("Column");
    expect(lowered(<Table hideOnMobile />)?.hidden).toEqual({ mobile: true });
  });

  it("with no cells is a Table with no rows", () => {
    expect((lowered(<Table />) as TreeNode).children).toEqual([{ type: "Table", style: { borderCollapse: "collapse" }, children: [] }]);
  });

  it("reads in plain text as legacy's markup does: a line for each cell", () => {
    expect(block({}).textAs).toEqual({ type: "Raw", props: { html: "<table>" + ["H1", "H2", "A1", "A2", "B1", "B2", "C1", "C2"].map((text) => `<td>${text}</td>\n\n`).join("") + "</table>" } });
  });
});

describe("a menu block", () => {
  const menu = <Menu items={[{ text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }]} separator="|" padding="5px 15px" />;

  it("is on a page a Row of its links and separators, each in the links' padding, separators left out on phones", () => {
    const row = (lowered(menu, Page)?.children as TreeNode[])[0];
    expect(row).toMatchObject({ type: "Row", props: { stackOnMobile: false }, style: { flexWrap: "wrap", justifyContent: "center" } });
    expect((row.children as TreeNode[]).map((c) => [c.type, c.hidden, c.style?.padding, typeof c.children?.[0] === "string" ? c.children[0] : (c.children?.[0] as TreeNode).type])).toEqual([
      ["Text", undefined, { top: 5, right: 15, bottom: 5, left: 15 }, "Link"],
      ["Text", { mobile: true }, { top: 5, right: 15, bottom: 5, left: 15 }, "|"],
      ["Text", undefined, { top: 5, right: 15, bottom: 5, left: 15 }, "Link"],
    ]);
  });

  const row = (node: TreeNode | undefined) => (node?.children as TreeNode[])[0];

  it("is in an email its links and separators a word space apart, on lines of the font's own height, separators left out on phones", () => {
    const line = row(lowered(menu));
    expect(line).toMatchObject({ type: "Row", props: { stackOnMobile: false }, style: { flexWrap: "words", lineHeight: "normal", justifyContent: "center" } });
    expect((line.children as TreeNode[]).map((c) => c.hidden)).toEqual([undefined, { mobile: true }, undefined]);
    expect(lowered(<Menu items={[{ text: "Docs", href: "https://a.example" }]} letterSpacing="2px" />)?.children?.[0]).toMatchObject({ style: { letterSpacing: 2 } });
  });

  it("is in a printed document on lines of the font's own height, its separators always there", () => {
    const line = row(lowered(menu, Document as Root));
    expect(line.style).toMatchObject({ flexWrap: "wrap", lineHeight: "normal" });
    expect((line.children as TreeNode[])[1].hidden).toBeUndefined();
    expect(row(lowered(menu, Page)).style?.lineHeight).toBeUndefined();
  });

  it("draws as its own markup does where it says it's another output's: a page's in an email has no word spaces, an email's on a page a gap as wide", () => {
    expect(row(lowered(<Menu items={[{ text: "A", href: "https://a.example" }]} mode="web" />)).style?.flexWrap).toBe("wrap");
    expect(row(lowered(<Menu items={[{ text: "A", href: "https://a.example" }]} mode="email" />, Page)).style).toMatchObject({ flexWrap: "wrap", gap: 4.45 });
  });

  it("is vertical its links one under another, no separators", () => {
    const node = lowered(<Menu layout="vertical" align="left" separator="|" items={[{ text: "Docs", href: "https://a.example" }, { text: "Blog", href: "https://b.example" }]} />, Page);
    expect((node?.children as TreeNode[]).map((c) => [c.type, c.style?.textAlign, (c.children?.[0] as TreeNode).type])).toEqual([["Text", "left", "Link"], ["Text", "left", "Link"]]);
  });

  it("with no items has its padding and nothing in it", () => {
    expect(lowered(<Menu items={[]} />)).toEqual({ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: [] });
  });

  it("says items that aren't a list, and draws none", () => {
    const { node, said } = drawn(<Menu values={{ menu: { items: "Docs" } } as never} />, Page);
    expect(node?.children).toEqual([]);
    expect(said).toEqual(['A menu\'s items "Docs" can\'t be read: it\'s drawn without it.']);
  });

  it("is drawn without what can't be read, as CSS draws a value it can't read, each said", () => {
    const { node, said } = drawn(<Menu values={{ fontSize: "big", fontWeight: "heavy", letterSpacing: "wide", padding: "lots", containerPadding: "lots", align: "middle", menu: { items: [{ text: "Docs", link: { name: "web", values: { href: "https://a.example" } } }] } } as never} />, Page);
    expect(node?.style).toEqual({});
    const item = (row(node).children as TreeNode[])[0];
    expect(item.style).toEqual({ flex: "none" });
    expect(row(node).style?.justifyContent).toBe("start");
    expect(said.map((message) => /menu's (.+?) "/.exec(message)?.[1])).toEqual(["links' padding", "padding", "font size", "font weight", "letter spacing", "alignment"]);
  });

  it("draws a color the new engine refuses without it, and says so", () => {
    const { node, said } = drawn(<Menu items={[{ text: "A", href: "https://a.example" }]} linkColor="notacolor" />, Page);
    expect(((row(node).children as TreeNode[])[0].children as TreeNode[])[0].style).toEqual({ textDecoration: "none" });
    expect(said.join()).toContain("notacolor");
  });

  it("takes on a page's phones its links' size and padding and the block's padding; says what can't be read", () => {
    const node = lowered(<Menu separator="|" items={[{ text: "A", href: "https://a.example" }, { text: "B", href: "https://b.example" }]} mobile={{ fontSize: "20px", padding: "1px 2px", containerPadding: "30px" } as never} />, Page);
    expect(node?.mobile).toEqual({ padding: { top: 30, right: 30, bottom: 30, left: 30 } });
    for (const child of row(node).children as TreeNode[]) expect(child.mobile).toEqual({ fontSize: 20, padding: { top: 1, right: 2, bottom: 1, left: 2 } });
    expect(drawn(<Menu items={[{ text: "A", href: "https://a.example" }]} mobile={{ fontSize: "big" } as never} />, Page).said).toEqual(['A menu\'s font size on phones "big" can\'t be read: it\'s drawn without it.']);
  });

  const items = (list: unknown[]) => ({ menu: { items: list } }) as never;

  it("draws an item with no URL in the text's color: a link to nothing in a page's markup, plain text in an email's", () => {
    const plain = (Root: Root) => (row(lowered(<Menu values={items([{ text: "Plain" }])} textColor="#123456" />, Root)).children as TreeNode[])[0];
    expect(plain(Page).children).toEqual([{ type: "Link", props: { href: { href: "" } }, style: { color: "#123456", textDecoration: "none" }, children: ["Plain"] }]);
    expect(plain(Email)).toMatchObject({ style: { color: "#123456" }, children: ["Plain"] });
    // A link of another kind with no URL opens as it says.
    const phone = (row(lowered(<Menu values={items([{ text: "Call", link: { name: "phone", values: { phone: "+1" } } }])} />, Page)).children as TreeNode[])[0];
    expect((phone.children as TreeNode[])[0].props).toEqual({ href: { href: "", target: "_blank" } });
  });

  it("links an item of another kind where it has a URL, and shows what's in an item that isn't text", () => {
    const [mail, number] = row(lowered(<Menu values={items([{ text: "Mail", link: { name: "email", attrs: { href: "mailto:hi@example.com" }, values: { email: "hi@example.com" } } }, { text: 7, link: { name: "web", values: { href: "https://a.example" } } }])} />, Page)).children as TreeNode[];
    expect((mail.children as TreeNode[])[0].props).toEqual({ href: { href: "mailto:hi@example.com", target: "_blank" } });
    expect((number.children as TreeNode[])[0].children).toEqual(["7"]);
  });

  it("keeps an item with no text as its padding, its link empty; says an item that's nothing", () => {
    const { node, said } = drawn(<Menu values={items([{ link: { name: "web", values: { href: "https://a.example" } } }, null, { text: "A", link: { name: "web", values: { href: "https://b.example" } } }])} />, Page);
    const children = row(node).children as TreeNode[];
    expect(children).toHaveLength(2);
    expect((children[0].children as TreeNode[])[0]).toMatchObject({ type: "Link", children: [] });
    expect(said).toEqual(["A menu's item null can't be read: it's drawn without it."]);
  });

  it("keeps entity references and an email service's tags as written in an email's markup, in plain text as its markup reads", () => {
    const html = (Root: Root) => renderToHtml(<Root><Row><Column><Menu items={[{ text: "Shop &rarr; <%first%>", href: "https://a.example/<%id%>" }]} /></Column></Row></Root>);
    expect(html(Email)).toContain("Shop &rarr; <%first%>");
    expect(html(Email)).toContain('href="https://a.example/<%id%>"');
    expect(html(Page)).toContain("Shop &amp;rarr; &lt;%first%&gt;");
    const reading = (Root: Root) => lowered(<Menu separator="|" items={[{ text: "A", href: "https://a.example" }, { text: "B", href: "https://b.example" }]} />, Root)?.textAs;
    expect(reading(Email)?.type).toBe("Column");
    expect(reading(Email)?.children).toHaveLength(3);
    expect(reading(Page)?.type).toBe("Paragraph");
  });

  it("is laid out left to right in a template written right to left, as legacy's", () => {
    const element = (Root: Root) => <Root textDirection="rtl"><Row><Column><Menu items={[{ text: "A", href: "https://a.example" }]} /></Column></Row></Root>;
    const result = (Root: Root) => withRenderScope(() => lowerTemplate(element(Root), undefined, "renderToHtml")) as Lowered;
    expect(JSON.stringify(result(Page).tree)).toContain('"dir":"ltr"');
    expect(JSON.stringify(lowered(menu, Page))).not.toContain('"dir"');
  });
});

describe("a social block", () => {
  const icons = [{ name: "Facebook", url: "https://facebook.com/acme" }, { name: "Email", url: "hi@example.com" }];
  const row = (node: TreeNode | undefined) => (node?.children as TreeNode[])[0];
  const given = (list: unknown[], extra: Record<string, unknown> = {}) => ({ icons: { icons: list }, ...extra }) as never;

  it("is on a page a Row of its icons that wraps, each a link around its icon from the CDN, the space to the next inside its box", () => {
    expect(row(lowered(<Social icons={icons} iconSize={32} spacing={8} />, Page))).toEqual({
      type: "Row",
      props: { stackOnMobile: false },
      style: { flexWrap: "wrap", justifyContent: "center" },
      children: [
        {
          type: "Column",
          style: { flex: "none", width: 40, padding: { top: 0, right: 8, bottom: 0, left: 0 } },
          children: [
            {
              type: "Link",
              props: { href: { href: "https://facebook.com/acme", target: "_blank" }, "aria-label": "Facebook icon" },
              children: [{ type: "Image", props: { src: { src: "https://cdn.tools.unlayer.com/social/icons/circle/facebook.png", width: 32, height: 32 }, alt: "Facebook icon" }, style: { width: 32, height: 32 } }],
            },
          ],
        },
        expect.objectContaining({ type: "Column", style: { flex: "none", width: 32 }, children: [expect.objectContaining({ props: expect.objectContaining({ href: { href: "mailto:hi@example.com", target: "_blank" } }) })] }),
      ],
    });
  });

  it("is in an email the same, each in a box of the icon's height, its image as tall as its file makes it, with its name as a title", () => {
    const [first] = row(lowered(<Social icons={icons} iconSize={32} spacing={8} />)).children as TreeNode[];
    expect(first.style).toEqual({ flex: "none", width: 40, padding: { top: 0, right: 8, bottom: 0, left: 0 }, height: 32 });
    expect((first.children as TreeNode[])[0]).toEqual({
      type: "Link",
      props: { href: { href: "https://facebook.com/acme", target: "_blank" }, title: "Facebook" },
      children: [{ type: "Image", props: { src: { src: "https://cdn.tools.unlayer.com/social/icons/circle/facebook.png", width: 32, height: 32 }, alt: "Facebook icon", title: "Facebook" }, style: { width: 32 } }],
    });
  });

  it("draws as its own markup does where it says it's another output's", () => {
    expect(((row(lowered(<Social icons={icons} mode="web" />)).children as TreeNode[])[0].children as TreeNode[])[0].props).toHaveProperty("aria-label");
    expect((row(lowered(<Social icons={icons} mode="email" />, Page)).children as TreeNode[])[0].style).toHaveProperty("height");
  });

  it("with no icons draws a page's placeholder, placed by its alignment, and in an email's markup nothing", () => {
    expect(lowered(<Social icons={[]} iconSize={40} align="left" />, Page)).toEqual({
      type: "Column",
      style: { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "start" },
      children: [{ type: "Image", props: { src: "https://cdn.tools.unlayer.com/social/icons/default.png", alt: "social icon" }, style: { height: 40 } }],
    });
    expect(lowered(<Social icons={[]} />)).toEqual({ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: [] });
  });

  const image = (node: TreeNode | undefined, index = 0) => ((((row(node).children as TreeNode[])[index].children as TreeNode[])[0].children as TreeNode[])[0]);

  it("says icons that aren't a list, and draws as with none", () => {
    const { node, said } = drawn(<Social values={{ icons: { icons: "X" } } as never} />);
    expect(node?.children).toEqual([]);
    expect(said).toEqual(['A social block\'s icons "X" can\'t be read: it\'s drawn without it.']);
  });

  it("draws an icon's own image, and a custom icon's for its style", () => {
    expect((image(lowered(<Social values={given([{ name: "Mine", url: "https://mine.example", imgUrl: "https://cdn.example/mine.png" }])} />)).props?.src as { src: string }).src).toBe("https://cdn.example/mine.png");
    const custom = { icons: { iconType: "rounded", icons: [{ name: "Mine", url: "https://mine.example" }, { name: "X", url: "https://x.example" }], editor: { data: { customIcons: [{ name: "Mine", icons: { circle: "https://cdn.example/c.png", rounded: "https://cdn.example/r.png" } }] } } } } as never;
    const node = lowered(<Social values={custom} />, Page);
    expect((image(node).props?.src as { src: string }).src).toBe("https://cdn.example/r.png");
    expect((image(node, 1).props?.src as { src: string }).src).toBe("https://cdn.tools.unlayer.com/social/icons/rounded/x.png");
  });

  it("draws icons however wide they are: they wrap", () => {
    const wide = Array.from({ length: 14 }, (_, i) => ({ name: "X", url: `https://x.example/${i}` }));
    expect(row(lowered(<Social icons={wide} iconSize={48} />)).children).toHaveLength(14);
  });

  it("is drawn without what can't be read, each said", () => {
    const { node, said } = drawn(<Social containerPadding="lots" values={given([{ name: "X", url: "https://x.example" }], { iconSize: { no: 1 }, spacing: { no: 1 }, align: "middle" })} />, Page);
    expect(node?.style).toEqual({});
    expect(row(node).style?.justifyContent).toBe("start");
    expect(image(node).style).toEqual({ width: 32, height: 32 });
    expect(said.map((message) => /social block's (.+?) [{"]/.exec(message)?.[1])).toEqual(["icon size", "spacing", "padding", "alignment"]);
    expect(row(lowered(<Social values={given([{ name: "X", url: "https://x.example" }], { align: "middle" })} />)).style?.justifyContent).toBe("center");
  });

  it("draws what it can of a malformed icon, each said: no name (its link kept), no link (no link), a number as a link and as an image, and leaves out what isn't an icon", () => {
    const { node, said } = drawn(<Social values={given([{ url: "https://noname.example" }, { name: "Facebook" }, { name: "Facebook", url: 42 }, null, { name: "Instagram", url: "https://i.example", imgUrl: 7 }, { name: "X", url: "https://x.example", imgUrl: { no: 1 } }])} />);
    const boxes = row(node).children as TreeNode[];
    expect(boxes).toHaveLength(5);
    const [nameless, noLink, numeric, numericImage, oddImage] = boxes.map((box) => (box.children as TreeNode[])[0]);
    expect(nameless).toMatchObject({ type: "Link", props: { href: { href: "https://noname.example" } }, children: [{ props: { alt: " icon", src: { src: "https://cdn.tools.unlayer.com/social/icons/circle/.png" } } }] });
    expect(noLink.type).toBe("Image");
    expect(numeric.props?.href).toEqual({ href: "42", target: "_blank" });
    expect(((numericImage.children as TreeNode[])[0].props?.src as { src: string }).src).toBe("7");
    expect(((oddImage.children as TreeNode[])[0].props?.src as { src: string }).src).toBe("https://cdn.tools.unlayer.com/social/icons/circle/x.png");
    expect(said).toEqual([
      "A social block's icon null can't be read: it's drawn without it.",
      "A social block's icon's name undefined can't be read: it's drawn without it.",
      "A social icon's 7 isn't a URL: it's written as it is.",
      'A social icon\'s {"no":1} can\'t be read.',
    ]);
  });

  it("draws an icon size of none without a size for its file (which the new engine refuses)", () => {
    const { node, said } = drawn(<Social values={given([{ name: "X", url: "https://x.example" }], { iconSize: 0 })} />, Page);
    expect(image(node).props?.src).toBe("https://cdn.tools.unlayer.com/social/icons/circle/x.png");
    expect(said).toEqual([]);
  });

  it("is laid out left to right in a template written right to left, as legacy's", () => {
    const tree = (Root: Root) => (withRenderScope(() => lowerTemplate(<Root textDirection="rtl"><Row><Column><Social icons={icons} /></Column></Row></Root>, undefined, "renderToHtml")) as Lowered).tree;
    expect(JSON.stringify(tree(Page))).toContain('"dir":"ltr"');
    expect(JSON.stringify(lowered(<Social icons={icons} />, Page))).not.toContain('"dir"');
  });

  it("reads as its links' addresses in plain text: on one line in a page's markup, each on its own in an email's", () => {
    const addresses = (Root: Root) => lowered(<Social icons={icons} />, Root)?.textAs;
    expect(addresses(Page)).toMatchObject({ type: "Paragraph", children: [{ type: "Link", children: [] }, " ", { type: "Link", children: [] }] });
    expect(addresses(Email)).toMatchObject({ type: "Column", children: [{ type: "Column" }, { type: "Column" }] });
  });
});

describe("a video block", () => {
  const video = <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />;

  it("is its player on a page, its thumbnail (with no link, as legacy's) in an email", () => {
    expect((lowered(video, Page)?.children as TreeNode[])[0]).toEqual({ type: "Video", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
    expect((lowered(video)?.children as TreeNode[])[0]).toMatchObject({ type: "Image", props: { src: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg", alt: "Video" } });
  });

  const held = (node: TreeNode | undefined) => (node?.children as TreeNode[])[0];
  const html = (node: TreeNode | undefined) => String(held(node).props?.html);
  const other = { video: { type: "dailymotion", videoId: "x8abc", thumbnail: "https://cdn.example/t.png" } } as never;

  it("of a kind that has no player leaves its 16:9 place empty on a page and says so; its thumbnail in an email", () => {
    const { node, said } = drawn(<Video values={other} />, Page);
    expect(held(node).type).toBe("Raw");
    expect(html(node)).toContain("padding-bottom:56.25%");
    expect(html(node)).not.toMatch(/<iframe|<img/);
    expect(said).toEqual(['A video of type "dailymotion" has no player: its place is left empty.']);
    expect(held(lowered(<Video values={other} />))).toMatchObject({ type: "Image", props: { src: "https://cdn.example/t.png" } });
  });

  it("with no video draws the placeholder: in its 16:9 place on a page, as a thumbnail in an email", () => {
    const empty = <Video values={{ video: { type: "youtube", videoId: "", thumbnail: "" } } as never} />;
    expect(html(lowered(empty, Page))).toContain('src="https://cdn.tools.unlayer.com/video/placeholder.png"');
    expect(held(lowered(empty))).toMatchObject({ type: "Image", props: { src: "https://cdn.tools.unlayer.com/video/placeholder.png", alt: "Video" } });
    expect(drawn(empty, Page).said).toEqual(["A video has no video to play: it's drawn as the placeholder."]);
  });

  it("with an id the new Video doesn't read writes its player as it is, which that id can't get out of, and says so", () => {
    const { node, said } = drawn(<Video values={{ video: { type: "youtube", videoId: 'a"><x-pwn>' } } as never} />, Page);
    expect(html(node)).toContain('src="https://www.youtube.com/embed/a&quot;&gt;&lt;x-pwn&gt;"');
    expect(said.join()).toContain("can't be read");
  });

  it("in an email, where it says it's a page's, is a player of its own", () => {
    expect(html(lowered(<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" mode="web" />))).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
  });

  it("on a page, where it says it's an email's, is its thumbnail", () => {
    expect(held(lowered(<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" mode="email" />, Page))).toMatchObject({ type: "Image", props: { alt: "Video" } });
  });

  it("links its thumbnail where it has a link of its own: its href, else its video's URL", () => {
    expect(held(lowered(<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" values={{ href: "https://example.com/watch" } as never} />))).toMatchObject({ type: "Link", props: { href: { href: "https://example.com/watch", target: "_blank" } } });
    expect(held(lowered(<Video values={{ video: { thumbnail: "https://cdn.example/t.png", url: "https://example.com/v" } } as never} />))).toMatchObject({ type: "Link", props: { href: { href: "https://example.com/v" } } });
  });

  it("draws a thumbnail that runs a script as the placeholder, and says so", () => {
    const { node, said } = drawn(<Video values={{ video: { thumbnail: "javascript:alert(1)" } } as never} />);
    expect(held(node).props?.src).toBe("https://cdn.tools.unlayer.com/video/placeholder.png");
    expect(said.join()).toContain("isn't one Elements writes");
  });

  it("is drawn without a padding it can't read, and says so", () => {
    const { node, said } = drawn(<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" containerPadding="lots" />, Page);
    expect(node?.style).toEqual({});
    expect(said).toEqual(['A video\'s padding "lots" can\'t be read: it\'s drawn without it.']);
  });

  it("caps an email's thumbnail at legacy's maximum where its row stacks, where that's past its width on desktop", () => {
    const image = (Root: Root) => {
      const result = withRenderScope(() => lowerTemplate(<Root><Row cells={[1, 1]}><Column>{video}</Column><Column><Paragraph>B</Paragraph></Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
      const find = (node: TreeNode): TreeNode | undefined => (node.type === "Image" ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
      return find(result.tree.root);
    };
    expect(image(Email)).toMatchObject({ style: { maxWidth: 250 }, compat: { stackedMaxWidth: 250 } });
    expect(image(Email)?.mobile).toBeUndefined();
  });
});

describe("a page break", () => {
  it("draws nothing in an email or on a page, and in a printed document is a box of its padding the page breaks after, with no Raw node", () => {
    for (const Root of [Email, Page]) {
      const result = withRenderScope(() => lowerTemplate(<Root><Row><Column><Paragraph>A</Paragraph><PageBreak /></Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
      expect(result.legacyHead).toBeUndefined();
      expect(lowered(<PageBreak />, Root)).toBeUndefined();
    }
    expect(lowered(<PageBreak />, Document as Root)).toEqual({ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 }, breakAfter: "page" } });
    expect((withRenderScope(() => lowerTemplate(<Document><Row><Column><PageBreak /></Column></Row></Document>, undefined, "renderToHtml")) as Lowered).legacyHead).toBeUndefined();
  });

  it("goes by its own mode: a box in an email where it says it's a document's, nothing in a document where it says it's a page's", () => {
    expect(lowered(<PageBreak mode="document" />)?.style?.breakAfter).toBe("page");
    expect(lowered(<PageBreak mode="web" />, Document as Root)).toBeUndefined();
  });

  it("is drawn without a padding it can't read, and says so", () => {
    const { node, said } = drawn(<PageBreak containerPadding="lots" />, Document as Root);
    expect(node).toEqual({ type: "Column", style: { breakAfter: "page" } });
    expect(said).toEqual(['A page break\'s padding "lots" can\'t be read: it\'s drawn without it.']);
  });
});

describe("an Html block's own HTML", () => {
  const written = (html: unknown, mode: string, toSafeHtml?: (html: string) => string) =>
    (Html as any)[UNLAYER_RENDER_KEY]({ values: { html }, mode, _config: { toSafeHtml } }).props.dangerouslySetInnerHTML.__html;

  it("is in a <div>, on lines of its own in an email", () => {
    expect(written("<b>x</b>", "web")).toBe("<div><b>x</b></div>");
    expect(written("<b>x</b>", "document")).toBe("<div><b>x</b></div>");
    expect(written("<b>x</b>", "email")).toBe("\n  <div>\n    <b>x</b>\n  </div>\n");
  });

  it("goes through the config's sanitizer where it has one", () => {
    for (const mode of ["web", "document", "email"]) expect(written("<b>x</b>", mode, (html) => html.replace("x", "safe"))).toContain("<b>safe</b>");
  });

  it("is what the closed HtmlExporters write, byte for byte", () => {
    const closed = HtmlExporters as Record<string, (...args: any[]) => string>;
    for (const mode of ["web", "document", "email"]) {
      for (const html of ["<b>x</b>", "", "  spaced  ", "<p>a</p>\n<p>b</p>", "&amp; &copy; $& $' <!-- c -->", "<%tag%> {{merge}}", "</div>", "é ✓"]) {
        for (const toSafeHtml of [undefined, (text: string) => `[${text}]`]) {
          expect(written(html, mode, toSafeHtml)).toBe(closed[mode]({ html }, 0, 0, [], {}, {}, undefined, { exporterConfig: { toSafeHtml } }));
        }
      }
    }
  });
});

describe("a custom tool, an Html block and a user's own markup", () => {
  type Root = typeof Email;
  const calls: unknown[][] = [];
  const Tool = registerTool({
    name: "frame_probe",
    values: { label: "default" },
    renderer: {
      exporters: {
        web: (values, ...args) => (calls.push([values, ...args]), `<i>web ${values.label} ${values._meta.htmlID}</i>`),
        email: (values, ...args) => (calls.push([values, ...args]), `<i>email ${values.label} ${values._meta.htmlID}</i>`),
      },
    },
  });
  const Mine = ({ label }: { label: string; containerPadding?: string; hideOnDesktop?: boolean }) => <section>{label}</section>;
  const template = (Root: Root) => (
    <Root contentWidth="640px" textColor="#333333" fontFamily={{ label: "Georgia", value: "georgia,serif" } as never}>
      <Row cells={[1, 2]} backgroundColor="#fafafa" padding="4px">
        <Column padding="8px">
          <Paragraph>First</Paragraph>
          <Html html="<b>One</b>" containerPadding={20} hideOnMobile />
          <Tool label="a" />
          <Html html="<b>Two</b>" values={{ _meta: { htmlID: "given" } } as never} />
        </Column>
        <Column padding="2px 6px">
          <Mine label="mine" containerPadding="3px" hideOnDesktop />
          <Tool label="b" hideOnMobile={"its own" as never} containerPadding="0px" values={{ _override: { tablet: { hideTablet: true } } }} />
          <Paragraph>Last</Paragraph>
        </Column>
      </Row>
      <Row>
        <Column>
          <Tool label="c" mode="web" />
          <Mine label="again" />
        </Column>
      </Row>
    </Root>
  );
  const raws = (node: TreeNode): TreeNode[] => (node.type === "Raw" ? [node] : (node.children ?? []).flatMap((c) => (typeof c === "string" ? [] : raws(c))));
  const lower = (element: React.ReactElement) => withRenderScope(() => lowerTemplate(element, undefined, "renderToHtml")) as Lowered;
  /** The blocks but the paragraphs (the template's first and seventh), as today's Column writes them. */
  const asToday = (element: React.ReactElement) => {
    const html = new Map<number, string>();
    withRenderScope(() => recordingBlockHtml((n) => n !== 0 && n !== 6, (n, written) => html.set(n, written), () => renderBody(element, undefined)));
    return [...html.values()];
  };

  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as Array<[string, Root]>)("are written as today's Column writes them, byte for byte, numbered as it numbers them (%s)", (name, Root) => {
    const today = asToday(template(Root));
    const now = raws(lower(template(Root)).tree.root).map((node) => String(node.props?.html));
    expect(now).toEqual(name === "Document" ? today.map((html) => `<div style="line-height:normal">${html}</div>`) : today);
    expect(now).toHaveLength(7);
    const all = now.join("");
    for (const id of ["u_content_html_1", "u_content_custom_frame_probe_1", "given", "u_content_mine_1", "u_content_custom_frame_probe_2", "u_content_custom_frame_probe_3", "u_content_mine_2"]) expect(all).toContain(`id="${id}"`);
  });

  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as Array<[string, Root]>)("give a custom tool's exporter what today's Column gives it (%s)", (_, Root) => {
    calls.length = 0;
    asToday(template(Root));
    const today = calls.splice(0);
    lower(template(Root));
    expect(today).toHaveLength(3);
    expect(calls).toEqual(today);
  });

  it("are Raw nodes wherever they're hidden, by their box's classes", () => {
    const [one, , , mine, tool] = raws(lower(template(Email)).tree.root);
    expect(one.hidden).toBeUndefined();
    expect(one.props?.html).toContain('class="u_content_html hide-mobile"');
    expect(one.props?.html).toContain("padding:20px;");
    expect(mine.props?.html).toContain('class="u_content_mine hide-default__display-table hide-desktop"');
    expect(mine.props?.html).toContain("<section>mine</section>");
    // A custom tool's `hideOnMobile` is its own value; its overrides are its settings.
    expect(tool.props?.html).toContain('class="u_content_custom_frame_probe hide-tablet"');
    expect(tool.props?.html).toContain("padding:0px;");
  });

  it("take a block's own mode for its exporter, and the template's for its box", () => {
    const [, , , , , third] = raws(lower(template(Email)).tree.root);
    expect(third.props?.html).toContain("<i>web c u_content_custom_frame_probe_3</i>");
    expect(third.props?.html).toContain('<table id="u_content_custom_frame_probe_3"');
  });

  it("read as legacy's plain text", () => {
    const [one, , two] = raws(lower(template(Page)).tree.root);
    expect(one.props?.text).toBe("One");
    expect(two.props?.text).toBe("Two");
  });
});
