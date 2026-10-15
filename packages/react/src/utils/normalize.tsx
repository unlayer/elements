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
import { renderToStaticMarkup, renderToString } from "./server-renderer";
import { COLLECTING_ID, MARK, within, type Collection, type Recorded } from "./collect";
import { guard } from "./record";
import { callIsolated, FORWARD_REF, isAsyncComponent, isThenable, MEMO } from "./unwrap-root";
import { sayOnce, scopeCache } from "./render-scope";
import { classProps, rootProps, TAILWIND } from "./tailwind";
import { UNLAYER_CONFIG_KEY } from "./create-component";
import { inlineHtml } from "./inline-html";
import { closestName } from "./closest-name";
import { PROP_ALIASES } from "@unlayer-internal/shared-elements";
import Row from "../components/Row";
import Column from "../components/Column";
import Html from "../components/Html";
import Paragraph from "../components/Paragraph";
import Divider from "../components/Divider";
import Heading, { margins } from "../components/Heading";
import Button from "../components/Button";
import Image from "../components/Image";
import Menu from "../components/Menu";
import Social from "../components/Social";
import Table from "../components/Table";
import Video from "../components/Video";
import PageBreak from "../components/PageBreak";
import { COLUMN_DEFAULTS, ROW_DEFAULTS } from "./container-defaults";

/**
 * On markup a component of the user's own rendered in a Column (see `keptMarkup`): the Html block the design
 * keeps it as. The HTML numbers it after the component, and the head counts it so too.
 */
export const KEPT = Symbol.for("@unlayer/react-elements/kept");

/** `tw`: the <Tailwind> it's in (where it's recorded), whose classes its `className` takes. */
type Within = { at: number; children: Node[]; tw?: number };
type Node =
  | { kind: "raw"; html: string }
  | ({ kind: "block" } | { kind: "failed" }) & { at: number; tw?: number; children?: Node[] }
  | ({ kind: "row" } | { kind: "column" } | { kind: "boundary" } | { kind: "tailwind" }) & Within;

/** The markers in a collected render, as a tree; what's between them is kept as raw HTML. */
export function parse(html: string, collection: Collection): Node[] {
  const root: Node[] = [];
  const open: Node[][] = [root];
  // The <Tailwind> each open list is in.
  const tws: Array<number | undefined> = [undefined];
  const pattern = new RegExp(`<${MARK} data-n="${collection.nonce}" data-i="(\\d+)"(?: data-e="([ocf])")?></${MARK}>`, "g");
  let last = 0;
  for (const match of html.matchAll(pattern)) {
    const into = open[open.length - 1];
    if (match.index! > last) into.push({ kind: "raw", html: html.slice(last, match.index) });
    last = match.index! + match[0].length;
    const at = Number(match[1]);
    const edge = match[2];
    const tw = tws[tws.length - 1];
    if (edge === "o") {
      const children: Node[] = [];
      const kind = collection.recorded[at].kind as "row" | "column" | "boundary" | "tailwind" | "block";
      into.push({ kind, at, children, tw });
      open.push(children);
      tws.push(kind === "tailwind" ? at : tw);
    } else if (edge === "c") {
      open.pop();
      tws.pop();
    } else into.push({ kind: edge === "f" ? "failed" : "block", at, tw });
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
  /** Each component's kept markup, worked out once (asking the component means calling it again). */
  kept?: Map<number, React.ReactElement | undefined>;
  /** A template that isn't one (see tell): every use of this render fails with it, the head's and the design's too. */
  fatal?: unknown;
  /** Props with their classes turned into props (see styled), by where they're recorded. */
  styled?: Map<number, Record<string, any>>;
  /** The root's props (its classes as props, its mode), for a scope's rewrite of a Row (see utils/tailwind.ts). */
  root?: Record<PropertyKey, any>;
}

const recorded = (c: Collected, node: { at: number }) => c.collection.recorded[node.at] as Recorded & Record<string, any>;

const nameOf = (element: React.ReactElement): string => {
  if (typeof element.type === "string") return element.type;
  const type = innerType(element.type);
  return type?.displayName || type?.name || "component";
};

/** A component that threw, suspended or is async, left out: said once per render. */
function leftOut(c: Collected, node: { at: number }): [] {
  if (c.fatal) throw c.fatal;
  if (!c.told.has(node.at)) {
    c.told.add(node.at);
    try {
      tell(recorded(c, node).element);
    } catch (error) {
      c.fatal = error;
      throw error;
    }
  }
  return [];
}

/** A function component of the user's own (memo, forwardRef), called once more on its own; undefined for others. */
function calledAgain(element: React.ReactElement<any>): { out: unknown } | undefined {
  const type = innerType(element.type);
  if (type?.$$typeof !== FORWARD_REF && (typeof type !== "function" || type.prototype?.isReactComponent)) return undefined;
  const props = { ...element.props };
  for (const key in type.defaultProps) if (props[key] === undefined) props[key] = type.defaultProps[key];
  return { out: callIsolated(() => (type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props))) };
}

/**
 * Says why a component was left out: it's called once more on its own, and what it renders is collected, so a
 * component in it that fails says so itself.
 */
function tell(element: React.ReactElement<any>): void {
  const type = innerType(element.type);
  const name = nameOf(element);
  const async = () =>
    console.warn(`[Unlayer] <${name}> is async or suspends: these renderers are synchronous, so it's left out. Render with "@unlayer/react-elements/async", or load its data first and pass it as props.`);
  if (isAsyncComponent(type)) return async();
  try {
    const again = calledAgain(element);
    // A class, lazy, …: React renders it, and throws what it does.
    const inner = again ? collected(again.out as React.ReactNode) : collected(element, false);
    const failed = (nodes: Node[]): Array<{ at: number }> => nodes.flatMap((n) => (n.kind === "failed" ? [n] : "children" in n && n.children ? failed(n.children) : []));
    const found = failed(inner.nodes);
    for (const node of found) tell(recorded(inner, node).element);
    if (!found.length) console.error(`[Unlayer] <${name}> failed while rendering, so it's left out.`);
  } catch (error) {
    const message = String((error as Error)?.message);
    // A template that isn't one (a component that's undefined, from a broken or circular import; an object or a Date
    // as a child) fails the render, wherever it is, as without a component around it: an email missing a block
    // shouldn't send. (React's production build names these by their error numbers, 130 and 31.)
    if (/Element type is invalid|Objects are not valid as a React child|Minified React error #(130|31)\b/.test(message)) throw error;
    // (React's production build says "suspended" as its error #426.)
    if (isThenable(error) || /async and suspending|suspended|Minified React error #426\b/.test(message)) async();
    else console.error(`[Unlayer] <${name}> threw while rendering, so it's left out:`, error);
  }
}

/** What a component rendered, when that's markup only (its own components' markup in, those that failed left out). */
function markupOnly(c: Collected, nodes: Node[]): string | undefined {
  let out = "";
  for (const node of nodes) {
    if (node.kind === "raw") out += node.html;
    else if (node.kind === "failed") leftOut(c, node);
    else if (node.kind !== "boundary" && node.kind !== "tailwind") return undefined;
    else {
      const inner = markupOnly(c, node.children);
      if (inner === undefined) return undefined;
      out += inner;
    }
  }
  return out;
}

/**
 * A component of the user's own that rendered markup in a Column: an HTML block of it, named after the component
 * (with its props, for its padding and visibility). An element given `dangerouslySetInnerHTML` gives what's in it,
 * as 0.1.22 kept it (the element itself left out), whatever that holds (a `<div/>`, a stray end tag, a comment);
 * other markup, which 0.1.22 left out (a link, a table, an image, elements side by side), is kept as it is.
 */
function keptMarkup(c: Collected, node: Within): React.ReactElement | undefined {
  c.kept ??= new Map();
  if (!c.kept.has(node.at)) c.kept.set(node.at, keptMarkupOnce(c, node));
  return c.kept.get(node.at);
}

function keptMarkupOnce(c: Collected, node: Within): React.ReactElement | undefined {
  const raw = markupOnly(c, node.children);
  if (raw === undefined) return undefined;
  const list = parts(raw);
  // Text alone shows as text (see `elements`).
  if (!list.some((p) => "tag" in p)) return undefined;
  const element = recorded(c, node).element as React.ReactElement<any>;
  // A link alone (a <Link>) is a Paragraph holding it, a rule a Divider: blocks the design can edit.
  const solo = list.filter((p) => !("text" in p) || p.text.trim());
  const { containerPadding, hideOnMobile, hideOnDesktop } = (element.props ?? {}) as Record<string, unknown>;
  const block = solo.length === 1 && "tag" in solo[0] ? asBlock(solo[0], { containerPadding, hideOnMobile, hideOnDesktop }) : undefined;
  if (block) return block;
  // One element (what's in it may not pair up as markup): React writes `dangerouslySetInnerHTML` and children
  // alike, so the component is asked which it gave (a <div> when it can't say, as most such are).
  const one = list.length === 1 || list.some((p) => "tag" in p && p.tag === "#") ? /^<([a-zA-Z][\w:-]*)\b[^>]*>([\s\S]*)<\/\1>$/.exec(raw) : null;
  // Asked only when it matters (one element), as asking calls the component again.
  let given = false;
  if (one) {
    try {
      const out = calledAgain(element)?.out as React.ReactElement<{ dangerouslySetInnerHTML?: unknown }> | undefined;
      given = React.isValidElement(out) && typeof out.type === "string" && out.props.dangerouslySetInnerHTML != null;
    } catch {
      given = one[1].toLowerCase() === "div";
    }
  }
  const html = one && given ? one[2] : raw;
  const Rendered = () => React.createElement("div", { dangerouslySetInnerHTML: { __html: html } });
  Rendered.displayName = nameOf(element);
  (Rendered as unknown as Record<symbol, unknown>)[KEPT] = React.createElement(Html, {
    html,
    ...(containerPadding !== undefined ? { containerPadding } : {}),
    ...(hideOnMobile !== undefined ? { hideOnMobile } : {}),
    ...(hideOnDesktop !== undefined ? { hideOnDesktop } : {}),
  } as Record<string, unknown>);
  return React.createElement(Rendered, { ...element.props });
}

/**
 * A block a component of the template rendered to a string (react-dom's own `renderToStaticMarkup`) while the
 * template is collected comes out as its marker. In a prop (an Html block's `html`) that's what it renders.
 */
function resolvedProps(c: Collected, props: Record<string, any>): Record<string, any> {
  let out = props;
  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== "string" || !value.includes(MARK)) continue;
    let html = value;
    try {
      if (value.includes(c.collection.nonce)) html = markup(c, parse(value, c.collection), (block) => within(null, () => renderToStaticMarkup(block)));
    } catch {
      // Markers that don't pair up (part of a string): left for withoutMarkers.
    }
    out = out === props ? { ...props } : out;
    out[key] = withoutMarkers(html, c.collection.nonce);
  }
  return out;
}

/**
 * A marker that got out of the collecting render (it can't, by the Sentinel: this is the net under it) is
 * taken out, and said, rather than sent in an email: what it stood for can't be told any more. Only this
 * render's markers, whole, as React writes them: this runs on finished HTML, after `toSafeHtml`, and taking
 * out anything else (text shaped like a marker in an attribute) could move where an attribute ends.
 */
function withoutMarkers(html: string, nonce: string): string {
  const left = new RegExp(`<${MARK} data-n="${nonce}" data-i="\\d+"(?: data-e="[ocf]")?></${MARK}>`, "g");
  if (!html.includes(nonce) || !html.match(left)) return html;
  console.error(`[Unlayer] an Elements block rendered inside a component left a marker behind; it's taken out, and the block it stood for is missing.`);
  return html.replace(left, "");
}

/** Collected nodes as HTML: markup as it is, each row, column or block by `render`. */
function markup(c: Collected, nodes: Node[], render: (element: React.ReactElement) => string): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "raw":
          return node.html;
        case "boundary":
        case "tailwind":
          return markup(c, node.children, render);
        case "failed":
          leftOut(c, node);
          return "";
        default: {
          const out = element(c, node);
          return out ? render(out) : "";
        }
      }
    })
    .join("");
}

/** A list with keys, as React asks for one it renders (a Row or Column that fails renders its children as they are). */
const keyed = (list: React.ReactNode[]): React.ReactNode[] =>
  list.map((child, i) => (React.isValidElement(child) && child.key == null ? React.cloneElement(child, { key: `k${i}` }) : child));

/**
 * A recorded Row's, Column's or block's props, with its `className` turned into props by the <Tailwind> it's in
 * (worked out once: the HTML, the head and the design ask for the same).
 */
function styled(c: Collected, node: Extract<Node, { kind: "row" | "column" | "block" }>, props: Record<string, any>): Record<string, any> {
  // (Classes in a block's `html` are inlined too.)
  if (node.tw === undefined || !(props.className || /\sclass=/i.test(props.html))) return props;
  c.styled ??= new Map();
  if (!c.styled.has(node.at)) {
    const type = recorded(c, node).type as any;
    const item = type?.[UNLAYER_CONFIG_KEY];
    const [name, defaults] = node.kind === "row" ? ["Row", ROW_DEFAULTS] : node.kind === "column" ? ["Column", COLUMN_DEFAULTS] : [item?.name ?? type?.displayName ?? "Block", item?.defaultValues];
    c.styled.set(node.at, classProps(recorded(c, { at: node.tw }).props, name, defaults, props));
  }
  return c.styled.get(node.at)!;
}

/** Props any block takes beside its values (its defaults' keys); `font…` in camel case (`fontsize` is a slip). */
const KNOWN = /^(children|className|style|mode|values|containerPadding|hideOn(Mobile|Desktop)|mobile|skipInText|html|text|href|action|alt|src|width|maxWidth|items|icons|icon\w+|spacing|videoUrl|headers|data|columns|rows|font[A-Z]\w*|letterSpacing|color|lineHeight|textAlign|padding|border\w*|backgroundColor|hover\w*|_\w+)$/;

/** Markup that is a block: an <a> a Paragraph holding it (its link kept to what text can hold), an <hr> a Divider. */
const asBlock = (part: Part, props: Record<string, unknown> = {}): React.ReactElement | undefined =>
  "tag" in part && part.tag === "a" ? React.createElement(Paragraph, { ...props, html: inlineHtml(part.html) }) : "tag" in part && part.tag === "hr" ? React.createElement(Divider, props) : undefined;

/**
 * This copy's blocks, by name. A block of another copy of Elements (a package still on an earlier release, in a
 * monorepo) is this copy's block of its name, so its HTML is this release's, the export of its design (a custom tool
 * stays its own).
 */
const BLOCKS: Record<string, React.ComponentType<any>> = { Paragraph, Heading, Button, Image, Divider, Html, Menu, Social, Table, Video, PageBreak };

/** A recorded Row, Column or block, as the Elements component it was, with what React rendered in it (null: left out). */
function element(c: Collected, node: Extract<Node, { kind: "row" | "column" | "block" }>): React.ReactElement | null {
  const r = recorded(c, node);
  if (node.kind === "block") {
    let props = resolvedProps(c, r.props);
    // Its text as React rendered it (see record.tsx): HTML, kept to inline formatting. A component in it that failed is said.
    const html = node.children && markupOnly(c, node.children);
    const item = r.type[UNLAYER_CONFIG_KEY];
    if (html !== undefined) props = { ...props, children: undefined, [item.name === "Paragraph" ? "html" : "text"]: inlineHtml(html, node.tw !== undefined) };
    if (item?.name === "Heading") props = margins(props);
    // A prop a block has no use for is said, not dropped quietly (a custom tool's props are its own).
    if (item && !item.contentType) {
      const values = item.defaultValues;
      // Its props: its values' names (flat too) and the names it takes for them (see PROP_ALIASES).
      const names = Object.keys({ ...values, ...PROP_ALIASES[item.name] }).concat(...Object.values(values).map((v) => (v && typeof v == "object" ? Object.keys(v) : [])));
      for (const key in props) {
        // (`target` is a link's: a block without one has no use for it.)
        const known = names.includes(key) || KNOWN.test(key) || (key === "target" && ("href" in values || "action" in values));
        const near = !known && props[key] !== undefined && closestName(key, names);
        if (near !== false) sayOnce(`[Unlayer] ${item.name} ignores the prop \`${key}\`${near ? `: did you mean \`${near}\`?` : "."}`);
      }
    }
    return React.createElement((item?.contentType !== "custom" && BLOCKS[item?.name]) || r.type, styled(c, node, props));
  }
  if (node.kind === "column") return React.createElement(Column, { ...styled(c, node, r.props), children: keyed(elements(c, node.children, "column")) });
  const props: Record<PropertyKey, any> = { ...styled(c, node, r.props) };
  const list = elements(c, node.children, "row");
  // A layout counts the Columns as written (a condition's place included) or as rendered (from Fragments and
  // components): either fits it. The rendered Row is then given its cells, which hold no condition's place. A Row
  // neither fits is left out, of the HTML and the design alike, and said once.
  const layout = props.layout;
  if (layout) {
    const columns = list.filter((child: any) => child?.type === Column).length;
    if (columns !== layout.expectedColumns && React.Children.count(props.children) !== layout.expectedColumns) {
      // (Said once: the HTML, the head and the design ask.)
      c.told.has(node.at) || (c.told.add(node.at), console.error(`[Unlayer] A Row with the ${layout.name} layout, for ${layout.expectedColumns} Columns, has ${columns}, so it's left out.`));
      return null;
    }
    props.cells = layout.cells;
    delete props.layout;
  }
  // A scope's rewrite, the Row's, one its Columns' classes give, or the root's, can put what its classes give the Row
  // in its Columns (Tailwind's padding and margins, and text styles for the text in them: see utils/tailwind.ts).
  const rewrite = props[TAILWIND] ?? list.map((child: any) => child?.props?.style?.[TAILWIND]?.row).find(Boolean) ?? c.root?.[TAILWIND];
  const children = keyed(rewrite?.(list, props, c.root) ?? list);
  // Its own padding is the editor's: around the row, outside its content background (a hook's warned already).
  const v = { ...props.values, ...props };
  if (!props[TAILWIND] && /[1-9]/.test(String(v.padding ?? "")) && (/^(transparent)?$/.test(v.columnsBackgroundColor ?? "") ? v.backgroundImage?.url && v.backgroundImage.fullWidth === false : 1))
    sayOnce("[Unlayer] Row padding sits outside the row's content background, as in the editor; to inset the content use the Columns' padding.");
  return React.createElement(Row, { ...props, children });
}

type Place = "root" | "row" | "column";

/**
 * Markup in a Row or Column that a marker cuts in two (`<p>Hello <Name />, welcome back</p>`, a `<div>` around a
 * block): an element whose start and end tags are in different pieces. Each piece of `nodes`, raw HTML cut where
 * such an element starts and ends, with whether it's in one. React writes each element whole, so one that isn't
 * whole in its piece is cut by a marker.
 */
function spanned(nodes: Node[]): { node: Node; inside: boolean }[] {
  const out: { node: Node; inside: boolean }[] = [];
  // The elements open across pieces, outermost first.
  const spans: string[] = [];
  for (const node of nodes) {
    if (node.kind !== "raw") {
      out.push({ node, inside: spans.length > 0 });
      continue;
    }
    const html = node.html;
    // Elements opened in this piece and not closed yet; an end tag of one opened in another ends it (and what's open
    // in it); one that ends nothing open is passed over, as the browser does.
    const open: { name: string; at: number }[] = [];
    let closed = spans.length ? -1 : 0;
    for (const m of html.matchAll(/<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][\w:-]*)\b[^>]*>/g)) {
      if (!m[2]) continue;
      const name = m[2].toLowerCase();
      if (m[1]) {
        const i = open.map((o) => o.name).lastIndexOf(name);
        const across = spans.lastIndexOf(name);
        if (i >= 0) open.length = i;
        else if (across >= 0) {
          spans.length = across;
          open.length = 0;
          if (!spans.length) closed = m.index! + m[0].length;
        }
      } else if (!VOID.test(name) && !m[0].endsWith("/>")) open.push({ name, at: m.index! });
    }
    const piece = (from: number, to: number, inside: boolean) => {
      if (to > from) out.push({ node: { kind: "raw", html: html.slice(from, to) }, inside });
    };
    if (closed < 0) piece(0, html.length, true);
    else {
      piece(0, closed, true);
      piece(closed, open[0]?.at ?? html.length, false);
      if (open.length) piece(open[0].at, html.length, true);
    }
    spans.push(...open.map((o) => o.name));
  }
  return out;
}

/**
 * What's among the rows, or in a Row or a Column, as Elements components. In a Row or Column, markup a marker cuts
 * (see `spanned`) is left out whole, as 0.1.22 left it out, with what's in it (text, markup a component renders
 * there); a Row, Column or block in it is kept, as one beside it is.
 */
function elements(c: Collected, nodes: Node[], place: Place, owner?: React.FC, inMarkup = false): React.ReactNode[] {
  const inColumn = place === "column";
  return (place === "root" || inMarkup ? nodes.map((node) => ({ node, inside: inMarkup })) : spanned(nodes)).flatMap(({ node, inside }): React.ReactNode[] => {
    switch (node.kind) {
      case "failed":
        return leftOut(c, node);
      case "tailwind":
        return elements(c, node.children, place, owner, inside);
      case "boundary": {
        const kept = inColumn && !inside ? keptMarkup(c, node) : undefined;
        if (kept) return [kept];
        // Markup it renders, where it isn't kept, is named after it in the messages that say so.
        const Named = () => null;
        Named.displayName = nameOf(recorded(c, node).element);
        if (inColumn && !inside && !c.told.has(node.at) && node.children.some((n) => n.kind === "raw" && parts(n.html).some((p) => "tag" in p))) {
          c.told.add(node.at);
          console.warn(`Column: <${Named.displayName}> rendered markup that isn't a block, so it's left out. Put HTML in an <Html> block.`);
        }
        return elements(c, node.children, place, Named, inside);
      }
      case "raw":
        // In markup a marker cuts, it's that markup's: a Row says where it starts isn't a Column.
        if (inside) {
          const name = /^<([a-zA-Z][\w:-]*)/.exec(node.html)?.[1];
          return place === "row" && name && !inMarkup ? [React.createElement(owner ?? name)] : [];
        }
        // Text shows as text. Other markup isn't a Column, which a Row says (and leaves it out); in a Column it's left out.
        // In a Column, an <a> is a Paragraph holding it and an <hr> a Divider; other markup is said and left out.
        return parts(node.html).flatMap((p): React.ReactNode[] => {
          if ("text" in p) return [p.text];
          if (!inColumn) return [React.createElement(owner ?? (p.tag === "#" ? "div" : p.tag))];
          const block = asBlock(p);
          // (A component's markup is said where it's left out, above.)
          if (!block && p.tag !== "#" && !owner) sayOnce(`[Unlayer] Column: <${p.tag}> isn't a block, so it's left out. Put HTML in an <Html> block.`);
          return block ? [block] : [];
        });
      default: {
        const out = element(c, node);
        return out ? [out] : [];
      }
    }
  });
}

/** A render of `children` that collects them; `guarded`, a component in them that fails is left out. */
function collected(children: React.ReactNode, guarded = true): Collected {
  const once = (markup: boolean): Collected => {
    const collection: Collection = { nonce: nonce(), recorded: [], ...(markup ? { markup } : {}), ...(idsSeen() ? {} : { blind: true }) };
    const html = within(collection, () => renderToStaticMarkup(<>{guarded ? guard(children, collection) : children}</>, { identifierPrefix: COLLECTING_ID }));
    return { nodes: parse(html, collection), collection, told: new Set() };
  };
  try {
    return once(false);
  } catch (error) {
    // Markup React rejects (`<hr style="…">` with a string style, in a JavaScript template) isn't a component, so no
    // boundary catches it and it ends the render. Once more with markup guarded too: it's left out, with a message,
    // and the rest renders, as in 0.1.22. A template that renders doesn't get here, so nothing else changes.
    if (!guarded) throw error;
    return once(true);
  }
}

/**
 * Whether the React Elements' components call gives them the ids of the render Elements starts (see Sentinel):
 * not where a bundler gave them another copy than react-dom's (Next.js's server layers), where `useId()` throws or
 * gives an outer render's ids.
 */
function idsSeen(): boolean {
  let seen = false;
  const Probe = () => {
    try {
      seen = React.useId().slice(1).startsWith(COLLECTING_ID);
    } catch {
      // another copy: no render it can see
    }
    return null;
  };
  renderToStaticMarkup(<Probe />, { identifierPrefix: COLLECTING_ID });
  return seen;
}

// Shared by every copy of Elements a process loads, as the collecting stack is (collect.ts): no two renders get one nonce.
const RENDERS = Symbol.for("@unlayer/react-elements/renders");

/**
 * A collection's nonce, so markup a template's data holds can't name it: letters, digits and "_", from the count of
 * the process's renders and its high-resolution clock (when it started, and the time since to a fraction of a
 * millisecond), which data written before the render can't know. Not random numbers: a framework that prerenders
 * pages takes `crypto.getRandomValues()` and `Math.random()` for a value that changes the page, and Next.js's Cache
 * Components (its new apps' default) fail the build on one, but the nonce never reaches the output. `performance` is
 * what Next.js leaves for timing, and every runtime Elements supports has it.
 */
function nonce(): string {
  const shared = globalThis as Record<symbol, number>;
  const clock = globalThis.performance;
  return [(shared[RENDERS] = (shared[RENDERS] ?? 0) + 1), (clock?.timeOrigin ?? 0) * 1e3, (clock?.now() ?? 0) * 1e6].map((n) => Math.floor(n).toString(36)).join("_");
}

/** `children` collected, once per render (the HTML, the head and the design ask for the same). */
export const collect = (children: React.ReactNode): Collected =>
  children !== null && typeof children === "object" ? scopeCache(children, () => collected(children)) : collected(children);

/**
 * A root's children as HTML (what Body puts inside it): markup among the rows as it is, and each row or block
 * rendered by Elements with `place` giving it the root's settings.
 */
export function childrenHtml(children: React.ReactNode, place: (child: React.ReactElement) => React.ReactElement, root: Record<string, any>): string {
  const c = collect(children);
  c.root = root;
  return withoutMarkers(markup(c, c.nodes, (child) => within(null, () => renderToString(place(child)))), c.collection.nonce);
}

/** Children (a root's, with its props, or a Row on its own) as Elements components only, for the head and the design. */
export function normalizedChildren(children: React.ReactNode, root?: Record<string, any>): React.ReactNode[] {
  const c = collect(children);
  c.root = root;
  return elements(c, c.nodes, "root");
}

/** What a root's content gives the document's head and the root (a <Font>, from "@unlayer/react-elements/font"). */
const heads = (children: React.ReactNode) => collect(children).collection.recorded.flatMap((r) => (r.kind === "head" ? [r] : []));
export const headTags = (children: React.ReactNode, mode: string) => heads(children).flatMap((r) => r.tags(mode));

/** The props a root's content gives it (a <Font default>'s `fontFamily`), where it sets none of them. */
export function rootDefaults(props: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { root } of heads(props.children)) for (const key in root) if (props[key] === undefined && props.values?.[key] === undefined) out[key] ??= root[key];
  return out;
}

/** `root` with its children as Elements components only (and its classes and default font as props). */
export function normalizedRoot(root: React.ReactElement): React.ReactElement {
  const props = root.props as { className?: string; children?: React.ReactNode };
  const styled = rootProps(props, (root.type as { displayName?: string }).displayName ?? "Body");
  return React.cloneElement(root, { ...styled, ...rootDefaults(styled) }, ...normalizedChildren(props.children, styled));
}
