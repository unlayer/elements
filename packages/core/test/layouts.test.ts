import { checkDocument, expandDocument, parseDocument, resolveDocument, type Node, type ResolvedNode } from "../src";

const email = (child: Record<string, unknown>) => ({ root: { type: "Email", props: { width: 600 }, children: [child] } });
const text = (words: string, id?: string) => ({ type: "Text", ...(id ? { id } : {}), children: [words] });

describe("Grid", () => {
  it("is the Column of Rows it lays out: its children so many to a Row, each in a cell, the last Row's empty cells hidden on phones", () => {
    const grid = { type: "Grid", id: "products", props: { columns: 3 }, style: { gap: 20, rowGap: 12, padding: 8, alignItems: "center" }, children: ["a", "b", "c", "d", "e"].map((w) => text(w, w)) };
    const { document, diagnostics } = expandDocument(parseDocument(email(grid)));
    expect(diagnostics).toEqual([]);
    const column = document.root.children![0] as Node;
    expect(column).toMatchObject({ type: "Column", id: "products", style: { padding: { top: 8, right: 8, bottom: 8, left: 8 }, gap: 12 } });
    const rows = column.children as Node[];
    expect(rows.map((row) => [row.type, row.props, row.style])).toEqual([
      ["Row", { stackOnMobile: true }, { gap: 20, alignItems: "center" }],
      ["Row", { stackOnMobile: true }, { gap: 20, alignItems: "center" }],
    ]);
    // Each child in a cell of its own, its id kept; the second Row's third cell is empty, and not on phones.
    expect(rows.map((row) => (row.children as Node[]).map((cell) => [cell.type, (cell.children as Node[])[0]?.id ?? null, cell.hidden ?? null]))).toEqual([
      [["Column", "a", null], ["Column", "b", null], ["Column", "c", null]],
      [["Column", "d", null], ["Column", "e", null], ["Column", null, { mobile: true }]],
    ]);
  });

  it("gives every cell the same width, and each child the cell's, as in every output", () => {
    const { root } = resolveDocument(parseDocument(email({ type: "Grid", props: { columns: 3 }, style: { gap: 20 }, children: ["a", "b", "c", "d"].map((w) => text(w)) })));
    const rows = (root.children[0] as ResolvedNode).children as ResolvedNode[];
    const widths = rows.map((row) => (row.children as ResolvedNode[]).map((cell) => cell.width));
    // 600 less two gaps of 20, in three: whole px that add up.
    expect(widths).toEqual([[187, 187, 186], [187, 187, 186]]);
    expect(((rows[1].children[0] as ResolvedNode).children[0] as ResolvedNode).width).toBe(187);
  });

  it("takes two columns and the Grid's gap between its rows by default, and stacks on phones unless told not to", () => {
    const { document } = expandDocument(parseDocument(email({ type: "Grid", props: { stackOnMobile: false }, style: { gap: 16 }, mobile: { gap: 8 }, children: [text("a"), text("b"), text("c")] })));
    const column = document.root.children![0] as Node;
    expect(column.style).toEqual({ gap: 16 });
    expect(column.mobile).toEqual({ gap: 8 });
    expect((column.children as Node[]).map((row) => [row.props, row.mobile, (row.children as Node[]).length])).toEqual([
      [{ stackOnMobile: false }, { gap: 8 }, 2],
      [{ stackOnMobile: false }, { gap: 8 }, 2],
    ]);
    // Where the cells stay side by side on phones, the last Row's empty cell is drawn there too: its cell keeps its width.
    expect((column.children as Node[]).map((row) => (row.children as Node[]).map((cell) => cell.hidden ?? null))).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("takes blocks, not text, and a whole number of columns from 1 to 12", () => {
    const check = (grid: Record<string, unknown>) => checkDocument(email(grid)).diagnostics.filter((d) => d.severity === "error").map((d) => d.path);
    expect(check({ type: "Grid", children: ["loose words"] })).toEqual(["root.children[0].children[0]"]);
    expect(check({ type: "Grid", props: { columns: 0 }, children: [text("a")] })).toEqual(["root.children[0].props.columns"]);
    expect(check({ type: "Grid", props: { columns: 2.5 }, children: [text("a")] })).toEqual(["root.children[0].props.columns"]);
    expect(check({ type: "Grid", props: { columns: 4 }, children: [text("a")] })).toEqual([]);
  });
});

describe("Layer", () => {
  const image = (style?: Record<string, unknown>) => ({ type: "Image", props: { src: { src: "https://example.com/a.png", width: 1200, height: 600 } }, ...(style ? { style } : {}) });
  const button = { type: "Button", props: { href: "#" }, style: { width: 120 }, children: ["Go"] };

  it("gives its children its width: an image is stretched across it, unless justifyItems places it", () => {
    const widths = (style: Record<string, unknown>) => {
      const { root } = resolveDocument(parseDocument(email({ type: "Layer", style, children: [image(), text("over"), button] })));
      return ((root.children[0] as ResolvedNode).children as ResolvedNode[]).map((child) => child.width);
    };
    expect(widths({})).toEqual([600, 600, 120]);
    expect(widths({ justifyItems: "center" })).toEqual([600, 600, 120]);
    // A narrower image: stretched across by default (justifyItems, not alignItems, is across a Layer); placed, as wide
    // as its file. A Text fills the width whatever justifyItems says.
    const small = (style: Record<string, unknown>) => {
      const { root } = resolveDocument(parseDocument(email({ type: "Layer", style, children: [{ ...image(), props: { src: { src: "https://example.com/a.png", width: 300, height: 150 } } }, text("over")] })));
      return ((root.children[0] as ResolvedNode).children as ResolvedNode[]).map((child) => child.width);
    };
    expect(small({ alignItems: "start" })).toEqual([600, 600]);
    expect(small({ justifyItems: "start", alignItems: "stretch" })).toEqual([300, 600]);
  });

  it("takes blocks, its height in px, and alignment down and across", () => {
    const check = (layer: Record<string, unknown>) => checkDocument(email(layer)).diagnostics.filter((d) => d.severity === "error").map((d) => d.path);
    expect(check({ type: "Layer", children: ["words"] })).toEqual(["root.children[0].children[0]"]);
    expect(check({ type: "Layer", style: { height: "50%" }, children: [image()] })).toEqual(["root.children[0].style.height"]);
    expect(check({ type: "Layer", style: { justifyItems: "space-between" }, children: [image()] })).toEqual(["root.children[0].style.justifyItems"]);
    expect(check({ type: "Layer", style: { height: 300, alignItems: "end", justifyItems: "center" }, children: [image(), text("over")] })).toEqual([]);
  });
});
