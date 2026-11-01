/**
 * Changing a document: finding a node, and applying a patch (what an editor,
 * composite or not, writes) with the same validation as reading one.
 */
import type { NodePatch } from "./define";
import { Diagnostics, type Diagnostic } from "./diagnostics";
import { isNode, type ElementsDocument, type Json, type Node } from "./model";
import { registryOf, type ComponentsOption, type Registry } from "./registry";

export function findNode(document: ElementsDocument, id: string): Node | undefined {
  const search = (node: Node): Node | undefined => {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
      if (!isNode(child)) continue;
      const found = search(child);
      if (found) return found;
    }
    return undefined;
  };
  return search(document.root);
}

/**
 * The document with `patch` applied to the node `id`: each value validated by
 * the node's definition (an invalid one is left as it was, with a
 * diagnostic), `undefined` removing it. The document passed isn't changed.
 */
export function applyPatch(
  document: ElementsDocument,
  id: string,
  patch: NodePatch,
  options?: ComponentsOption | Registry
): { document: ElementsDocument; diagnostics: Diagnostic[] } {
  const d = new Diagnostics();
  const copy = JSON.parse(JSON.stringify(document)) as ElementsDocument;
  const node = findNode(copy, id);
  if (!node) {
    d.error("patch/no-node", `No component has the id "${id}"`, "");
    return { document, diagnostics: d.list };
  }
  const definition = registryOf(options).get(node.type);
  if (!definition) {
    d.error("patch/unknown-type", `"${node.type}" is a component this call wasn't given`, "", id);
    return { document, diagnostics: d.list };
  }
  const hover = new Set<string>(definition.hover ?? []);
  for (const section of ["props", "style", "hover"] as const) {
    const changes = patch[section];
    if (!changes) continue;
    const values: Record<string, Json> = { ...(node[section] ?? {}) };
    for (const [key, value] of Object.entries(changes)) {
      const path = `${section}.${key}`;
      const spec = section === "props" ? definition.props[key] : definition.style[key];
      if (!spec || (section === "hover" && !hover.has(key))) {
        d.error("patch/unknown", `A ${node.type} has no ${section === "props" ? "prop" : section === "hover" ? "hover style" : "style"} "${key}"`, path, id);
        continue;
      }
      if (value === undefined) {
        if (section === "props" && definition.props[key].required) d.error("patch/required", `A ${node.type} needs "${key}"`, path, id);
        else delete values[key];
        continue;
      }
      const parsed = spec.kind.parse(value);
      if (parsed.ok) values[key] = parsed.value;
      else d.error("patch/invalid", `${key}: ${parsed.message}`, path, id);
    }
    if (Object.keys(values).length) node[section] = values;
    else delete node[section];
  }
  return { document: copy, diagnostics: d.list };
}
