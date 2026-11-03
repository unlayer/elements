/**
 * Values the builder holds that a node takes from what it's in or from its component (a heading's font, an email's
 * width): the builder has every value set on every item, so on the way back each is left out where it's still what
 * the node takes, but where the template set it itself (`own` in its payload).
 */
import { type Json, type Node, type ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate } from "@unlayer-internal/elements-exporters";
import { sameValue, setAt, valueAt } from "./paths";

/** Marks the values of a node read from the builder, till they're told apart from what it takes. */
const TAKEN = Symbol("taken");
type Marked = Node & { [TAKEN]?: { paths: string[] } };

/** A path as a payload says it: a style's by its name alone. */
const brief = (path: string) => (path.startsWith("style.") ? path.slice(6) : path);
const full = (path: string) => (path.includes(".") ? path : `style.${path}`);

/** Paths as a payload says them, between spaces. */
export const say = (paths: string[]) => paths.map(brief).join(" ");
const list = (said: string) => said.split(" ").filter(Boolean).map(full);

/** Marks a node's values the builder holds that it takes: those said `taken`, or those read (`read`) but its `own`. */
export function mark(node: Node, read: string[], said: { taken?: string; own?: string }) {
  const own = said.own === undefined ? undefined : list(said.own);
  const paths = own ? read.filter((path) => path.includes(".") && !own.includes(path)) : list(said.taken ?? "");
  if (paths.length) (node as Marked)[TAKEN] = { paths };
}

const round = (n: number) => Math.round(n * 100) / 100;
/** A resolved text style as the builder holds it and reads it back (its px, its line height as a percentage). */
const TEXT: Record<string, (text: ResolvedNode["text"]) => Json | undefined> = {
  fontFamily: (text) => String(text.fontFamily),
  fontSize: (text) => round(text.fontSize),
  fontWeight: (text) => text.fontWeight,
  color: (text) => text.color,
  textAlign: (text) => text.textAlign,
  lineHeight: (text) => Math.round(Math.round((text.lineHeightPx / text.fontSize) * 10000) / 100) / 100,
  letterSpacing: (text) => (text.letterSpacing ? round(text.letterSpacing) : undefined),
  textTransform: (text) => (text.textTransform === "none" ? undefined : text.textTransform),
};

/** What a node has at `path` when it sets nothing there: what it takes from what it's in, or its component's default. */
export function taken(resolved: ResolvedNode, path: string): Json | undefined {
  const [part, key] = path.split(".");
  if (part === "style" && key in TEXT) return TEXT[key](resolved.text);
  if (part === "style") return resolved.style[key];
  if (part === "props") return resolved.props[key];
  return undefined;
}

/** Each node by its place in the template, resolved; or where it doesn't resolve, the places of what's wrong. */
function resolvedByPath(root: Node): Map<string, ResolvedNode> | { wrong: string[] } {
  const prepared = prepareTemplate({ root });
  if (!prepared.resolved) return { wrong: prepared.diagnostics.filter((d) => d.severity === "error").map((d) => d.path) };
  const out = new Map<string, ResolvedNode>();
  const index = (node: ResolvedNode) => {
    out.set(node.path, node);
    for (const child of node.children) if (typeof child !== "string") index(child);
  };
  index(prepared.resolved.root);
  return out;
}

/**
 * The marked values left out where they're what the node takes: outermost first, each against what's around it as
 * read back (a font changed on the body is the font a heading takes, and one the heading kept is its own).
 */
export function dropTaken(root: Node): Node {
  const marked: Array<{ node: Node; path: string; depth: number; values: Record<string, unknown> }> = [];
  const types = new Map<string, string>();
  const visit = (node: Marked, path: string, depth: number) => {
    types.set(path, node.type);
    const mine = node[TAKEN];
    if (mine) {
      delete node[TAKEN];
      const values: Record<string, unknown> = {};
      for (const at of mine.paths) {
        const value = valueAt(node, at);
        if (value === undefined) continue;
        values[at] = value;
        setAt(node, at, undefined);
      }
      if (Object.keys(values).length) marked.push({ node, path, depth, values });
    }
    (node.children ?? []).forEach((child, i) => {
      if (typeof child !== "string") visit(child, `${path}.children[${i}]`, depth + 1);
    });
  };
  visit(root, "root", 0);
  const keep = (m: (typeof marked)[number]) => {
    for (const [at, value] of Object.entries(m.values)) setAt(m.node, at, value);
    m.values = {};
  };
  for (const depth of [...new Set(marked.map((m) => m.depth))].sort((a, b) => a - b)) {
    let found = resolvedByPath(root);
    // A node that isn't valid without one of its values (a Social's icons the builder changed) keeps them all.
    while (!(found instanceof Map)) {
      // The node each wrong value is of (the innermost marked one it's in) keeps that value, or all of them.
      const open = marked.filter((m) => Object.keys(m.values).length);
      let kept = 0;
      for (const path of found.wrong) {
        const holders = open.filter((m) => path === m.path || path.startsWith(`${m.path}.`));
        if (!holders.length) continue;
        const m = holders.reduce((a, b) => (b.path.length > a.path.length ? b : a));
        const value = Object.keys(m.values).find((at) => path === `${m.path}.${at}` || path.startsWith(`${m.path}.${at}.`) || path.startsWith(`${m.path}.${at}[`));
        if (value) {
          setAt(m.node, value, m.values[value]);
          delete m.values[value];
        } else keep(m);
        kept++;
      }
      if (!kept) {
        marked.forEach(keep);
        return root;
      }
      found = resolvedByPath(root);
    }
    const resolved = found;
    for (const m of marked.filter((m) => m.depth === depth && Object.keys(m.values).length)) {
      // Where a layout moved it (a Grid's item), what's at its place is another node: it's resolved on its own.
      const there = resolved?.get(m.path);
      const own = there?.type === m.node.type ? there : alone(m.node, aroundOf(resolved, types, m.path));
      for (const [at, value] of Object.entries(m.values)) if (!own || !sameValue(value, taken(own, at))) setAt(m.node, at, value);
    }
  }
  return root;
}

/** Nodes laid out as others at their own place (a Grid, as the Column of Rows it is). */
const ARRANGED = new Set(["Grid"]);

/**
 * The text styles around a node a layout moved (a Grid's item, in the Row it's laid out in): those of the nearest
 * node around it that is where it was (the Grid, as the Column it's laid out as).
 */
function aroundOf(resolved: Map<string, ResolvedNode>, types: Map<string, string>, path: string): ResolvedNode["text"] | undefined {
  for (let at = path; /\.children\[\d+\]$/.test(at); ) {
    at = at.replace(/\.children\[\d+\]$/, "");
    const found = resolved.get(at);
    const type = types.get(at);
    if (found && type && (found.type === type || ARRANGED.has(type))) return found.text;
  }
  return undefined;
}

/** A node resolved on its own, in an Email with the text styles around it. */
function alone(node: Node, around: ResolvedNode["text"] | undefined): ResolvedNode | undefined {
  if (!around) return undefined;
  const { lineHeightPx: _px, ...text } = around;
  const prepared = prepareTemplate({ root: { type: "Email", style: text as unknown as Record<string, Json>, children: [node] } });
  const child = prepared.resolved?.root.children[0];
  return child && typeof child !== "string" ? child : undefined;
}
