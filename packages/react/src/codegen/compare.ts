/**
 * Two designs compared as the builder shows them: what a round trip (design → Elements code → `renderToJson`) has
 * to keep. What the comparison leaves aside, and why:
 *
 * - `counters`, `schemaVersion`, node `id`s and `_meta.htmlID`/`htmlClassNames`: numbering, which the editor
 *   (and renderToJson) assigns.
 * - A value missing and the same value at the builder's default: the builder fills defaults in (an image without
 *   `autoWidth` is sized automatically; a video block without a video has none).
 * - A text block's missing color and the body's text color: that's the color the builder shows it in.
 * - `textJson` where a block has `text` (what the builder renders and exports), and the editor's Lexical
 *   `paragraph` block as a `text` block with its HTML.
 * - Colors and font stacks written another way (`rgb(0, 0, 0)` and `#000000`), links in their other shape (a URL
 *   string and `{ name: "web", values: { href } }`), paddings written shorter (`0px 0px` and `0px`), and a bare zero
 *   in a px length (`0 0 12px` and `0px 0px 12px`: renderToJson writes `0px`, as the design's schema types it).
 * - Device settings that are off (`hideMobile: false`) and empty ones, and a row's `noStackMobile` at the top of its
 *   values (the exporters read it from its phone settings).
 * - A font without its family's web font URL, where another font of the family has it: the builder loads the web
 *   font for the family, and a <Font> writes its URL on each.
 */
import { generateHtmlFromTextJson, mergeValues, normalizeCssValues, pxZeros } from "@unlayer-internal/shared-elements";
import { EDITOR_BODY_DEFAULTS, EDITOR_COLUMN_DEFAULTS, EDITOR_ROW_DEFAULTS, editorBlockDefaults } from "./defaults";
import { deviceSettings } from "./device";
import { deepEqual, isPlainObject, type Plain } from "./values";

export interface DesignDifference {
  /** Where, as `body.rows[0].columns[1].contents[2].values.color`. */
  path: string;
  /** The value in the first design and in the second (`undefined`: not there). */
  expected: unknown;
  actual: unknown;
}

const TEXT_TYPES = new Set(["text", "paragraph", "heading"]);

/** A link in the shape the components keep (see `mapSemanticProps`). */
function link(value: unknown): unknown {
  if (typeof value === "string") return { name: "web", values: { href: value, target: "_blank" } };
  if (!isPlainObject(value) || !("name" in value) || !isPlainObject(value.attrs)) return value;
  const { href, target, ...custom } = value.attrs;
  if (href === undefined && target === undefined) return value;
  const values = { ...(isPlainObject(value.values) ? value.values : {}) };
  if (!values.href && href !== undefined) values.href = href;
  if (!values.target && target !== undefined) values.target = target;
  const out: Plain = { ...value, values };
  if (Object.keys(custom).length) out.attrs = custom;
  else delete out.attrs;
  return out;
}

/** A box's sides, written as short as CSS allows (`10px 10px` is `10px`). */
function box(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const parts = value.trim().split(/\s+/).map((part) => (/^0(\.0+)?(px)?$/.test(part) ? "0px" : part));
  if (!parts.length || parts.length > 4) return value;
  const [t, r = t, b = t, l = r] = parts;
  return l !== r ? `${t} ${r} ${b} ${l}` : b !== t ? `${t} ${r} ${b}` : r !== t ? `${t} ${r}` : t;
}

/** Values in one form: links, colors, fonts and paddings as the components write them. */
function canonical(values: Plain): Plain {
  const out: Plain = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (key === "href" || key === "action") out[key] = link(value);
    else if (/padding$/i.test(key)) out[key] = box(value);
    else if (key === "menu" && isPlainObject(value) && Array.isArray(value.items)) out[key] = { ...value, items: value.items.map((item: unknown) => (isPlainObject(item) && item.link !== undefined ? { ...item, link: link(item.link) } : item)) };
    else if (key === "_override") {
      const settings = deviceSettings(value);
      if (settings !== undefined) out[key] = isPlainObject(settings) ? Object.fromEntries(Object.entries(settings).map(([device, set]) => [device, isPlainObject(set) ? canonical(set) : set])) : settings;
    } else out[key] = value;
  }
  return normalizeCssValues(pxZeros(out));
}

/** `value` without what equals `defaults`, deep; undefined when it all does. */
function withoutDefaults(value: unknown, defaults: unknown): unknown {
  if (deepEqual(value, defaults)) return undefined;
  if (!isPlainObject(value) || !isPlainObject(defaults)) return value;
  const out: Plain = {};
  for (const [key, item] of Object.entries(value)) {
    const kept = key in defaults ? withoutDefaults(item, defaults[key]) : item;
    if (kept !== undefined) out[key] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}

/** A node's values as the builder sees them, without what's at its default. */
function nodeValues(values: unknown, defaults: Plain): Plain {
  const given: Plain = isPlainObject(values) ? { ...values } : {};
  if (isPlainObject(given._meta)) {
    const { htmlID: _id, htmlClassNames: _classes, ...meta } = given._meta;
    if (Object.keys(meta).length) given._meta = meta;
    else delete given._meta;
  }
  const base = canonical(defaults);
  return (withoutDefaults(mergeValues(base, canonical(given)), base) as Plain | undefined) ?? {};
}

function block(content: unknown, textColor: unknown): Plain {
  if (!isPlainObject(content)) return { invalid: content };
  const type = content.type === "paragraph" ? "text" : content.type;
  const values: Plain = isPlainObject(content.values) ? { ...content.values } : {};
  if ((content.type === "paragraph" || content.type === "text") && typeof values.text !== "string" && typeof values.textJson === "string") values.text = generateHtmlFromTextJson(values.textJson);
  if (typeof values.text === "string") delete values.textJson;
  if (TEXT_TYPES.has(String(content.type)) && values.color === undefined) values.color = textColor;
  return { type, ...(content.slug !== undefined ? { slug: content.slug } : {}), values: nodeValues(values, editorBlockDefaults(String(type))) };
}

/**
 * A design with each web font's URL on every font of its family: the builder loads a family's web font for all its
 * fonts, and a <Font> writes its URL on each (see the font entry).
 */
function withFontUrls(body: Plain): Plain {
  const urls = new Map<string, unknown>();
  const fonts = (values: unknown) => (isPlainObject(values) ? Object.entries(values).filter(([key, font]) => /fontFamily$/i.test(key) && isPlainObject(font) && typeof font.value === "string") : []);
  const family = (font: Plain) => String(font.value).split(",")[0].replace(/['"]/g, "").trim().toLowerCase();
  const blocks = (Array.isArray(body.rows) ? body.rows : []).flatMap((row: Plain) => (Array.isArray(row?.columns) ? row.columns : []).flatMap((column: Plain) => (Array.isArray(column?.contents) ? column.contents : [])));
  const all = [body.values, ...blocks.map((content: Plain) => content?.values)];
  for (const values of all) for (const [, font] of fonts(values)) if (font.url && !urls.has(family(font))) urls.set(family(font), font.url);
  const filled = (values: unknown) => (isPlainObject(values) ? { ...values, ...Object.fromEntries(fonts(values).filter(([, font]) => font.url === undefined && urls.has(family(font))).map(([key, font]) => [key, { ...font, url: urls.get(family(font)) }])) } : values);
  return {
    ...body,
    values: filled(body.values),
    rows: (Array.isArray(body.rows) ? body.rows : []).map((row: Plain) => ({
      ...row,
      columns: (Array.isArray(row?.columns) ? row.columns : []).map((column: Plain) => ({
        ...column,
        contents: (Array.isArray(column?.contents) ? column.contents : []).map((content: Plain) => (isPlainObject(content) ? { ...content, values: filled(content.values) } : content)),
      })),
    })),
  };
}

/** A design as the builder shows it: what a round trip has to keep (see the top of this file). */
export function normalizeDesign(design: Plain): Plain {
  const body: Plain = isPlainObject(design.body) ? withFontUrls(design.body) : {};
  const bodyValues = nodeValues(body.values, EDITOR_BODY_DEFAULTS);
  const textColor = mergeValues(EDITOR_BODY_DEFAULTS, isPlainObject(body.values) ? body.values : {}).textColor;
  const rows = (Array.isArray(body.rows) ? body.rows : []).map((row: Plain) => {
    const given: Plain = isPlainObject(row.values) ? { ...row.values } : {};
    delete given.cells;
    if (given.noStackMobile === true) {
      given._override = { ...given._override, mobile: { ...given._override?.mobile, noStackMobile: true } };
      given.noStackMobile = false;
    }
    return {
      cells: row.cells,
      values: nodeValues(given, EDITOR_ROW_DEFAULTS),
      columns: (Array.isArray(row.columns) ? row.columns : []).map((column: Plain) => ({
        values: nodeValues(column?.values, EDITOR_COLUMN_DEFAULTS),
        contents: (Array.isArray(column?.contents) ? column.contents : []).map((content: unknown) => block(content, textColor)),
      })),
    };
  });
  const out: Plain = { body: { values: bodyValues, rows } };
  for (const part of ["headers", "footers"]) if (Array.isArray(body[part]) && body[part].length) out.body[part] = body[part];
  return out;
}

/** Where two values differ, deep. */
function differ(expected: unknown, actual: unknown, path: string, out: DesignDifference[]): void {
  if (deepEqual(expected, actual)) return;
  if (Array.isArray(expected) && Array.isArray(actual) && expected.length === actual.length) {
    expected.forEach((item, i) => differ(item, actual[i], `${path}[${i}]`, out));
    return;
  }
  if (isPlainObject(expected) && isPlainObject(actual)) {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) differ(expected[key], actual[key], path ? `${path}.${key}` : key, out);
    return;
  }
  out.push({ path, expected, actual });
}

/** How `actual` differs from `expected`, as the builder shows them (empty: the same design). */
export function compareDesigns(expected: Plain, actual: Plain): DesignDifference[] {
  const out: DesignDifference[] = [];
  differ(normalizeDesign(expected), normalizeDesign(actual), "", out);
  return out;
}
