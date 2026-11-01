/**
 * Email support is data (each style's `email` in its definition), and it's
 * kept true: every style of every component that renders to email declares
 * how email shows it, and none is dropped without a word. Setting a style
 * either changes the email, or gives a diagnostic for that style; where its
 * declaration says email shows it otherwise, that diagnostic is there.
 */
import { COMPONENTS, type ComponentDefinition, type EmailSupport, type Json, type ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate, renderTemplate } from "../src";

const EMAIL_COMPONENTS = Object.values(COMPONENTS).filter((definition) => definition.targets.email);

/** Values to try for a style: each of an enum's, else one a reader would notice. */
function samples(key: string, definition: ComponentDefinition): Json[] {
  const kind = definition.style[key].kind;
  const schema = kind.jsonSchema() as { enum?: Json[] };
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
  };
  if (byKey[key]) return byKey[key];
  const byKind: Record<string, Json[]> = {
    color: ["#123456"],
    insets: [[7, 9]],
    border: ["3px solid #123456"],
    radius: [9],
    line: ["3px dashed #123456"],
  };
  return byKind[kind.name] ?? [];
}

const text = (words = "words") => ({ type: "Text", children: [words] });

/** A small email with the component in it, `node` its node: in a Row beside a Column for `flex`, else where it goes. */
function host(type: string, node: Record<string, unknown>, key: string): Record<string, unknown> {
  const root = (children: unknown[], style?: unknown) => ({ version: 1, root: { type: "Email", props: { width: 600 }, ...(style ? { style } : {}), children } });
  if (type === "Email") return root([text("a"), { type: "Button", props: { href: "#" }, children: ["Go"] }, { type: "Row", children: [{ type: "Column", children: [text("b")] }, { type: "Column", children: [text("c")] }] }], node.style);
  if (key === "flex") return root([{ type: "Row", children: [node, { type: "Column", children: [text("beside")] }] }]);
  switch (type) {
    case "Span":
      return root([{ type: "Text", children: [node] }]);
    case "ListItem":
      return root([{ type: "List", children: [node, { type: "ListItem", children: ["second"] }] }]);
    case "TableRow":
      return root([{ type: "Table", children: [node, { type: "TableRow", children: [{ type: "TableCell", children: ["c"] }, { type: "TableCell", children: ["d"] }] }] }]);
    case "TableCell":
      return root([{ type: "Table", children: [{ type: "TableRow", children: [node, { type: "TableCell", children: ["b"] }] }, { type: "TableRow", children: [{ type: "TableCell", children: ["c"] }, { type: "TableCell", children: ["d"] }] }] }]);
    default:
      return root([node]);
  }
}

/** The component's node with `style`, holding what lets each style show. */
function nodeOf(type: string, style: Record<string, Json>): Record<string, unknown> {
  const node = (extra: Record<string, unknown>) => ({ type, id: "subject", ...(Object.keys(style).length ? { style } : {}), ...extra });
  switch (type) {
    case "Section":
    case "Column":
      return node({ children: [text("a"), { type: "Button", props: { href: "#" }, children: ["Go"] }] });
    case "Row":
      return node({ children: [{ type: "Column", children: [text("a")] }, { type: "Column", children: [text("b")] }] });
    case "Link":
      return node({ props: { href: "https://example.com" }, children: ["a link"] });
    case "Button":
      return node({ props: { href: "https://example.com" }, children: ["Go"] });
    case "Image":
      return node({ props: { src: { src: "https://example.com/a.png", width: 300, height: 150 }, alt: "A" } });
    case "List":
      return node({ children: [{ type: "ListItem", children: ["first"] }, { type: "ListItem", children: ["second"] }] });
    case "Table":
      return node({ children: [{ type: "TableRow", children: [{ type: "TableCell", children: ["a"] }, { type: "TableCell", children: ["b"] }] }, { type: "TableRow", children: [{ type: "TableCell", children: ["c"] }, { type: "TableCell", children: ["d"] }] }] });
    case "TableRow":
      return node({ children: [{ type: "TableCell", children: ["a"] }, { type: "TableCell", children: ["b"] }] });
    case "Divider":
      return node({});
    default:
      return node({ children: ["words"] });
  }
}

function render(type: string, style: Record<string, Json>, key: string) {
  try {
    const { html, diagnostics } = renderTemplate(host(type, nodeOf(type, style), key));
    return { html, diagnostics };
  } catch (error) {
    return { html: "", diagnostics: [], error: String(error) };
  }
}

/** CSS's own values where nothing is set: setting them changes nothing. */
const INITIAL: Record<string, Json> = { alignItems: "start", justifyContent: "start", flexWrap: "nowrap", overflow: "visible", textDecoration: "none", verticalAlign: "top" };

/** The value a style already has on the subject (inherited, a default, or CSS's own): setting it is no change. */
function inEffect(type: string, key: string): Json | undefined {
  const { resolved } = prepareTemplate(host(type, nodeOf(type, {}), key));
  if (!resolved) return undefined;
  const find = (node: ResolvedNode): ResolvedNode | undefined =>
    node.id === "subject" || (type === "Email" && node === resolved.root) ? node : node.children.flatMap((c) => (typeof c === "string" ? [] : [find(c)])).find(Boolean);
  const node = find(resolved.root);
  if (!node) return undefined;
  if (key in node.text) return (node.text as unknown as Record<string, Json>)[key];
  if (key === "width" && node.width !== null && !(key in node.style)) return node.width;
  return node.style[key] ?? INITIAL[key];
}

/** Whether a rule of the declaration covers this value (anything but `full`). */
function declaredOtherwise(support: EmailSupport | readonly EmailSupport[], value: Json): boolean {
  return ([] as EmailSupport[]).concat(support).some((rule) => rule.level !== "full" && (!rule.values || rule.values.some((v) => JSON.stringify(v) === JSON.stringify(value))) && (!rule.when || rule.when(value)));
}

describe("email support", () => {
  it("is declared on every style of every component that renders to email", () => {
    const missing = EMAIL_COMPONENTS.flatMap((definition) => Object.entries(definition.style).filter(([, spec]) => !spec.email).map(([key]) => `${definition.type}.${key}`));
    expect(missing).toEqual([]);
  });

  it("says where each declaration comes from", () => {
    const sources = new Set(EMAIL_COMPONENTS.flatMap((definition) => Object.values(definition.style).flatMap((spec) => ([] as EmailSupport[]).concat(spec.email ?? []).map((rule) => rule.source))));
    for (const source of sources) expect(["outlook-captures", "caniemail", "writer", "assumed"]).toContain(source);
  });

  const silent: string[] = [];
  const unreported: string[] = [];
  const failed: string[] = [];
  for (const definition of EMAIL_COMPONENTS) {
    const type = definition.type;
    const without = render(type, {}, "");
    for (const key of Object.keys(definition.style)) {
      const current = inEffect(type, key);
      for (const value of samples(key, definition)) {
        if (JSON.stringify(value) === JSON.stringify(current)) continue;
        const label = `${type}.${key} = ${JSON.stringify(value)}`;
        const result = render(type, { [key]: value }, key);
        if ("error" in result && result.error) {
          failed.push(`${label}: ${result.error}`);
          continue;
        }
        // A diagnostic for the style, or for the node itself (a minimum wider than its parent: layout/overflow).
        const subject = type === "Email" ? "root" : undefined;
        const reported = result.diagnostics.some((d) => d.path.endsWith(`.style.${key}`) || d.nodeId === "subject" || d.path === subject);
        const base = key === "flex" ? render(type, {}, key).html : without.html;
        if (declaredOtherwise(definition.style[key].email!, value) && !reported) unreported.push(label);
        else if (result.html === base && !reported) silent.push(label);
      }
    }
  }

  it("renders every style of every component, each sample value", () => {
    expect(failed).toEqual([]);
  });

  it("drops no style silently: setting it changes the email, or a diagnostic names it", () => {
    expect(silent).toEqual([]);
  });

  it("reports every style email shows otherwise, as its declaration says", () => {
    expect(unreported).toEqual([]);
  });
});
