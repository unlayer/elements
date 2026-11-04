import { describe, expect, it } from "vitest";
import { HtmlExporters } from "@unlayer/exporters";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Table, Video, registerTool, renderToPlainText } from "../index";
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
