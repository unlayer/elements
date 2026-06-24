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
export type SemanticProps<T, TChildren = any> = FlattenObjectProps<T> & {
  children?: TChildren;
  values?: T; // Escape hatch for full control
  /** HTML string with inline formatting for Paragraph (e.g. `'Hello <b>bold</b>'`) */
  html?: string;
};

/**
 * Runtime detection of nested object structures
 * Analyzes default values to identify which properties are nested objects.
 * Results are cached per defaultValues object reference to avoid recomputing
 * on every render.
 */
const nestedStructureCache = new WeakMap<object, Map<string, Set<string>>>();

function analyzeNestedStructure(defaultValues: any): Map<string, Set<string>> {
  const cached = nestedStructureCache.get(defaultValues);
  if (cached) return cached;

  const nestedGroups = new Map<string, Set<string>>();

  for (const [key, value] of Object.entries(defaultValues)) {
    // Skip special keys
    if (key === "_meta" || key === "text" || key === "textJson" || key === "children") {
      continue;
    }

    // Check if this is a nested object (plain object, not array, not null)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    ) {
      const props = new Set(Object.keys(value));
      nestedGroups.set(key, props);
    }
  }

  nestedStructureCache.set(defaultValues, nestedGroups);
  return nestedGroups;
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
const PX_SIZE_KEYS = [
  "fontSize",
  "padding",
  "containerPadding",
  "borderRadius",
  "letterSpacing",
] as const;

function normalizeCssProps(props: Record<string, any>): void {
  if (typeof props.fontFamily === "string") {
    const v = props.fontFamily;
    props.fontFamily = { label: v, value: v };
  }
  if (
    typeof props.fontWeight === "string" &&
    /^\d+$/.test(props.fontWeight.trim())
  ) {
    props.fontWeight = Number(props.fontWeight.trim());
  }
  if (typeof props.lineHeight === "number") {
    props.lineHeight = String(props.lineHeight);
  }
  for (const key of PX_SIZE_KEYS) {
    const v = props[key];
    // bare number (28) or a unit-less numeric string ("0", "20") → "<n>px"
    if (typeof v === "number") {
      props[key] = `${v}px`;
    } else if (typeof v === "string" && /^\d+$/.test(v.trim())) {
      props[key] = `${v.trim()}px`;
    }
  }
}

/**
 * Flatten a JSX/ReactNode children tree to its plain text content.
 * Text components store a string (or Lexical JSON derived from one); a raw React
 * element passed as children would otherwise stringify to "[object Object]".
 * Duck-types the element shape (`.props.children`) so this stays framework-free.
 * Inline formatting is not preserved — use the `html` prop for rich text.
 */
function flattenChildrenText(node: any): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenChildrenText).join("");
  if (typeof node === "object" && "props" in node) {
    return flattenChildrenText(node.props?.children);
  }
  return "";
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
  const { children, values, ...restProps } = props;
  const userProps: any = { ...restProps };

  // Start with escape hatch if provided
  const result: any = values ? { ...values } : {};

  // Handle children → text/textJson conversion
  // Paragraph uses textJson (Lexical JSON); all others use text (plain string)
  // Note: editor-types codegen renamed text→textJson for Button/Heading but
  // the exporter still uses plain text at runtime via generateHtmlFromTextJson
  if (children !== undefined && !result.text && !result.textJson) {
    const textContent =
      typeof children === "string" ? children : flattenChildrenText(children);
    if (componentType === "Paragraph") {
      result.textJson = textToTextJson(textContent);
    } else {
      result.text = textContent;
    }
  }

  // Paragraph: auto-convert `text` → `textJson` (Lexical JSON)
  // This allows Paragraph to accept the same `text` field as Heading/Button,
  // making it a drop-in replacement for the legacy Text component.
  // - values.text (escape hatch) = legacy HTML → use htmlToTextJson (preserves HTML)
  // - text prop (API) = plain text → use textToTextJson (wraps in Lexical JSON)
  const textFromEscapeHatch = result.text;
  const textFromProp = userProps.text;
  const textProp = textFromEscapeHatch || textFromProp;
  if (componentType === "Paragraph" && textProp && !result.textJson) {
    result.textJson = textFromEscapeHatch
      ? htmlToTextJson(String(textProp))
      : textToTextJson(String(textProp));
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

  // String shorthand for link/action fields (`href="https://..."` or
  // `action="https://..."`) → wrap into the schema's storage shape so that
  // the rest of the pipeline (mergeValues, renderToJson) sees a consistent
  // type. The render-time exporter handoff later resolves this into the
  // exporter's `{ url, target }` shape via `normalizeValuesForExporter`.
  for (const key of ["href", "action"] as const) {
    const v = userProps[key];
    if (typeof v === "string") {
      userProps[key] = {
        name: "web",
        values: { href: v, target: "_blank" },
      };
    }
  }

  // Normalize CSS-idiom prop values to the shapes the exporters expect. Authors
  // (humans and AI) reach for CSS habits — a string `fontFamily`, a numeric
  // `fontSize`, a string `fontWeight` — which type-check (flat props are loose)
  // but otherwise render blank or invalid. Coercing the natural form here makes
  // it render correctly. Applied to flat props only; the `values` escape hatch
  // is the full-control path and is left untouched.
  normalizeCssProps(userProps);

  // Analyze default values to detect nested object structure
  const nestedGroups = analyzeNestedStructure(defaultValues);

  // Separate flat props from potential nested props
  const nested: Record<string, any> = {};
  const flat: Record<string, any> = {};

  for (const [key, value] of Object.entries(userProps)) {
    if (value === undefined) continue;

    // Check if user already provided a nested object
    if (nestedGroups.has(key)) {
      // User passed the nested object directly
      nested[key] = value;
      continue;
    }

    // Check if this prop belongs to any nested group
    let belongsToGroup = false;
    for (const [groupName, groupProps] of nestedGroups.entries()) {
      if (groupProps.has(key)) {
        // This flat prop should be grouped
        nested[groupName] = nested[groupName] || {};
        nested[groupName][key] = value;
        belongsToGroup = true;
        break;
      }
    }

    if (!belongsToGroup) {
      // Regular flat prop
      flat[key] = value;
    }
  }

  // Merge everything: escape hatch < flat props < nested groups
  const final: any = {
    ...result,
    ...flat
  };

  // Merge nested groups (preserve existing from escape hatch)
  for (const [groupName, groupValues] of Object.entries(nested)) {
    if (Object.keys(groupValues).length > 0) {
      final[groupName] = {
        ...result[groupName],
        ...groupValues
      };
    }
  }

  // Some components (e.g. Column) ship an empty `border: {}` default, so the
  // nested-group detector can't see the border sub-keys and flat border-side
  // props (borderTopWidth, …) would land loose and be dropped by the exporter.
  // If the component declares a `border` field, gather them into it.
  if (
    defaultValues &&
    typeof defaultValues === "object" &&
    "border" in (defaultValues as object)
  ) {
    const borderSideRe = /^border(Top|Right|Bottom|Left)(Width|Style|Color)$/;
    const collected: Record<string, any> = {};
    for (const key of Object.keys(final)) {
      if (borderSideRe.test(key)) {
        collected[key] = final[key];
        delete final[key];
      }
    }
    if (Object.keys(collected).length > 0) {
      final.border = { ...(final.border || {}), ...collected };
    }
  }

  return final as T;
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
  if (value == null) return undefined;
  if (typeof value === "string") {
    return { url: value, target: "_blank" };
  }
  if (typeof value !== "object") return undefined;
  const v = value as Record<string, any>;
  // Already render-shape (has url) — pass through.
  if ("url" in v) return v;
  // Storage shape from the schema: { name, values: { href, target } }.
  if ("name" in v && v.values && typeof v.values === "object") {
    const inner = v.values as Record<string, any>;
    return {
      url: inner.href ?? "",
      target: inner.target ?? "_blank",
      ...(v.attrs ?? {}),
    };
  }
  return undefined;
}

/**
 * Normalize all link/action fields on an item's values to the render-value
 * shape the exporter reads. Returns a shallow clone — does not mutate.
 *
 * Knows about the link-bearing paths per component:
 * - top-level `href` (Button, Video)
 * - top-level `action` (Image, Timer)
 * - `menu.items[].link` (Menu)
 *
 * Only the bridge between mapper and exporter should call this; renderToJson
 * must NOT, because JSON output preserves storage shape.
 */
export function normalizeValuesForExporter<T extends Record<string, any>>(
  values: T,
  componentName: string
): T {
  if (values == null || typeof values !== "object") return values;

  const out: Record<string, any> = { ...values };

  // Top-level link fields used by Button (href), Image (action), Video (href),
  // Timer (action). Cheap to check both keys for every component.
  for (const key of ["href", "action"]) {
    if (out[key] !== undefined) {
      const normalized = normalizeLinkValue(out[key]);
      if (normalized !== undefined) out[key] = normalized;
    }
  }

  // Menu items each carry a `link` field.
  if (componentName === "Menu" && out.menu && Array.isArray(out.menu.items)) {
    out.menu = {
      ...out.menu,
      items: out.menu.items.map((item: any) => {
        if (!item || item.link === undefined) return item;
        const normalized = normalizeLinkValue(item.link);
        if (normalized === undefined) return item;
        return { ...item, link: normalized };
      }),
    };
  }

  return out as T;
}
