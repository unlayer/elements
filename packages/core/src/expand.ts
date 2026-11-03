/**
 * Custom components expanded into the primitives they're made of, before a
 * document is resolved and rendered. The document keeps them as one node
 * each; only what's rendered is expanded.
 */
import type { ComponentDefinition } from "./define";
import { Diagnostics, type Diagnostic } from "./diagnostics";
import { isNode, type ElementsDocument, type Json, type Node } from "./model";
import { checkFragment } from "./normalize";
import { CUSTOM_TYPE, isCustom, propsWithDefaults, registryOf, type ComponentsOption, type CustomDefinition, type Registry } from "./registry";

/** How deep custom components may expand into others: deeper is a component that contains itself. */
const MAX_DEPTH = 32;

/**
 * Each expanded node's place in the template ("root.children[4].children[1]"), for messages: a Grid's children are
 * where the template has them, not in the Rows and cells it lays them out in (which are the Grid); what a custom
 * component renders is its node, and the nodes inside it are "root.children[2](acme.Card).children[1]".
 */
export type TemplatePaths = WeakMap<Node, string>;

/** A path in an expanded document (a node's place in it, and what follows: ".props.src") as the template's. */
export function templatePathsOf(document: ElementsDocument, paths: TemplatePaths): (path: string) => string {
  const places = new Map<string, string>();
  const visit = (node: Node, at: string) => {
    places.set(at, paths.get(node) ?? at);
    node.children?.forEach((child, index) => isNode(child) && visit(child, `${at}.children[${index}]`));
  };
  visit(document.root, "root");
  return (path) => {
    // The deepest node it starts with.
    for (let at = path; at; at = at.slice(0, Math.max(at.lastIndexOf("."), at.lastIndexOf("["), 0))) {
      const place = places.get(at);
      if (place !== undefined) return place + path.slice(at.length);
    }
    return path;
  };
}

export function expandDocument(document: ElementsDocument, options?: ComponentsOption | Registry): { document: ElementsDocument; diagnostics: Diagnostic[]; paths: TemplatePaths } {
  const registry = registryOf(options);
  const d = new Diagnostics();
  const paths: TemplatePaths = new WeakMap();
  const taken = new Set<string>();
  const collect = (node: Node) => {
    if (node.id) taken.add(node.id);
    node.children?.forEach((child) => isNode(child) && collect(child));
  };
  collect(document.root);
  const rootDefinition = registry.get(document.root.type);
  const responsive = !!rootDefinition?.responsive;

  /** A node at `path` (its children's paths start from it), arranged first if its component arranges; it's at `self` in the template. */
  const visit = (given: Node, path: string, depth: number, self = path): Node => {
    const arrange = registry.get(given.type)?.arrange;
    if (!arrange) return walk(given, path, self, depth);
    // Its own children keep their places in the template, wherever it puts them.
    const origins = new Map<Node, string>();
    given.children?.forEach((child, index) => isNode(child) && origins.set(child, `${path}.children[${index}]`));
    return walk(arrange(given), path, self, depth, origins);
  };

  /** A node's children expanded; inside an arranged node, what it adds around the children it was given is it (`self`). */
  const walk = (node: Node, path: string, self: string, depth: number, origins?: Map<Node, string>): Node => {
    const definition = registry.get(node.type)!;
    const children = node.children?.map((child, index) => {
      if (!isNode(child)) return child;
      const at = origins ? (origins.get(child) ?? self) : `${path}.children[${index}]`;
      const childDefinition = registry.get(child.type);
      if (childDefinition && isCustom(childDefinition)) return expandOne(child, childDefinition, definition, at, depth) ?? null;
      if (origins && !origins.has(child)) return walk(child, self, self, depth, origins);
      return visit(child, at, depth);
    });
    const out = children?.length ? { ...node, children: children.filter((child): child is NonNullable<typeof child> => child !== null) } : node;
    paths.set(out, self);
    return out;
  };

  /** A custom node at `path` expanded; what it renders is at `self` (its own path, or the custom node's that rendered it). */
  const expandOne = (node: Node, definition: CustomDefinition, parent: ComponentDefinition, path: string, depth: number, self = path): Node | undefined => {
    if (depth >= MAX_DEPTH) {
      d.error("custom/depth", `${node.type} expands into custom components ${MAX_DEPTH} deep: does it contain itself?`, path, node.id);
      return undefined;
    }
    let raw: unknown;
    try {
      const style = { ...(definition.defaultStyle as Record<string, Json> | undefined), ...node.style } as Record<string, Json>;
      raw = definition.expand(propsWithDefaults(definition, node.props) as never, { register: (custom) => registry.add(custom), style, responsive });
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
    // The custom node's place in a Row and its visibility go onto what it renders; a built-in's (a Menu's, a
    // Social's) id and phone styles too. A template's own component's id is only what the ids in it go after.
    if (node.style?.flex !== undefined) expanded.style = { ...expanded.style, flex: node.style.flex };
    if (node.hidden) expanded.hidden = { ...expanded.hidden, ...node.hidden };
    if (node.id && !expanded.id && !CUSTOM_TYPE.test(node.type)) expanded.id = node.id;
    for (const [key, value] of Object.entries(node.mobile ?? {})) {
      if (registry.get(expanded.type)?.style[key]?.mobile) expanded.mobile = { [key]: value, ...expanded.mobile };
      else d.warning("mobile/not-shown", `${node.type}'s ${key} on phones isn't shown: what it renders (a ${expanded.type}) has no ${key} for phones`, `${path}.mobile.${key}`, node.id);
    }
    const inner = registry.get(expanded.type)!;
    if (isCustom(inner)) return expandOne(expanded, inner, parent, `${path}(${node.type})`, depth + 1, self);
    return visit(expanded, `${path}(${node.type})`, depth + 1, self);
  };

  const collectIds = (node: Node) => {
    if (node.id) taken.add(node.id);
    node.children?.forEach((child) => isNode(child) && collectIds(child));
  };

  return { document: { ...document, root: visit(document.root, "root", 0) }, diagnostics: d.list, paths };
}
