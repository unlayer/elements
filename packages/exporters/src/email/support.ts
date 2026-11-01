/**
 * What email can't do as a template asks, found in one pass before the
 * email is written. Styles: from their definitions' email support (`email` on
 * each style: `none` a warning, `partial` and `outlook` notes), so a style's
 * support is said once, where the style is. Structure: what no single style
 * says (a Row child whose size isn't known, an image without a width, a
 * hidden table cell). Size budgets are checked on the written email
 * (index.tsx).
 */
import { Diagnostics, type Diagnostic, type EmailSupport, type Json, type ResolvedNode } from "@unlayer-internal/elements-core";
import { isNode, shown } from "./context";

export function emailSupport(root: ResolvedNode): Diagnostic[] {
  const d = new Diagnostics();
  const visit = (node: ResolvedNode) => {
    styles(node, d);
    structure(node, d);
    for (const child of node.children) if (isNode(child) && shown(child)) visit(child);
  };
  visit(root);
  return d.list;
}

const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);

/** Each style the author set (not the component's default) that email shows otherwise, as its definition says. */
function styles(node: ResolvedNode, d: Diagnostics): void {
  const { definition, path, id } = node;
  const byProp = definition.defaultStyleBy ? definition.defaultStyleBy.values[String(node.props[definition.defaultStyleBy.prop])] : undefined;
  for (const [key, value] of Object.entries(node.style)) {
    const spec = definition.style[key];
    const fallback = (byProp as Record<string, Json> | undefined)?.[key] ?? (definition.defaultStyle as Record<string, Json> | undefined)?.[key];
    if (!spec?.email || same(value, fallback)) continue;
    for (const rule of ([] as EmailSupport[]).concat(spec.email)) {
      if (rule.level === "full") continue;
      if (rule.values && !rule.values.some((v) => same(v, value))) continue;
      if (rule.when && !rule.when(value)) continue;
      const at = `${path}.style.${key}`;
      const asked = typeof value === "string" ? `${key}: "${value}"` : key;
      if (rule.level === "none") d.warning("email/unsupported", `${asked} isn't possible in email: ${rule.shows}`, at, id);
      else if (rule.level === "partial") d.add("email/degraded", "info", `${asked} on this ${node.type} in email: ${rule.shows}`, at, id);
      else d.add("email/outlook-degraded", "info", `${asked} on this ${node.type} in classic Outlook: ${rule.shows}`, at, id);
    }
  }
}

/** What email can't do that no single style says. */
function structure(node: ResolvedNode, d: Diagnostics): void {
  const { path, id } = node;
  if (node.type === "Row") {
    for (const child of node.children.filter(isNode).filter(shown)) {
      if (child.width === null) {
        d.warning("email/width", `This ${child.type} takes its own size in a Row, and its size isn't known: give it a width, so Outlook can lay the Row out`, `${child.path}.style.width`, child.id);
      }
    }
  }
  if (node.type === "TableCell" && node.hidden) {
    d.warning("email/unsupported", "A TableCell can't be hidden in email (its row would lose a column): hide its TableRow", `${path}.hidden`, id);
  }
  if (node.type === "Image" && node.width === null) {
    d.warning("email/image-width", "This Image has no width: Outlook shows it at the size of its file, however wide that is. Give it a width, or the file's width in src", `${path}.props.src`, id);
  }
}
