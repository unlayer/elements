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

/** A path's parent's: `root.children[2]` for `root.children[2].children[0]`; none for the root. */
const parentOf = (path: string) => (/\.children\[\d+\]$/.test(path) ? path.replace(/\.children\[\d+\]$/, "") : undefined);

/**
 * Each node by its place in the template, resolved, with a plain Column in place of each node at `standIns` (one that
 * doesn't resolve: a component of the template's own, an image with no source); or where it doesn't resolve, the
 * places of what's wrong.
 */
function resolvedByPath(root: Node, standIns: Set<string>): Map<string, ResolvedNode> | { wrong: string[] } {
  const swap = (node: Node, path: string): Node =>
    standIns.has(path) ? { type: "Column" } : node.children ? { ...node, children: node.children.map((child, i) => (typeof child === "string" ? child : swap(child, `${path}.children[${i}]`))) } : node;
  const prepared = prepareTemplate({ root: standIns.size ? swap(root, "root") : root });
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
  const nodes = new Map<string, Node>();
  const visit = (node: Marked, path: string, depth: number) => {
    nodes.set(path, node);
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
  const standIns = new Set<string>();
  for (const depth of [...new Set(marked.map((m) => m.depth))].sort((a, b) => a - b)) {
    let found = resolvedByPath(root, standIns);
    for (let tries = 0; !(found instanceof Map); tries++) {
      if (tries > nodes.size) {
        marked.forEach(keep);
        return root;
      }
      // What's wrong is a value a marked node needs (a Social's icons the builder changed): it keeps it. Else the
      // node it's in is a Column while it's resolved, and keeps what it holds.
      const open = marked.filter((m) => Object.keys(m.values).length);
      for (const path of found.wrong) {
        const holders = open.filter((m) => path === m.path || path.startsWith(`${m.path}.`));
        const m = holders.length ? holders.reduce((a, b) => (b.path.length > a.path.length ? b : a)) : undefined;
        const value = m && Object.keys(m.values).find((at) => path === `${m.path}.${at}` || path.startsWith(`${m.path}.${at}.`) || path.startsWith(`${m.path}.${at}[`));
        if (m && value) {
          setAt(m.node, value, m.values[value]);
          delete m.values[value];
          continue;
        }
        let at: string | undefined = path;
        while (at && !nodes.has(at)) at = at.includes(".") ? at.slice(0, Math.max(at.lastIndexOf("."), at.lastIndexOf("["))) : undefined;
        if (!at) continue;
        standIns.add(at);
        for (const inside of marked) if (inside.path === at || inside.path.startsWith(`${at}.`)) keep(inside);
      }
      found = resolvedByPath(root, standIns);
    }
    const resolved = found;
    // What's around a node a layout moved (a Grid's item, in the Row it's laid out in): each node around it as it
    // is where it was, or resolved on its own in what's around it.
    const texts = new Map<string, ResolvedNode["text"] | undefined>();
    const textAt = (path: string | undefined): ResolvedNode["text"] | undefined => {
      if (path === undefined) return undefined;
      if (texts.has(path)) return texts.get(path);
      const node = nodes.get(path);
      const there = moved(path) ? undefined : resolved.get(path);
      const text = !node ? undefined : there && (there.type === node.type || ARRANGED.has(node.type)) ? there.text : alone(node, textAt(parentOf(path)))?.text;
      texts.set(path, text);
      return text;
    };
    /** In a layout that moves what's in it (a Grid's item): another node is at its place once it's laid out. */
    const moved = (path: string) => {
      for (let at = parentOf(path); at !== undefined; at = parentOf(at)) if (ARRANGED.has(nodes.get(at)?.type ?? "")) return true;
      return false;
    };
    for (const m of marked.filter((m) => m.depth === depth && Object.keys(m.values).length)) {
      // The node as it's resolved: none where it's drawn as others (a Menu, as its Row of links), so it keeps them.
      const there = moved(m.path) ? alone(m.node, textAt(parentOf(m.path))) : resolved.get(m.path);
      const own = there?.type === m.node.type ? there : undefined;
      for (const [at, value] of Object.entries(m.values)) if (!own || !sameValue(value, taken(own, at))) setAt(m.node, at, value);
    }
  }
  return root;
}

/** Nodes laid out as others at their own place (a Grid, as the Column of Rows it is). */
const ARRANGED = new Set(["Grid"]);

/** A node resolved on its own, in an Email with the text styles around it. */
function alone(node: Node, around: ResolvedNode["text"] | undefined): ResolvedNode | undefined {
  if (!around) return undefined;
  const { lineHeightPx: _px, ...text } = around;
  const prepared = prepareTemplate({ root: { type: "Email", style: text as unknown as Record<string, Json>, children: [node] } });
  const child = prepared.resolved?.root.children[0];
  return child && typeof child !== "string" ? child : undefined;
}
