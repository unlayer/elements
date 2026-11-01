/**
 * Custom components expanded into the primitives they're made of, before a
 * document is resolved and rendered. The document keeps them as one node
 * each; only what's rendered is expanded.
 */
import type { ComponentDefinition } from "./define";
import { Diagnostics, type Diagnostic } from "./diagnostics";
import { isNode, type ElementsDocument, type Json, type Node } from "./model";
import { checkFragment } from "./normalize";
import { isCustom, propsWithDefaults, registryOf, type ComponentsOption, type CustomDefinition, type Registry } from "./registry";

/** How deep custom components may expand into others: deeper is a component that contains itself. */
const MAX_DEPTH = 32;

export function expandDocument(document: ElementsDocument, options?: ComponentsOption | Registry): { document: ElementsDocument; diagnostics: Diagnostic[] } {
  const registry = registryOf(options);
  const d = new Diagnostics();
  const taken = new Set<string>();
  const collect = (node: Node) => {
    if (node.id) taken.add(node.id);
    node.children?.forEach((child) => isNode(child) && collect(child));
  };
  collect(document.root);
  const rootDefinition = registry.get(document.root.type);
  const responsive = !!rootDefinition?.responsive;

  const visit = (node: Node, path: string, depth: number): Node => {
    const definition = registry.get(node.type)!;
    if (!node.children?.length) return node;
    const children = node.children.map((child, index) => {
      if (!isNode(child)) return child;
      const at = `${path}.children[${index}]`;
      const childDefinition = registry.get(child.type);
      if (childDefinition && isCustom(childDefinition)) return expandOne(child, childDefinition, definition, at, depth) ?? null;
      return visit(child, at, depth);
    });
    return { ...node, children: children.filter((child): child is NonNullable<typeof child> => child !== null) };
  };

  const expandOne = (node: Node, definition: CustomDefinition, parent: ComponentDefinition, path: string, depth: number): Node | undefined => {
    if (depth >= MAX_DEPTH) {
      d.error("custom/depth", `${node.type} expands into custom components ${MAX_DEPTH} deep: does it contain itself?`, path, node.id);
      return undefined;
    }
    let raw: unknown;
    try {
      const style = { ...(definition.defaultStyle as Record<string, Json> | undefined), ...node.style } as Record<string, Json>;
      raw = definition.expand(propsWithDefaults(definition, node.props) as never, { register: (custom) => registry.add(custom), style });
    } catch (error) {
      d.error("custom/render", `${node.type} failed to render: ${error instanceof Error ? error.message : String(error)}`, path, node.id);
      return undefined;
    }
    if (Array.isArray(raw) || typeof raw !== "object" || raw === null) {
      d.error("custom/render", `${node.type} renders one component (a Column, a Section, …), not ${Array.isArray(raw) ? "several" : JSON.stringify(raw)}`, path, node.id);
      return undefined;
    }
    const { node: expanded, diagnostics } = checkFragment(raw, { parent, responsive, idPrefix: node.id ?? null, taken, registry, path: `${path}(${node.type})` });
    for (const diagnostic of diagnostics) d.list.push(diagnostic);
    if (!expanded) return undefined;
    collectIds(expanded);
    // The custom node's place in a Row and its visibility go onto what it renders.
    if (node.style?.flex !== undefined) expanded.style = { ...expanded.style, flex: node.style.flex };
    if (node.hidden) expanded.hidden = { ...expanded.hidden, ...node.hidden };
    const inner = registry.get(expanded.type)!;
    if (isCustom(inner)) return expandOne(expanded, inner, parent, `${path}(${node.type})`, depth + 1);
    return visit(expanded, `${path}(${node.type})`, depth + 1);
  };

  const collectIds = (node: Node) => {
    if (node.id) taken.add(node.id);
    node.children?.forEach((child) => isNode(child) && collectIds(child));
  };

  return { document: { ...document, root: visit(document.root, "root", 0) }, diagnostics: d.list };
}
