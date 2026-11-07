import { checkDocument, describeComponents, expandDocument, parseDocument, resolveDocument, type Node } from "../src";

const email = (child: Record<string, unknown>) => ({ root: { type: "Email", props: { width: 600 }, children: [child] } });
const ICONS = [
  { name: "Instagram", href: "https://instagram.com/acme" },
  { name: "LinkedIn", href: "https://linkedin.com/acme" },
];

describe("Social", () => {
  it("expands into a line of its networks' icons, each linked to its profile, by its props and style", () => {
    const { document, diagnostics } = expandDocument(parseDocument(email({ type: "Social", props: { icons: ICONS, iconType: "rounded", size: 28 }, style: { gap: 12 } })));
    expect(diagnostics).toEqual([]);
    const row = document.root.children![0] as Node;
    expect(row).toMatchObject({ type: "Row", props: { stackOnMobile: false }, style: { gap: 12, justifyContent: "center" } });
    expect((row.children as Node[]).map((link) => [link.type, link.props, link.style, (link.children![0] as Node).props, (link.children![0] as Node).style])).toEqual([
      ["Link", { href: { href: "https://instagram.com/acme", target: "_blank" }, title: "Instagram" }, { flex: "none" }, { src: "https://cdn.tools.unlayer.com/social/icons/rounded/instagram.png", alt: "Instagram" }, { width: 28 }],
      ["Link", { href: { href: "https://linkedin.com/acme", target: "_blank" }, title: "LinkedIn" }, { flex: "none" }, { src: "https://cdn.tools.unlayer.com/social/icons/rounded/linkedin.png", alt: "LinkedIn" }, { width: 28 }],
    ]);
  });

  it("takes today's defaults (circle icons, 32px, 5px apart, centered), and its hiding goes on what it expands to", () => {
    const { root, diagnostics } = resolveDocument(parseDocument(email({ type: "Social", props: { icons: ICONS.slice(0, 1) }, hidden: { mobile: true } })));
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const row = root.children[0] as unknown as { type: string; hidden: unknown; style: Record<string, unknown>; children: Array<{ children: Array<{ props: Record<string, unknown>; width: number }> }> };
    expect(row).toMatchObject({ type: "Row", hidden: { mobile: true }, style: { gap: 5, justifyContent: "center" } });
    expect(row.children[0].children[0].props.src).toBe("https://cdn.tools.unlayer.com/social/icons/circle/instagram.png");
    expect(row.children[0].children[0].width).toBe(32);
  });

  it("says which icon is wrong, and how", () => {
    const { diagnostics } = checkDocument(email({ type: "Social", props: { icons: [ICONS[0], { name: "Y", url: "https://y.com" }] } }));
    expect(diagnostics.map((d) => [d.severity, d.path, d.message])).toEqual([
      ["error", "root.children[0].props.icons", expect.stringContaining('icon 2: "url" isn\'t one of its fields (name, href)')],
    ]);
    expect(checkDocument(email({ type: "Social", props: {} })).diagnostics.map((d) => d.path)).toEqual(["root.children[0].props.icons"]);
    // Its icon is found by the letters and digits of its name: a name with none would point at no icon.
    expect(checkDocument(email({ type: "Social", props: { icons: [ICONS[0], { name: "★ ✦", href: "https://y.com" }] } })).diagnostics.map((d) => [d.severity, d.path, d.message])).toEqual([
      ["error", "root.children[0].props.icons", expect.stringContaining("icon 2: name: has no letter (a to z) or digit")],
    ]);
  });

  it("is described for editors and agents: its icons as a list of { name, href }", () => {
    const social = describeComponents().find((d) => d.type === "Social")!;
    expect(social.properties.find((p) => p.path === "props.icons")?.schema).toMatchObject({ type: "array", items: { required: ["name", "href"] } });
  });
});

describe("Menu", () => {
  const ITEMS = [
    { text: "Docs", href: "https://example.com/docs" },
    { text: "Blog", href: "https://example.com/blog" },
  ];

  it("expands into a line of its links, each in its padding, its separator between them on desktop, by today's defaults", () => {
    const { document, diagnostics } = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS, separator: "|" }, style: { fontWeight: 700 } })));
    expect(diagnostics).toEqual([]);
    const row = document.root.children![0] as Node;
    // Its links wrap onto another line where they don't fit, as today's Menu's do.
    expect(row).toEqual(expect.objectContaining({ type: "Row", props: { stackOnMobile: false }, style: { fontSize: 14, fontWeight: 700, lineHeight: 1.2, flexWrap: "wrap", justifyContent: "center" } }));
    // A link's padding either side of the separator, as between two links without one: not twice the space.
    const padding = { top: 5, right: 15, bottom: 5, left: 15 };
    const link = (href: string, words: string) => [{ type: "Link", props: { href }, style: { color: "#0068a5", textDecoration: "none" }, children: [words] }];
    expect((row.children as Node[]).map((child) => [child.type, child.hidden ?? null, child.style, child.children])).toEqual([
      ["Text", null, { flex: "none", padding }, link("https://example.com/docs", "Docs")],
      ["Text", { mobile: true }, { flex: "none", padding: { top: 5, right: 0, bottom: 5, left: 0 }, color: "#444444" }, ["|"]],
      ["Text", null, { flex: "none", padding }, link("https://example.com/blog", "Blog")],
    ]);
  });

  it("puts its links down a column, aligned, when it's vertical; without a separator, none goes between them", () => {
    const { document } = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS, layout: "vertical" }, style: { justifyContent: "start", padding: [4, 8] } })));
    const column = document.root.children![0] as Node;
    expect(column).toMatchObject({ type: "Column", style: { gap: 8, alignItems: "start", padding: { top: 4, right: 8, bottom: 4, left: 8 } } });
    expect((column.children as Node[]).map((child) => child.type)).toEqual(["Link", "Link"]);
    const row = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS } }))).document.root.children![0] as Node;
    expect((row.children as Node[]).map((child) => [child.type, (child.children![0] as Node).type])).toEqual([
      ["Text", "Link"],
      ["Text", "Link"],
    ]);
  });

  it("gives what it renders its id and its phone styles, as a Social does", () => {
    const menu = expandDocument(parseDocument(email({ type: "Menu", id: "nav", props: { items: ITEMS }, mobile: { fontSize: 12, lineHeight: 1.5 } })));
    expect(menu.diagnostics).toEqual([]);
    const row = menu.document.root.children![0] as Node;
    expect([row.type, row.id, row.mobile]).toEqual(["Row", "nav", { fontSize: 12, lineHeight: 1.5 }]);
    const social = expandDocument(parseDocument(email({ type: "Social", id: "follow", props: { icons: ICONS }, mobile: { gap: 2 } })));
    expect(social.diagnostics).toEqual([]);
    const icons = social.document.root.children![0] as Node;
    expect([icons.type, icons.id, icons.mobile]).toEqual(["Row", "follow", { gap: 2 }]);
  });

  it("keeps its separator in a Document, which has no phones to hide it on (hiding on phones isn't allowed there)", () => {
    const menu = () => parseDocument({ root: { type: "Document", children: [{ type: "Menu", props: { items: ITEMS, separator: "|" } }] } });
    expect(resolveDocument(menu()).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const row = expandDocument(menu()).document.root.children![0] as Node;
    expect((row.children as Node[]).map((child) => [child.children, child.hidden ?? null])).toEqual([
      [[expect.objectContaining({ type: "Link" })], null],
      [["|"], null],
      [[expect.objectContaining({ type: "Link" })], null],
    ]);
  });
});

