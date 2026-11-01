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
      ["Link", { href: "https://instagram.com/acme", title: "Instagram" }, { flex: "none" }, { src: "https://cdn.tools.unlayer.com/social/icons/rounded/instagram.png", alt: "Instagram" }, { width: 28 }],
      ["Link", { href: "https://linkedin.com/acme", title: "LinkedIn" }, { flex: "none" }, { src: "https://cdn.tools.unlayer.com/social/icons/rounded/linkedin.png", alt: "LinkedIn" }, { width: 28 }],
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

  it("expands into a line of its links, its separator between them on desktop, by today's defaults", () => {
    const { document, diagnostics } = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS, separator: "|" }, style: { fontWeight: 700 } })));
    expect(diagnostics).toEqual([]);
    const row = document.root.children![0] as Node;
    expect(row).toMatchObject({
      type: "Row",
      props: { stackOnMobile: false },
      style: { fontSize: 14, fontWeight: 700, lineHeight: 1.2, gap: 30, padding: { top: 5, right: 15, bottom: 5, left: 15 }, justifyContent: "center" },
    });
    expect((row.children as Node[]).map((child) => [child.type, child.props?.href ?? null, child.hidden ?? null, child.style?.color, child.children])).toEqual([
      ["Link", "https://example.com/docs", null, "#0068a5", ["Docs"]],
      ["Text", null, { mobile: true }, "#444444", ["|"]],
      ["Link", "https://example.com/blog", null, "#0068a5", ["Blog"]],
    ]);
  });

  it("puts its links down a column, aligned, when it's vertical; without a separator, none goes between them", () => {
    const { document } = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS, layout: "vertical" }, style: { justifyContent: "start", padding: [4, 8] } })));
    const column = document.root.children![0] as Node;
    expect(column).toMatchObject({ type: "Column", style: { gap: 8, alignItems: "start", padding: { top: 4, right: 8, bottom: 4, left: 8 } } });
    expect((column.children as Node[]).map((child) => child.type)).toEqual(["Link", "Link"]);
    const row = expandDocument(parseDocument(email({ type: "Menu", props: { items: ITEMS } }))).document.root.children![0] as Node;
    expect((row.children as Node[]).map((child) => child.type)).toEqual(["Link", "Link"]);
  });
});

