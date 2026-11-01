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
      ["layout/overflow", "root.children[0]"],
      ["layout/overflow", "root.children[1]"],
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
