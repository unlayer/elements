import { checkTarget, parseDocument, resolveDocument, type ResolvedNode } from "../src";

const resolve = (root: unknown) => resolveDocument(parseDocument({ version: 1, root }));
const child = (node: ResolvedNode, ...path: number[]): ResolvedNode => path.reduce((n, i) => n.children[i] as ResolvedNode, node);

describe("widths", () => {
  it("gives the root's children its width, and a Section its own padding inside it", () => {
    const { root, diagnostics } = resolve({
      type: "Email",
      children: [{ type: "Section", style: { padding: 24 }, children: [{ type: "Text", children: ["Hi"] }] }, { type: "Divider" }],
    });
    expect(diagnostics).toEqual([]);
    expect([root.width, root.contentWidth]).toEqual([600, 600]);
    expect([child(root, 0).width, child(root, 0).contentWidth]).toEqual([600, 552]);
    expect(child(root, 0, 0).width).toBe(552);
    expect(child(root, 1).width).toBe(600);
  });

  it("leaves a Row's children shown only on phones out of its desktop widths, and as wide as the Row", () => {
    const { root } = resolve({
      type: "Email",
      children: [{ type: "Row", style: { gap: 20 }, children: [{ type: "Column" }, { type: "Column", hidden: { desktop: true } }, { type: "Column" }] }],
    });
    expect([0, 1, 2].map((i) => child(root, 0, i).width)).toEqual([290, 600, 290]);
  });

  it("shares a Row's width after its gaps and fixed children, in whole px that add up", () => {
    const { root } = resolve({
      type: "Email",
      props: { width: 601 },
      children: [
        {
          type: "Row",
          style: { gap: 20, padding: [0, 10] },
          children: [{ type: "Column", style: { width: 100 } }, { type: "Column" }, { type: "Column", style: { flex: 2 } }],
        },
      ],
    });
    const row = child(root, 0);
    expect(row.contentWidth).toBe(581);
    const widths = row.children.map((c) => (c as ResolvedNode).width);
    // 581 - 40 of gaps - 100 = 441, shared 1:2
    expect(widths).toEqual([100, 147, 294]);
    expect(widths.reduce((a, b) => a! + b!, 0)! + 40).toBe(581);
  });

  it("takes percentages of the width the parent has", () => {
    const { root } = resolve({ type: "Email", children: [{ type: "Row", children: [{ type: "Column", style: { width: "25%" } }, { type: "Column" }] }] });
    expect(child(root, 0).children.map((c) => (c as ResolvedNode).width)).toEqual([150, 450]);
  });

  it("subtracts padding and border from the content width", () => {
    const { root } = resolve({ type: "Email", children: [{ type: "Column", style: { padding: 20, border: "2px solid #000" } }] });
    expect([child(root, 0).width, child(root, 0).contentWidth]).toEqual([600, 556]);
  });

  it("sizes images by their own size, no wider than their parent, and leaves unknown sizes unknown", () => {
    const { root } = resolve({
      type: "Email",
      children: [
        { type: "Image", props: { src: { src: "https://example.com/a.png", width: 200 } } },
        { type: "Image", props: { src: { src: "https://example.com/b.png", width: 2000 } } },
        { type: "Image", props: { src: "https://example.com/c.png" } },
        { type: "Image", props: { src: "https://example.com/d.png" }, style: { width: "50%" } },
        { type: "Button", props: { href: "#" }, children: ["Go"] },
        { type: "Link", props: { href: "#" }, children: [{ type: "Image", props: { src: { src: "https://example.com/e.png", width: 120 } } }] },
      ],
    });
    expect(root.children.map((c) => (c as ResolvedNode).width)).toEqual([200, 600, null, 300, null, 120]);
    expect(child(root, 2).available).toBe(600);
  });

  it("warns when children are wider than their parent, and when flex is on a child of something else", () => {
    const { diagnostics } = resolve({
      type: "Email",
      children: [
        { type: "Row", children: [{ type: "Column", style: { width: 400 } }, { type: "Column", style: { width: 300 } }] },
        { type: "Image", props: { src: "https://example.com/a.png" }, style: { width: 700 } },
        { type: "Text", style: { flex: 2 } },
      ],
    });
    expect(diagnostics.map((d) => [d.code, d.path]).sort()).toEqual([
      ["layout/overflow", "root.children[1]"],
      ["layout/shrunk", "root.children[0]"],
      ["style/ignored", "root.children[2].style.flex"],
    ]);
  });

  it("stacks Rows on phones by default in an Email or Page", () => {
    expect(child(resolve({ type: "Email", children: [{ type: "Row" }] }).root, 0).style.wrap).toBe("stack");
    expect(child(resolve({ type: "Email", children: [{ type: "Row", style: { wrap: "none" } }] }).root, 0).style.wrap).toBe("none");
  });
});

describe("text styles", () => {
  it("inherits from the root down, under each component's own defaults", () => {
    const { root } = resolve({
      type: "Email",
      style: { fontFamily: "Inter, Arial, sans-serif", color: "#333333" },
      children: [
        {
          type: "Column",
          style: { textAlign: "center" },
          children: [
            { type: "Heading", props: { level: 2 }, children: ["Title"] },
            { type: "Paragraph", style: { fontSize: 14 }, children: ["Body ", { type: "Link", props: { href: "#" }, children: ["link"] }] },
            { type: "Button", props: { href: "#" }, children: ["Go"] },
          ],
        },
      ],
    });
    const heading = child(root, 0, 0);
    expect(heading.text).toMatchObject({ fontFamily: "Inter, Arial, sans-serif", color: "#333333", fontSize: 24, fontWeight: 700, textAlign: "center", lineHeightPx: 30 });
    const paragraph = child(root, 0, 1);
    expect(paragraph.text).toMatchObject({ fontSize: 14, fontWeight: 400, lineHeight: 1.5, lineHeightPx: 21 });
    const link = child(root, 0, 1, 1);
    expect(link.text).toMatchObject({ fontSize: 14, color: "#0000ee" });
    expect(link.style.textDecoration).toBe("underline");
    expect(child(root, 0, 2).text).toMatchObject({ color: "#ffffff", fontSize: 14, lineHeightPx: 16.8 });
  });

  it("applies prop defaults", () => {
    const { root } = resolve({ type: "Email", children: [{ type: "Heading", children: ["x"] }, { type: "Image", props: { src: "https://example.com/a.png" } }] });
    expect(child(root, 0).props.level).toBe(1);
    expect(child(root, 0).text.fontSize).toBe(32);
    expect(child(root, 1).props.alt).toBe("");
    expect(root.props.width).toBe(600);
  });
});

describe("checkTarget", () => {
  it("reports components a target doesn't render", () => {
    const document = parseDocument({ version: 1, root: { type: "Email", children: [{ type: "Text", children: ["x"] }] } });
    expect(checkTarget(document, "email")).toEqual([]);
    expect(checkTarget(document, "pdf").map((d) => d.path)).toEqual(["root", "root.children[0]"]);
  });
});

describe("lists and tables", () => {
  it("gives a List's items its width less the markers' column, and a nested List its item's", () => {
    const { root, diagnostics } = resolve({
      type: "Email",
      children: [
        {
          type: "List",
          style: { padding: [0, 10], indent: 30 },
          children: [{ type: "ListItem", children: ["a", { type: "List", children: [{ type: "ListItem", children: ["b"] }] }] }],
        },
      ],
    });
    expect(diagnostics).toEqual([]);
    const list = child(root, 0);
    expect([list.width, list.contentWidth]).toEqual([600, 580]);
    expect(child(list, 0).width).toBe(550);
    const nested = child(list, 0, 1);
    expect(nested.width).toBe(550);
    // Its own markers' column: the default 24px.
    expect(child(nested, 0).width).toBe(526);
  });

  it("sizes a Table's columns from its cells, shares the rest, and spans cells across columns", () => {
    const { root, diagnostics } = resolve({
      type: "Email",
      children: [
        {
          type: "Table",
          style: { cellPadding: 8, border: "1px solid #ccc", rowBorder: "1px solid #eee" },
          children: [
            { type: "TableRow", props: { header: true }, children: [{ type: "TableCell", style: { width: "50%" } }, { type: "TableCell" }, { type: "TableCell", style: { width: 100 } }] },
            { type: "TableRow", children: [{ type: "TableCell", props: { colSpan: 2 }, children: [{ type: "Image", props: { src: { src: "https://example.com/a.png", width: 1000 } } }] }, { type: "TableCell", style: { padding: 0 } }] },
          ],
        },
      ],
    });
    expect(diagnostics).toEqual([]);
    const table = child(root, 0);
    // 600 less the 1px border each side: 299 for 50%, 100 fixed, 199 for the free column.
    expect(table.columns).toEqual([299, 199, 100]);
    expect([0, 1, 2].map((i) => child(table, 0, i).width)).toEqual([299, 199, 100]);
    expect(child(table, 1, 0).width).toBe(498);
    // A cell's padding is the table's unless it sets its own; an image in it fits inside it.
    expect(child(table, 1, 0).contentWidth).toBe(482);
    expect(child(table, 1, 0, 0).width).toBe(482);
    expect(child(table, 1, 1).contentWidth).toBe(100);
    // The table's line between rows is each cell's bottom border, but in the last row.
    expect(child(table, 0, 0).style.border).toEqual({ bottom: { width: 1, style: "solid", color: "#eeeeee" } });
    expect(child(table, 1, 0).style.border).toBeUndefined();
    // A header row's cells are bold.
    expect(child(table, 0, 0).text.fontWeight).toBe(700);
    expect(child(table, 1, 0).text.fontWeight).toBe(400);
  });

  it("rounds columns given as a share before sharing the rest, so the columns add up to the table", () => {
    const { root } = resolve({
      type: "Email",
      props: { width: 640 },
      children: [{ type: "Table", style: { border: "1px solid #ccc" }, children: [{ type: "TableRow", children: [{ type: "TableCell", style: { width: "40%" } }, { type: "TableCell" }, { type: "TableCell", style: { width: 120 } }] }] }],
    });
    expect(child(root, 0).columns).toEqual([255, 263, 120]);
  });

  it("warns where a Table's columns are wider than it", () => {
    const { diagnostics } = resolve({ type: "Email", children: [{ type: "Table", children: [{ type: "TableRow", children: [{ type: "TableCell", style: { width: 400 } }, { type: "TableCell", style: { width: 300 } }] }] }] });
    expect(diagnostics.map((d) => d.code)).toEqual(["layout/overflow"]);
  });
});

describe("Row widths, as browser flexbox gives them", () => {
  const row = (children: unknown[], style: Record<string, unknown> = {}) => {
    const { root, diagnostics } = resolve({ type: "Email", children: [{ type: "Row", style, children }] });
    return { widths: child(root, 0).children.map((c) => (c as ResolvedNode).width), codes: diagnostics.map((d) => d.code) };
  };
  const column = (style: Record<string, unknown> = {}) => ({ type: "Column", style });

  it("gives what a child's maximum leaves to the others", () => {
    expect(row([column({ maxWidth: 100 }), column()])).toEqual({ widths: [100, 500], codes: [] });
    expect(row([column({ maxWidth: 100 }), column()], { gap: 20 })).toEqual({ widths: [100, 480], codes: [] });
    expect(row([column({ maxWidth: 100 }), column({ flex: 2 }), column()])).toEqual({ widths: [100, 333, 167], codes: [] });
  });

  it("takes what a child's minimum needs from the others", () => {
    expect(row([column({ minWidth: 400 }), column()])).toEqual({ widths: [400, 200], codes: [] });
    expect(row([column({ width: 200 }), column({ minWidth: 300 }), column()])).toEqual({ widths: [200, 300, 100], codes: [] });
    expect(row([column({ minWidth: "50%" }), column(), column()], { gap: 10 })).toEqual({ widths: [300, 140, 140], codes: [] });
  });

  it("shares what's left after padding, as flex-basis 0 does", () => {
    expect(row([column({ padding: [0, 30] }), column()])).toEqual({ widths: [330, 270], codes: [] });
  });

  it("narrows children with a width that don't fit, in proportion to their width inside their padding", () => {
    expect(row([column({ width: 400 }), column({ width: 300 })])).toEqual({ widths: [343, 257], codes: ["layout/shrunk"] });
    // An image with its own size (flex none) keeps it.
    expect(row([column({ width: 500 }), { type: "Image", props: { src: { src: "https://example.com/a.png", width: 200 } }, style: { flex: "none" } }])).toEqual({ widths: [400, 200], codes: ["layout/shrunk"] });
  });

  it("leaves a child that takes its own size unknown where its size isn't known, the others the room past its padding", () => {
    // The Button's label can't be measured: its padding (20px each side) is the least it takes.
    expect(row([{ type: "Button", props: { href: "#" }, style: { flex: "none" }, children: ["Go"] }, column()])).toEqual({ widths: [null, 560], codes: [] });
  });

  it("reports minimums that can't fit, by how much", () => {
    const { widths, codes } = row([column({ minWidth: 400 }), column({ minWidth: 300 })]);
    expect(widths).toEqual([400, 300]);
    expect(codes).toEqual(["layout/overflow"]);
    expect(resolve({ type: "Email", children: [{ type: "Row", children: [column({ minWidth: 400 }), column({ minWidth: 300 })] }] }).diagnostics[0].message).toContain("need 100px more");
  });
});
