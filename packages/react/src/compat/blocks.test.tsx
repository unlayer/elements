import { describe, expect, it } from "vitest";
import { HtmlExporters } from "@unlayer/exporters";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Video } from "../index";
import { UNLAYER_RENDER_KEY } from "../utils/create-component";
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

  it("keeps its legacy HTML where it links somewhere: legacy's link holds it at the size its place gives it", () => {
    const linked = <Image src={{ url: "https://example.com/a.png", width: 200, height: 100 }} altText="A" width="40%" action={{ url: "https://example.com", target: "_self" } as never} />;
    for (const Root of [Email, Page, Document]) expect(lowered(linked, Root)?.type).toBe("Raw");
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

  it("keeps its legacy HTML in an email, whose lines are the font's own height", () => {
    expect(lowered(menu)?.type).toBe("Raw");
  });
});

describe("a social block", () => {
  it("is on a page a Row of its icons, each a link around its icon from the CDN", () => {
    const row = (lowered(<Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} iconSize={32} spacing={8} />, Page)?.children as TreeNode[])[0];
    expect(row).toEqual({
      type: "Row",
      props: { stackOnMobile: false },
      style: { gap: 8, justifyContent: "center" },
      children: [
        {
          type: "Link",
          props: { href: { href: "https://facebook.com/acme", target: "_blank" }, "aria-label": "Facebook icon" },
          style: { flex: "none" },
          children: [{ type: "Image", props: { src: { src: "https://cdn.tools.unlayer.com/social/icons/circle/facebook.png", width: 32, height: 32 }, alt: "Facebook icon" }, style: { width: 32, height: 32 } }],
        },
      ],
    });
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
