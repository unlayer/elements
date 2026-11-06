import { checkDocument, documentPages, pageBox, parseDocument, resolveDocument, type ResolvedNode } from "../src";

describe("pageBox", () => {
  it("gives the paper's size in CSS px (96 to the inch), turned for landscape, and what's inside the margins", () => {
    expect(pageBox({})).toEqual({ width: 793.7, height: 1122.52, margin: { top: 48, right: 48, bottom: 48, left: 48 }, contentWidth: 698, contentHeight: 1027, css: "A4 portrait" });
    const letter = pageBox({ size: "Letter", orientation: "landscape", margin: { top: 36, right: 72, bottom: 36, left: 72 } });
    expect([letter.width, letter.height, letter.contentWidth, letter.contentHeight, letter.css]).toEqual([1056, 816, 912, 744, "Letter landscape"]);
  });
});

describe("documentPages", () => {
  const n = (type: string, children: unknown[] = []) => ({ type, children }) as { type: string; children: never[] };
  it("makes a page of each Document.Page and of each run of content a PageBreak ends, an empty run none", () => {
    const header = n("PageHeader");
    const page = n("DocumentPage", [n("Paragraph")]);
    const { pages, header: found } = documentPages(n("Document", [header, n("Paragraph"), n("PageBreak"), n("PageBreak"), page, n("Heading"), n("Paragraph"), n("PageBreak")]));
    expect(found).toBe(header);
    expect(pages.map((p) => [p.page?.type ?? null, p.children.map((c) => c.type)])).toEqual([
      [null, ["Paragraph"]],
      ["DocumentPage", ["Paragraph"]],
      [null, ["Heading", "Paragraph"]],
    ]);
    expect(documentPages(n("Document", [header])).pages).toEqual([{ children: [] }]);
  });
});

describe("a Document", () => {
  it("has one PageHeader and one PageFooter, drawn on every page: a second of either is an error, not a silent replacement", () => {
    const part = (type: string, words: string) => ({ type, children: [{ type: "Paragraph", children: [words] }] });
    const check = (children: unknown[]) => checkDocument({ root: { type: "Document", children } }).diagnostics.map((d) => [d.code, d.severity, d.path]);
    expect(check([part("PageHeader", "a"), part("PageFooter", "b"), { type: "Paragraph", children: ["c"] }])).toEqual([]);
    expect(check([part("PageHeader", "a"), { type: "Paragraph", children: ["c"] }, part("PageHeader", "b"), part("PageFooter", "d"), part("PageFooter", "e")])).toEqual([
      ["children/one-only", "error", "root.children[2]"],
      ["children/one-only", "error", "root.children[4]"],
    ]);
  });

  it("lays its content out at its page's width inside the margins", () => {
    const { root } = resolveDocument(parseDocument({ root: { type: "Document", props: { size: "A5", margin: [40, 30] }, children: [{ type: "Paragraph", children: ["Hi"] }] } }));
    expect(root.width).toBe(Math.round(148 / 25.4 * 96 - 60));
    expect((root.children[0] as ResolvedNode).width).toBe(root.width);
  });
});
