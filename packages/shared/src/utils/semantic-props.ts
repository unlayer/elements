/**
 * Universal Semantic Props System
 *
 * Automatically flattens nested properties for ALL components
 * No build-time generation needed - pure TypeScript + runtime detection
 *
 * Example:
 * - ButtonValues has: { buttonColors: { color, backgroundColor }, fontSize }
 * - Users can pass: { color: "red", backgroundColor: "blue" } OR { buttonColors: { color: "red" } }
 * - TypeScript provides autocomplete for ALL properties (flat and nested)
 */

import type { DeviceProps, ValuesInput } from "../types";
import { cssSafeValues, normalizeCssValues } from "./css-values";
import { entities } from "./entities";
import { textToTextJson, htmlToTextJson } from "./lexical-helpers";

/**
 * Type utility: Extracts all properties from nested objects
 * This provides TypeScript autocomplete for flat props!
 */
type FlattenObjectProps<T> = T extends object
  ? {
      [K in keyof T]?: T[K] extends object
        ? T[K] | FlattenObjectProps<T[K]>  // Accept nested OR its flattened props
        : T[K];
    } & {
      // Also accept all nested object properties as flat props
      [K in keyof T as T[K] extends object
        ? keyof T[K] extends string
          ? keyof T[K]
          : never
        : never]?: any;
    }
  : T;

/**
 * Semantic props type for any component.
 * Generic TChildren parameter allows each framework to supply its own child type.
 */
export type SemanticProps<T, TChildren = any> = Omit<FlattenObjectProps<T>, keyof DeviceProps | "values"> & DeviceProps & {
  children?: TChildren;
  /**
   * Escape hatch for full control: the builder's values, as many as you set (the defaults fill in the rest). Its keys
   * are checked, its values passed on as they are; the flat props are the typed way to set one.
   */
  values?: ValuesInput<T>;
  /** HTML string with inline formatting for Paragraph (e.g. `'Hello <b>bold</b>'`) */
  html?: string;
};

/**
 * Runtime detection of nested object structures
 * Analyzes default values to identify which properties are nested objects.
 * Results are cached per defaultValues object reference to avoid recomputing
 * on every render.
 */
interface NestedStructure {
  /** Each nested object's key, with its keys. */
  groups: Map<string, Set<string>>;
  /** A key of a nested object (flat, as a prop): the first nested object that has it. */
  owners: Map<string, string>;
}

const nestedStructureCache = new WeakMap<object, NestedStructure>();

function analyzeNestedStructure(defaultValues: any): NestedStructure {
  let structure = nestedStructureCache.get(defaultValues);
  if (!structure) {
    const groups = new Map<string, Set<string>>();
    const owners = new Map<string, string>();
    // A nested object: a plain object (not an array, not null) with keys; special keys aside.
    for (const [key, value] of Object.entries(defaultValues)) {
      if (!/^(_meta|text|textJson|children)$/.test(key) && value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) groups.set(key, new Set(Object.keys(value)));
    }
    for (const [group, keys] of groups) for (const key of keys) if (!owners.has(key)) owners.set(key, group);
    structure = { groups, owners };
    nestedStructureCache.set(defaultValues, structure);
  }
  return structure;
}

/**
 * Coerce CSS-idiom flat prop values to the shapes the exporters expect.
 * Mutates the given props object in place. Each rule fixes a footgun where the
 * natural/CSS form type-checks (flat props are loosely typed) but renders blank
 * or invalid:
 * - `fontFamily: "Arial"` → `{ label, value }` (a bare string is otherwise
 *   char-spread when merged into the fontFamily group, dropping the font).
 * - `fontWeight: "700"` → `700` (numeric string → number; keyword strings like
 *   "bold"/"normal" are valid CSS and left as-is).
 * - `fontSize: 28` → `"28px"` (a unitless number is invalid CSS the browser
 *   ignores). Same for other bare-number size fields.
 * - `lineHeight: 1.4` → `"1.4"` (the field is typed as a string; unitless
 *   line-height is valid CSS).
 */
/** A unit-less number as text ("20", " 0 "): read as px where a size takes one. */
const BARE_NUMBER = /^\s*\d+\s*$/;

const SIZES = ["fontSize", "padding", "containerPadding", "borderRadius", "letterSpacing"];

function normalizeCssProps(props: Record<string, any>): void {
  const { fontFamily, fontWeight } = props;
  if (typeof fontFamily === "string") props.fontFamily = { label: fontFamily, value: fontFamily };
  if (typeof fontWeight === "string" && BARE_NUMBER.test(fontWeight)) props.fontWeight = Number(fontWeight);
  if (typeof props.lineHeight === "number") props.lineHeight = String(props.lineHeight);
  // A bare number (28) or a unit-less numeric string ("0", "20") → "<n>px".
  for (const key of SIZES) {
    const v = props[key];
    if (typeof v === "number" || (typeof v === "string" && BARE_NUMBER.test(v))) props[key] = `${String(v).trim()}px`;
  }
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Text as HTML: `&`, `<` and `>` escaped (and quotes, with `quotes`). */
export function escapeText(text: string, quotes?: boolean): string {
  return text.replace(quotes ? /[&<>"']/g : /[&<>]/g, (c) => ENTITIES[c]);
}

/**
 * `escapeText`, keeping an email service's `<%name%>` tag (SendGrid's substitution tags) as written, as 0.1.22
 * did in this text: the service fills it in. `<%` can't start an element, so it adds no markup.
 */
export function escapeKeepingTags(text: string, quotes?: boolean, escape = (part: string) => escapeText(part, quotes)): string {
  if (!text.includes("<%")) return escape(text);
  return text
    .split(/(<%[\w.]+%>)/)
    .map((part, i) => (i % 2 ? part : escape(part)))
    .join("");
}

/**
 * A Menu item's text in an email, which its exporter writes as HTML (0.1.22 wrote what it was given): markup escaped,
 * an entity reference kept (`&rarr;`, `&nbsp;`), as a single quote (a template's string: `{{ name | default: 'you' }}`);
 * a double quote escaped, also in a template tag: the exporter writes the text in a double-quoted `aria-label` too,
 * which a raw one would end (`{{ " }} onmouseover=…`).
 */
const menuText = (text: string) =>
  escapeKeepingTags(text, false, (part) => part.replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);)|[<>"]/gi, (c) => ENTITIES[c]));

/**
 * Flatten a JSX/ReactNode children tree to its plain text content.
 * Text components store a string (or Lexical JSON derived from one); a raw React
 * element passed as children would otherwise stringify to "[object Object]".
 * Duck-types the element shape (`.props.children`) so this stays framework-free.
 * Inline formatting is not preserved — use the `html` prop for rich text.
 */
function flattenChildrenText(node: any, breaks?: boolean): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => flattenChildrenText(child, breaks)).join("");
  // An element (null, booleans and anything else show nothing).
  return node && typeof node === "object" && "props" in node ? (breaks && node.type === "br" ? "<br/>" : flattenChildrenText(node.props?.children, breaks)) : "";
}

/**
 * Heading and Button children as HTML: text, with markup escaped, so a
 * value like a user's name can't inject HTML. A line break stays one,
 * written `<br>` in a string (as it worked before) or as a JSX `<br />`.
 */
function childrenHtml(children: any): string {
  const text = flattenChildrenText(children, true);
  if (!text.includes("<")) return escapeKeepingTags(text);
  return text
    .split(/(<br\s*\/?>)/i)
    .map((part, i) => (i % 2 ? "<br/>" : escapeKeepingTags(part)))
    .join("");
}

const ALIGN = { align: "textAlign" };
const TEXT = { ...ALIGN, textColor: "color" };
/**
 * Names authors (and agents) reach for, from CSS or React Email, where a component's prop has another, by component:
 * each the props it stands for (a Menu's `color` is its items', linked or not). Only where it can mean nothing else;
 * the component's own prop wins over it, and an earlier name over a later one (a Heading's `level` over `as`).
 */
export const PROP_ALIASES: Record<string, Record<string, string>> = {
  Menu: { color: "textColor linkColor", textAlign: "align" },
  Social: { textAlign: "align" },
  Paragraph: TEXT,
  // `as`: React Email's.
  Heading: { ...TEXT, level: "headingType", as: "headingType" },
  Button: TEXT,
  Image: ALIGN,
  Divider: ALIGN,
};

const LINK_KEYS = ["href", "action"] as const;

const JAVASCRIPT_URL = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;

/**
 * A URL that can't run code: a `javascript:` URL as React 19 tells one (controls and spaces before it, tabs and line
 * breaks in it, any case) as the one react-dom 19 writes for it, which throws; any other as it is, byte for byte.
 * `raw`: one written into an attribute as it is (the editor's exporters write a link's URL so), which a browser reads
 * with its character references decoded (`&#106;avascript:`, `javascript&colon;`), as it's read here then; React
 * escapes its own (`&` as `&amp;`), so a reference in one stays text.
 */
export const unrunUrl = (url: string, raw?: boolean): string => (JAVASCRIPT_URL.test(raw ? entities(url) : url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url);

/**
 * A link of any shape (`"…"`, `{ url, customAttrs }`, `{ name, values: { href }, attrs: { href } }`) with its URLs as
 * unrunUrl writes them (a list or a number as its text).
 */
function unrunLink(link: any): any {
  const unrun = (url: unknown) => unrunUrl(String(url), true);
  const blocked = (url: unknown) => url != null && unrun(url) !== String(url);
  if (typeof link !== "object" || link === null) return blocked(link) ? unrun(link) : link;
  if (blocked(link.url)) link = { ...link, url: unrun(link.url) };
  for (const key of ["values", "attrs", "customAttrs"]) if (blocked(link[key]?.href)) link = { ...link, [key]: { ...link[key], href: unrun(link[key].href) } };
  return link;
}

/**
 * A block's values with no link URL that runs code (see unrunUrl), in the HTML and the design alike: its `href` and
 * `action` (Button, Image, Video), a Menu's items' links and a Social's icons' URLs, however they were given. The
 * editor's exporters write those links as they are, in every mode (0.2.1 did too).
 */
export function unrunLinks<T>(values: T, name: string): T {
  if (!values || typeof values !== "object") return values;
  const out: Record<string, any> = { ...values };
  for (const key of LINK_KEYS) if (out[key] != null) out[key] = unrunLink(out[key]);
  if (name === "Menu" && Array.isArray(out.menu?.items)) out.menu = { ...out.menu, items: out.menu.items.map((item: any) => (item?.link != null ? { ...item, link: unrunLink(item.link) } : item)) };
  if (name === "Social" && Array.isArray(out.icons?.icons)) out.icons = { ...out.icons, icons: out.icons.icons.map((icon: any) => (icon?.url != null ? { ...icon, url: unrunLink(icon.url) } : icon)) };
  return out as T;
}

/**
 * A link's target, which the exporters write into a `target="…"` as it is: one that could end the attribute or start
 * a tag (`"`, `'`, `<`, `>`, a backtick), or that isn't a string (an array from a JSON body, written as its text), is
 * a new tab (`_blank`) instead.
 */
const safeTarget = (target: unknown) => (target != null && (typeof target !== "string" || /["'<>`]/.test(target)) ? "_blank" : target);

/**
 * A link in the schema's storage shape: `"https://…"` is `{ name: "web", values: { href, target } }` (`target`, the
 * component's, a new tab where it gives none), and a link given in `attrs` has its `href` and `target` in `values`.
 */
function canonicalizeLink(v: any, target: string): any {
  if (typeof v === "string") return { name: "web", values: { href: v, target } };
  if (!(v && typeof v === "object" && "name" in v && v.attrs && typeof v.attrs === "object")) return v;
  const { href, target: attrsTarget, ...attrs } = v.attrs;
  if (href === undefined && attrsTarget === undefined) return v;
  const values = { ...(v.values as Record<string, any> | undefined) };
  if (!values.href && href !== undefined) values.href = href;
  if (!values.target && attrsTarget !== undefined) values.target = attrsTarget;
  const { attrs: _attrs, ...next } = v;
  return Object.keys(attrs).length ? { ...next, values, attrs } : { ...next, values };
}

/** The props an alias stands for (`"textColor linkColor"`), split once. */
const aliasLists = new Map<string, string[]>();
function aliasesOf(names: string): string[] {
  let list = aliasLists.get(names);
  if (!list) aliasLists.set(names, (list = names.split(" ")));
  return list;
}

/**
 * Universal semantic props mapper
 * Works for ANY component - no configuration needed!
 *
 * @param props - User props (can include flat or nested properties)
 * @param defaultValues - Component default values (used to detect structure)
 * @param componentType - Component name (for special handling like Paragraph)
 * @returns Properly structured values object for exporter
 */
export function mapSemanticProps<T extends Record<string, any>>(
  props: SemanticProps<T>,
  defaultValues: T,
  componentType: string
): T {
  const { children, values, mobile, hideOnMobile: hideMobileProp, hideOnDesktop: hideDesktopProp, ...rest } = props;
  const userProps: Record<string, any> = rest;
  // The editor hides rows and content on a device, never a column.
  const hideOnMobile = componentType === "Column" ? undefined : hideMobileProp;
  const hideOnDesktop = componentType === "Column" ? undefined : hideDesktopProp;
  const aliases = PROP_ALIASES[componentType];
  if (aliases)
    for (const alias in aliases) {
      if (!(alias in userProps)) continue;
      for (const prop of aliasesOf(aliases[alias])) userProps[prop] ??= userProps[alias];
      delete userProps[alias];
    }

  // Start with escape hatch if provided
  const result: any = values ? { ...values } : {};

  // Handle children → text/textJson conversion
  // Paragraph uses textJson (Lexical JSON); all others use text (plain string)
  // Note: editor-types codegen renamed text→textJson for Button/Heading but
  // the exporter still uses plain text at runtime via generateHtmlFromTextJson
  if (children !== undefined && !result.text && !result.textJson) {
    const textContent = flattenChildrenText(children);
    // Heading and Button children are text, as in React (and as Paragraph's are): markup in them shows as typed, so a
    // value like a user's name can't inject HTML, but a line break stays one. The `text` prop still takes HTML.
    if (componentType === "Paragraph") result.textJson = textToTextJson(textContent);
    else result.text = componentType === "Heading" || componentType === "Button" ? childrenHtml(children) : textContent;
  }

  // Paragraph: auto-convert `text` → `textJson` (Lexical JSON)
  // This allows Paragraph to accept the same `text` field as Heading/Button,
  // making it a drop-in replacement for the legacy Text component.
  // - values.text (escape hatch) = legacy HTML → use htmlToTextJson (preserves HTML)
  // - text prop (API) = plain text → use textToTextJson (wraps in Lexical JSON)
  const textProp = result.text || userProps.text;
  if (componentType === "Paragraph" && textProp && !result.textJson) {
    result.textJson = (result.text ? htmlToTextJson : textToTextJson)(String(textProp));
    delete result.text;
    delete userProps.text;
  }

  // Paragraph: convert `html` (rich HTML string) → `textJson` (Lexical JSON)
  // Supports both: <Paragraph html="..." /> and <Paragraph values={{ html: "..." }} />
  const htmlProp = userProps.html || result.html;
  if (componentType === "Paragraph" && htmlProp && !result.textJson) {
    result.textJson = htmlToTextJson(String(htmlProp));
    delete userProps.html;
    delete result.html;
  }

  // Canonicalize link/action fields to the schema's storage shape so the rest of
  // the pipeline (mergeValues, renderToJson, AND the editor) sees a consistent
  // type:
  //  - `"https://…"` string shorthand → `{ name:"web", values:{ href, target } }`.
  //  - a link placed in `attrs` (the canonical Href type also surfaces
  //    `attrs:{ href, target }`) is moved into `values.href`/`target`, where the
  //    editor reads it — so the link round-trips into the Builder, not just into
  //    renderToHtml. Genuine custom attrs (class, data-*, …) are preserved.
  // Applied to both the flat prop and the `values` escape hatch. (Render-time
  // `normalizeLinkValue` also reads `attrs` as a defensive fallback.)
  // A flat `target` (Button, Link) is the link's: a new tab only where none is given (or where it's one that could end
  // its attribute or isn't a string, said).
  const target = safeTarget(userProps.target ?? "_blank") as string;
  if (target !== (userProps.target ?? "_blank")) console.warn(`[Unlayer] ${componentType}'s target ${typeof userProps.target === "string" ? `${JSON.stringify(userProps.target)} could end its HTML attribute or start a tag` : "isn't text"}, so the link opens in a new tab (_blank).`);
  if ("target" in userProps) delete userProps.target;
  for (const key of LINK_KEYS) {
    // A link given as null (nullable data) is none, as one left out is.
    if (userProps[key] === null) delete userProps[key];
    if (userProps[key] !== undefined) userProps[key] = canonicalizeLink(userProps[key], target);
    if (result[key] !== undefined) result[key] = canonicalizeLink(result[key], target);
  }

  // Normalize CSS-idiom prop values to the shapes the exporters expect. Authors
  // (humans and AI) reach for CSS habits — a string `fontFamily`, a numeric
  // `fontSize`, a string `fontWeight` — which type-check (flat props are loose)
  // but otherwise render blank or invalid. Coercing the natural form here makes
  // it render correctly. Applied to flat props only; the `values` escape hatch
  // is the full-control path and is left untouched.
  normalizeCssProps(userProps);

  // Analyze default values to detect nested object structure
  const { groups: nestedGroups, owners } = analyzeNestedStructure(defaultValues);

  // Separate flat props from potential nested props: a nested object as given, a key of one (flat) in it.
  const nested: Record<string, any> = {};
  const flat: Record<string, any> = {};
  for (const key of Object.keys(userProps)) {
    const value = userProps[key];
    // (A prop given as `null`, as data gives one it hasn't, is one not given: `color: ;` isn't a color.)
    if (value == null) continue;
    if (nestedGroups.has(key)) nested[key] = value;
    else {
      const group = owners.get(key);
      if (group) (nested[group] ||= {})[key] = value;
      else flat[key] = value;
    }
  }

  // Merge everything: escape hatch < flat props < nested groups
  const final: any = { ...result, ...flat };

  // Merge nested groups (preserve existing from escape hatch)
  for (const groupName in nested) {
    const groupValues = nested[groupName];
    if (Object.keys(groupValues).length) final[groupName] = { ...result[groupName], ...groupValues };
  }

  // Some components (e.g. Column) ship an empty `border: {}` default, so the
  // nested-group detector can't see the border sub-keys and flat border-side
  // props (borderTopWidth, …) would land loose and be dropped by the exporter.
  // If the component declares a `border` field, gather them into it.
  if (defaultValues && typeof defaultValues === "object" && "border" in (defaultValues as object)) {
    const sides = Object.keys(final).filter((key) => key.startsWith("border") && /^border(Top|Right|Bottom|Left)(Width|Style|Color)$/.test(key));
    if (sides.length) final.border = { ...(final.border || {}), ...Object.fromEntries(sides.map((key) => [key, final[key]])) };
    for (const key of sides) delete final[key];

    // Border widths must carry a unit — `borderTopWidth: 1` would otherwise
    // render `border-top: 1 solid` (invalid CSS the browser drops). The
    // BorderInput type accepts a number, so normalize *Width fields (bare number
    // or unit-less numeric string → px), wherever the border came from.
    // Cloned before rewriting: final.border may alias the caller's object (the
    // `values` escape hatch is only a shallow clone, and a nested `border` prop
    // passes through by reference), so mutating in place would be an impure side
    // effect — e.g. a shared `const HAIRLINE = { borderTopWidth: 1 }` would get
    // rewritten to "1px" in the caller.
    if (final.border && typeof final.border === "object") {
      const b: Record<string, any> = { ...(final.border as Record<string, any>) };
      for (const [key, v] of Object.entries(b)) if (/Width$/.test(key) && (typeof v === "number" || (typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v)))) b[key] = `${String(v).trim()}px`;
      final.border = b;
    }
  }

  if (mobile || hideOnMobile !== undefined || hideOnDesktop !== undefined) {
    const overrides = { ...final._override };
    if (mobile || hideOnMobile !== undefined) {
      const { width, maxWidth, autoWidth, ...phone } = mobile || {};
      const mapped = mapSemanticProps(phone as SemanticProps<T>, defaultValues, componentType) as Record<string, any>;
      if (componentType === "Image" && (width !== undefined || maxWidth !== undefined || autoWidth !== undefined)) {
        mapped.src = { ...(overrides.mobile?.src || {}), autoWidth: autoWidth === undefined ? false : autoWidth, ...(width !== undefined || maxWidth !== undefined ? { maxWidth: width ?? maxWidth } : {}) };
      } else if (width !== undefined || autoWidth !== undefined) {
        const key = componentType === "Button" ? "size" : "width";
        mapped[key] = { autoWidth: autoWidth ?? false, ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}) };
      }
      overrides.mobile = { ...overrides.mobile, ...cssSafeValues(mapped), ...(hideOnMobile !== undefined ? { hideMobile: hideOnMobile } : {}) };
    }
    if (hideOnDesktop !== undefined) overrides.desktop = { ...overrides.desktop, hideDesktop: hideOnDesktop };
    final._override = overrides;
  }

  // "Do not stack on mobile" is a mobile override, as the editor saves it:
  // the exporters read it only there.
  if (componentType === "Row" && final.noStackMobile === true) {
    final._override = { ...final._override, mobile: { ...final._override?.mobile, noStackMobile: true } };
    final.noStackMobile = false;
  }

  // Colors and font stacks in forms the exporters write correctly.
  return normalizeCssValues(final) as T;
}

/**
 * Convert any of the three link-shaped inputs into the render-value shape
 * the exporter expects: `{ url, target, ...customAttrs }`.
 *
 * The schema stores links as `{ name, values: { href, target } }`, but
 * exporters (consumed via @unlayer/exporters) expect the editor's render
 * value shape `{ url, target, customAttrs?, class?, onClick? }`. The editor
 * runs this conversion via the link property-editor's `renderValue()` —
 * `normalizeValuesForExporter` (in render-time code) mirrors it so React
 * rendered output matches.
 *
 * Accepted inputs:
 * - `"https://..."` (string shorthand)
 * - `{ url, target?, customAttrs?, class?, onClick? }` (already render shape)
 * - `{ name, values: { href, target? }, attrs? }` (storage shape from schema)
 *
 * Returns `undefined` for shapes we don't recognize so the caller can fall
 * back to the original value (avoids silently dropping data).
 *
 * IMPORTANT: this is render-time only. Do NOT apply during renderToJson —
 * JSON output is for round-tripping into the editor, which expects the
 * storage shape.
 */
export function normalizeLinkValue(value: unknown): Record<string, any> | undefined {
  if (typeof value === "string") return { url: value, target: "_blank" };
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, any>;
  // Already render-shape (has url) — pass through.
  if ("url" in v) return v;
  // Storage shape from the schema: { name, values: { href, target }, attrs? }.
  // The canonical Href type also surfaces `attrs: { href, target }`, so authors
  // reasonably put the link there — read href/target from `values` first, then
  // fall back to `attrs`, and spread any remaining `attrs` as custom attributes.
  // (Without this, `{ name, attrs: { href } }` type-checks but renders href="".)
  const object = (x: unknown): Record<string, any> | undefined => (x && typeof x === "object" ? x : undefined);
  const inner = object(v.values);
  const attrs = object(v.attrs);
  if (!("name" in v) || !(inner || attrs)) return undefined;
  const { href, target, ...customAttrs } = attrs ?? {};
  // `||` not `??`: the schema default merges in `values: { href: "" }`, so an
  // empty `values.href` must fall through to the `attrs` href, not win over it.
  return { url: inner?.href || href || "", target: inner?.target || target || "_blank", ...customAttrs };
}

/**
 * A link whose URL the exporters write into an `href="…"` as it is: `"`, `<`
 * and `>`, which a URL can't hold unencoded, are percent-encoded (as a browser
 * would), so a URL can't end the attribute (or Outlook's conditional comment);
 * and whose target can't either (see safeTarget).
 * An email service's placeholder in the form `<%name%>` (SendGrid's
 * `<%asm_group_unsubscribe_raw_url%>`) is kept: the service fills it in as
 * written, and it can end neither.
 */
function safeLink(given: Record<string, any>): Record<string, any> {
  // Its target too (see safeTarget).
  const target = safeTarget(given.target);
  const link = target === given.target ? given : { ...given, target };
  // A URL that isn't a string (an array from a JSON body or `?url[]=`) is written as its text: escaped as one.
  return link.url == null ? link : { ...link, url: String(link.url).replace(/<%[\w.]+%>|["<>]/g, (c) => (c.length > 1 ? c : encodeURIComponent(c))) };
}

/**
 * Normalize all link/action fields on an item's values to the render-value
 * shape the exporter reads. Returns a shallow clone — does not mutate.
 *
 * Knows about the link-bearing paths per component:
 * - top-level `href` (Button, Video)
 * - top-level `action` (Image, Timer)
 * - `menu.items[].link` (Menu), and its items' text
 * - `icons.icons[].url` (Social)
 *
 * Only the bridge between mapper and exporter should call this; renderToJson
 * must NOT, because JSON output preserves storage shape.
 */
export function normalizeValuesForExporter<T extends Record<string, any>>(
  values: T,
  componentName: string,
  mode?: string
): T {
  if (values == null || typeof values !== "object") return values;

  const out: Record<string, any> = { ...values };

  // Top-level link fields used by Button (href), Image (action), Video (href),
  // Timer (action). Cheap to check both keys for every component.
  // A link as the exporters read it, or as it was (a shape it isn't).
  const linkOf = (link: unknown) => {
    const normalized = normalizeLinkValue(link);
    return normalized ? safeLink(normalized) : link;
  };
  for (const key of ["href", "action"]) if (out[key] !== undefined) out[key] = linkOf(out[key]);

  // The Button exporter unescapes its text before writing it, where the
  // editor's canvas shows the text as the HTML it is. Escaping it once here
  // gives it back as stored: `&lt;b&gt;` shows as text, `<b>` as bold.
  if (componentName === "Button" && typeof out.text === "string") {
    out.text = escapeKeepingTags(out.text, true);
  }

  // Menu items each carry a `link` field, and text the email exporter writes
  // as it is (the web and document exporters escape it).
  if (componentName === "Menu" && out.menu && Array.isArray(out.menu.items)) {
    out.menu = {
      ...out.menu,
      items: out.menu.items.map((item: any) => {
        if (!item) return item;
        // (In an email, text that isn't a string, an array from a JSON body, is its text, escaped as text is.)
        const next = mode === "email" && item.text != null ? { ...item, text: menuText(String(item.text)) } : item;
        const link = linkOf(next.link);
        return link === next.link ? next : { ...next, link };
      }),
    };
  }

  // Social icons each carry a `url`, written into an href as it is, and a `name`, which an email writes into its
  // `title`, `alt` and image URL as it is too (a web page or a document escapes it); a name that isn't a string (an
  // array from a JSON body) is its text.
  if (componentName === "Social" && out.icons && Array.isArray(out.icons.icons)) {
    const named = (icon: any) => (icon.name == null || (mode !== "email" && typeof icon.name === "string") ? icon : { ...icon, name: mode === "email" ? escapeText(String(icon.name), true) : String(icon.name) });
    out.icons = { ...out.icons, icons: out.icons.icons.map((icon: any) => (icon && typeof icon === "object" ? named(safeLink(icon)) : icon)) };
  }

  return out as T;
}
