/** Ids a template can hold: a block duplicated in the builder keeps its id once, the others get the first free number after it. */
import type { Node } from "@unlayer-internal/elements-core";

export function uniqueIds(root: Node): Node {
  const taken = new Set<string>();
  const collect = (node: Node) => {
    if (node.id !== undefined) taken.add(node.id);
    for (const child of node.children ?? []) if (typeof child !== "string") collect(child);
  };
  collect(root);
  const seen = new Set<string>();
  const visit = (node: Node): Node => {
    let id = node.id;
    if (id !== undefined) {
      if (seen.has(id)) {
        let n = 2;
        while (taken.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
        taken.add(id);
      }
      seen.add(id);
    }
    return { ...node, ...(id !== undefined ? { id } : {}), ...(node.children ? { children: node.children.map((child) => (typeof child === "string" ? child : visit(child))) } : {}) };
  };
  return visit(root);
}
