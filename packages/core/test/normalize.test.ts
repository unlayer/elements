import { checkDocument, ElementsError, parseDocument } from "../src";

const doc = (root: unknown) => ({ root });
const codes = (input: unknown) => checkDocument(input).diagnostics.map((d) => d.code);

describe("checkDocument", () => {
  it("normalizes values, and keeps only the ids authors write", () => {
    const { document, diagnostics } = checkDocument(
      doc({
        type: "Email",
        props: { width: "640px", previewText: "Hi" },
        style: { backgroundColor: "#F4F4F4", gap: 16 },
        children: [
          { type: "Heading", props: { level: 2 }, children: ["Welcome"] },
          { type: "Paragraph", style: { padding: "8px 0" }, children: ["Hello ", { type: "MergeTag", props: { name: "first_name" } }, "!"] },
          { type: "Button", id: "cta", props: { href: "https://example.com" }, style: { borderRadius: [6, 6, 6, 6] }, children: ["Go"] },
          { type: "Button", props: { href: "https://example.com/2" }, children: ["Again"] },
        ],
      })
    );
    expect(diagnostics).toEqual([]);
    expect(document).toEqual({
      root: {
        type: "Email",
        props: { width: 640, previewText: "Hi" },
        style: { backgroundColor: "#f4f4f4", gap: 16 },
        children: [
          { type: "Heading", props: { level: 2 }, children: ["Welcome"] },
          {
            type: "Paragraph",
            style: { padding: { top: 8, right: 0, bottom: 8, left: 0 } },
            children: ["Hello ", { type: "MergeTag", props: { name: "first_name" } }, "!"],
          },
          { id: "cta", type: "Button", props: { href: "https://example.com" }, style: { borderRadius: 6 }, children: ["Go"] },
          { type: "Button", props: { href: "https://example.com/2" }, children: ["Again"] },
        ],
      },
    });
  });

  it("gives the same document for its own output (idempotent)", () => {
    const first = checkDocument(doc({ type: "Page", children: [{ type: "Row", children: [{ type: "Column" }, { type: "Column" }] }] })).document;
    expect(checkDocument(first).document).toEqual(first);
  });

  it("reports repeated and invalid ids, and generates none", () => {
    const { document, diagnostics } = checkDocument(doc({ type: "Email", children: [{ type: "Divider" }, { type: "Divider", id: "rule" }, { type: "Divider", id: "rule" }, { type: "Divider", id: "1x" }] }));
    expect(document!.root.children!.map((c) => (typeof c === "string" ? c : c.id))).toEqual([undefined, "rule", undefined, undefined]);
    expect(diagnostics.map((d) => [d.code, d.path])).toEqual([
      ["id/duplicate", "root.children[2].id"],
      ["id/invalid", "root.children[3].id"],
    ]);
  });

  it("checks the root", () => {
    expect(codes(doc({ type: "Row" }))).toEqual(["root/invalid"]);
    expect(codes({})).toEqual(["document/root"]);
    expect(codes({ root: { type: "Email" }, version: 1 })).toEqual(["document/unknown-key"]);
    expect(checkDocument("x").document).toBeNull();
  });

  it("checks nesting", () => {
    expect(codes(doc({ type: "Email", children: [{ type: "Column", children: [{ type: "Section" }] }] }))).toEqual(["children/not-allowed"]);
    expect(codes(doc({ type: "Email", children: [{ type: "Paragraph", children: [{ type: "Button", props: { href: "#" } }] }] }))).toEqual([
      "children/not-allowed",
    ]);
    expect(codes(doc({ type: "Email", children: [{ type: "Row", children: ["text"] }] }))).toEqual(["children/text-not-allowed"]);
    expect(codes(doc({ type: "Email", children: [{ type: "Row", children: ["  \n "] }] }))).toEqual([]);
    expect(codes(doc({ type: "Email", children: [{ type: "Email" }] }))).toEqual(["children/not-allowed"]);
  });

  it("lets content sit straight in a root and in a Section, without Rows", () => {
    expect(
      codes(
        doc({
          type: "Email",
          children: [
            { type: "Section", style: { backgroundColor: "#111" }, children: [{ type: "Image", props: { src: "https://example.com/logo.png" } }] },
            { type: "Paragraph", children: ["Hi"] },
            { type: "Link", props: { href: "https://example.com" }, children: [{ type: "Image", props: { src: "https://example.com/a.png" } }] },
          ],
        })
      )
    ).toEqual([]);
  });

  it("checks props", () => {
    const result = checkDocument(
      doc({ type: "Email", children: [{ type: "Button", props: { href: "javascript:alert(1)", rel: "x" } }, { type: "Image", props: {} }, { type: "Heading", props: { level: 7 } }] })
    );
    expect(result.diagnostics.map((d) => [d.code, d.path])).toEqual([
      ["prop/invalid", "root.children[0].props.href"],
      ["prop/unknown", "root.children[0].props.rel"],
      ["prop/required", "root.children[1].props.src"],
      ["prop/invalid", "root.children[2].props.level"],
    ]);
    expect(() => parseDocument({ root: { type: "Email", children: [{ type: "Image" }] } })).toThrow(ElementsError);
  });

  it("checks styles, and says what to use instead of CSS it doesn't take", () => {
    const { diagnostics } = checkDocument(doc({ type: "Email", children: [{ type: "Paragraph", style: { margin: 10, color: "nope", fontSize: "1em" } }] }));
    expect(diagnostics.map((d) => d.code)).toEqual(["style/unknown", "style/invalid", "style/invalid"]);
    expect(diagnostics[0].message).toMatch(/gap/);
  });

  it("says what to write instead of a prop or style a component doesn't take, and where the component is listed", () => {
    const messages = checkDocument(
      doc({
        type: "Email",
        props: { backgroundColor: "#ffffff" },
        style: { width: 600, padding: 24 },
        children: [
          { type: "Heading", props: { levle: 2 }, style: { colour: "red", fontsize: 20, zzz: 1 }, children: ["Hi"] },
          { type: "Row", children: [{ type: "ListItem" }] },
        ],
      })
    ).diagnostics.map((d) => d.message);
    expect(messages).toEqual([
      'An Email has no prop "backgroundColor": it\'s a style, style={{ backgroundColor: … }}',
      '"width" isn\'t a style an Email takes: it\'s a prop, width={…}. See Email in @unlayer/react-elements/GUIDE.md',
      '"padding" isn\'t a style an Email takes: a root has no padding; put it on a Column (a card) or a Section (a band) inside it. See Email in @unlayer/react-elements/GUIDE.md',
      'A Heading has no prop "levle": did you mean "level"? See Heading in @unlayer/react-elements/GUIDE.md',
      '"colour" isn\'t a style a Heading takes: did you mean "color"? See Heading in @unlayer/react-elements/GUIDE.md',
      '"fontsize" isn\'t a style a Heading takes: did you mean "fontSize"? See Heading in @unlayer/react-elements/GUIDE.md',
      '"zzz" isn\'t a style a Heading takes. See Heading in @unlayer/react-elements/GUIDE.md',
      "A Row takes layout components, block components; a ListItem can't go in it. See Row in @unlayer/react-elements/GUIDE.md",
    ]);
  });

  it("allows phone styles and hiding under an Email or Page only, for the properties that take them", () => {
    expect(codes(doc({ type: "Email", children: [{ type: "Paragraph", mobile: { fontSize: 14, color: "#000" }, hidden: { desktop: true } }] }))).toEqual([
      "mobile/not-allowed",
    ]);
    expect(codes(doc({ type: "Email", children: [{ type: "Paragraph", hidden: { mobile: true, desktop: true } }] }))).toEqual(["hidden/everywhere"]);
  });

  it("allows hover styles only where the component has them", () => {
    expect(codes(doc({ type: "Email", children: [{ type: "Button", props: { href: "#" }, hover: { backgroundColor: "#000", padding: 4 } }] }))).toEqual([
      "hover/not-allowed",
    ]);
  });

  it("merges adjacent text and drops empty text", () => {
    const { document, diagnostics } = checkDocument(doc({ type: "Email", children: [{ type: "Paragraph", children: ["a", "", "b"] }] }));
    expect(diagnostics).toEqual([]);
    expect(document!.root.children![0]).toEqual({ type: "Paragraph", children: ["ab"] });
  });

  it("reports unknown types and keys", () => {
    expect(codes(doc({ type: "Email", children: [{ type: "Body" }, { type: "Paragraph", styles: {} }] }))).toEqual(["node/unknown-type", "node/unknown-key"]);
  });

  it("keeps list items in Lists and table rows and cells in Tables", () => {
    const { diagnostics } = checkDocument({
      root: { type: "Email", children: [{ type: "ListItem", children: ["x"] }, { type: "Table", children: [{ type: "TableCell" }] }, { type: "List", children: [{ type: "Paragraph" }] }] },
    });
    expect(diagnostics.map((d) => [d.code, d.path])).toEqual([
      ["children/not-allowed", "root.children[0]"],
      ["children/not-allowed", "root.children[1].children[0]"],
      ["children/not-allowed", "root.children[2].children[0]"],
    ]);
  });

  it("points the names Elements used before CSS's to the new ones", () => {
    const messages = checkDocument({
      root: {
        type: "Email",
        children: [
          { type: "Row", style: { align: "center", justify: "between", wrap: "none" } },
          { type: "Divider", style: { color: "#000", thickness: 2 } },
          { type: "Column", style: { textDecoration: "underline" } },
        ],
      },
    }).diagnostics.map((d) => d.message);
    expect(messages).toEqual([
      '"align" isn\'t a style a Row takes: it\'s alignItems now. See Row in @unlayer/react-elements/GUIDE.md',
      '"justify" isn\'t a style a Row takes: it\'s justifyContent now ("between" is "space-between"). See Row in @unlayer/react-elements/GUIDE.md',
      '"wrap" isn\'t a style a Row takes: a Row stays side by side on phones with its stackOnMobile prop set to false; flexWrap wraps it on the web. See Row in @unlayer/react-elements/GUIDE.md',
      '"color" isn\'t a style a Divider takes: a Divider\'s line is its borderTop, with its color. See Divider in @unlayer/react-elements/GUIDE.md',
      '"thickness" isn\'t a style a Divider takes: a Divider\'s line is borderTop now: "1px solid #bbbbbb". See Divider in @unlayer/react-elements/GUIDE.md',
      '"textDecoration" isn\'t a style a Column takes. See Column in @unlayer/react-elements/GUIDE.md',
    ]);
  });
});

