import { describe, expect, it } from "vitest";
import { HtmlExporters } from "@unlayer/exporters";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Video, registerTool, renderToHtml } from "../index";
import { recordingBlockHtml } from "../utils/block-html";
import { UNLAYER_RENDER_KEY } from "../utils/create-component";
import { renderBody } from "../utils/render-to-html";
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

/** The node a block lowers to and what it says, in an Email or a Page. */
function drawn(block: React.ReactElement, Root: Root = Email): { node: TreeNode | undefined; said: string[] } {
  const result = withRenderScope(() => lowerTemplate(<Root><Row><Column>{block}</Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
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

  it("keeps its legacy HTML where its HTML holds what no run does", () => {
    expect(lowered(<Paragraph html="<ul><li>One</li></ul>" />)?.type).toBe("Raw");
  });

  it("keeps its legacy HTML where it holds an email service's tag the new engine would write otherwise; a plain merge tag is written as it is", () => {
    for (const html of ["{% if orders > 1 %}Thanks{% endif %}", "Hi {{ name | default: \"there\" }}", "{{ a > b }}", "<%= name %>"]) expect(lowered(<Paragraph html={html} />)?.type).toBe("Raw");
    expect(lowered(<Paragraph html="Hi {{name}}" />)).toMatchObject({ type: "Paragraph", children: ["Hi {{name}}"] });
  });
});

describe("a text block's link style", () => {
  const link = (Root: Root, linkStyle: Record<string, unknown>) => lowered(<Paragraph html='<a href="https://example.com">link</a> rest' linkStyle={linkStyle as never} />, Root);

  it("gives its links its color, and no underline where it says none", () => {
    expect(link(Email, { inherit: false, linkColor: "#00ff00", linkUnderline: false })?.children?.[0]).toMatchObject({ type: "Link", style: { color: "#00ff00", textDecoration: "none" } });
    expect(link(Page, { inherit: false, linkColor: "#00ff00", linkHoverColor: "#00ff00", linkUnderline: false, linkHoverUnderline: false })?.children?.[0]).toMatchObject({ type: "Link", style: { color: "#00ff00", textDecoration: "none" } });
  });

  it("keeps its legacy HTML on a page where its links' hover style is another (legacy's head CSS draws it)", () => {
    expect(link(Page, { inherit: false, linkColor: "#00ff00", linkUnderline: false })?.type).toBe("Raw");
  });
});

describe("a text block's direction and fonts", () => {
  const block = (element: React.ReactElement) => {
    const result = withRenderScope(() => lowerTemplate(element, undefined, "renderToHtml")) as Lowered;
    const find = (node: TreeNode): TreeNode | undefined => (node.type === "Column" && node.designColumn ? (node.children as TreeNode[])[0] : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
    return find(result.tree.root);
  };

  it("keeps its legacy HTML where its own direction isn't the template's (legacy writes the template's)", () => {
    expect(lowered(<Paragraph textDirection="rtl">Hello (world)!</Paragraph>)?.type).toBe("Raw");
    expect(block(<Email textDirection="rtl"><Row><Column><Paragraph textDirection="rtl">مرحبا</Paragraph></Column></Row></Email>)?.type).toBe("Paragraph");
  });

  it("keeps a heading's legacy HTML where a run sets its own font size in a line height in % (legacy's is the heading's)", () => {
    expect(lowered(<Heading values={{ text: 'H <span style="font-size:60px">BIG</span>' } as never} />)?.type).toBe("Raw");
    expect(lowered(<Paragraph html='a <span style="font-size:28px">BIG</span>' />)?.type).toBe("Paragraph");
  });
});

describe("a heading block", () => {
  it("is a Heading of its level, bold where it says no weight", () => {
    expect(lowered(<Heading headingType="h2" values={{ fontWeight: undefined } as never}>Title</Heading>)).toMatchObject({ type: "Heading", props: { level: 2 }, children: ["Title"] });
    expect(lowered(<Heading fontWeight={600}>Title</Heading>)?.style).toMatchObject({ fontSize: 22, lineHeight: "140%", fontWeight: 600 });
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

  it("keeps its legacy HTML on a page or in a printed document where it has a width: legacy puts its padding on top", () => {
    const button = <Button href="https://example.com" width="300px" padding="10px 20px">Go</Button>;
    expect(lowered(button, Page)?.type).toBe("Raw");
    expect(lowered(button, Document)?.type).toBe("Raw");
    expect((lowered(button)?.children as TreeNode[])[0]).toMatchObject({ type: "Button", style: { width: 300 } });
  });

  it("keeps its legacy HTML where it has no link (legacy's href=\"\")", () => {
    expect(lowered(<Button>Go</Button>)?.type).toBe("Raw");
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

  it("caps an email image on phones at legacy's maximum where that's past its width on desktop (a stacked column is wider)", () => {
    const image = (Root: Root) => {
      const result = withRenderScope(() => lowerTemplate(<Root><Row cells={[1, 1]}><Column><Image src={{ url: "https://example.com/a.png", width: 600, height: 300 }} altText="A" /></Column><Column><Paragraph>B</Paragraph></Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
      const find = (node: TreeNode): TreeNode | undefined => (node.type === "Image" ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c))).find(Boolean));
      return find(result.tree.root);
    };
    // A 500px email's half is 250px: legacy's image is at most that, drawn 230px wide in its padding on desktop.
    expect(image(Email)).toMatchObject({ style: { width: "100%", maxWidth: 250 }, mobile: { maxWidth: 250 } });
    expect(image(Page)?.mobile).toBeUndefined();
  });
});

describe("a divider block", () => {
  it("is a Divider of its line, padding and length, placed by its alignment where it's shorter than its column", () => {
    expect(lowered(<Divider borderTopWidth="2px" borderTopColor="#ccc" />)).toEqual({ type: "Divider", style: { borderTop: { width: 2, style: "solid", color: "#ccc" }, padding: { top: 10, right: 10, bottom: 10, left: 10 } } });
    expect(lowered(<Divider width="60%" textAlign="left" />)).toMatchObject({ type: "Column", style: { textAlign: "left" }, children: [{ type: "Divider", style: { width: "60%" } }] });
  });

  it("keeps its legacy HTML on a page and in a printed document, whose line is as tall as its font makes it", () => {
    expect(lowered(<Divider borderTopWidth="2px" />, Page)?.type).toBe("Raw");
    expect(lowered(<Divider borderTopWidth="2px" />, Document)?.type).toBe("Raw");
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
});

describe("a page break", () => {
  it("draws nothing in an email or on a page (with nothing written by legacy's exporters), and keeps its legacy HTML in a printed document", () => {
    for (const Root of [Email, Page]) {
      const result = withRenderScope(() => lowerTemplate(<Root><Row><Column><Paragraph>A</Paragraph><PageBreak /></Column></Row></Root>, undefined, "renderToHtml")) as Lowered;
      expect(result.legacyHead).toBeUndefined();
      expect(lowered(<PageBreak />, Root)).toBeUndefined();
    }
    expect(lowered(<PageBreak />, Document as Root)?.type).toBe("Raw");
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
