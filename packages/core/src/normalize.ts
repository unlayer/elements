/**
 * Reading the tree a template's JSX was collected into: validated against the
 * component definitions and normalized (values in their canonical form, ids
 * checked).
 */
import type { ComponentDefinition, StyleSpecs } from "./define";
import { Diagnostics, ElementsError, type Diagnostic } from "./diagnostics";
import { type Child, type ElementsDocument, type Json, type Node } from "./model";
import { CUSTOM_TYPE, registryOf, type ComponentsOption, type Registry } from "./registry";

export interface CheckResult {
  /** The document with what could be read, or null when there's no usable root. */
  document: ElementsDocument | null;
  diagnostics: Diagnostic[];
}

const NODE_KEYS = ["id", "type", "props", "style", "mobile", "hover", "hidden", "children"];
/** An id is written into HTML ids and CSS selectors. */
const ID = /^[A-Za-z][A-Za-z0-9_-]*$/;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

interface Context {
  d: Diagnostics;
  registry: Registry;
  /**
   * Inside a custom component's expansion (see expand.ts): the instance's id, put before the ids its
   * render writes, or null when the instance has none (those ids are then dropped: a block used many
   * times can't own an id). Undefined outside one.
   */
  idPrefix?: string | null;
  /** Ids taken so far: an id is unique in a template. */
  used: Set<string>;
  responsive: boolean;
}

/** Validates and normalizes a document; never throws. */
export function checkDocument(input: unknown, options?: ComponentsOption | Registry): CheckResult {
  const registry = registryOf(options);
  const d = new Diagnostics();
  if (!isObject(input)) {
    d.error("document/invalid", "A document is an object: { root: { type: \"Email\", … } }", "");
    return { document: null, diagnostics: d.list };
  }
  const extra = Object.keys(input).filter((key) => key !== "root");
  for (const key of extra) d.error("document/unknown-key", `"${key}" isn't part of a document (root)`, key);

  const rootDefinition = isObject(input.root) && typeof input.root.type === "string" ? registry.get(input.root.type) : undefined;
  const context: Context = { d, registry, used: new Set(), responsive: !!rootDefinition?.responsive };
  const root = input.root === undefined ? null : readNode(input.root, "root", null, context);
  if (input.root === undefined) d.error("document/root", 'A document has a root: { type: "Email" }, "Page", …', "root");
  return { document: root ? { root } : null, diagnostics: d.list };
}

/** Validates and normalizes a document, throwing an `ElementsError` if it has errors. */
export function parseDocument(input: unknown, options?: ComponentsOption | Registry): ElementsDocument {
  const { document, diagnostics } = checkDocument(input, options);
  if (!document || diagnostics.some((x) => x.severity === "error")) throw new ElementsError(diagnostics);
  return document;
}

/**
 * One node read as the child of `parent` would be: what a custom component
 * expands to. Ids its render writes go after the instance's id (`idPrefix`),
 * and mustn't take one of `taken`.
 */
export function checkFragment(
  input: unknown,
  options: { parent: ComponentDefinition; responsive: boolean; idPrefix: string | null; taken: ReadonlySet<string>; registry: Registry; path: string }
): { node: Node | null; diagnostics: Diagnostic[] } {
  const d = new Diagnostics();
  const context: Context = { d, registry: options.registry, idPrefix: options.idPrefix, used: new Set(options.taken), responsive: options.responsive };
  const node = readNode(input, options.path, options.parent, context);
  return { node, diagnostics: d.list };
}

function allowedIn(parent: ComponentDefinition, child: ComponentDefinition): boolean {
  const rule = parent.children;
  return !!rule.types?.includes(child.type) || child.categories.some((category) => rule.categories?.includes(category));
}

/** Where each component's props and styles are listed: the guide the package ships. */
const GUIDE = "@unlayer/react-elements/PRIMITIVES.md";
/** A message, then where to look the component up. */
const seeing = (message: string, type: string) => `${message}${/[?.]$/.test(message) ? "" : "."} See ${type} in ${GUIDE}`;
const a = (type: string) => `${/^[AEIOU]/.test(type) ? "An" : "A"} ${type}`;

/** The name meant, where one is a typo away (a letter or two, or its case): "colour" is "color". */
function nearest(key: string, names: readonly string[]): string | undefined {
  const lower = key.toLowerCase();
  let best: { name: string; distance: number } | undefined;
  for (const name of names) {
    const distance = name.toLowerCase() === lower ? 0 : editDistance(lower, name.toLowerCase());
    if (distance <= (key.length > 4 ? 2 : 1) && (!best || distance < best.distance)) best = { name, distance };
  }
  return best?.name;
}

function editDistance(from: string, to: string): number {
  let row = Array.from({ length: to.length + 1 }, (_, i) => i);
  for (let i = 1; i <= from.length; i++) {
    const next = [i];
    for (let j = 1; j <= to.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (from[i - 1] === to[j - 1] ? 0 : 1));
    row = next;
  }
  return row[to.length];
}

/** What's wrong with a prop the component doesn't have, and what to write instead. */
function unknownProp(definition: ComponentDefinition, key: string): string {
  if (Object.prototype.hasOwnProperty.call(definition.style, key)) return `${a(definition.type)} has no prop "${key}": it's a style, style={{ ${key}: … }}`;
  const known = Object.keys(definition.props);
  const meant = nearest(key, known);
  return seeing(`${a(definition.type)} has no prop "${key}"${meant ? `: did you mean "${meant}"?` : known.length ? ` (it has ${known.join(", ")})` : ""}`, definition.type);
}

function placementMessage(parent: ComponentDefinition, child: ComponentDefinition): string {
  if (child.categories.includes("section")) return `A ${child.type} goes directly in an Email or Page, not in a ${parent.type}`;
  if (child.categories.includes("root")) return `A ${child.type} is a root: it can't be inside a ${parent.type}`;
  const takes = [...(parent.children.text ? ["text"] : []), ...(parent.children.categories ?? []).map((c) => `${c} components`), ...(parent.children.types ?? [])];
  return takes.length ? seeing(`A ${parent.type} takes ${takes.join(", ")}; a ${child.type} can't go in it`, parent.type) : `A ${parent.type} has no children`;
}

function readNode(input: unknown, path: string, parent: ComponentDefinition | null, context: Context): Node | null {
  const { d } = context;
  if (!isObject(input)) {
    d.error("node/invalid", `Expected a component ({ "type": … }), not ${JSON.stringify(input) ?? String(input)}`, path);
    return null;
  }
  if (typeof input.type !== "string") {
    d.error("node/type", 'A component has a "type" ("Row", "Heading", …)', `${path}.type`);
    return null;
  }
  const definition = context.registry.get(input.type);
  if (!definition) {
    const custom = CUSTOM_TYPE.test(input.type);
    d.error(
      "node/unknown-type",
      custom ? `"${input.type}" is a custom component this document wasn't given: pass it in the components option` : `"${input.type}" isn't a component Elements knows`,
      `${path}.type`
    );
    return null;
  }
  if (!parent && !definition.categories.includes("root")) {
    d.error("root/invalid", `A document's root is an Email or Page, not a ${definition.type}`, `${path}.type`);
    return null;
  }
  if (parent && !allowedIn(parent, definition)) {
    d.error("children/not-allowed", placementMessage(parent, definition), path);
    return null;
  }

  // Only what the author writes: an id is theirs (an anchor, a reference), never generated.
  let id: string | undefined;
  if (input.id !== undefined) {
    if (typeof input.id !== "string" || !ID.test(input.id)) {
      d.error("id/invalid", `An id starts with a letter and holds letters, digits, "_" and "-", not ${JSON.stringify(input.id)}`, `${path}.id`);
    } else if (context.idPrefix === null) {
      d.add("id/dropped", "info", `The id "${input.id}" is left out: inside a custom component, ids are kept only when the component is given one (a block used many times can't own an id)`, `${path}.id`);
    } else {
      const full = context.idPrefix ? `${context.idPrefix}-${input.id}` : input.id;
      if (context.used.has(full)) d.error("id/duplicate", `The id "${full}" is already used by another component`, `${path}.id`);
      else {
        id = full;
        context.used.add(full);
      }
    }
  }

  for (const key of Object.keys(input)) {
    if (!NODE_KEYS.includes(key)) d.error("node/unknown-key", `"${key}" isn't part of a component (${NODE_KEYS.join(", ")})`, `${path}.${key}`, id);
  }

  const node: Node = id === undefined ? { type: definition.type } : { id, type: definition.type };

  const props = readProps(input.props, definition, `${path}.props`, id, d);
  if (props) node.props = props;

  const style = readStyles(input.style, definition, definition.style, `${path}.style`, id, d, "style", () => true);
  if (style) node.style = style;

  if (input.mobile !== undefined) {
    if (!context.responsive) d.error("mobile/not-supported", "Phone styles are for an Email or a Page, which have a phone width", `${path}.mobile`, id);
    else {
      const mobile = readStyles(input.mobile, definition, definition.style, `${path}.mobile`, id, d, "mobile", (spec) => !!spec.mobile);
      if (mobile) node.mobile = mobile;
    }
  }

  if (input.hover !== undefined) {
    const allowed = new Set<string>(definition.hover ?? []);
    const hover = readStyles(input.hover, definition, definition.style, `${path}.hover`, id, d, "hover", (_, key) => allowed.has(key));
    if (hover) node.hover = hover;
  }

  if (input.hidden !== undefined) {
    const hidden = readHidden(input.hidden, `${path}.hidden`, id, context);
    if (hidden) node.hidden = hidden;
  }

  const children = readChildren(input.children, definition, `${path}.children`, id, context);
  if (children.length) node.children = children;
  return node;
}

function readProps(input: unknown, definition: ComponentDefinition, path: string, id: string | undefined, d: Diagnostics): Record<string, Json> | undefined {
  const out: Record<string, Json> = {};
  if (input !== undefined && !isObject(input)) {
    d.error("props/invalid", "props is an object", path, id);
    input = undefined;
  }
  for (const [key, value] of Object.entries((input as Record<string, unknown> | undefined) ?? {})) {
    if (value === undefined) continue;
    const spec = Object.prototype.hasOwnProperty.call(definition.props, key) ? definition.props[key] : undefined;
    if (!spec) {
      d.error("prop/unknown", unknownProp(definition, key), `${path}.${key}`, id);
      continue;
    }
    const parsed = spec.kind.parse(value);
    if (parsed.ok) out[key] = parsed.value;
    else d.error("prop/invalid", `${key}: ${parsed.message}`, `${path}.${key}`, id);
  }
  for (const [key, spec] of Object.entries(definition.props)) {
    if (spec.required && !(key in out) && !(isObject(input) && input[key] !== undefined)) {
      d.error("prop/required", `A ${definition.type} needs "${key}" (${spec.kind.accepts})`, `${path}.${key}`, id);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const UNSUPPORTED_CSS: Record<string, string> = {
  margin: "use the parent's gap for space between siblings, or padding for space inside",
  marginTop: "use the parent's gap, or padding",
  marginBottom: "use the parent's gap, or padding",
  marginLeft: "use padding",
  marginRight: "use padding",
  display: "the component sets it",
  position: "use a Layer for content placed over other content",
  float: "use a Row to put things side by side",
  // Names Elements used before it took CSS's.
  align: "it's alignItems now",
  justify: 'it\'s justifyContent now ("between" is "space-between")',
  wrap: "a Row stays side by side on phones with its stackOnMobile prop set to false; flexWrap wraps it on the web",
  color: "a Divider's line is its borderTop, with its color",
  thickness: 'a Divider\'s line is borderTop now: "1px solid #bbbbbb"',
  lineStyle: 'a Divider\'s line is borderTop now: "1px solid #bbbbbb"',
};

/** What to write instead of a style a component doesn't take, after a colon; or nothing. */
function styleHint(definition: ComponentDefinition, specs: StyleSpecs, key: string): string {
  if (Object.prototype.hasOwnProperty.call(definition.props, key)) return `: it's a prop, ${key}={…}`;
  if (key === "padding" && definition.categories.includes("root")) return ": a root has no padding; put it on a Column (a card) or a Section (a band) inside it";
  if (UNSUPPORTED_CSS[key]) return `: ${UNSUPPORTED_CSS[key]}`;
  const meant = nearest(key, Object.keys(specs));
  return meant ? `: did you mean "${meant}"?` : "";
}

function readStyles(
  input: unknown,
  definition: ComponentDefinition,
  specs: StyleSpecs,
  path: string,
  id: string | undefined,
  d: Diagnostics,
  what: "style" | "mobile" | "hover",
  allowed: (spec: StyleSpecs[string], key: string) => boolean
): Record<string, Json> | undefined {
  if (input === undefined) return undefined;
  if (!isObject(input)) {
    d.error(`${what}/invalid`, `${what} is an object of style properties`, path, id);
    return undefined;
  }
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const spec = Object.prototype.hasOwnProperty.call(specs, key) ? specs[key] : undefined;
    if (!spec) {
      d.error("style/unknown", seeing(`"${key}" isn't a style ${a(definition.type).replace(/^A/, "a")} takes${styleHint(definition, specs, key)}`, definition.type), `${path}.${key}`, id);
      continue;
    }
    if (!allowed(spec, key)) {
      d.error(`${what}/not-allowed`, what === "mobile" ? `"${key}" can't be set for phones` : `"${key}" can't be set for hover`, `${path}.${key}`, id);
      continue;
    }
    const parsed = spec.kind.parse(value);
    if (parsed.ok) out[key] = parsed.value;
    else d.error(`${what}/invalid`, `${key}: ${parsed.message}`, `${path}.${key}`, id);
  }
  return Object.keys(out).length ? out : undefined;
}

function readHidden(input: unknown, path: string, id: string | undefined, context: Context): Node["hidden"] | undefined {
  const { d } = context;
  if (!context.responsive) {
    d.error("hidden/not-supported", "Hiding on phones or desktops is for an Email or a Page", path, id);
    return undefined;
  }
  if (!isObject(input) || Object.entries(input).some(([key, value]) => (key !== "mobile" && key !== "desktop") || (value !== undefined && typeof value !== "boolean"))) {
    d.error("hidden/invalid", "hidden is { mobile?: boolean, desktop?: boolean }", path, id);
    return undefined;
  }
  const out: { mobile?: boolean; desktop?: boolean } = {};
  if (input.mobile === true) out.mobile = true;
  if (input.desktop === true) out.desktop = true;
  if (out.mobile && out.desktop) d.warning("hidden/everywhere", "Hidden on phones and on desktops, it never shows", path, id);
  return Object.keys(out).length ? out : undefined;
}

function readChildren(input: unknown, definition: ComponentDefinition, path: string, id: string | undefined, context: Context): Child[] {
  const { d } = context;
  if (input === undefined) return [];
  if (!Array.isArray(input)) {
    d.error("children/invalid", "children is an array of components and text", path, id);
    return [];
  }
  const out: Child[] = [];
  input.forEach((child, index) => {
    const at = `${path}[${index}]`;
    if (typeof child === "string") {
      if (!child) return;
      if (definition.children.text) {
        const last = out[out.length - 1];
        if (typeof last === "string") out[out.length - 1] = last + child;
        else out.push(child);
      } else if (child.trim()) {
        d.error("children/text-not-allowed", `Text can't go straight in a ${definition.type}: put it in a Paragraph or Heading`, at, id);
      }
      return;
    }
    const node = readNode(child, at, definition, context);
    if (!node) return;
    // A Document's header and footer are drawn on every page: it has one of each, and a second would replace the first.
    if (definition.type === "Document" && (node.type === "PageHeader" || node.type === "PageFooter") && out.some((other) => typeof other !== "string" && other.type === node.type)) {
      d.error("children/one-only", `A Document has one ${node.type}, drawn on every page: this is a second (put what both hold in one)`, at, node.id);
    }
    out.push(node);
  });
  return out;
}
