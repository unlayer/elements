/**
 * MJML's attribute cascade, resolved before mapping, as mjml-core resolves it: a component's own defaults, then
 * `mj-all`, then `mj-attributes` for its tag, its `mj-class`es (in order, `css-class` values joined), the defaults an
 * ancestor's `mj-class` sets for its tag, then its own attributes. The defaults are read from the installed MJML.
 */

import { decodeHtmlEntities } from "@unlayer/convert-core";
import { mjmlRuntime } from "./runtime";
import type { MjmlNode } from "./types";

/** A body node with its attributes resolved. */
export interface Resolved {
  tag: string;
  /** Every attribute it renders with. */
  attrs: Record<string, string>;
  /** The attributes the template sets for it (not MJML's defaults): inline, `mj-attributes`, `mj-class`, `mj-all`. */
  given: Set<string>;
  children: Resolved[];
  content: string;
  /** The JSON node, to compile it on its own. */
  node: MjmlNode;
}

/** What `mj-attributes` set, merged in order across the head's blocks. */
export interface HeadAttributes {
  defaults: Record<string, Record<string, string>>;
  classes: Record<string, Record<string, string>>;
  classDefaults: Record<string, Record<string, Record<string, string>>>;
}

const text = (value: unknown): string => (value === undefined || value === null ? "" : String(value));

/**
 * Attribute values as they read: MJML writes them into its HTML as they're written (`&amp;` in a link), where the
 * browser decodes them; the design holds the value itself (Elements escapes it again).
 */
function strings(attributes: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes ?? {})) if (value !== undefined && value !== null) out[key] = decodeHtmlEntities(text(value));
  return out;
}

export function headAttributes(head: MjmlNode | undefined): HeadAttributes {
  const out: HeadAttributes = { defaults: {}, classes: {}, classDefaults: {} };
  for (const block of head?.children ?? []) {
    if (block.tagName !== "mj-attributes") continue;
    for (const child of block.children ?? []) {
      const attributes = strings(child.attributes);
      if (child.tagName === "mj-class") {
        const { name = "", ...rest } = attributes;
        out.classes[name] = { ...out.classes[name], ...rest };
        const byTag: Record<string, Record<string, string>> = {};
        for (const inner of child.children ?? []) byTag[inner.tagName] = strings(inner.attributes);
        out.classDefaults[name] = { ...out.classDefaults[name], ...byTag };
      } else {
        out.defaults[child.tagName] = { ...out.defaults[child.tagName], ...attributes };
      }
    }
  }
  return out;
}

/** The component's own default attributes (`null` ones aren't set). */
export function componentDefaults(tag: string): Record<string, string> {
  const component = mjmlRuntime().components[tag];
  return strings(component?.defaultAttributes as Record<string, unknown> | undefined);
}

export function resolveAttributes(node: MjmlNode, head: HeadAttributes, parentClass = ""): Resolved {
  const own = strings(node.attributes);
  const classes = (own["mj-class"] ?? "").split(" ").filter(Boolean);
  let fromClasses: Record<string, string> = {};
  for (const name of classes) {
    const values = head.classes[name] ?? {};
    const joined: Record<string, string> = fromClasses["css-class"] && values["css-class"] ? { "css-class": `${fromClasses["css-class"]} ${values["css-class"]}` } : {};
    fromClasses = { ...fromClasses, ...values, ...joined };
  }
  let fromParentClass: Record<string, string> = {};
  for (const name of parentClass.split(" ")) fromParentClass = { ...fromParentClass, ...head.classDefaults[name]?.[node.tagName] };
  const { "mj-class": _class, ...inline } = own;
  const all = head.defaults["mj-all"] ?? {};
  const set = { ...(head.defaults[node.tagName] ?? {}), ...fromClasses, ...fromParentClass, ...inline };
  const nextParentClass = own["mj-class"] ?? parentClass;
  return {
    tag: node.tagName,
    attrs: { ...componentDefaults(node.tagName), ...all, ...set },
    given: new Set([...Object.keys(all), ...Object.keys(set)]),
    children: (node.children ?? []).map((child) => resolveAttributes(child, head, nextParentClass)),
    content: text(node.content).trim(),
    node,
  };
}
