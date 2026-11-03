/**
 * The template read from a design, checked value by value against the components' definitions before it's given back:
 * a design holds what the builder (or someone editing its JSON) put there, and a value a component doesn't take would
 * make the template fail to render. Such a value is left out and said. A link that isn't one Elements writes (a
 * script's, a file's) is left out alone: a Link's words are kept (in text, as a Span), what it held (an image) in its
 * place; a button's, a menu item's or a social icon's is "#". An image or video without a source it can show is left
 * out.
 */
import { definitionOf, type Child, type Json, type Node } from "@unlayer-internal/elements-core";

type Kind = { parse(value: unknown): { ok: true; value: Json } | { ok: false; message: string } };

/** What a link is checked by: a Link's href. */
const LINK = (definitionOf("Link")!.props as Record<string, { kind: Kind }>).href.kind;
/** Whether a component holds text (a Link in it is a run). */
const holdsText = (type: string) => !!(definitionOf(type)?.children as { text?: boolean } | undefined)?.text;

/** A list of items with links (a Menu's, a Social block's), each link Elements won't write "#". */
function itemLinks(value: Json, key: string, path: string, report: string[]): Json {
  if (!Array.isArray(value)) return value;
  return value.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || !("href" in item) || LINK.parse(item.href).ok) return item;
    report.push(`${path}: its ${key}[${i}]'s link ${JSON.stringify(item.href)} isn't one Elements writes: it's "#"`);
    return { ...item, href: "#" };
  });
}

/** The node with only values its component takes, its children checked; null where it can't be kept, its children where only it can't. */
function checkNode(node: Node, path: string, report: string[], inText = false): Node | Child[] | null {
  const definition = definitionOf(node.type);
  if (!definition) {
    report.push(`${path}: ${JSON.stringify(node.type)} isn't a component: left out`);
    return null;
  }
  const out: Node = { ...node };
  // An id a template takes (the builder's can hold any text).
  if (out.id !== undefined && !/^[A-Za-z][\w-]*$/.test(out.id)) {
    report.push(`${path}: its id ${JSON.stringify(out.id)} isn't one a template takes: left out`);
    delete out.id;
  }
  for (const part of ["props", "style", "mobile", "hover"] as const) {
    const values = node[part];
    if (!values) continue;
    const specs = (part === "props" ? definition.props : definition.style) as Record<string, { kind: Kind } | undefined>;
    const kept: Record<string, Json> = {};
    for (const [key, given] of Object.entries(values)) {
      const value = part === "props" ? itemLinks(given, key, path, report) : given;
      const spec = Object.hasOwn(specs, key) ? specs[key] : undefined;
      const parsed = spec ? spec.kind.parse(value) : undefined;
      if (parsed?.ok) {
        kept[key] = parsed.value;
        continue;
      }
      // A link Elements won't write: a Link's words without it, a Button's "#"; an image or video it can't show, none.
      if (part === "props" && (key === "href" || key === "src")) {
        if (node.type === "Button") {
          report.push(`${path}: its link ${JSON.stringify(value)} isn't one Elements writes: it's "#"`);
          kept.href = "#";
          continue;
        }
        if (node.type !== "Link") {
          report.push(`${path}: its ${key} ${JSON.stringify(value)} isn't one Elements writes: left out`);
          return null;
        }
        // In text, its words as a Span; elsewhere (around an image), what it holds, in its place.
        report.push(`${path}: its ${key} ${JSON.stringify(value)} isn't one Elements writes: ${inText ? "its words" : "what it holds"} without it`);
        const children = checkChildren(node.children ?? [], path, report, true);
        return inText ? { type: "Span", children } : children;
      }
      report.push(`${path}: its ${part === "props" ? "" : `${part} `}${key} ${JSON.stringify(value)}${parsed && !parsed.ok ? ` (${parsed.message})` : ""} isn't one a ${node.type} takes: left out`);
    }
    if (Object.keys(kept).length) out[part] = kept;
    else delete out[part];
  }
  if (node.children) out.children = checkChildren(node.children, path, report, holdsText(node.type));
  return out;
}

function checkChildren(children: Child[], path: string, report: string[], inText: boolean): Child[] {
  return children.flatMap((child, i): Child[] => {
    if (typeof child === "string") return [child];
    const checked = checkNode(child, `${path}.children[${i}]`, report, inText);
    return Array.isArray(checked) ? checked : checked ? [checked] : [];
  });
}

export function checkTemplate(root: Node, report: string[]): Node {
  // A Document has no phones: its phone values and hiding (a design made for email, a Grid's empty cells) aren't its.
  const checked = checkNode(root.type === "Document" ? withoutPhones(root) : root, "root", report);
  return checked && !Array.isArray(checked) ? checked : { type: root.type };
}

function withoutPhones(node: Node): Node {
  const { mobile: _mobile, hidden: _hidden, ...rest } = node;
  return rest.children ? { ...rest, children: rest.children.map((child) => (typeof child === "string" ? child : withoutPhones(child))) } : rest;
}
