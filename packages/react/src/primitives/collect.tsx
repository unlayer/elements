/**
 * JSX → Elements document. One React render: each primitive records its props
 * and renders markers around its children, and React renders everything else
 * (the user's components, hooks, Context, Fragments, arrays), so the document
 * holds what React would show. The markers and the text between them are then
 * read back into nodes, and the result is checked like any JSON document.
 *
 * A stack shared by every copy of Elements in a process, not React context:
 * Server Components have no context.
 */
import React from "react";
import { checkDocument, Registry, type CheckResult, type CustomDefinition, type Diagnostic } from "@unlayer-internal/elements-core";
import { renderToString } from "../utils/server-renderer";
import { withRenderScope } from "../utils/render-scope";
import { nonce } from "../utils/normalize";
import { isAsyncComponent } from "../utils/unwrap-root";

interface Recorded {
  type: string;
  props: Record<string, unknown>;
}

interface PrimitiveCollection {
  nonce: string;
  recorded: Recorded[];
  /** The custom components the JSX used. */
  components: Map<string, CustomDefinition<any>>;
  /** Types two different custom components were both made with. */
  clashes: Set<string>;
  /** An async component was left out (not called: React would drop the promise it returns, unhandled). */
  async?: boolean;
}

const SHARED = Symbol.for("@unlayer/react-elements/primitives/collecting");
const frames = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as PrimitiveCollection[];

export function collectingPrimitives(): PrimitiveCollection | undefined {
  return frames[frames.length - 1];
}

const MARK = "elements-node";

function marker(collection: PrimitiveCollection, at: number, edge: "o" | "c"): React.ReactElement {
  return React.createElement(MARK, { key: `${at}${edge}`, "data-n": collection.nonce, "data-i": at, "data-e": edge });
}

/** A custom component the JSX being collected uses. */
export function registerUsed(collection: PrimitiveCollection, definition: CustomDefinition<any>): void {
  const known = collection.components.get(definition.type);
  // (A frame made by an older copy of Elements has no clashes.)
  if (known && known !== definition) (collection.clashes ??= new Set()).add(definition.type);
  else collection.components.set(definition.type, definition);
}

/** What a primitive renders while JSX is collected: its props recorded, markers around its children. */
export function recordPrimitive(collection: PrimitiveCollection, type: string, props: Record<string, unknown>): React.ReactElement {
  const { children, ...rest } = props;
  const at = collection.recorded.push({ type, props: rest }) - 1;
  return React.createElement(React.Fragment, null, marker(collection, at, "o"), withoutAsync(children as React.ReactNode, collection), marker(collection, at, "c"));
}

const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");

/**
 * React's own wrappers, which render their children as they are: Fragment, Suspense, StrictMode, Profiler, a
 * context's provider (a consumer's child is a function, called with the value).
 */
function wraps(element: React.ReactElement): boolean {
  const type = element.type as unknown;
  if (typeof (element.props as { children?: unknown }).children === "function") return false;
  const kind = (type as { $$typeof?: symbol } | null)?.$$typeof;
  return typeof type === "symbol" || kind === PROVIDER || kind === CONTEXT;
}

const childrenOf = (element: React.ReactElement) => (element.props as { children?: React.ReactNode }).children;

/** Whether children hold an async component, directly or in React's own wrappers. */
function holdsAsync(children: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(children, (child) => {
    if (!found && React.isValidElement(child)) found = isAsyncComponent(child.type) || (wraps(child) && holdsAsync(childrenOf(child)));
  });
  return found;
}

/**
 * A primitive's children with the async components among them (in React's own wrappers too) left out, and
 * noted: React would call them and drop the promise they return, whose rejection would then go unhandled.
 * Children without one stay as they are (rebuilt, they'd move useId's ids). One inside a component of the
 * user's own is called by React, and reported as React fails on it.
 */
function withoutAsync(children: React.ReactNode, collection: PrimitiveCollection): React.ReactNode {
  if (!holdsAsync(children)) return children;
  collection.async = true;
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (isAsyncComponent(child.type)) return null;
    return wraps(child) ? React.cloneElement(child, undefined, withoutAsync(childrenOf(child), collection)) : child;
  });
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };
const unescape = (text: string) => text.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (entity) => ENTITIES[entity]);

/** Where a node's own keys go: the rest of its JSX props are its semantic props. */
const NODE_KEYS = new Set(["id", "style", "mobile", "hover", "hidden"]);

export interface JsonNode {
  type: string;
  [key: string]: unknown;
  children: Array<JsonNode | string>;
}

function toJsonNode({ type, props }: Recorded, diagnostics: Diagnostic[]): JsonNode {
  const node: JsonNode = { type, children: [] };
  const semantic: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    // What today's components give the writers, as they lower into the tree. It holds markup: a template has no say in it.
    if (key === "compat") diagnostics.push({ code: "jsx/compat", severity: "warning", message: `A <${type}>'s compat isn't a prop of a template: it's left out`, path: "jsx" });
    else if (NODE_KEYS.has(key)) node[key] = value;
    else semantic[key] = value;
  }
  if (Object.keys(semantic).length) node.props = semantic;
  return node;
}

/** The markers and text of a collected render, as JSON nodes; markup that isn't a primitive is reported. */
function read(html: string, collection: PrimitiveCollection, diagnostics: Diagnostic[]): Array<JsonNode | string> {
  const pattern = new RegExp(`<${MARK} data-n="${collection.nonce}" data-i="(\\d+)" data-e="([oc])"></${MARK}>`, "g");
  const top: Array<JsonNode | string> = [];
  const open: Array<{ node: JsonNode | null; children: Array<JsonNode | string> }> = [{ node: null, children: top }];
  let last = 0;
  const text = (between: string) => {
    if (!between) return;
    const into = open[open.length - 1];
    if (/<[a-zA-Z!/]/.test(between)) {
      const where = into.node ? `in a ${into.node.type}` : "around the root";
      diagnostics.push({
        code: "jsx/markup",
        severity: "error",
        message: `HTML ${where} isn't part of an Elements document: use the primitives (Text, Link, Image, …) instead of ${JSON.stringify(between.slice(0, 60))}. Every component: @unlayer/react-elements/PRIMITIVES.md`,
        path: "jsx",
      });
      return;
    }
    into.children.push(unescape(between));
  };
  for (const match of html.matchAll(pattern)) {
    text(html.slice(last, match.index));
    last = match.index! + match[0].length;
    if (match[2] === "o") {
      const node = toJsonNode(collection.recorded[Number(match[1])], diagnostics);
      open[open.length - 1].children.push(node);
      open.push({ node, children: node.children });
    } else open.pop();
  }
  text(html.slice(last));
  return top;
}

/**
 * React's own comments in renderToString's output (between text nodes, around Suspense and Activity boundaries).
 * The template's content never holds one: React escapes text and attributes.
 */
const COMMENTS = /<!--[\s\S]*?-->/g;
/** What React throws for an async component, or one that suspends outside a <Suspense> (its own words, or its production code's). */
const ASYNC_ERROR =
  /^(?:Objects are not valid as a React child \(found: \[object Promise\]\)|A component suspended while responding to synchronous input|Minified React error #426\b|Minified React error #31\b.*%5Bobject%20Promise%5D)/;
const ASYNC_MESSAGE =
  "A component is async or suspends (an async function, React.lazy, use()): render() doesn't wait for it yet. Load its data first and pass it in as props";
/** Why React didn't finish a Suspense boundary, when it says (development builds): it was waiting for something. */
const SUSPENDED = /does not support Suspense|did not finish this Suspense boundary/;

/**
 * The Suspense boundaries React didn't finish (`<!--$!-->` … `<!--/$-->`, its fallback in place of the content)
 * taken out, with the reason React gives for each in development (`<template data-msg>`), else "".
 */
function unfinished(html: string): { html: string; reasons: string[] } {
  const reasons: string[] = [];
  let [out, at] = ["", 0];
  for (let start = html.indexOf("<!--$!-->"); start >= 0; start = html.indexOf("<!--$!-->", at)) {
    out += html.slice(at, start);
    reasons.push(unescape(/^<!--\$!--><template[^>]*?\bdata-msg="([^"]*)"/.exec(html.slice(start))?.[1] ?? ""));
    // To the boundary's own end: boundaries can nest.
    const marks = /<!--(\$[!?]?|\/\$)-->/g;
    marks.lastIndex = start;
    let depth = 0;
    for (let mark = marks.exec(html); mark; mark = marks.exec(html)) {
      depth += mark[1] === "/$" ? -1 : 1;
      if (depth === 0) break;
    }
    at = depth === 0 ? marks.lastIndex : html.length;
  }
  return { html: out + html.slice(at), reasons };
}

/** A boundary that didn't finish: something in it was async or suspended, or threw (React says which in development). */
function unfinishedDiagnostic(reason: string): Diagnostic {
  const said = reason.replace(/^Switched to client rendering because the server rendering errored:\s*/, "");
  // (What React threw there can be its own words for an async component inside a component of the user's.)
  const thrown = reason && !SUSPENDED.test(reason) && !ASYNC_ERROR.test(said) ? said : "";
  if (thrown) return { code: "jsx/error", severity: "error", message: `A component inside <Suspense> threw: ${thrown}`, path: "jsx" };
  const message = reason ? ASYNC_MESSAGE : `${ASYNC_MESSAGE}. (With React's production build, a component that threw inside <Suspense> looks the same: check it too.)`;
  return { code: "jsx/async", severity: "error", message, path: "jsx" };
}

/** JSX rendered once, read back as JSON nodes, with the custom components it used. */
export function collectNodes(element: React.ReactElement): {
  nodes: Array<JsonNode | string>;
  components: CustomDefinition<any>[];
  diagnostics: Diagnostic[];
  /** Nothing was collected, for a reason already said: React couldn't render it, or all of it suspended. */
  aborted?: boolean;
} {
  const diagnostics: Diagnostic[] = [];
  const collection: PrimitiveCollection = { nonce: nonce(), recorded: [], components: new Map(), clashes: new Set() };
  let html: string;
  try {
    html = withRenderScope(() => {
      frames.push(collection);
      try {
        return renderToString(element);
      } finally {
        frames.pop();
      }
    });
  } catch (error) {
    // An async component's promise isn't a child React can render; React 18 and 19 say so in their own words.
    if (!ASYNC_ERROR.test(String((error as Error | undefined)?.message))) throw error;
    diagnostics.push({ code: "jsx/async", severity: "error", message: ASYNC_MESSAGE, path: "jsx" });
    return { nodes: [], components: [...collection.components.values()], diagnostics, aborted: true };
  }
  if (collection.async) diagnostics.push({ code: "jsx/async", severity: "error", message: ASYNC_MESSAGE, path: "jsx" });
  // A Suspense boundary that didn't finish: React wrote its fallback in place of the content. Neither is read.
  const done = unfinished(html);
  for (const reason of done.reasons) {
    const diagnostic = unfinishedDiagnostic(reason);
    // The same problem in several places is said once.
    if (!diagnostics.some((d) => d.code === diagnostic.code && d.message === diagnostic.message)) diagnostics.push(diagnostic);
  }
  const nodes = read(done.html.replace(COMMENTS, ""), collection, diagnostics).filter((child) => typeof child !== "string" || child.trim());
  for (const type of collection.clashes) {
    diagnostics.push({
      code: "custom/duplicate",
      severity: "error",
      message: `Two different custom components are named ${type}. If component() ran more than once (inside a function or a component, or in a module loaded twice), call it once, at the top of a module; if they're different components, give each its own type`,
      path: "jsx",
    });
  }
  // All of it was in a boundary that didn't finish: that says why there's no root.
  return { nodes, components: [...collection.components.values()], diagnostics, aborted: nodes.length === 0 && done.reasons.length > 0 };
}

/** A template collected from JSX: its tree (internal: never part of the API), the problems, the custom components it uses. */
export interface CollectedTemplate extends CheckResult {
  components: CustomDefinition<any>[];
}

/** JSX collected into Elements' internal tree and checked, never throwing for what's in it. */
export function collectTemplate(element: React.ReactElement): CollectedTemplate {
  const { nodes: top, components, diagnostics, aborted } = collectNodes(element);
  if (top.length !== 1 || typeof top[0] === "string") {
    // (A render React couldn't do has already said why nothing was collected.)
    if (!aborted) {
      diagnostics.push({
        code: "jsx/root",
        severity: "error",
        message: top.length ? "A template renders one root (an Email or a Page) and nothing beside it" : "The JSX rendered no Elements root (an Email or a Page)",
        path: "jsx",
      });
    }
    return { document: null, diagnostics, components };
  }
  const result = checkDocument({ root: top[0] }, new Registry(components));
  return { document: result.document, diagnostics: [...diagnostics, ...result.diagnostics], components };
}
