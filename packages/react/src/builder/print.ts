/**
 * A template's tree as JSX source in the new components, and as an element to render: what fromDesign() gives back.
 * Text runs are written on one line (JSX keeps spaces there); blocks one under another.
 */
import type { Child, Node } from "@unlayer-internal/elements-core";
import React from "react";
import * as primitives from "../primitives/components";

const PRIMITIVE = primitives.PRIMITIVE;

/** Each primitive's component, by its type. */
const COMPONENTS = new Map<string, React.ComponentType<any>>();
for (const value of Object.values(primitives)) {
  const type = typeof value === "function" ? (value as unknown as Record<symbol, string>)[PRIMITIVE] : undefined;
  if (type) COMPONENTS.set(type, value as React.ComponentType<any>);
}
COMPONENTS.set("DocumentPage", primitives.Document.Page);

/** The JSX name of a type. */
const tagName = (type: string) => (type === "DocumentPage" ? "Document.Page" : type);

/** The props of a node as its component takes them. */
function propsOf(node: Node): Record<string, unknown> {
  return {
    ...(node.id !== undefined ? { id: node.id } : {}),
    ...node.props,
    ...(node.style && Object.keys(node.style).length ? { style: node.style } : {}),
    ...(node.mobile ? { mobile: node.mobile } : {}),
    ...(node.hover ? { hover: node.hover } : {}),
    ...(node.hidden ? { hidden: node.hidden } : {}),
  };
}

/** The tree as an element. A component of the template's own needs passing in `components`, by its name. */
export function toElement(node: Node, components: Record<string, React.ComponentType<any>> = {}, key?: number): React.ReactElement {
  const component = COMPONENTS.get(node.type) ?? components[node.type];
  if (!component) throw new Error(`[Elements] fromDesign: <${node.type}> is a component of the template's own: pass it in the components option`);
  const children = (node.children ?? []).map((child, i) => (typeof child === "string" ? child : toElement(child, components, i)));
  return React.createElement(component, { ...propsOf(node), key }, ...children);
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
/** A prop's name JSX can hold as one (`aria-label` too); a design could hold any other text where one goes. */
const PROP_NAME = /^[A-Za-z_$][\w$]*(?:-[\w$]+)*$/;
/** A component's name as JSX writes it: a built-in's, or a custom component's (`acme.ProductCard`). */
const TYPE_NAME = /^(?:[A-Z][\w$]*|[a-z][a-z0-9-]*\.[A-Z][\w$]*)$/;

/** A value as JavaScript source: objects with bare keys where they can be. */
/** Keys of `value` exactly `keys`, each a number (`top`, `right`, …). */
const shaped = (value: object, keys: string[], test: (v: unknown) => boolean) => {
  const own = Object.keys(value);
  return own.length === keys.length && keys.every((key) => own.includes(key) && test((value as Record<string, unknown>)[key]));
};
const SIDES = ["top", "right", "bottom", "left"];
const LINE = ["width", "style", "color"];
const isLine = (v: unknown) => !!v && typeof v === "object" && shaped(v as object, LINE, (x) => typeof x === "number" || typeof x === "string");
/** A line as CSS says one ("1px solid #ccc"), where its color holds no space. */
const cssLine = (v: { width: number; style: string; color: string }) => (/\s/.test(v.color) ? undefined : `${v.width}px ${v.style} ${v.color}`);

/**
 * A value as the template would write it: sides as a number (all the same) or `[top, right, bottom, left]`, a line
 * as "1px solid #ccc", a border of four equal lines as one.
 */
function compact(value: object): unknown {
  if (shaped(value, SIDES, (v) => typeof v === "number")) {
    const s = value as Record<string, number>;
    return s.top === s.right && s.right === s.bottom && s.bottom === s.left ? s.top : [s.top, s.right, s.bottom, s.left];
  }
  if (isLine(value)) return cssLine(value as never) ?? value;
  const sides = Object.keys(value);
  if (sides.length && sides.every((side) => SIDES.includes(side) && isLine((value as Record<string, unknown>)[side]))) {
    const lines = Object.values(value).map((line) => cssLine(line as never));
    if (lines.every((line) => line !== undefined)) return sides.length === 4 && new Set(lines).size === 1 ? lines[0] : Object.fromEntries(sides.map((side, i) => [side, lines[i]]));
  }
  return value;
}

function js(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(js).join(", ")}]`;
  if (value && typeof value === "object") {
    const short = compact(value);
    if (short !== value) return js(short);
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return entries.length ? `{ ${entries.map(([k, v]) => `${IDENTIFIER.test(k) ? k : JSON.stringify(k)}: ${js(v)}`).join(", ")} }` : "{}";
  }
  return JSON.stringify(value);
}

function attribute(name: string, value: unknown): string {
  if (value === true) return name;
  if (typeof value === "string" && /^[^"&\n\\{}]*$/.test(value)) return `${name}="${value}"`;
  return `${name}={${js(value)}}`;
}

/**
 * Text as JSX children: as it is where JSX keeps it so, else a string expression (spaces at its ends, which JSX can
 * drop; braces, angle brackets, line breaks).
 */
function text(value: string, flat: boolean): string {
  const kept = /^[^{}<>&\n\u2028\u2029]+$/.test(value) && !/^\s|\s$/.test(value) && (flat || !/\s{2,}/.test(value));
  return kept ? value : `{${JSON.stringify(value)}}`;
}

/** Whether a node holds a run of text (written on one line). */
const inline = (node: Node) => (node.children ?? []).some((child) => typeof child === "string" || ["Span", "Link", "LineBreak", "MergeTag", "PageNumber"].includes(child.type));

/**
 * A node as JSX. A name the design holds that isn't one JSX can write (a prop's, a component's) is left out and
 * said, never written as code: the design's data stays data.
 */
function element(node: Node, indent: string, flat: boolean, path: string, report: string[]): string {
  if (!TYPE_NAME.test(node.type)) {
    report.push(`${path}: ${JSON.stringify(node.type)} isn't a component's name: it's left out of the code`);
    return flat ? "" : "{/* left out: not a component's name */}";
  }
  const name = tagName(node.type);
  const attributes = Object.entries(propsOf(node))
    .filter(([key]) => PROP_NAME.test(key) || (report.push(`${path}: a prop named ${JSON.stringify(key)} isn't one JSX can write: it's left out of the code`), false))
    .map(([key, value]) => ` ${attribute(key, value)}`)
    .join("");
  const children: Child[] = node.children ?? [];
  const child = (c: Child, i: number, inner: string, oneLine: boolean) => (typeof c === "string" ? text(c, oneLine) : element(c, inner, oneLine, `${path}.children[${i}]`, report));
  if (!children.length) return `<${name}${attributes} />`;
  if (flat || inline(node)) return `<${name}${attributes}>${children.map((c, i) => child(c, i, indent, true)).join("")}</${name}>`;
  const inner = `${indent}  `;
  return `<${name}${attributes}>\n${children.map((c, i) => `${inner}${child(c, i, inner, false)}`).join("\n")}\n${indent}</${name}>`;
}

/** The tree as a module: the components it uses imported, a component returning it. What it leaves out goes in `report`. */
export function printTemplate(root: Node, name = "Template", report: string[] = []): string {
  if (!IDENTIFIER.test(name)) {
    report.push(`the component's name ${JSON.stringify(name)} isn't one JavaScript can write: it's named Template`);
    name = "Template";
  }
  const used = new Set<string>();
  const own = new Set<string>();
  const visit = (node: Node) => {
    const base = node.type === "DocumentPage" ? "Document" : node.type;
    if (TYPE_NAME.test(node.type)) (COMPONENTS.has(node.type) ? used : own).add(base);
    for (const child of node.children ?? []) if (typeof child !== "string") visit(child);
  };
  visit(root);
  const imports = [`import { ${[...used].sort().join(", ")} } from "@unlayer/react-elements/primitives";`];
  if (own.size) imports.push(`// The template's own components: ${[...own].sort().join(", ")} (import them from where they're defined).`);
  return `${imports.join("\n")}\n\nexport default function ${name}() {\n  return (\n    ${element(root, "    ", false, "root", report)}\n  );\n}\n`;
}
