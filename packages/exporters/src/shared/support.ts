/**
 * What an output can't do as a template asks, from the components'
 * definitions: each style and prop says, for each output it renders to, how
 * that output shows it (`support`). One pass reads it for every output, for
 * what the author set (not a component's own defaults): `none` is a warning
 * (`<output>/unsupported`), `partial` a note (`<output>/degraded`), `outlook`
 * a note (`email/outlook-degraded`). Each output adds what no single style or
 * prop says (email: `email/support.ts`).
 */
import { Diagnostics, type Diagnostic, type Json, type ResolvedNode, type Support, type SupportByTarget, type Target } from "@unlayer-internal/elements-core";

const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);
const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);

export function support(root: ResolvedNode, target: Target): Diagnostic[] {
  const d = new Diagnostics();
  const visit = (node: ResolvedNode) => {
    const { definition } = node;
    const byProp = definition.defaultStyleBy ? (definition.defaultStyleBy.values[String(node.props[definition.defaultStyleBy.prop])] as Record<string, Json> | undefined) : undefined;
    for (const [key, value] of Object.entries(node.style)) {
      const fallback = byProp?.[key] ?? (definition.defaultStyle as Record<string, Json> | undefined)?.[key];
      report(node, "style", key, value, fallback, definition.style[key]?.support, target, d);
    }
    for (const [key, value] of Object.entries(node.props)) report(node, "props", key, value, definition.props[key]?.default as Json | undefined, definition.props[key]?.support, target, d);
    for (const child of node.children) if (isNode(child) && shown(child)) visit(child);
  };
  visit(root);
  return d.list;
}

function report(node: ResolvedNode, where: "style" | "props", key: string, value: Json, fallback: Json | undefined, declared: SupportByTarget | undefined, target: Target, d: Diagnostics): void {
  const rules = declared?.[target];
  if (!rules || same(value, fallback)) return;
  for (const rule of ([] as Support[]).concat(rules)) {
    if (rule.level === "full") continue;
    if (rule.values && !rule.values.some((v) => same(v, value))) continue;
    if (rule.when && !rule.when(value, node)) continue;
    const at = `${node.path}.${where}.${key}`;
    const asked = typeof value === "string" ? `${key}: "${value}"` : key;
    const output = target === "web" ? "a page" : target;
    if (rule.level === "none") d.warning(`${target}/unsupported`, `${asked} isn't possible in ${output}: ${rule.shows}`, at, node.id);
    else if (rule.level === "partial") d.add(`${target}/degraded`, "info", `${asked} on this ${node.type} in ${output}: ${rule.shows}`, at, node.id);
    else d.add("email/outlook-degraded", "info", `${asked} on this ${node.type} in classic Outlook: ${rule.shows}`, at, node.id);
  }
}
