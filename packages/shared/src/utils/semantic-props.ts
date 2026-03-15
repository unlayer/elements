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
    if (componentType === "Paragraph") {
      const textContent = typeof children === "string" ? children : String(children);
      result.textJson = textToTextJson(textContent);
    } else {
      result.text = children;
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

  // Handle href normalization (special case for Button/Image components)
  const href = userProps.href;
  if (href !== undefined) {
    if (typeof href === "string") {
      userProps.href = {
        name: "web",
        values: { href, target: "_blank" }
      };
    } else {
      userProps.href = href;
    }
  }

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

  return final as T;
}
