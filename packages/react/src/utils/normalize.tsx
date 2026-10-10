/**
 * A template's Rows, Columns and blocks, as React renders them: one render
 * collects them (see collect.ts and record.tsx), with the user's components,
 * Fragments, conditions, hooks and Context handled by React itself. What it
 * gives back is the template as Elements components only (Email > Row >
 * Column > blocks), which the HTML, the head and the design are then made
 * from, so they can't disagree.
 *
 * What a template puts among them that isn't one keeps what it did before:
 * markup among the rows is kept as it is; text in a Row or Column shows as
 * text (with a warning); a component of the user's own that renders markup in
 * a Column is an HTML block named after it; other markup in a Row or Column is
 * left out. A component that throws, suspends or is async is left out, with a
 * message, and the rest renders.
 */
import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { MARK, within, type Collection, type Recorded } from "./collect";
import { guard } from "./record";
import { callIsolated, FORWARD_REF, isThenable, MEMO } from "./unwrap-root";
import { scopeCache } from "./render-scope";
import Row from "../components/Row";
import Column from "../components/Column";

type Within = { at: number; children: Node[] };
type Node =
  | { kind: "raw"; html: string }
  | ({ kind: "block" } | { kind: "failed" }) & { at: number }
  | ({ kind: "row" } | { kind: "column" } | { kind: "boundary" }) & Within;

/** The markers in a collected render, as a tree; what's between them is kept as raw HTML. */
function parse(html: string, collection: Collection): Node[] {
  const root: Node[] = [];
  const open: Node[][] = [root];
  const pattern = new RegExp(`<${MARK} data-n="${collection.nonce}" data-i="(\\d+)"(?: data-e="([ocf])")?></${MARK}>`, "g");
  let last = 0;
  for (const match of html.matchAll(pattern)) {
    const into = open[open.length - 1];
    if (match.index! > last) into.push({ kind: "raw", html: html.slice(last, match.index) });
    last = match.index! + match[0].length;
    const at = Number(match[1]);
    const edge = match[2];
    if (edge === "o") {
      const children: Node[] = [];
      into.push({ kind: collection.recorded[at].kind as "row" | "column" | "boundary", at, children });
      open.push(children);
    } else if (edge === "c") open.pop();
    else into.push({ kind: edge === "f" ? "failed" : "block", at });
  }
  if (last < html.length) open[open.length - 1].push({ kind: "raw", html: html.slice(last) });
  if (open.length !== 1) throw new Error("[Unlayer] a collected render's markers don't pair up");
  return root;
}

const TEXT_ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

type Part = { text: string } | { tag: string; html: string; inner?: string };

/** Raw HTML as React wrote it: text (unescaped) and top-level elements, in order. */
function parts(html: string): Part[] {
  const out: Part[] = [];
  let at = 0;
  const text = (s: string) => s && out.push({ text: s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => TEXT_ENTITIES[e]) });
  while (at < html.length) {
    const start = html.indexOf("<", at);
    if (start < 0) {
      text(html.slice(at));
      break;
    }
    text(html.slice(at, start));
    const name = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(start))?.[1];
    if (!name) {
      // Not an element (a comment from a template's own markup): kept with what follows as markup.
      out.push({ tag: "#", html: html.slice(start) });
      break;
    }
    const openEnd = html.indexOf(">", start);
    if (VOID.test(name) || html[openEnd - 1] === "/") {
      out.push({ tag: name, html: html.slice(start, openEnd + 1) });
      at = openEnd + 1;
      continue;
    }
    // Its matching end tag: the same name, nested ones counted.
    const tags = new RegExp(`<(/?)${name}(?=[\\s>/])`, "gi");
    tags.lastIndex = openEnd + 1;
    let depth = 1;
    let end = -1;
    for (let m = tags.exec(html); m; m = tags.exec(html)) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) {
        end = m.index;
        break;
      }
    }
    if (end < 0) {
      out.push({ tag: "#", html: html.slice(start) });
      break;
    }
    const close = html.indexOf(">", end) + 1;
    out.push({ tag: name, html: html.slice(start, close), inner: html.slice(openEnd + 1, end) });
    at = close;
  }
  return out;
}

function innerType(type: any): any {
  while (type?.$$typeof === MEMO) type = type.type;
  return type;
}

/** One render of a root's children, collected. */
interface Collected {
  nodes: Node[];
  collection: Collection;
  /** The components left out that were said so (once: the HTML, the head and the design build from the same render). */
  told: Set<number>;
}

const recorded = (c: Collected, node: { at: number }) => c.collection.recorded[node.at] as Recorded & Record<string, any>;

const nameOf = (element: React.ReactElement): string => {
  const type = innerType(element.type);
  return type?.displayName || type?.name || "component";
};

/** A component that threw, suspended or is async, left out: said once per render. */
function leftOut(c: Collected, node: { at: number }): [] {
  if (!c.told.has(node.at)) {
    c.told.add(node.at);
    tell(recorded(c, node).element);
  }
  return [];
}

/**
 * Says why a component was left out: it's called once more on its own, and what it renders is collected, so a
 * component in it that fails says so itself.
 */
function tell(element: React.ReactElement<any>): void {
  const type = innerType(element.type);
  const name = nameOf(element);
  try {
    let inner: Collected;
    if (type?.$$typeof === FORWARD_REF || (typeof type === "function" && !type.prototype?.isReactComponent)) {
      const props = { ...element.props };
      for (const key in type.defaultProps) if (props[key] === undefined) props[key] = type.defaultProps[key];
      inner = collected(callIsolated(() => (type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props))) as React.ReactNode);
    } else inner = collected(element, false); // a class, lazy, …: React renders it, and throws what it does
    const failed = (nodes: Node[]): Array<{ at: number }> => nodes.flatMap((n) => (n.kind === "failed" ? [n] : "children" in n ? failed(n.children) : []));
    const found = failed(inner.nodes);
    for (const node of found) tell(recorded(inner, node).element);
    if (!found.length) console.error(`[Unlayer] <${name}> failed while rendering, so it's left out.`);
  } catch (error) {
    if (isThenable(error) || /async and suspending|suspended/.test(String((error as Error)?.message))) {
      console.warn(`[Unlayer] <${name}> is async or suspends: Elements renders synchronously, so it's left out. Load its data first and pass it as props.`);
    } else console.error(`[Unlayer] <${name}> threw while rendering, so it's left out:`, error);
  }
}

/**
 * A component of the user's own that rendered one element of markup in a Column: an HTML block of what's in it,
 * named after the component (with its props, for its padding and visibility).
 */
function keptMarkup(c: Collected, node: Within): React.ReactElement | undefined {
  const only = node.children.length === 1 && node.children[0].kind === "raw" ? parts(node.children[0].html) : [];
  if (only.length !== 1 || !("inner" in only[0]) || only[0].inner === undefined) return undefined;
  const element = recorded(c, node).element as React.ReactElement<any>;
  const inner = only[0].inner;
  const Rendered = () => React.createElement("div", { dangerouslySetInnerHTML: { __html: inner } });
  Rendered.displayName = nameOf(element);
  return React.createElement(Rendered, { ...element.props });
}

/** A recorded Row, Column or block, as the Elements component it was, with what React rendered in it. */
function element(c: Collected, node: Extract<Node, { kind: "row" | "column" | "block" }>): React.ReactElement {
  const r = recorded(c, node);
  if (node.kind === "block") return React.createElement(r.type, r.props);
  if (node.kind === "column") return React.createElement(Column, { ...r.props, children: elements(c, node.children, true) });
  const props = { ...r.props };
  const children = elements(c, node.children, false);
  // A layout counts the Columns as written (a condition's place included) or as rendered (from Fragments and
  // components): either fits it. The rendered Row is then given its cells, which hold no condition's place.
  if (props.layout) {
    const columns = children.filter((child) => React.isValidElement(child) && child.type === Column).length;
    if (columns === props.layout.expectedColumns || React.Children.count(props.children) === props.layout.expectedColumns) {
      props.cells = props.layout.cells;
      delete props.layout;
    }
  }
  return React.createElement(Row, { ...props, children });
}

/** What's among the rows, or in a Row or a Column, as Elements components. */
function elements(c: Collected, nodes: Node[], inColumn: boolean, owner?: React.FC): React.ReactNode[] {
  return nodes.flatMap((node): React.ReactNode[] => {
    switch (node.kind) {
      case "failed":
        return leftOut(c, node);
      case "boundary": {
        const kept = inColumn ? keptMarkup(c, node) : undefined;
        if (kept) return [kept];
        // Markup it renders, where it isn't kept, is named after it in the messages that say so.
        const Named = () => null;
        Named.displayName = nameOf(recorded(c, node).element);
        return elements(c, node.children, inColumn, Named);
      }
      case "raw":
        // Text shows as text. Other markup isn't a Column, which a Row says (and leaves it out); in a Column it's left out.
        return parts(node.html).flatMap((p): React.ReactNode[] => ("text" in p ? [p.text] : inColumn ? [] : [React.createElement(owner ?? (p.tag === "#" ? "div" : p.tag))]));
      default:
        return [element(c, node)];
    }
  });
}

/** A render of `children` that collects them; `guarded`, a component in them that fails is left out. */
function collected(children: React.ReactNode, guarded = true): Collected {
  const collection: Collection = { nonce: Math.random().toString(36).slice(2, 10), recorded: [] };
  const html = within(collection, () => renderToStaticMarkup(<>{guarded ? guard(children, collection) : children}</>));
  return { nodes: parse(html, collection), collection, told: new Set() };
}

/** `children` collected, once per render (the HTML, the head and the design ask for the same). */
const collect = (children: React.ReactNode): Collected =>
  children !== null && typeof children === "object" ? scopeCache(children, () => collected(children)) : collected(children);

/**
 * A root's children as HTML (what Body puts inside it): markup among the rows as it is, and each row or block
 * rendered by Elements with `place` giving it the root's settings.
 */
export function childrenHtml(children: React.ReactNode, place: (child: React.ReactElement) => React.ReactElement): string {
  const c = collect(children);
  const html = (nodes: Node[]): string =>
    nodes
      .map((node) => {
        switch (node.kind) {
          case "raw":
            return node.html;
          case "boundary":
            return html(node.children);
          case "failed":
            leftOut(c, node);
            return "";
          default:
            return within(null, () => renderToString(place(element(c, node))));
        }
      })
      .join("");
  return html(c.nodes);
}

/** Children (a root's, or a Row on its own) as Elements components only, for the head and the design. */
export function normalizedChildren(children: React.ReactNode): React.ReactNode[] {
  const c = collect(children);
  return elements(c, c.nodes, false);
}

/** `root` with its children as Elements components only. */
export function normalizedRoot(root: React.ReactElement): React.ReactElement {
  return React.cloneElement(root, undefined, ...normalizedChildren((root.props as { children?: React.ReactNode }).children));
}
