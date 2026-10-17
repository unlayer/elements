/**
 * Design values as a component's props: semantic flat props where the component has one (and the value comes back
 * through it as it is), the rest in its `values` escape hatch. Whether a value comes back is checked with the same
 * mapper the components use (`mapSemanticProps`), so a prop that the components would normalize differently
 * (a numeric `fontSize`, a `lineHeight` number, a name a nested group takes) goes in `values` instead.
 */
import { mapSemanticProps, mergeValues, normalizeCssValues } from "@unlayer-internal/shared-elements";
import { castValue, type Attr } from "./print";
import { valuesTypeCheck } from "./checked-values";
import { deepEqual, differences, isIdentifier, isPlainObject, type Plain } from "./values";

/** The props of one element, in order, with what goes in `values`. */
export class Props {
  readonly attrs: Attr[] = [];
  readonly values: Plain = {};
  /** Text children. */
  text?: string;

  constructor(readonly component: string) {}

  add(name: string, value: unknown): void {
    this.attrs.push({ name, value });
  }
}

/** A node's `_meta`: its ids are left out (renderToJson numbers them), anything else is kept in `values`. */
export function withoutMeta(values: Plain, props: Props): Plain {
  const { _meta, ...rest } = values;
  const meta = isPlainObject(_meta) ? Object.fromEntries(Object.entries(_meta).filter(([key]) => key !== "htmlID" && key !== "htmlClassNames")) : {};
  if (Object.keys(meta).length) props.values._meta = meta;
  return rest;
}

/**
 * The attributes of an element: its props, then `values`, as they are where they type-check (see checked-values.ts),
 * else as the component's `values` type (whose props type the module imports, in `types`).
 */
export function attributes(props: Props, types: Set<string>): Attr[] {
  if (!Object.keys(props.values).length) return props.attrs;
  if (valuesTypeCheck(props.component, props.values)) return [...props.attrs, { name: "values", value: props.values }];
  const type = `${props.component}Props`;
  types.add(type);
  return [...props.attrs, { name: "values", value: castValue(props.values, `${type}["values"]`) }];
}

/**
 * Prop names with a meaning of their own on every component (never a design key written as a flat prop). Each
 * component's own (Image's `width`, Table's `rows`) are left out of its typed keys (see blocks.ts).
 */
const RESERVED = new Set([
  "children", "values", "key", "ref", "mode", "className", "style", "index", "colIndex", "cells", "bodyValues", "rowValues",
  "columnValues", "_config", "_metaHtmlId", "config", "collection", "mobile", "hideOnMobile", "hideOnDesktop", "skipInText", "target",
]);

/**
 * What a prop's type takes, where it's narrower than any value (one of a few strings, a px length): a value outside
 * it goes in `values` (it wouldn't type-check). By key; `component` where it differs.
 */
const ROOTS = new Set(["Email", "Page", "Document"]);
const oneOf = (...allowed: string[]) => (value: unknown) => typeof value === "string" && allowed.includes(value);
const ALIGN = oneOf("left", "center", "right", "justify");
const VERTICAL = oneOf("top", "middle", "bottom");
const NUMBER = String.raw`-?(?:\d+\.?\d*|\.\d+)`;
/** `number | ${number}px` */
const PX = (value: unknown) => typeof value === "number" || (typeof value === "string" && new RegExp(`^${NUMBER}px$`).test(value));
/** A box of px lengths, one to four (`8px 16px`). */
const BOX = (value: unknown) => typeof value === "string" && new RegExp(`^${NUMBER}px(?: ${NUMBER}px){0,3}$`).test(value);
/** `number | ${number}px | ${number}%` (and `auto`). */
const LENGTH = (auto: boolean) => (value: unknown) => typeof value === "number" || (typeof value === "string" && (new RegExp(`^${NUMBER}(?:px|%)$`).test(value) || (auto && value === "auto")));
const CHECKS: Record<string, (value: unknown, component: string) => boolean> = {
  textAlign: ALIGN,
  align: ALIGN,
  contentAlign: oneOf("left", "center", "right"),
  contentVerticalAlign: VERTICAL,
  headerTextAlign: ALIGN,
  contentTextAlign: ALIGN,
  footerTextAlign: ALIGN,
  headerVerticalAlign: VERTICAL,
  footerVerticalAlign: VERTICAL,
  headingType: oneOf("h1", "h2", "h3", "h4", "h5", "h6"),
  documentSize: oneOf("A3", "A4", "A5", "Legal", "Letter", "Tabloid"),
  documentOrientation: oneOf("portrait", "landscape"),
  textDirection: oneOf("ltr", "rtl", "auto"),
  layout: oneOf("horizontal", "vertical"),
  contentWidth: LENGTH(true),
  width: (value, component) => component !== "Divider" || LENGTH(false)(value),
  headerFontSize: PX,
  contentFontSize: PX,
  footerFontSize: PX,
  headerPadding: BOX,
  contentPadding: BOX,
  footerPadding: BOX,
  // A block's weight takes a number, a numeric string or a keyword; the root's and a table's, a number.
  fontWeight: (value, component) => typeof value === "number" || (!ROOTS.has(component) && typeof value === "string" && /^(\d+|normal|bold|lighter|bolder)$/.test(value)),
  headerFontWeight: (value) => typeof value === "number",
  contentFontWeight: (value) => typeof value === "number",
  footerFontWeight: (value) => typeof value === "number",
  // A Button's size: its width as its type takes it.
  size: (value) => !isPlainObject(value) || value.width === undefined || LENGTH(false)(value.width),
  backgroundImage: (value, component) =>
    !ROOTS.has(component) ||
    (isPlainObject(value) &&
      (value.size === undefined || oneOf("custom", "contain", "cover")(value.size)) &&
      (value.repeat === undefined || oneOf("repeat", "no-repeat", "repeat-x", "repeat-y")(value.repeat)) &&
      (value.position === undefined || oneOf("custom", "center", "top-left", "top-center", "top-right", "center-left", "center-right", "bottom-left", "bottom-center", "bottom-right")(value.position))),
};

/** Objects written whole, not as what differs from their default. */
const WHOLE = new Set(["fontFamily", "href", "action"]);

/** A font as the blocks' `fontFamily` prop types it: a label and a value (the root's also takes a URL and more). */
const simpleFont = (value: unknown) => isPlainObject(value) && typeof value.label === "string" && typeof value.value === "string" && Object.keys(value).length === 2;

/** Whether `value` type-checks as the `key` prop of `component`. */
export function typeChecks(key: string, value: unknown, component: string, richFonts = false): boolean {
  if (value === null) return false;
  if (key === "fontFamily" && !richFonts) return simpleFont(value);
  return CHECKS[key]?.(value, component) ?? true;
}

/** A component's nested groups (as `mapSemanticProps` finds them): each non-empty object default, and its keys. */
function nestedGroups(defaults: Plain): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  for (const [key, value] of Object.entries(defaults)) {
    if (key === "_meta" || key === "text" || key === "textJson") continue;
    if (isPlainObject(value) && Object.keys(value).length) groups.set(key, new Set(Object.keys(value)));
  }
  return groups;
}

/** What a design value becomes in the design the props render to: merged into its default, colors normalized. */
const expected = (key: string, value: unknown, defaults: Plain) =>
  normalizeCssValues({ [key]: isPlainObject(value) && isPlainObject(defaults[key]) ? mergeValues(defaults[key], value) : value })[key];

export interface PlaceOptions {
  /** Design keys this component has a flat prop for (typed in its props). */
  typed: ReadonlySet<string>;
  /** Groups whose changed keys read best as flat props (`backgroundColor` for `buttonColors`). */
  flatten?: ReadonlySet<string>;
  /** Keys placed last, in this order (`containerPadding`). */
  last?: string[];
  /** The `fontFamily` prop takes the builder's whole font (a URL, weights): the root's does. */
  richFonts?: boolean;
}

/**
 * Place `rest` (design values not handled otherwise) on `props`: each value that differs from `defaults` as a flat
 * prop (a nested object as the part of it that differs, or its keys as flat props), or in `values`.
 */
export function placeValues(rest: Plain, defaults: Plain, props: Props, { typed, flatten, last = [], richFonts }: PlaceOptions): void {
  const groups = nestedGroups(defaults);
  const groupOf = (name: string) => [...groups].find(([, keys]) => keys.has(name))?.[0];
  const usable = (name: string) => isIdentifier(name) && !RESERVED.has(name);
  const placed: Array<{ key: string; attrs: Attr[] }> = [];
  const keys = [...Object.keys(rest).filter((key) => !last.includes(key)), ...last.filter((key) => key in rest)];

  for (const key of keys) {
    const value = rest[key];
    if (value === undefined || deepEqual(value, defaults[key])) continue;
    // A name a nested group takes (a flat `url` is a background image's): only as itself where it's a value of its own.
    const routed = !groups.has(key) && !(key in defaults) && groupOf(key) !== undefined;
    if (!typed.has(key) || !usable(key) || routed || !typeChecks(key, value, props.component, richFonts)) {
      props.values[key] = value;
      continue;
    }
    if (isPlainObject(value) && isPlainObject(defaults[key])) {
      const diff = differences(value, defaults[key]) as Plain | undefined;
      if (!diff) continue;
      const flat = flatten?.has(key) && Object.keys(diff).every((sub) => usable(sub) && !(sub in defaults) && (groupOf(sub) ?? key) === key && typeChecks(sub, diff[sub], props.component));
      // (A font and a link are one thing each: written whole.)
      placed.push({ key, attrs: flat ? Object.entries(diff).map(([name, item]) => ({ name, value: item })) : [{ name: key, value: WHOLE.has(key) ? value : diff }] });
      continue;
    }
    placed.push({ key, attrs: [{ name: key, value }] });
  }

  // Each value as the props give it back (the components' own mapper), or in `values`.
  const flatProps = Object.fromEntries(placed.flatMap(({ attrs }) => attrs.map((attr) => [attr.name, attr.value])));
  const given = mergeValues(defaults, mapSemanticProps(flatProps as never, defaults, props.component) as Plain);
  for (const { key, attrs } of placed) {
    if (deepEqual(given[key], expected(key, rest[key], defaults))) props.attrs.push(...attrs);
    else props.values[key] = rest[key];
  }
}

/**
 * Whether `values` come back as they are through the escape hatch: the keys that don't (a color written another way,
 * a link in another shape) are what the design can't keep.
 */
export function lostThroughValues(values: Plain, defaults: Plain, component: string): string[] {
  if (!Object.keys(values).length) return [];
  const given = mergeValues(defaults, mapSemanticProps({ values } as never, defaults, component) as Plain);
  return Object.keys(values).filter((key) => key !== "_override" && !deepEqual(given[key], expected(key, values[key], defaults)));
}
