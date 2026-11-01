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
import { renderToStaticMarkup } from "../utils/server-renderer";
import { withRenderScope } from "../utils/render-scope";
import { nonce } from "../utils/normalize";

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
  return React.createElement(React.Fragment, null, marker(collection, at, "o"), children as React.ReactNode, marker(collection, at, "c"));
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };
const unescape = (text: string) => text.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (entity) => ENTITIES[entity]);

/** Where a node's own keys go: the rest of its JSX props are its semantic props. */
const NODE_KEYS = new Set(["id", "style", "mobile", "hover", "hidden", "compat"]);

export interface JsonNode {
  type: string;
  [key: string]: unknown;
  children: Array<JsonNode | string>;
}

function toJsonNode({ type, props }: Recorded): JsonNode {
  const node: JsonNode = { type, children: [] };
  const semantic: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (NODE_KEYS.has(key)) node[key] = value;
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
        message: `HTML ${where} isn't part of an Elements document: use the primitives (Text, Link, Image, …) instead of ${JSON.stringify(between.slice(0, 60))}`,
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
      const node = toJsonNode(collection.recorded[Number(match[1])]);
      open[open.length - 1].children.push(node);
      open.push({ node, children: node.children });
    } else open.pop();
  }
  text(html.slice(last));
  return top;
}

/** JSX rendered once, read back as JSON nodes, with the custom components it used. */
export function collectNodes(element: React.ReactElement): { nodes: Array<JsonNode | string>; components: CustomDefinition<any>[]; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const collection: PrimitiveCollection = { nonce: nonce(), recorded: [], components: new Map(), clashes: new Set() };
  const html = withRenderScope(() => {
    frames.push(collection);
    try {
      return renderToStaticMarkup(element);
    } finally {
      frames.pop();
    }
  });
  const nodes = read(html, collection, diagnostics).filter((child) => typeof child !== "string" || child.trim());
  for (const type of collection.clashes) {
    diagnostics.push({
      code: "custom/duplicate",
      severity: "error",
      message: `Two different custom components are named ${type}. If component() ran more than once (inside a function or a component, or in a module loaded twice), call it once, at the top of a module; if they're different components, give each its own type`,
      path: "jsx",
    });
  }
  return { nodes, components: [...collection.components.values()], diagnostics };
}

/** A template collected from JSX: its tree (internal: never part of the API), the problems, the custom components it uses. */
export interface CollectedTemplate extends CheckResult {
  components: CustomDefinition<any>[];
}

/** JSX collected into Elements' internal tree and checked, never throwing for what's in it. */
export function collectTemplate(element: React.ReactElement): CollectedTemplate {
  const { nodes: top, components, diagnostics } = collectNodes(element);
  if (top.length !== 1 || typeof top[0] === "string") {
    diagnostics.push({
      code: "jsx/root",
      severity: "error",
      message: top.length ? "A template renders one root (an Email or a Page) and nothing beside it" : "The JSX rendered no Elements root (an Email or a Page)",
      path: "jsx",
    });
    return { document: null, diagnostics, components };
  }
  const result = checkDocument({ root: top[0] }, new Registry(components));
  return { document: result.document, diagnostics: [...diagnostics, ...result.diagnostics], components };
}
