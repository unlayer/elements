/**
 * Support is data (each style's and prop's `support`, by output, in its
 * definition), and it's kept true, for every output with a writer: every
 * style and prop of every component that renders to it declares how it's
 * shown there, and none is dropped without a word. Setting one either changes
 * the output or gives a diagnostic for it; where its declaration says the
 * output shows it otherwise, that diagnostic is there. An output added later
 * (print, PDF, image) joins by its entry in OUTPUTS: until each of its
 * components' styles and props declares it, this fails.
 */
import { COMPONENTS, type ComponentDefinition, type Json, type ResolvedNode, type Support, type SupportByTarget, type Target } from "@unlayer-internal/elements-core";
import { prepareTemplate, renderTemplate } from "../src";

/** Each output with a writer, and the root that renders to it. */
const OUTPUTS: Array<{ target: Target; root: string }> = [
  { target: "email", root: "Email" },
  { target: "web", root: "Page" },
  // Print HTML: a page writer's output, with a Document's own components.
  { target: "web", root: "Document" },
  // A Canvas's HTML (its image is @unlayer/elements-image's).
  { target: "web", root: "Canvas" },
];

/** What only a Document takes. */
const DOCUMENT_ONLY = new Set(["DocumentPage", "PageBreak", "PageHeader", "PageFooter", "PageNumber"]);
/** The components an output's samples take: a Document's own under a Document; the others under the other roots. */
const sampled = (root: string, type: string) => (root === "Document" ? DOCUMENT_ONLY.has(type) || type === root : root === "Canvas" ? type === root : !DOCUMENT_ONLY.has(type));
const SHAPES = new Set(["Rect", "Circle", "Ellipse", "Line", "Polygon", "Path"]);

const ROOTS = new Set(Object.values(COMPONENTS).filter((d) => d.categories.includes("root")).map((d) => d.type));

/** Values to try: each of an enum's, else one a reader would notice. */
function samples(key: string, kindName: string, schema: { enum?: Json[] }, fallback: Json | undefined): Json[] {
  if (schema.enum) return schema.enum;
  const byKey: Record<string, Json[]> = {
    width: [250, "40%"],
    minWidth: [700],
    maxWidth: [200],
    height: [77],
    gap: [23],
    letterSpacing: [3],
    fontSize: [23],
    indent: [40],
    lineHeight: [2.5],
    fontWeight: [300],
    fontFamily: ["Georgia, serif"],
    flex: [3],
    start: [3],
    colSpan: [2],
    strokeWidth: [3],
    opacity: [0.5],
    x: [7],
    y: [7],
    cx: [17],
    cy: [17],
    r: [9],
    rx: [4],
    ry: [5],
    x1: [3],
    y1: [3],
    x2: [33],
    y2: [21],
    points: ["1,1 29,1 15,19"],
    d: ["M1 1 L29 1 L15 19 Z"],
    viewBox: ["0 0 50 30"],
  };
  if (byKey[key]) return byKey[key];
  const byKind: Record<string, Json[]> = {
    color: ["#123456"],
    insets: [[7, 9]],
    border: ["3px solid #123456"],
    radius: [9],
    line: ["3px dashed #123456"],
    text: ["Sample words"],
    link: ["https://sample.test/x"],
    asset: [{ src: "https://sample.test/s.png", width: 123 }],
    boolean: [!fallback],
    fontFaces: [[{ family: "Sample", src: "https://sample.test/s.woff2" }]],
  };
  return byKind[kindName] ?? [];
}

const text = (words = "words") => ({ type: "Text", children: [words] });

/** A small template with the component in it, `node` its node: in a Row beside a Column for `flex`, else where it goes. */
function host(root: string, type: string, node: Record<string, unknown>, key: string): Record<string, unknown> {
  const width = root === "Document" ? {} : root === "Canvas" ? { width: 600, height: 300 } : { width: 600 };
  const doc = (children: unknown[], extra: Record<string, unknown> = {}) => ({ root: { type: root, props: width, ...extra, children } });
  if (type === root) {
    const children = [text("a"), { type: "Button", props: { href: "#" }, children: ["Go"] }, { type: "Row", children: [{ type: "Column", children: [text("b")] }, { type: "Column", children: [text("c")] }] }];
    return doc(children, { style: node.style, props: { ...width, ...(node.props as object) } });
  }
  if (key === "flex") return doc([{ type: "Row", children: [node, { type: "Column", children: [text("beside")] }] }]);
  if (SHAPES.has(type)) return doc([{ type: "Svg", props: { width: 100, height: 60 }, children: [node] }]);
  switch (type) {
    case "Span":
    case "MergeTag":
    case "LineBreak":
    case "PageNumber":
      return doc([{ type: "Text", children: ["before ", node, " after"] }, ...(type === "PageNumber" ? [{ type: "PageBreak" }, text("second page")] : [])]);
    case "ListItem":
      return doc([{ type: "List", children: [node, { type: "ListItem", children: ["second"] }] }]);
    case "TableRow":
      return doc([{ type: "Table", children: [node, { type: "TableRow", children: [{ type: "TableCell", children: ["c"] }, { type: "TableCell", children: ["d"] }] }] }]);
    case "TableCell":
      return doc([{ type: "Table", children: [{ type: "TableRow", children: [node, { type: "TableCell", children: ["b"] }] }, { type: "TableRow", children: [{ type: "TableCell", children: ["c"] }, { type: "TableCell", children: ["d"] }] }] }]);
    default:
      return doc([node]);
  }
}

/** The component's node with `style` and `props`, holding what lets each show. */
function nodeOf(type: string, style: Record<string, Json>, props: Record<string, Json>): Record<string, unknown> {
  const node = (base: Record<string, unknown>) => ({ type, id: "subject", ...(Object.keys(style).length ? { style } : {}), ...base, props: { ...(base.props as object), ...props } });
  const cells = (a: string, b: string) => [{ type: "TableCell", children: [a] }, { type: "TableCell", children: [b] }];
  switch (type) {
    case "Section":
    case "Column":
    case "DocumentPage":
    case "PageHeader":
    case "PageFooter":
      return node({ children: [text("a"), { type: "Button", props: { href: "#" }, children: ["Go"] }] });
    case "PageNumber":
      return node({});
    case "Svg":
      return node({ props: { width: 100, height: 60 }, children: [{ type: "Rect", props: { width: 40, height: 20 } }] });
    case "Rect":
      return node({ props: { width: 40, height: 20 } });
    case "Circle":
      return node({ props: { cx: 20, cy: 20, r: 10 } });
    case "Ellipse":
      return node({ props: { cx: 20, cy: 20, rx: 10, ry: 6 } });
    case "Line":
      return node({ props: { x2: 40, y2: 20 } });
    case "Polygon":
      return node({ props: { points: "0,0 20,0 10,15" } });
    case "Path":
      return node({ props: { d: "M0 0 L20 0 L10 15 Z" } });
    case "Row":
      return node({ children: [{ type: "Column", children: [text("a")] }, { type: "Column", children: [text("b")] }] });
    case "Layer":
      // An Image with words over it: the one shape an email draws.
      return node({ children: [{ type: "Image", props: { src: { src: "https://example.com/a.png", width: 600, height: 300 }, alt: "A" }, style: { width: "100%" } }, { type: "Column", children: [text("over")] }] });
    case "Grid":
      // Two rows (two to a row by default), the first of children of different heights, so alignItems shows.
      return node({ children: [text("a"), { type: "Column", children: [text("b"), text("c")] }, text("d")] });
    case "Link":
      return node({ props: { href: "https://example.com" }, children: ["a link"] });
    case "Button":
      return node({ props: { href: "https://example.com" }, children: ["Go"] });
    case "Image":
      return node({ props: { src: { src: "https://example.com/a.png", width: 300, height: 150 }, alt: "A" } });
    case "List":
      // A numbered list, so its start shows.
      return node({ props: { type: "number" }, children: [{ type: "ListItem", children: ["first"] }, { type: "ListItem", children: ["second"] }] });
    case "Table":
      return node({ children: [{ type: "TableRow", children: cells("a", "b") }, { type: "TableRow", children: cells("c", "d") }] });
    case "TableRow":
      return node({ children: cells("a", "b") });
    case "MergeTag":
      return node({ props: { name: "first_name" } });
    case "Divider":
    case "LineBreak":
      return node({});
    case "Video":
      return node({ props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
    case "Menu":
      return node({ props: { items: [{ text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }], separator: "|" } });
    case "Social":
      return node({ props: { icons: [{ name: "Instagram", href: "https://instagram.com/acme" }, { name: "X", href: "https://x.com/acme" }] } });
    case "Raw":
    case "Html":
      return node({ props: { html: "<p>raw</p>" } });
    default:
      return node({ children: ["words"] });
  }
}

function render(root: string, type: string, style: Record<string, Json>, props: Record<string, Json>, key: string) {
  try {
    const { html, text, diagnostics } = renderTemplate(host(root, type, nodeOf(type, style, props), key));
    return { html, text, diagnostics };
  } catch (error) {
    return { html: "", text: "", diagnostics: [], error: String(error) };
  }
}

/** CSS's own values where nothing is set: setting them changes nothing. */
const INITIAL: Record<string, Json> = { alignItems: "start", alignSelf: "start", borderCollapse: "separate", boxSizing: "border-box", justifyContent: "start", flexWrap: "nowrap", overflow: "visible", textDecoration: "none", textTransform: "none", verticalAlign: "top" };

/** The value a style or prop already has on the subject (inherited, a default, or CSS's own): setting it is no change. */
function inEffect(root: string, type: string, where: "style" | "props", key: string): Json | undefined {
  const { resolved } = prepareTemplate(host(root, type, nodeOf(type, {}, {}), key));
  if (!resolved) return undefined;
  const find = (node: ResolvedNode): ResolvedNode | undefined =>
    node.id === "subject" || (type === root && node === resolved.root) ? node : node.children.flatMap((c) => (typeof c === "string" ? [] : [find(c)])).find(Boolean);
  const node = find(resolved.root);
  // Expanded away (a component made of primitives): CSS's own values are still in effect.
  if (!node) return where === "style" ? INITIAL[key] : undefined;
  if (where === "props") return node.props[key];
  if (key in node.text) return (node.text as unknown as Record<string, Json>)[key];
  if (key === "width" && node.width !== null && !(key in node.style)) return node.width;
  // A run of text sits on the baseline; a table cell's content at its top.
  return node.style[key] ?? (type === "Span" && key === "verticalAlign" ? "baseline" : INITIAL[key]);
}

/** Whether a rule of the declaration covers this value, on a node with these props (anything but `full`). */
function declaredOtherwise(support: Support | readonly Support[], value: Json, props: Record<string, Json>): boolean {
  return ([] as Support[]).concat(support).some((rule) => rule.level !== "full" && (!rule.values || rule.values.some((v) => JSON.stringify(v) === JSON.stringify(value))) && (!rule.when || rule.when(value, { props })));
}

const entries = (definition: ComponentDefinition) => [
  ...Object.entries(definition.style).map(([key, spec]) => ({ where: "style" as const, key, spec: spec as { kind: { name: string; jsonSchema(): unknown; parse(value: unknown): { ok: boolean } }; support?: SupportByTarget; default?: Json } })),
  ...Object.entries(definition.props).map(([key, spec]) => ({ where: "props" as const, key, spec: spec as { kind: { name: string; jsonSchema(): unknown; parse(value: unknown): { ok: boolean } }; support?: SupportByTarget; default?: Json } })),
];

for (const { target, root } of OUTPUTS) {
  const components = Object.values(COMPONENTS).filter((definition) => definition.targets[target] && (!ROOTS.has(definition.type) || definition.type === root) && sampled(root, definition.type));

  describe(`support in ${target} (${root})`, () => {
    it("is declared on every style and prop of every component that renders to it", () => {
      const missing = components.flatMap((definition) => entries(definition).filter(({ spec }) => !spec.support?.[target]).map(({ where, key }) => `${definition.type}.${where}.${key}`));
      expect(missing).toEqual([]);
    });

    it("says where each declaration comes from", () => {
      const sources = new Set(components.flatMap((definition) => entries(definition).flatMap(({ spec }) => ([] as Support[]).concat(spec.support?.[target] ?? []).map((rule) => rule.source))));
      for (const source of sources) expect(["outlook-captures", "caniemail", "writer", "css", "assumed"]).toContain(source);
    });

    const silent: string[] = [];
    const unreported: string[] = [];
    const failed: string[] = [];
    for (const definition of components) {
      const type = definition.type;
      for (const { where, key, spec } of entries(definition)) {
        const base = render(root, type, {}, {}, key);
        const current = inEffect(root, type, where, key);
        // Only values its kind takes (a root's width is px only).
        for (const value of samples(key, spec.kind.name, spec.kind.jsonSchema() as { enum?: Json[] }, spec.default).filter((v) => spec.kind.parse(v).ok)) {
          // Setting what's in effect is no change: on the node, or its definition's default (a component made of
          // primitives, Social, is expanded away).
          const fallback = where === "props" ? spec.default : (definition.defaultStyle as Record<string, Json> | undefined)?.[key];
          if (JSON.stringify(value) === JSON.stringify(current) || JSON.stringify(value) === JSON.stringify(fallback)) continue;
          const label = `${type}.${where}.${key} = ${JSON.stringify(value)}`;
          const result = render(root, type, where === "style" ? { [key]: value } : {}, where === "props" ? { [key]: value } : {}, key);
          if ("error" in result && result.error) {
            failed.push(`${label}: ${result.error}`);
            continue;
          }
          // A diagnostic for it, or for the node itself (a minimum wider than its parent: layout/overflow).
          const subject = type === root ? "root" : undefined;
          const reported = result.diagnostics.some((d) => d.path.endsWith(`.${where}.${key}`) || d.nodeId === "subject" || d.path === subject);
          if (declaredOtherwise(spec.support![target]!, value, where === "props" ? { [key]: value } : {}) && !reported) unreported.push(label);
          // The output is the HTML and the plain text (a Raw node's text shows only there).
          else if (result.html === base.html && result.text === base.text && !reported) silent.push(label);
        }
      }
    }

    it("renders every style and prop of every component, each sample value", () => {
      expect(failed).toEqual([]);
    });

    it("drops nothing silently: setting a style or prop changes the output, or a diagnostic names it", () => {
      expect(silent).toEqual([]);
    });

    it("reports what it shows otherwise, as the declaration says", () => {
      expect(unreported).toEqual([]);
    });
  });
}
