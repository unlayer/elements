/**
 * Value kinds: what a prop or style property accepts, what it's normalized to,
 * the editor that edits it, and a JSON Schema of its values (for property
 * discovery). Component definitions are made of these, so types, validation
 * and editors come from one place.
 */
import type { Json } from "./model";

export type JsonSchema = { [key: string]: unknown };

/** Conceptual editors, mapped by each editor (the builder, others) to its own widgets. */
export type EditorKind =
  | "color"
  | "length"
  | "insets"
  | "border"
  | "radius"
  | "choice"
  | "fontFamily"
  | "fontFaces"
  | "items"
  | "fontWeight"
  | "lineHeight"
  | "image"
  | "link"
  | "text"
  | "number"
  | "toggle";

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export interface Kind<In = unknown, Out extends Json = Json> {
  readonly name: string;
  readonly editor: EditorKind;
  /** What it accepts, in words (for messages and descriptions). */
  readonly accepts: string;
  parse(input: unknown): Parsed<Out>;
  jsonSchema(): JsonSchema;
  /** Type only: what it accepts as input. */
  readonly __in?: In;
}

export type InputOf<K> = K extends Kind<infer I, Json> ? I : never;
export type OutputOf<K> = K extends Kind<unknown, infer O> ? O : never;

const ok = <T>(value: T): Parsed<T> => ({ ok: true, value });
const fail = (message: string): Parsed<never> => ({ ok: false, message });
const show = (input: unknown): string => {
  try {
    return typeof input === "string" ? JSON.stringify(input) : typeof input === "function" ? "a function" : JSON.stringify(input) ?? String(input);
  } catch {
    return String(input);
  }
};
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function kind<In, Out extends Json>(spec: Omit<Kind<In, Out>, "__in">): Kind<In, Out> {
  return spec;
}

// ─── Numbers and lengths ────────────────────────────────────────────────────

const NUMBER = "-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";

export type LengthUnit = "px" | "%" | "pt" | "mm" | "in";
/** A length in px: a number, or a string with px. */
export type Px = number | `${number}px`;
export type LengthInput<U extends LengthUnit> = number | `${number}${U}`;
/** px as a number, any other unit as a string ("50%", "12pt"). */
export type Length = number | string;

const LENGTH = new RegExp(`^(${NUMBER})(px|%|pt|mm|in)?$`);

/** A length's value and unit, from a number (px) or a string ("12px", "50%", "12" as px). */
export function readLength(input: unknown): { value: number; unit: LengthUnit } | undefined {
  if (typeof input === "number") return Number.isFinite(input) ? { value: input, unit: "px" } : undefined;
  if (typeof input !== "string") return undefined;
  const match = LENGTH.exec(input.trim());
  return match ? { value: Number(match[1]), unit: (match[2] as LengthUnit | undefined) ?? "px" } : undefined;
}

function px(input: unknown, min: number, what: string): Parsed<number> {
  const length = readLength(input);
  if (!length || length.unit !== "px") return fail(`${what} must be a number of px or a px string ("8px"), not ${show(input)}`);
  if (length.value < min) return fail(`${what} can't be less than ${min}, not ${show(input)}`);
  return ok(length.value);
}

/** A length as a document holds it: px as a number, other units as a string. */
export type LengthOf<U extends LengthUnit> = number | `${number}${Exclude<U, "px">}`;

export function length<const U extends LengthUnit = "px">(
  units: readonly U[] = ["px"] as unknown as readonly U[],
  options: { min?: number } = {}
): Kind<LengthInput<U>, LengthOf<U>> {
  const min = options.min ?? 0;
  const accepts = `a length (${units.map((u) => (u === "px" ? "a number of px" : u)).join(", ")})`;
  return kind<LengthInput<U>, LengthOf<U>>({
    name: "length",
    editor: "length",
    accepts,
    parse(input) {
      const parsed = readLength(input);
      if (!parsed) return fail(`expected ${accepts}, not ${show(input)}`);
      if (!units.includes(parsed.unit as U)) return fail(`${parsed.unit} isn't accepted here; expected ${accepts}`);
      if (parsed.value < min) return fail(`can't be less than ${min}, not ${show(input)}`);
      return ok((parsed.unit === "px" ? parsed.value : `${parsed.value}${parsed.unit}`) as LengthOf<U>);
    },
    jsonSchema: () => ({
      anyOf: [
        ...(units.includes("px" as U) ? [{ type: "number", minimum: min }] : []),
        { type: "string", pattern: `^${NUMBER}(${units.map((u) => (u === "%" ? "%" : u)).join("|")})${units.includes("px" as U) ? "?" : ""}$` },
      ],
    }),
  });
}

export function number(options: { min?: number; max?: number; integer?: boolean } = {}): Kind<number, number> {
  const { min = -Infinity, max = Infinity, integer = false } = options;
  const accepts = `${integer ? "an integer" : "a number"}${Number.isFinite(min) ? ` from ${min}` : ""}${Number.isFinite(max) ? ` to ${max}` : ""}`;
  return kind({
    name: "number",
    editor: "number",
    accepts,
    parse(input) {
      if (typeof input !== "number" || !Number.isFinite(input) || (integer && !Number.isInteger(input)) || input < min || input > max) {
        return fail(`expected ${accepts}, not ${show(input)}`);
      }
      return ok(input);
    },
    jsonSchema: () => ({
      type: integer ? "integer" : "number",
      ...(Number.isFinite(min) ? { minimum: min } : {}),
      ...(Number.isFinite(max) ? { maximum: max } : {}),
    }),
  });
}

/** A share of a Row's free width (a grow factor), or "none" to take its own size. */
export function flex(): Kind<number | "none", number | "none"> {
  return kind({
    name: "flex",
    editor: "number",
    accepts: 'a share of the free width (0 or more), or "none"',
    parse: (input) =>
      input === "none" || (typeof input === "number" && Number.isFinite(input) && input >= 0)
        ? ok(input)
        : fail(`expected a share of the free width (0 or more) or "none", not ${show(input)}`),
    jsonSchema: () => ({ anyOf: [{ type: "number", minimum: 0 }, { const: "none" }] }),
  });
}

// ─── Insets, borders, corners ───────────────────────────────────────────────

export type InsetsInput =
  | Px
  | string
  | [Px, Px]
  | [Px, Px, Px]
  | [Px, Px, Px, Px]
  | { top?: Px; right?: Px; bottom?: Px; left?: Px };
export type Insets = { top: number; right: number; bottom: number; left: number };

const SIDES = ["top", "right", "bottom", "left"] as const;

/** CSS's 1-to-4 value order: top, right, bottom, left. */
function fourSides<T>(values: T[]): [T, T, T, T] {
  const [a, b = a, c = a, d = b] = values;
  return [a, b, c, d];
}

export function insets(): Kind<InsetsInput, Insets> {
  const accepts = 'px for all sides, "8px 16px" (1 to 4 values), [v, h] or [t, r, b, l], or { top, right, bottom, left }';
  const read = (values: unknown[]): Parsed<Insets> => {
    if (values.length < 1 || values.length > 4) return fail(`expected ${accepts}`);
    const out: number[] = [];
    for (const value of values) {
      const side = px(value, 0, "each side");
      if (!side.ok) return side;
      out.push(side.value);
    }
    const [top, right, bottom, left] = fourSides(out);
    return ok({ top, right, bottom, left });
  };
  return kind({
    name: "insets",
    editor: "insets",
    accepts,
    parse(input) {
      if (typeof input === "number") return read([input]);
      if (typeof input === "string") return read(input.trim().split(/\s+/));
      if (Array.isArray(input)) return read(input);
      if (isObject(input)) {
        const extra = Object.keys(input).find((key) => !(SIDES as readonly string[]).includes(key));
        if (extra) return fail(`"${extra}" isn't a side; expected top, right, bottom or left`);
        const out = { top: 0, right: 0, bottom: 0, left: 0 };
        for (const side of SIDES) {
          if (input[side] === undefined) continue;
          const value = px(input[side], 0, side);
          if (!value.ok) return value;
          out[side] = value.value;
        }
        return ok(out);
      }
      return fail(`expected ${accepts}, not ${show(input)}`);
    },
    jsonSchema: () => {
      const side = { anyOf: [{ type: "number", minimum: 0 }, { type: "string", pattern: `^${NUMBER}(px)?$` }] };
      return {
        anyOf: [
          side.anyOf[0],
          { type: "string" },
          { type: "array", items: side, minItems: 1, maxItems: 4 },
          { type: "object", properties: Object.fromEntries(SIDES.map((s) => [s, side])), additionalProperties: false },
        ],
      };
    },
  });
}

export type BorderStyle = "solid" | "dashed" | "dotted" | "none";
export type BorderSideInput = { width?: Px; style?: BorderStyle; color?: string };
export type BorderInput =
  | string
  | BorderSideInput
  | { top?: BorderSideInput | string; right?: BorderSideInput | string; bottom?: BorderSideInput | string; left?: BorderSideInput | string };
export type BorderSide = { width: number; style: BorderStyle; color: string };
export type Border = { top?: BorderSide; right?: BorderSide; bottom?: BorderSide; left?: BorderSide };

const BORDER_STYLES: readonly BorderStyle[] = ["solid", "dashed", "dotted", "none"];

function borderSide(input: unknown): Parsed<BorderSide> {
  const out: BorderSide = { width: 1, style: "solid", color: "#000000" };
  if (typeof input === "string") {
    for (const token of input.match(/rgba?\([^)]*\)|\S+/g) ?? []) {
      if (readLength(token)) {
        const width = px(token, 0, "a border's width");
        if (!width.ok) return width;
        out.width = width.value;
      } else if ((BORDER_STYLES as readonly string[]).includes(token)) {
        out.style = token as BorderStyle;
      } else {
        const c = parseColor(token);
        if (!c.ok) return fail(`"${token}" in ${show(input)} isn't a width, a style (${BORDER_STYLES.join(", ")}) or a color`);
        out.color = c.value;
      }
    }
    return ok(out);
  }
  if (!isObject(input)) return fail(`expected "1px solid #ccc" or { width, style, color }, not ${show(input)}`);
  const extra = Object.keys(input).find((key) => !["width", "style", "color"].includes(key));
  if (extra) return fail(`"${extra}" isn't part of a border side; expected width, style or color`);
  if (input.width !== undefined) {
    const width = px(input.width, 0, "a border's width");
    if (!width.ok) return width;
    out.width = width.value;
  }
  if (input.style !== undefined) {
    if (!(BORDER_STYLES as readonly unknown[]).includes(input.style)) return fail(`a border's style is one of ${BORDER_STYLES.join(", ")}, not ${show(input.style)}`);
    out.style = input.style as BorderStyle;
  }
  if (input.color !== undefined) {
    const c = parseColor(input.color);
    if (!c.ok) return c;
    out.color = c.value;
  }
  return ok(out);
}

/** One line, as a border side: `"1px solid #eee"` or `{ width, style, color }` (a table's line between rows). */
export function line(): Kind<string | BorderSideInput, BorderSide> {
  return kind<string | BorderSideInput, BorderSide>({
    name: "line",
    editor: "border",
    accepts: '"1px solid #ccc" or { width, style, color }',
    parse: (input) => borderSide(input),
    jsonSchema: () => ({
      anyOf: [
        { type: "string" },
        {
          type: "object",
          properties: { width: { anyOf: [{ type: "number", minimum: 0 }, { type: "string" }] }, style: { enum: [...BORDER_STYLES] }, color: { type: "string" } },
          additionalProperties: false,
        },
      ],
    }),
  });
}

export function border(): Kind<BorderInput, Border> {
  return kind({
    name: "border",
    editor: "border",
    accepts: '"1px solid #ccc", { width, style, color } for all sides, or { top, right, bottom, left } with one of those each',
    parse(input) {
      const perSide = isObject(input) && Object.keys(input).some((key) => (SIDES as readonly string[]).includes(key));
      if (!perSide) {
        const side = borderSide(input);
        return side.ok ? ok({ top: side.value, right: side.value, bottom: side.value, left: side.value }) : side;
      }
      const out: Border = {};
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        if (!(SIDES as readonly string[]).includes(key)) return fail(`"${key}" isn't a side; expected top, right, bottom or left`);
        const side = borderSide(value);
        if (!side.ok) return fail(`${key}: ${side.message}`);
        out[key as (typeof SIDES)[number]] = side.value;
      }
      return ok(out);
    },
    jsonSchema: () => {
      const side = {
        anyOf: [
          { type: "string" },
          {
            type: "object",
            properties: { width: { anyOf: [{ type: "number", minimum: 0 }, { type: "string" }] }, style: { enum: [...BORDER_STYLES] }, color: { type: "string" } },
            additionalProperties: false,
          },
        ],
      };
      return { anyOf: [...side.anyOf, { type: "object", properties: Object.fromEntries(SIDES.map((s) => [s, side])), additionalProperties: false }] };
    },
  });
}

export type RadiusInput = Px | [Px, Px, Px, Px] | { topLeft?: Px; topRight?: Px; bottomRight?: Px; bottomLeft?: Px };
export type Corners = { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
export type Radius = number | Corners;

const CORNERS = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;

export function radius(): Kind<RadiusInput, Radius> {
  const accepts = "px for every corner, [topLeft, topRight, bottomRight, bottomLeft], or { topLeft, topRight, bottomRight, bottomLeft }";
  return kind<RadiusInput, Radius>({
    name: "radius",
    editor: "radius",
    accepts,
    parse(input) {
      let values: unknown[];
      if (Array.isArray(input)) {
        if (input.length !== 4) return fail(`expected ${accepts}`);
        values = input;
      } else if (isObject(input)) {
        const extra = Object.keys(input).find((key) => !(CORNERS as readonly string[]).includes(key));
        if (extra) return fail(`"${extra}" isn't a corner; expected ${CORNERS.join(", ")}`);
        values = CORNERS.map((corner) => input[corner] ?? 0);
      } else {
        return px(input, 0, "a radius");
      }
      const out: number[] = [];
      for (const value of values) {
        const corner = px(value, 0, "a corner");
        if (!corner.ok) return corner;
        out.push(corner.value);
      }
      if (out.every((value) => value === out[0])) return ok(out[0]);
      const [topLeft, topRight, bottomRight, bottomLeft] = out;
      return ok({ topLeft, topRight, bottomRight, bottomLeft });
    },
    jsonSchema: () => {
      const corner = { anyOf: [{ type: "number", minimum: 0 }, { type: "string", pattern: `^${NUMBER}(px)?$` }] };
      return {
        anyOf: [
          ...corner.anyOf,
          { type: "array", items: corner, minItems: 4, maxItems: 4 },
          { type: "object", properties: Object.fromEntries(CORNERS.map((c) => [c, corner])), additionalProperties: false },
        ],
      };
    },
  });
}

// ─── Choices, text, flags ───────────────────────────────────────────────────

export function enumOf<const V extends readonly (string | number)[]>(values: V): Kind<V[number], V[number]> {
  const accepts = `one of ${values.map((v) => JSON.stringify(v)).join(", ")}`;
  return kind({
    name: "enum",
    editor: "choice",
    accepts,
    parse: (input) => ((values as readonly unknown[]).includes(input) ? ok(input as V[number]) : fail(`expected ${accepts}, not ${show(input)}`)),
    jsonSchema: () => ({ enum: [...values] }),
  });
}

/** Text, at most `maxLength` long; with a `pattern`, text it finds something in (`mismatch` says what's missing). */
export function text(options: { maxLength?: number; pattern?: RegExp; mismatch?: string } = {}): Kind<string, string> {
  return kind({
    name: "text",
    editor: "text",
    accepts: "text",
    parse(input) {
      if (typeof input !== "string") return fail(`expected text, not ${show(input)}`);
      if (options.maxLength !== undefined && input.length > options.maxLength) return fail(`is longer than ${options.maxLength} characters`);
      if (options.pattern && !options.pattern.test(input)) return fail(options.mismatch ?? `doesn't match ${options.pattern.source}`);
      return ok(input);
    },
    jsonSchema: () => ({ type: "string", ...(options.maxLength !== undefined ? { maxLength: options.maxLength } : {}), ...(options.pattern ? { pattern: options.pattern.source } : {}) }),
  });
}

export function boolean(): Kind<boolean, boolean> {
  return kind({
    name: "boolean",
    editor: "toggle",
    accepts: "true or false",
    parse: (input) => (typeof input === "boolean" ? ok(input) : fail(`expected true or false, not ${show(input)}`)),
    jsonSchema: () => ({ type: "boolean" }),
  });
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen transparent"
  ).split(" ")
);

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+%?)\s*)?\)$/i;

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** A color as "#rrggbb", "rgba(r, g, b, a)" when it's see-through, or a lowercase CSS name. */
export function parseColor(input: unknown): Parsed<string> {
  if (typeof input !== "string") return fail(`expected a color ("#0879a1", "rgb(…)", "rgba(…)" or a CSS name), not ${show(input)}`);
  const value = input.trim().toLowerCase();
  const hex = HEX.exec(value);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    if (digits.length === 6 || digits.slice(6) === "ff") return ok(`#${digits.slice(0, 6)}`);
    const alpha = Math.round((parseInt(digits.slice(6), 16) / 255) * 1000) / 1000;
    return ok(`rgba(${parseInt(digits.slice(0, 2), 16)}, ${parseInt(digits.slice(2, 4), 16)}, ${parseInt(digits.slice(4, 6), 16)}, ${alpha})`);
  }
  const rgb = RGB.exec(value);
  if (rgb) {
    const channels = rgb.slice(1, 4).map(Number);
    if (channels.some((c) => c > 255)) return fail(`a color channel is 0 to 255 in ${show(input)}`);
    let alpha = 1;
    if (rgb[4] !== undefined) {
      alpha = rgb[4].endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
      if (!(alpha >= 0 && alpha <= 1)) return fail(`a color's alpha is 0 to 1 in ${show(input)}`);
    }
    return ok(alpha === 1 ? `#${channels.map(hex2).join("")}` : `rgba(${channels.join(", ")}, ${alpha})`);
  }
  if (NAMED_COLORS.has(value)) return ok(value);
  return fail(`expected a color ("#0879a1", "rgb(…)", "rgba(…)" or a CSS name), not ${show(input)}`);
}

export function color(): Kind<string, string> {
  return kind({
    name: "color",
    editor: "color",
    accepts: 'a color ("#0879a1", "rgb(…)", "rgba(…)" or a CSS name)',
    parse: parseColor,
    jsonSchema: () => ({ type: "string" }),
  });
}

// ─── Fonts ──────────────────────────────────────────────────────────────────

/** A font stack, as CSS writes it: "Inter, Arial, sans-serif". Web fonts are declared once, in the root's `fonts`. */
export type FontFamilyInput = string;
export type FontFamily = string;

/** What can't be in a font name or stack: what would end a declaration or a stylesheet. */
const FONT_UNSAFE = /[;{}<>\\\n\r]/;

export function fontFamily(): Kind<FontFamilyInput, FontFamily> {
  const accepts = 'a font stack, as CSS writes it ("Inter, Arial, sans-serif")';
  return kind<FontFamilyInput, FontFamily>({
    name: "fontFamily",
    editor: "fontFamily",
    accepts,
    parse(input) {
      if (isObject(input) && "src" in input) return fail("a web font is declared once, in the root's fonts ({ family, src, weight, style }); fontFamily names it in a stack");
      if (typeof input !== "string" || !input.trim() || FONT_UNSAFE.test(input)) return fail(`expected ${accepts}, not ${show(input)}`);
      return ok(input.trim());
    },
    jsonSchema: () => ({ type: "string", minLength: 1 }),
  });
}

/** The families of a font stack, unquoted: "'Brand Sans', Arial" is ["Brand Sans", "Arial"]. */
export function fontStack(stack: string): string[] {
  return stack
    .split(",")
    .map((family) => family.trim().replace(/^(["'])(.*)\1$/, "$2"))
    .filter(Boolean);
}

export type FontFormat = "woff2" | "woff" | "truetype" | "opentype";
const FONT_FORMATS: readonly FontFormat[] = ["woff2", "woff", "truetype", "opentype"];

export type FontFaceInput = {
  /** The name text uses for it in a fontFamily stack. */
  family: string;
  /** Its file: an http(s) URL, or a data:font URI. */
  src: string;
  /** The file's format; from its extension where not given. */
  format?: FontFormat;
  /** The weight this file draws (400, "bold"), or the range a variable font covers ("100 900"). */
  weight?: FontWeightInput | number | `${number} ${number}`;
  style?: "normal" | "italic";
};
export type FontFace = { family: string; src: string; format?: FontFormat; weight?: number | [number, number]; style?: "normal" | "italic" };

/** Web fonts: the faces a template loads, each a family's file for a weight and style. */
/** A list of items, each an object of the given fields, all of them required (a menu's links, a line of icons). */
export function items<const F extends Record<string, Kind<any, Json>>>(
  fields: F,
  noun: string
): Kind<Array<{ [K in keyof F]: InputOf<F[K]> }>, Array<{ [K in keyof F]: OutputOf<F[K]> }>> {
  const names = Object.keys(fields);
  const shape = `{ ${names.join(", ")} }`;
  const accepts = `a list of ${noun}s, each ${shape}`;
  return kind({
    name: "items",
    editor: "items",
    accepts,
    parse(input) {
      if (!Array.isArray(input)) return fail(`expected ${accepts}, not ${show(input)}`);
      const out: Array<Record<string, Json>> = [];
      for (const [index, item] of input.entries()) {
        const at = `${noun} ${index + 1}`;
        if (!isObject(item)) return fail(`${at}: expected ${shape}, not ${show(item)}`);
        const extra = Object.keys(item).find((key) => !names.includes(key));
        if (extra) return fail(`${at}: "${extra}" isn't one of its fields (${names.join(", ")})`);
        const value: Record<string, Json> = {};
        for (const name of names) {
          if (item[name] === undefined) return fail(`${at}: ${name} is missing`);
          const parsed = fields[name].parse(item[name]);
          if (!parsed.ok) return fail(`${at}: ${name}: ${parsed.message}`);
          value[name] = parsed.value;
        }
        out.push(value);
      }
      return ok(out as Array<{ [K in keyof F]: OutputOf<F[K]> }>);
    },
    jsonSchema: () => ({
      type: "array",
      items: { type: "object", required: names, properties: Object.fromEntries(names.map((name) => [name, fields[name].jsonSchema()])), additionalProperties: false },
    }),
  });
}

export function fontFaces(): Kind<FontFaceInput[], FontFace[]> {
  const accepts = "a list of { family, src, format, weight, style }";
  const face = (input: unknown, index: number): Parsed<FontFace> => {
    const at = `font ${index + 1}`;
    if (!isObject(input)) return fail(`${at}: expected { family, src, format, weight, style }, not ${show(input)}`);
    const extra = Object.keys(input).find((key) => !["family", "src", "format", "weight", "style"].includes(key));
    if (extra) return fail(`${at}: "${extra}" isn't part of a font; expected family, src, format, weight or style`);
    if (typeof input.family !== "string" || !input.family.trim() || FONT_UNSAFE.test(input.family) || input.family.includes(",")) {
      return fail(`${at}: family is one font's name ("Inter"), not ${show(input.family)}`);
    }
    if (typeof input.src !== "string" || !input.src.trim() || unsafeUrl(input.src, /^data:(font|application)\//)) {
      return fail(`${at}: src is the font file's http(s) URL (or a data:font URI), not ${show(input.src)}`);
    }
    const out: FontFace = { family: input.family.trim(), src: input.src.trim() };
    if (input.format !== undefined) {
      if (!(FONT_FORMATS as readonly unknown[]).includes(input.format)) return fail(`${at}: format is one of ${FONT_FORMATS.join(", ")}, not ${show(input.format)}`);
      out.format = input.format as FontFormat;
    }
    if (input.weight !== undefined) {
      // A range as written ("100 900"), or as parsed ([100, 900]): a font is checked again once it's been read.
      const range = typeof input.weight === "string" ? /^\s*(\d+)\s+(\d+)\s*$/.exec(input.weight) : Array.isArray(input.weight) && input.weight.length === 2 && input.weight.every(Number.isInteger) ? [null, ...input.weight] : null;
      const weight = input.weight === "normal" ? 400 : input.weight === "bold" ? 700 : input.weight;
      if (range && Number(range[1]) >= 1 && Number(range[2]) <= 1000 && Number(range[1]) <= Number(range[2])) out.weight = [Number(range[1]), Number(range[2])];
      else if (typeof weight === "number" && Number.isInteger(weight) && weight >= 1 && weight <= 1000) out.weight = weight;
      else return fail(`${at}: weight is 1 to 1000, "normal", "bold", or a range ("100 900"), not ${show(input.weight)}`);
    }
    if (input.style !== undefined) {
      if (input.style !== "normal" && input.style !== "italic") return fail(`${at}: style is "normal" or "italic", not ${show(input.style)}`);
      out.style = input.style;
    }
    return ok(out);
  };
  return kind<FontFaceInput[], FontFace[]>({
    name: "fontFaces",
    editor: "fontFaces",
    accepts,
    parse(input) {
      if (!Array.isArray(input)) return fail(`expected ${accepts}, not ${show(input)}`);
      const out: FontFace[] = [];
      for (const [index, item] of input.entries()) {
        const parsed = face(item, index);
        if (!parsed.ok) return parsed;
        out.push(parsed.value);
      }
      return ok(out);
    },
    jsonSchema: () => ({
      type: "array",
      items: {
        type: "object",
        required: ["family", "src"],
        properties: {
          family: { type: "string", minLength: 1 },
          src: { type: "string", minLength: 1 },
          format: { enum: [...FONT_FORMATS] },
          weight: { anyOf: [{ type: "number", minimum: 1, maximum: 1000 }, { type: "string" }] },
          style: { enum: ["normal", "italic"] },
        },
        additionalProperties: false,
      },
    }),
  });
}

export type FontWeightInput = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | "normal" | "bold";

export function fontWeight(): Kind<FontWeightInput, number> {
  return kind({
    name: "fontWeight",
    editor: "fontWeight",
    accepts: '100 to 900 in hundreds, "normal" or "bold"',
    parse(input) {
      if (input === "normal") return ok(400);
      if (input === "bold") return ok(700);
      if (typeof input === "number" && input >= 100 && input <= 900 && input % 100 === 0) return ok(input);
      return fail(`expected 100 to 900 in hundreds, "normal" or "bold", not ${show(input)}`);
    },
    jsonSchema: () => ({ anyOf: [{ enum: [100, 200, 300, 400, 500, 600, 700, 800, 900] }, { enum: ["normal", "bold"] }] }),
  });
}

export type LineHeightInput = number | `${number}px` | `${number}%` | "normal";
/** A multiple of the font size (1.5), or a fixed height in px ("24px"). */
export type LineHeight = number | `${number}px` | "normal";

export function lineHeight(): Kind<LineHeightInput, LineHeight> {
  const accepts = 'a multiple of the font size (1.5), a percentage ("150%"), px ("24px") or "normal" (the font\'s own)';
  return kind<LineHeightInput, LineHeight>({
    name: "lineHeight",
    editor: "lineHeight",
    accepts,
    parse(input) {
      if (input === "normal") return ok("normal");
      if (typeof input === "number") return input > 0 && Number.isFinite(input) ? ok(input) : fail(`expected ${accepts}, not ${show(input)}`);
      const parsed = typeof input === "string" && /^\s*-?[\d.]+\s*$/.test(input) ? undefined : readLength(input);
      if (!parsed || parsed.value <= 0 || (parsed.unit !== "px" && parsed.unit !== "%")) return fail(`expected ${accepts}, not ${show(input)}`);
      return ok(parsed.unit === "%" ? Math.round(parsed.value * 1000) / 100000 : (`${parsed.value}px` as const));
    },
    jsonSchema: () => ({ anyOf: [{ type: "number", exclusiveMinimum: 0 }, { type: "string", pattern: `^${NUMBER}(px|%)$` }, { const: "normal" }] }),
  });
}

// ─── URLs: images and links ─────────────────────────────────────────────────

/**
 * An email service's tag in a URL, as it's written or as today's components keep it from the writers (a mark:
 * packages/react/src/compat/values.ts). Its service fills it in later, perhaps with nothing.
 */
const SERVICE_TAG = /<%[\s\S]*?%>|\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}|\uFDD0\d+\uFDD1/g;

/** A URL scheme that runs code or reads local files, after the characters browsers ignore in one, and without what a service fills in. */
function unsafeUrl(url: string, allowedData?: RegExp): boolean {
  // eslint-disable-next-line no-control-regex
  const compact = url.replace(SERVICE_TAG, "").replace(/[\u0000- \u007f-\u009f]/g, "").toLowerCase();
  if (compact.startsWith("data:")) return !allowedData || !allowedData.test(compact);
  return /^(javascript|vbscript|file):/.test(compact);
}

export type AssetInput = string | { src: string; width?: number; height?: number };
/** A URL, or one with the image's own size in px (used to size it where no width is set). */
export type Asset = string | { src: string; width?: number; height?: number };

const IMAGE_DATA = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml)[;,]/;

export function asset(): Kind<AssetInput, Asset> {
  const accepts = "an image URL (http, https or a data:image URI), or { src, width, height }";
  return kind<AssetInput, Asset>({
    name: "asset",
    editor: "image",
    accepts,
    parse(input) {
      const src = typeof input === "string" ? input : isObject(input) ? input.src : undefined;
      if (typeof src !== "string" || !src.trim()) return fail(`expected ${accepts}, not ${show(input)}`);
      if (unsafeUrl(src, IMAGE_DATA)) return fail(`${show(src)} isn't an image URL Elements will write`);
      if (typeof input === "string") return ok(src.trim());
      const extra = Object.keys(input as object).find((key) => !["src", "width", "height"].includes(key));
      if (extra) return fail(`"${extra}" isn't part of an image; expected src, width or height`);
      const out: { src: string; width?: number; height?: number } = { src: src.trim() };
      for (const side of ["width", "height"] as const) {
        const value = (input as Record<string, unknown>)[side];
        if (value === undefined) continue;
        if (typeof value !== "number" || !(value > 0)) return fail(`an image's ${side} is its size in px, not ${show(value)}`);
        out[side] = value;
      }
      return ok(out);
    },
    jsonSchema: () => ({
      anyOf: [
        { type: "string", minLength: 1 },
        {
          type: "object",
          required: ["src"],
          properties: { src: { type: "string", minLength: 1 }, width: { type: "number", exclusiveMinimum: 0 }, height: { type: "number", exclusiveMinimum: 0 } },
          additionalProperties: false,
        },
      ],
    }),
  });
}

export type LinkTarget = "_blank" | "_self";
export type LinkInput = string | { href: string; target?: LinkTarget };
export type LinkValue = string | { href: string; target?: LinkTarget };

// ─── Videos ─────────────────────────────────────────────────────────────────

export type VideoProvider = "youtube" | "vimeo";
const YOUTUBE = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
const VIMEO = /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * A video's provider and id, and what follows from them without the network: its player's URL, and a YouTube
 * video's thumbnail (a Vimeo video's is only found by asking Vimeo).
 */
export function videoParts(url: string): { provider: VideoProvider; id: string; embed: string; thumbnail?: string } | undefined {
  const youtube = YOUTUBE.exec(url);
  if (youtube) return { provider: "youtube", id: youtube[1], embed: `https://www.youtube.com/embed/${youtube[1]}`, thumbnail: `https://img.youtube.com/vi/${youtube[1]}/0.jpg` };
  const vimeo = VIMEO.exec(url);
  if (vimeo) return { provider: "vimeo", id: vimeo[1], embed: `https://player.vimeo.com/video/${vimeo[1]}` };
  return undefined;
}

export function video(): Kind<string, string> {
  const accepts = "a YouTube or Vimeo video's https link";
  return kind<string, string>({
    name: "video",
    editor: "link",
    accepts,
    parse(input) {
      if (typeof input !== "string" || !videoParts(input.trim())) return fail(`expected ${accepts}, not ${show(input)}`);
      return ok(input.trim());
    },
    jsonSchema: () => ({ type: "string", pattern: "^https://" }),
  });
}

export function link(): Kind<LinkInput, LinkValue> {
  const accepts = "a URL (http, https, mailto, tel, a path, or a merge tag) or { href, target }";
  return kind<LinkInput, LinkValue>({
    name: "link",
    editor: "link",
    accepts,
    parse(input) {
      const href = typeof input === "string" ? input : isObject(input) ? input.href : undefined;
      // A link to nothing is { href: "" }, as a template from another format says one has no URL; a string that's empty is a mistake.
      if (typeof href !== "string" || (!href.trim() && (typeof input === "string" || href !== ""))) return fail(`expected ${accepts}, not ${show(input)}`);
      if (unsafeUrl(href)) return fail(`${show(href)} isn't a link Elements will write (scripts, data and local files aren't)`);
      if (typeof input === "string") return ok(href.trim());
      const extra = Object.keys(input as object).find((key) => !["href", "target"].includes(key));
      if (extra) return fail(`"${extra}" isn't part of a link; expected href or target`);
      const target = (input as Record<string, unknown>).target;
      if (target === undefined) return ok(href ? href.trim() : { href });
      if (target !== "_blank" && target !== "_self") return fail(`a link's target is "_blank" or "_self", not ${show(target)}`);
      return ok({ href: href.trim(), target });
    },
    jsonSchema: () => ({
      anyOf: [
        { type: "string", minLength: 1 },
        { type: "object", required: ["href"], properties: { href: { type: "string" }, target: { enum: ["_blank", "_self"] } }, additionalProperties: false },
      ],
    }),
  });
}

/** More attributes for an element, by name (a link's class, a `data-` attribute): not its handlers, which run scripts. */
export function attributes(): Kind<Record<string, string>, Record<string, string>> {
  const accepts = "attributes by name, each a text value (no on… handlers, href or style)";
  return kind<Record<string, string>, Record<string, string>>({
    name: "attributes",
    editor: "text",
    accepts,
    parse(input) {
      if (!isObject(input)) return fail(`expected ${accepts}, not ${show(input)}`);
      for (const [name, value] of Object.entries(input)) {
        if (!/^[a-zA-Z_:][\w:.-]*$/.test(name) || /^(on|href$|style$)/i.test(name) || typeof value !== "string") return fail(`${show(name)} isn't an attribute Elements will write, with ${show(value)}`);
      }
      return ok(input as Record<string, string>);
    },
    jsonSchema: () => ({ type: "object", additionalProperties: { type: "string" } }),
  });
}

/** A link's href and target, from either form. */
export function linkParts(value: LinkValue): { href: string; target?: LinkTarget } {
  return typeof value === "string" ? { href: value } : value;
}

/** An image's URL and own size, from either form. */
export function assetParts(value: Asset): { src: string; width?: number; height?: number } {
  return typeof value === "string" ? { src: value } : value;
}
