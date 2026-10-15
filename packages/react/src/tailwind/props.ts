/**
 * Declarations (see declarations.ts) as a component's props, by the table it gives (`classes` beside its props, see
 * utils/tailwind.ts): the shared part is here (what each CSS property is, how spacing and borders combine, phone
 * and hover variants), what differs (Button's padding is inside it, a Row's background paints the content width)
 * is the component's. Props given explicitly win; what a component can't take is reported, never dropped quietly.
 */
import { TABLES } from "./tables";
import { shorthand, sidesOf, type Margins } from "./row";
import { rowRewrite } from "./inherit";
import { PROP_ALIASES } from "@unlayer-internal/shared-elements";
import { BodyDefaults } from "@unlayer/exporters";


const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");
/** On a Row's and the root's props: the text styles their classes pass on to the text inside (see inherit.ts). */
const PASSED = Symbol.for("@unlayer/react-elements/tailwind-text");
/** Text styles CSS inherits, which a Row, a Column or the root passes on to its text blocks (see inherit.ts). */
const INHERITED = new Set(["color", "font-size", "line-height", "font-weight", "font-family", "letter-spacing", "text-align"]);
/** Of those, what a text block can take on phones (or above a breakpoint), as its `mobile` prop does. */
const BY_SCREEN = new Set(["font-size", "line-height", "text-align"]);
const ROOTS = new Set(["Email", "Page", "Document", "Body"]);
/** The text color the editor's body has by default: what a border without a color shows where nothing sets one. */
const BODY_TEXT: string = BodyDefaults.textColor;

/** A component's class table (see tables.ts), read. */
interface Table {
  text?: unknown;
  container?: unknown;
  display?: unknown;
  phone?: string | null;
  bg?: string | null;
  color?: string | null;
  fontSize?: string | null;
  lineHeight?: string | null;
  fontWeight?: string | null;
  fontFamily?: string | null;
  letterSpacing?: string | null;
  textAlign?: string | null;
  padding?: string | null;
  margin?: string | null;
  border?: string | null;
  radius?: string | null;
  width?: string | null;
  maxWidth?: string | null;
  hoverBg?: string | null;
  hoverColor?: string | null;
}

/** `bg=backgroundColor padding lineHeight= phone=fontSize,padding` → `{ bg: "backgroundColor", padding: "padding", lineHeight: null, phone: "fontSize,padding" }`. */
const read = (table: string): Table => Object.fromEntries(table.split(" ").filter(Boolean).map((token) => { const [key, value] = token.split("="); return [key, value === undefined ? key : value || null]; }));
import { isColor } from "./color";
import type { ClassDeclaration, ClassDeclarations } from "./declarations";

/** A content block: spacing around and inside it is the padding of the box it's in, and it can be hidden. */
const BLOCK: Table = { padding: "containerPadding", margin: "containerPadding", display: true };
const TEXT: Table = { color: "color", fontSize: "fontSize", lineHeight: "lineHeight", fontWeight: "fontWeight", fontFamily: "fontFamily", letterSpacing: "letterSpacing", textAlign: "textAlign" };
/** What a prop is when nothing sets it (a block's spacing, a container's padding, corners, borders). */
const UNSET: Record<string, string> = { containerPadding: "10px", padding: "0px", margin: "0px", borderRadius: "0px" };

const SIMPLE: Record<string, keyof Table> = {
  "background-color": "bg",
  color: "color",
  "font-size": "fontSize",
  "line-height": "lineHeight",
  "font-weight": "fontWeight",
  "font-family": "fontFamily",
  "letter-spacing": "letterSpacing",
  "text-align": "textAlign",
  width: "width",
  "max-width": "maxWidth",
  display: "display",
};
const SIDES = ["Top", "Right", "Bottom", "Left"];
// Logical sides as in a left-to-right document.
const AREAS: Record<string, number[]> = {
  "": [0, 1, 2, 3],
  top: [0],
  right: [1],
  bottom: [2],
  left: [3],
  inline: [1, 3],
  block: [0, 2],
  "inline-start": [3],
  "inline-end": [1],
  "block-start": [0],
  "block-end": [2],
};
const CORNERS: Record<string, number[]> = { "": [0, 1, 2, 3], "top-left": [0], "top-right": [1], "bottom-right": [2], "bottom-left": [3], "start-start": [0], "start-end": [1], "end-end": [2], "end-start": [3] };
const PARTS = ["Width", "Style", "Color"] as const;

type Sides = Array<ClassDeclaration | undefined>;
interface Box {
  one: Map<string, ClassDeclaration>;
  padding: Sides;
  margin: Sides;
  radius: Sides;
  border: Record<(typeof PARTS)[number], Sides>;
  other: ClassDeclaration[];
}

const box = (): Box => ({ one: new Map(), padding: [], margin: [], radius: [], border: { Width: [], Style: [], Color: [] }, other: [] });

function add(into: Box, d: ClassDeclaration): void {
  const p = d.property;
  const key = SIMPLE[p] ?? (p === "background" && isColor(d.value) ? "bg" : undefined);
  if (key) return void into.one.set(key, d);
  let m = /^(padding|margin)(?:-(top|right|bottom|left|inline|block)(?:-(start|end))?)?$/.exec(p);
  if (m) return void AREAS[m[3] ? `${m[2]}-${m[3]}` : m[2] ?? ""]?.forEach((i) => ((into[m![1] as "padding" | "margin"] as Sides)[i] = d));
  m = /^border(?:-(top|right|bottom|left|inline|block)(?:-(start|end))?)?-(width|style|color)$/.exec(p);
  if (m) return void AREAS[m[2] ? `${m[1]}-${m[2]}` : m[1] ?? ""]?.forEach((i) => (into.border[(m![3][0].toUpperCase() + m![3].slice(1)) as (typeof PARTS)[number]][i] = d));
  m = /^border(?:-(top|bottom|start|end)-(left|right|start|end))?-radius$/.exec(p);
  if (m && CORNERS[m[1] ? `${m[1]}-${m[2]}` : ""]) return void CORNERS[m[1] ? `${m[1]}-${m[2]}` : ""].forEach((i) => (into.radius[i] = d));
  into.other.push(d);
}

const LENGTH = /^(\d*\.?\d+)(px|%|em)?$/;
const plain = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Whether a prop of component `name` is given explicitly: flat, in a group (`buttonColors.color`,
 * `border.borderTopColor`), in `values`, or by another name it takes for it (`textColor` for `color`, `align` for
 * `textAlign`: see PROP_ALIASES).
 */
export function given(explicit: Record<string, any>, prop: string, name = ""): boolean {
  const look = (p: string) =>
    [explicit, explicit.values].some((o) => plain(o) && (o[p] !== undefined || Object.entries(o).some(([k, v]) => !/^(mobile|_override|values)$/.test(k) && plain(v) && v[p] !== undefined)));
  const aliases = Object.entries(PROP_ALIASES[name] ?? {}).flatMap(([alias, props]) => (props.split(" ").includes(prop) ? [alias] : []));
  // An image's width and maxWidth are one setting.
  return look(prop) || aliases.some(look) || (prop === "width" && look("maxWidth")) || (prop === "maxWidth" && look("width"));
}

/**
 * An image's display width from a width and a max width, as the browser shows it on a desktop: the smaller one,
 * where that can be told without the column's width (both in pixels, both percentages, or one of them 100%).
 */
function oneWidth(width: string, max: string): string | undefined {
  if (width === "100%") return max;
  if (max === "100%") return width;
  return /%$/.test(width) === /%$/.test(max) ? (parseFloat(width) <= parseFloat(max) ? width : max) : undefined;
}

/** A simple value as the prop takes it; undefined where it can't. */
function convert(key: string, value: string): unknown {
  switch (key) {
    case "lineHeight":
      // Unitless, as the editor writes line heights: a percentage.
      return /^\d*\.?\d+$/.test(value) ? `${parseFloat((parseFloat(value) * 100).toFixed(2))}%` : value;
    case "fontWeight":
      return /^\d+$/.test(value) ? Number(value) : value;
    case "textAlign": {
      const align = value === "start" ? "left" : value === "end" ? "right" : value;
      return /^(left|center|right|justify)$/.test(align) ? align : undefined;
    }
    case "width":
    case "maxWidth":
      return value === "0" ? "0px" : /^\d*\.?\d+(px|%)$/.test(value) ? value : undefined;
    default:
      return value;
  }
}

type Found = Map<string, { value: unknown; d: ClassDeclaration }>;

/**
 * Turns a component's classes into its props. `explicit`: the props it's given (they win); `defaults`: its default
 * values (what a phone shows where only a breakpoint variant, `sm:`, sets a prop). `quiet`: for text styles a block
 * takes from around it (see inherit.ts), what it can't take is passed over, not said or inlined.
 */
export function classesToProps(name: string, found: ClassDeclarations, explicit: Record<string, any>, defaults: Record<string, any> = {}, quiet = false): Record<string, any> {
  const own = read(TABLES[name] ?? "");
  const warn = (text: string) => quiet || console.warn(`[Unlayer] ${name} ${text}.`);
  const has = (prop: string) => given(explicit, prop, name);
  const ignore = (d: ClassDeclaration, why = "") => warn(`ignores \`${d.property}: ${d.value}\` from class \`${d.className}\`${why}`);
  // What no prop takes (unless a variant's, which can't apply as a style): inlined on the component's element.
  const style: Record<string, string> = {};
  const keep = (d: ClassDeclaration) => {
    if (quiet) return;
    style[d.property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = d.value + (d.important ? " !important" : "");
    warn(`\`${d.property}: ${d.value}\` from class \`${d.className}\` is kept in HTML (an inline style) but not in the design for the visual editor`);
  };
  for (const { className, reason } of found.ignored) warn(`ignores class \`${className}\`: ${reason}`);

  // A Row's, a Column's or the root's text styles are its text blocks' (inherit.ts gives them), as CSS inherits them:
  // the root's color and font family are the body's too, as the editor has them.
  const root = ROOTS.has(name);
  const text: ClassDeclaration[] = [];
  if (root || name === "Row" || name === "Column") {
    const rest: ClassDeclaration[] = [];
    for (const d of found.declarations) {
      const passed = INHERITED.has(d.property) && d.when !== "hover" && (d.when === "always" || BY_SCREEN.has(d.property));
      if (passed && !(root && d.property === "font-family")) text.push(d);
      if (!passed || (root && /^(color|font-family)$/.test(d.property))) rest.push(d);
    }
    found = { ...found, declarations: rest };
  }
  // `w-auto` on an Image is its responsive width, the editor's auto width.
  if (name === "Image") found = { ...found, declarations: found.declarations.map((d) => (d.property === "width" && d.value === "auto" ? { ...d, value: "100%" } : d)) };

  const table: Table = { ...(own.container ? {} : BLOCK), ...(own.text ? TEXT : {}), ...own };
  const phoneable = new Set(`${own.container ? "" : "containerPadding"},${own.phone ?? ""}`.split(",").filter(Boolean));
  const onPhones = (prop: string) => phoneable.has(prop) || (/^border(Top|Right|Bottom|Left)/.test(prop) && phoneable.has("border"));
  const boxes: Record<ClassDeclaration["when"], Box> = { always: box(), phone: box(), desktop: box(), hover: box() };
  for (const d of found.declarations) add(boxes[d.when], d);
  const unset = (prop: string) => defaults[prop] ?? UNSET[prop] ?? (/^border.*Width$/.test(prop) ? "0px" : undefined);

  /** One condition's props; `under(prop)` is what the sides and corners it doesn't set are, `drop` what no prop takes. */
  const propsOf = (b: Box, under: (prop: string) => unknown, drop = ignore): Found => {
    const out: Found = new Map();
    for (const [key, d] of b.one) {
      if (key === "display") continue;
      const prop = table[key as keyof Table];
      const value = typeof prop === "string" ? convert(key, d.value) : undefined;
      if (value === undefined) drop(d);
      else out.set(prop as string, { value, d });
    }
    // Spacing: a block's margins and padding are both the padding around it, added up.
    const spacing = new Map<string, Sides>();
    for (const kind of ["padding", "margin"] as const) {
      b[kind].forEach((d, i) => {
        if (!d) return;
        const prop = table[kind];
        if (!prop || !LENGTH.test(d.value)) {
          // Said once for a declaration on several sides.
          if (b[kind].indexOf(d) === i) ignore(d, prop ? `: its \`${prop}\` can't be negative or automatic` : "");
          return;
        }
        const sides = spacing.get(prop) ?? (spacing.set(prop, []), spacing.get(prop)!);
        const was = sides[i];
        sides[i] = was && /px$/.test(was.value) && /px$/.test(d.value) ? { ...d, value: `${parseFloat(was.value) + parseFloat(d.value)}px` } : d;
      });
    }
    for (const [prop, sides] of spacing) {
      const below = sidesOf(under(prop));
      out.set(prop, { value: shorthand(below.map((s, i) => sides[i]?.value ?? s)), d: sides.find(Boolean)! });
    }
    if (b.radius.some(Boolean)) {
      const below = sidesOf(under(table.radius ?? ""));
      if (table.radius) out.set(table.radius, { value: shorthand(below.map((s, i) => b.radius[i]?.value ?? s)), d: b.radius.find(Boolean)! });
      else new Set(b.radius).forEach((d) => d && drop(d));
    }
    // Borders, side by side (a Divider's line is its top border: other sides it doesn't have).
    const used = new Set<ClassDeclaration>();
    for (const part of PARTS) {
      b.border[part].forEach((d, i) => {
        if (!d || !table.border || (table.border === "borderTop" && i)) return;
        out.set(`border${SIDES[i]}${part}`, { value: d.value, d });
        used.add(d);
      });
      new Set(b.border[part]).forEach((d) => d && !used.has(d) && drop(d));
    }
    b.other.forEach((d) => drop(d));
    return out;
  };

  const result: Record<string, any> = {};
  const mobile: Record<string, any> = {};
  const base = propsOf(boxes.always, unset, keep);
  for (const [prop, { value }] of base) if (!has(prop)) result[prop] = value;

  // A border width without a color shows in the text color (Tailwind's `currentColor`): a Button's own; a Column's or
  // a Divider's own text class's, else the text color around it, which inherit.ts gives the props listed for it.
  const ownColor: string | undefined =
    name === "Button"
      ? result.color ?? explicit.color ?? explicit.textColor ?? explicit.buttonColors?.color ?? explicit.values?.buttonColors?.color ?? defaults.buttonColors?.color
      : (text.filter((d) => d.property === "color" && d.when === "always").pop() ?? boxes.always.one.get("color"))?.value;
  const current: string[] = [];
  const bare = (found: Found, set: (prop: string, value: string) => void, at = "", under?: Found) => {
    for (const side of table.border === "borderTop" ? ["Top"] : table.border ? SIDES : []) {
      const prop = `border${side}Color`;
      if (!(parseFloat(String(found.get(`border${side}Width`)?.value)) > 0) || found.has(prop) || under?.has(prop) || has(prop)) continue;
      set(prop, ownColor ?? BODY_TEXT);
      if (ownColor === undefined) current.push(at + prop);
    }
  };
  bare(base, (prop, value) => (result[prop] = value));

  // Above a breakpoint (`sm:`): its value is the desktop one, and phones keep what's set without it (or the default).
  const desktop = propsOf(boxes.desktop, (prop) => base.get(prop)?.value ?? explicit[prop] ?? unset(prop));
  for (const [prop, { value, d }] of desktop) {
    if (has(prop)) continue;
    if (!onPhones(prop)) {
      warn(`can't set \`${d.property}\` for one screen size (class \`${d.className}\`)`);
      continue;
    }
    const phone = base.get(prop)?.value ?? unset(prop);
    result[prop] = value;
    if (phone !== undefined) mobile[prop] = phone;
    else if (prop === "width") mobile.autoWidth = true;
  }

  // On phones (`max-sm:`): the `mobile` prop.
  const onPhone = propsOf(boxes.phone, (prop) => result[prop] ?? explicit[prop] ?? unset(prop));
  for (const [prop, { value, d }] of onPhone) {
    if (onPhones(prop)) mobile[prop] = value;
    else warn(`has no phone setting for \`${d.property}\` (class \`${d.className}\`)`);
  }
  if (onPhones("borderTopColor")) bare(onPhone, (prop, value) => (mobile[prop] = value), "mobile.", base);

  // An Image has one display width: a width and a max width give the one the browser shows (see oneWidth).
  if (name === "Image") {
    const [width, max] = [result.width, result.maxWidth];
    for (const [into, w, m] of [[result, width, max], [mobile, mobile.width ?? width, mobile.maxWidth ?? max]] as const) {
      if (w === undefined || m === undefined || (into === mobile && mobile.width === undefined && mobile.maxWidth === undefined)) continue;
      const one = oneWidth(w, m);
      if (one === undefined) warn(`can't hold both \`width: ${w}\` and \`max-width: ${m}\` from its classes (the editor's image has one width), so it's ${w}`);
      into.width = one ?? w;
      delete into.maxWidth;
    }
  }

  // Hover: a Button's colors.
  for (const [key, d] of boxes.hover.one) {
    const prop = key === "bg" ? table.hoverBg : key === "color" ? table.hoverColor : undefined;
    if (prop && !has(prop)) result[prop] = d.value;
    else if (!prop) warn(`has no hover style for \`${d.property}\` (class \`${d.className}\`)`);
  }
  const hover = boxes.hover;
  [hover.padding, hover.margin, hover.radius, hover.border.Width, hover.border.Style, hover.border.Color, hover.other].forEach((list) =>
    new Set(list).forEach((d) => d && warn(`has no hover style for \`${d.property}\` (class \`${d.className}\`)`))
  );
  // Without a hover class a color stays on hover, as in the browser (a Button's own hover colors are its defaults').
  for (const [color, hoverProp] of [[table.bg, table.hoverBg], [table.color, table.hoverColor]]) {
    if (color && hoverProp && result[color] !== undefined && result[hoverProp] === undefined && !has(hoverProp)) result[hoverProp] = result[color];
  }

  // Hidden: `hidden`, `max-sm:hidden` (phones), `sm:hidden` (desktop), and shown again by a variant (`hidden sm:block`).
  const display = (b: Box) => b.one.get("display");
  const hidden = display(boxes.always)?.value === "none";
  for (const [b, prop, also] of [[boxes.always, "hideOnDesktop", "hideOnMobile"], [boxes.phone, "hideOnMobile"], [boxes.desktop, "hideOnDesktop"]] as const) {
    const d = display(b);
    if (!d) continue;
    if (!table.display || (d.value !== "none" && (b === boxes.always || !hidden))) {
      (b === boxes.always ? keep : ignore)(d);
      continue;
    }
    for (const key of [prop, ...(also ? [also] : [])]) if (explicit[key] === undefined) result[key] = d.value === "none";
  }
  if (display(boxes.hover)) warn(`has no hover style for \`display\` (class \`${display(boxes.hover)!.className}\`)`);

  // Phone props: those given in `mobile` (or `values._override.mobile`) win; borders are one object there.
  const theirs = { ...explicit.values?._override?.mobile, ...explicit.mobile };
  const phone: Record<string, any> = {};
  for (const [prop, value] of Object.entries(mobile)) {
    if (/^border(Top|Right|Bottom|Left)/.test(prop)) {
      if (theirs.border?.[prop] === undefined) phone.border = { ...phone.border, [prop]: value };
    } else if (theirs[prop] === undefined) phone[prop] = value;
  }
  const out: Record<PropertyKey, any> = { ...result, ...explicit };
  // A prop of a group given whole (`buttonColors={{ backgroundColor }}` with `text-white`): in it, under what it holds.
  for (const [prop, value] of Object.entries(result)) {
    const group = Object.keys(defaults).find((g) => g !== prop && plain(defaults[g]) && prop in defaults[g] && plain(explicit[g]));
    if (group) {
      out[group] = { [prop]: value, ...out[group] };
      delete out[prop];
    }
  }
  // A Row's padding classes inset its content as in CSS: in its Columns (see row.ts), which normalize.tsx gives this;
  // its text styles and the root's are the text blocks' in it (see inherit.ts), and the root's rewrite is a Row's
  // without one of its own.
  if (text.length && name !== "Column") out[PASSED] = text;
  if (name === "Row" && (result.padding !== undefined || phone.padding !== undefined || text.length)) out[TAILWIND] = rowRewrite(result.padding, phone.padding, warn);
  if (root && text.length) out[TAILWIND] = rowRewrite(undefined, undefined, (text) => console.warn(`[Unlayer] Row ${text}.`));
  // A Column's margins are its Row's to place (see row.ts): beside its style, with a rewrite for a Row without one;
  // so are its text styles, for its text blocks, and the border sides that take the text color around it.
  const keys: string[] & { margin?: Margins; row?: unknown; text?: ClassDeclaration[]; current?: string[] } = Object.keys(style);
  if (text.length && name === "Column") keys.text = text;
  if (current.length) keys.current = current;
  const { margin: _margin, ...phoneRest } = phone;
  if (name === "Column" && (result.margin !== undefined || phone.margin !== undefined)) {
    const found = [boxes.always, boxes.desktop, boxes.phone].flatMap((b) => b.margin).filter((d, i, all): d is ClassDeclaration => !!d && LENGTH.test(d.value) && all.indexOf(d) === i);
    keys.margin = {
      desktop: sidesOf(result.margin),
      ...(phone.margin !== undefined ? { phone: sidesOf(phone.margin) } : {}),
      ignored() {
        this.ignored = () => {};
        found.forEach((d) => ignore(d));
      },
    };
    delete out.margin;
  }
  if (name === "Column" && (keys.margin || keys.text || keys.current)) keys.row = rowRewrite(undefined, undefined, (text) => console.warn(`[Unlayer] Row ${text}.`));
  // Its own style wins; the keys from classes are listed (under the scope's symbol), as they're said here already.
  if (keys.length || keys.margin || keys.text || keys.current) out.style = { ...style, ...explicit.style, [TAILWIND]: keys };
  if (Object.keys(phoneRest).length) out.mobile = { ...phoneRest, ...explicit.mobile, ...(phone.border && explicit.mobile?.border ? { border: { ...phone.border, ...explicit.mobile.border } } : {}) };
  return out;
}
