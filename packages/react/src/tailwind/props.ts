/**
 * Declarations (see declarations.ts) as a component's props, by the table it gives (`classes` beside its props, see
 * utils/tailwind.ts): the shared part is here (what each CSS property is, how spacing and borders combine, phone
 * and hover variants), what differs (Button's padding is inside it, a Row's background paints the content width)
 * is the component's. Props given explicitly win; what a component can't take is reported, never dropped quietly.
 */
import { TABLES } from "./tables";
import { plus, shorthand, sidesOf, type Margins } from "./row";
import { rowRewrite } from "./inherit";
import { PROP_ALIASES, cssValueSafe, isContentProp } from "@unlayer-internal/shared-elements";
import { BodyDefaults } from "@unlayer/exporters";
import { unsafeUrl } from "../markdown/sanitize";
import { heightAsWidth } from "./image-height";


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
  minWidth?: string | null;
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
  "min-width": "minWidth",
  display: "display",
};
const SIDES = ["Top", "Right", "Bottom", "Left"];
// Logical sides as in a left-to-right document; RTL has the ones a right-to-left one changes.
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
const RTL: Record<string, number[]> = { "inline-start": [1], "inline-end": [3], "start-start": [1], "start-end": [0], "end-end": [3], "end-start": [2] };
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

/** `d` in the box, on the sides it sets (`rtl`: in a right-to-left document, where inline start is the right). */
function add(into: Box, d: ClassDeclaration, rtl: boolean): void {
  const p = d.property;
  const key = SIMPLE[p] ?? (p === "background" && isColor(d.value) ? "bg" : undefined);
  if (key) return void into.one.set(key, d);
  const at = (table: Record<string, number[]>, a = "", b?: string) => (rtl && RTL[a + "-" + b]) || table[b ? `${a}-${b}` : a];
  let m = /^(padding|margin)(?:-(top|right|bottom|left|inline|block)(?:-(start|end))?)?$/.exec(p);
  if (m) return void at(AREAS, m[2], m[3])?.forEach((i) => ((into[m![1] as "padding" | "margin"] as Sides)[i] = d));
  m = /^border(?:-(top|right|bottom|left|inline|block)(?:-(start|end))?)?-(width|style|color)$/.exec(p);
  if (m) return void at(AREAS, m[1], m[2])?.forEach((i) => (into.border[(m![3][0].toUpperCase() + m![3].slice(1)) as (typeof PARTS)[number]][i] = d));
  m = /^border(?:-(top|bottom|start|end)-(left|right|start|end))?-radius$/.exec(p);
  const corners = m && at(CORNERS, m[1], m[2]);
  if (corners) return void corners.forEach((i) => (into.radius[i] = d));
  into.other.push(d);
}

/**
 * A class's value as a prop can take it, or undefined where it can't: the editor's exporters write props into a
 * `style="…"` (or a `<style>`) as they are, so nothing that ends an attribute or starts a tag (`"`, `<`, `>`, or a CSS
 * escape of one of them or of `'`), and nothing CSS can't hold there (see cssValueSafe). A font family's names in
 * double quotes are in single ones, as the exporters write them. (An arbitrary value from data,
 * `[color:'"><img …>']`, can't add markup that way.)
 */
function propValue({ property, value }: ClassDeclaration): string | undefined {
  const written = property === "font-family" ? value.replace(/"([^"'\\<>]*)"/g, "'$1'") : value;
  return /["<>]|\\(?:["'<>]|0{0,4}(?:22|27|3c|3e)(?![\da-f]))/i.test(written) || !cssValueSafe(written) ? undefined : written;
}

const LENGTH = /^(\d*\.?\d+)(px|%|em)?$/;
const plain = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Props without those given as `undefined`, or as `null` but for content (`text`, `html`: none, as in 0.2.1): a prop
 * passed so (a wrapper of yours forwarding one it wasn't given, `color={props.color}`, or data's `null`) is one not
 * given, as `given` reads it, so a class sets it.
 */
const defined = (props: Record<PropertyKey, any> | undefined): Record<PropertyKey, any> => {
  const out: Record<PropertyKey, any> = {};
  if (props) for (const key of [...Object.keys(props), ...Object.getOwnPropertySymbols(props)]) if (props[key] !== undefined && (props[key] !== null || (typeof key === "string" && isContentProp(key)))) out[key] = props[key];
  return out;
};

/**
 * Whether a prop of component `name` is given explicitly: flat, in a group (`buttonColors.color`,
 * `border.borderTopColor`), in `values`, or by another name it takes for it (`textColor` for `color`, `align` for
 * `textAlign`: see PROP_ALIASES).
 */
export function given(explicit: Record<string, any>, prop: string, name = ""): boolean {
  const look = (p: string) =>
    [explicit, explicit.values].some((o) => plain(o) && (o[p] != null || Object.entries(o).some(([k, v]) => !/^(mobile|_override|values)$/.test(k) && plain(v) && v[p] != null)));
  const aliases = Object.entries(PROP_ALIASES[name] ?? {}).flatMap(([alias, props]) => (props.split(" ").includes(prop) ? [alias] : []));
  // An image's width, max and min width are one setting.
  return look(prop) || aliases.some(look) || (/^(width|maxWidth|minWidth)$/.test(prop) && ["width", "maxWidth"].some(look));
}

/**
 * Two lengths compared without the width of the box around them (`a` minus `b`, by its sign): in the same unit, or a
 * length in pixels and 100%, the whole box, which is as wide as that on a desktop. Undefined where it depends.
 */
function compare(a: string, b: string): number | undefined {
  if (/%$/.test(a) === /%$/.test(b)) return parseFloat(a) - parseFloat(b);
  return a === "100%" ? 1 : b === "100%" ? -1 : undefined;
}

/**
 * One width from a width and the bounds on it, as CSS sizes a box on a desktop: the max width caps the width, and
 * the min width wins over both (`max(min, min(max, width))`). Undefined where that depends on the width of the box
 * around it (see compare).
 */
function bounded(width: string, min: string | undefined, max: string | undefined): string | undefined {
  let out = width;
  for (const [bound, wins] of [[max, (c: number) => c > 0], [min, (c: number) => c < 0]] as const) {
    if (bound === undefined) continue;
    const c = compare(out, bound);
    if (c === undefined) return undefined;
    if (wins(c)) out = bound;
  }
  return out;
}

/** "both `width: 50%` and `max-width: 320px`", or three of them "together": the lengths one width can't hold. */
function together(lengths: Array<[string, string | undefined]>): string {
  const given = lengths.filter(([, value]) => value !== undefined).map(([property, value]) => `\`${property}: ${value}\``);
  return given.length === 2 ? `both ${given.join(" and ")}` : `${given.slice(0, -1).join(", ")} and ${given[given.length - 1]} together`;
}

/** A simple value as the prop takes it (`rtl`: in a right-to-left document); undefined where it can't. */
function convert(key: string, value: string, rtl: boolean): unknown {
  switch (key) {
    case "lineHeight":
      // Unitless, as the editor writes line heights: a percentage.
      return /^\d*\.?\d+$/.test(value) ? `${parseFloat((parseFloat(value) * 100).toFixed(2))}%` : value;
    case "fontWeight":
      return /^\d+$/.test(value) ? Number(value) : value;
    case "textAlign": {
      const align = value === "start" ? (rtl ? "right" : "left") : value === "end" ? (rtl ? "left" : "right") : value;
      return /^(left|center|right|justify)$/.test(align) ? align : undefined;
    }
    case "width":
    case "maxWidth":
    case "minWidth":
      return value === "0" ? "0px" : /^\d*\.?\d+(px|%)$/.test(value) ? value : undefined;
    default:
      return value;
  }
}

type Found = Map<string, { value: unknown; d: ClassDeclaration }>;

/**
 * Turns a component's classes into its props. `props`: the props it's given (they win; one given as `undefined` isn't, see defined); `defaults`: its default
 * values (what a phone shows where only a breakpoint variant, `sm:`, sets a prop). `quiet`: for text styles a block
 * takes from around it (see inherit.ts), what it can't take is passed over, not said or inlined. `rtl`: the document
 * reads right to left, so logical sides and alignment (`ps-4`, `rounded-ss-md`, `text-start`) start on the right.
 */
export function classesToProps(name: string, found: ClassDeclarations, props: Record<string, any>, defaults: Record<string, any> = {}, quiet = false, rtl = false): Record<string, any> {
  const explicit = defined(props);
  const own = read(TABLES[name] ?? "");
  const warn = (text: string) => quiet || console.warn(`[Unlayer] ${name} ${text}.`);
  // (An Image whose height class gives its width has its `src.width` as its size, not a width given: see heightAsWidth.)
  let sizedByHeight = false;
  const has = (prop: string) => given(explicit, prop, name) && !(sizedByHeight && /^(width|maxWidth|minWidth)$/.test(prop));
  const ignore = (d: ClassDeclaration, why = "") => warn(`ignores \`${d.property}: ${d.value}\` from class \`${d.className}\`${why}`);
  // What no prop takes (unless a variant's, which can't apply as a style): inlined on the component's element.
  const style: Record<string, string> = {};
  const keep = (d: ClassDeclaration) => {
    if (quiet) return;
    style[d.property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = d.value + (d.important ? " !important" : "");
    warn(`\`${d.property}: ${d.value}\` from class \`${d.className}\` is kept in HTML (an inline style) but not in the design for the visual editor`);
  };
  for (const { className, reason } of found.ignored) warn(`ignores class \`${className}\`: ${reason}`);
  // What can't be a prop's value (see propValue) is no one's: not a prop's, an inline style's, or the text's inside;
  // nor is a `url()` that isn't a web, relative, attachment or image data URL (`bg-[url(javascript:…)]`: see unsafeUrl).
  found = {
    ...found,
    declarations: found.declarations.flatMap((d) => {
      const value = propValue(d);
      if (value === undefined) ignore(d, ": it could end the HTML attribute it's written in, start a tag, or end its CSS");
      else if (unsafeUrl(value)) ignore(d, ": its URL isn't a web one (`http:` or `https:`), a relative one, an inline attachment's (`cid:`), or an image's data URL");
      else return [value === d.value ? d : { ...d, value }];
      return [];
    }),
  };

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
  // An Image's height with an auto width (a logo's `h-12 w-auto`) is the width its aspect ratio gives (see
  // image-height.ts); `w-auto` is its responsive width, the editor's auto width.
  if (name === "Image") {
    const byHeight = heightAsWidth(found.declarations, explicit, ignore);
    sizedByHeight = byHeight.sized;
    found = { ...found, declarations: byHeight.declarations.map((d) => (d.property === "width" && d.value === "auto" ? { ...d, value: "100%" } : d)) };
  }

  const table: Table = { ...(own.container ? {} : BLOCK), ...(own.text ? TEXT : {}), ...own };
  // The one prop a width and the bounds on it all go to, where there's one (the root's content width; see propsOf).
  const sized = table.width && table.maxWidth === table.width && table.minWidth === table.width ? table.width : undefined;
  const phoneable = new Set(`${own.container ? "" : "containerPadding"},${own.phone ?? ""}`.split(",").filter(Boolean));
  const onPhones = (prop: string) => phoneable.has(prop) || (/^border(Top|Right|Bottom|Left)/.test(prop) && phoneable.has("border"));
  const boxes: Record<ClassDeclaration["when"], Box> = { always: box(), phone: box(), desktop: box(), hover: box() };
  for (const d of found.declarations) add(boxes[d.when], d, rtl);
  const unset = (prop: string) => defaults[prop] ?? UNSET[prop] ?? (/^border.*Width$/.test(prop) ? "0px" : undefined);

  /** One condition's props; `under(prop)` is what the sides and corners it doesn't set are, `drop` what no prop takes. */
  const propsOf = (b: Box, under: (prop: string) => unknown, drop = ignore): Found => {
    const out: Found = new Map();
    for (const [key, d] of b.one) {
      if (key === "display" || (sized && /^(width|maxWidth|minWidth)$/.test(key))) continue;
      const prop = table[key as keyof Table];
      const value = typeof prop === "string" ? convert(key, d.value, rtl) : undefined;
      if (value === undefined) drop(d);
      else out.set(prop as string, { value, d });
    }
    // One prop for a width and its bounds (the root's content width): the one width CSS gives them (see bounded).
    if (sized) {
      const [width, min, max] = (["width", "minWidth", "maxWidth"] as const).map((key) => {
        const d = b.one.get(key);
        const value = d && (convert(key, d.value, rtl) as string | undefined);
        if (d && value === undefined) drop(d);
        return value === undefined ? undefined : { value, d: d! };
      });
      // (A min width alone bounds no width: it's a class no prop takes.)
      if (!width && !max) {
        if (min) drop(min.d);
      } else {
        const one = bounded(width?.value ?? "100%", min?.value, max?.value);
        if (one === undefined) warn(`can't hold ${together([["width", width?.value], ["min-width", min?.value], ["max-width", max?.value]])} from its classes (the design has one content width), so it's ${(width ?? max)!.value}`);
        out.set(sized, { value: one ?? (width ?? max)!.value, d: (width ?? max)!.d });
      }
    }
    // Spacing: a block's margins and padding are both the padding around it, added up; where they can't be (`5%` and
    // `8px`), the padding, its own, stays and the margin is said.
    const spacing = new Map<string, Sides>();
    const said = new Set<ClassDeclaration>();
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
        const sum = !was ? d.value : /px$/.test(was.value) && /px$/.test(d.value) ? `${parseFloat(was.value) + parseFloat(d.value)}px` : plus(was.value, d.value);
        if (sum !== undefined) sides[i] = was ? { ...d, value: sum } : d;
        else if (!said.has(d) && said.add(d)) ignore(d, `: its \`${prop}\` can't add it to \`${was!.property}: ${was!.value}\``);
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

  // An Image has one display width: a width, a max and a min width give the one the browser shows (see bounded), on
  // phones too, where its desktop ones apply unless it has its own.
  if (name === "Image") {
    const [width, max, min] = [result.width, result.maxWidth, result.minWidth];
    delete result.minWidth;
    // (A min width alone bounds no width: it's a class no prop takes.)
    if (min !== undefined && width === undefined && max === undefined) keep(boxes.always.one.get("minWidth")!);
    for (const [into, w, m] of [[result, width, max], [mobile, mobile.width ?? width, mobile.maxWidth ?? max]] as const) {
      if ([w, m, min].filter((v) => v !== undefined).length < 2 || (into === mobile && mobile.width === undefined && mobile.maxWidth === undefined)) continue;
      const one = bounded(w ?? "100%", min, m);
      if (one === undefined) warn(`can't hold ${together([["width", w], ["min-width", min], ["max-width", m]])} from its classes (the editor's image has one width), so it's ${w ?? m}`);
      into.width = one ?? w ?? m;
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
  const theirs = { ...explicit.values?._override?.mobile, ...defined(explicit.mobile) };
  const phone: Record<string, any> = {};
  for (const [prop, value] of Object.entries(mobile)) {
    if (/^border(Top|Right|Bottom|Left)/.test(prop)) {
      if (theirs.border?.[prop] === undefined) phone.border = { ...phone.border, [prop]: value };
    } else if (theirs[prop] === undefined) phone[prop] = value;
  }
  const out: Record<PropertyKey, any> = { ...result, ...explicit };
  // A prop of a group given whole (`buttonColors={{ backgroundColor }}` with `text-white`): in it, under what it holds.
  // (Not the width an Image's height gives: its `src`'s width is its size, and its display width the flat prop.)
  for (const [prop, value] of Object.entries(result)) {
    if (sizedByHeight && /^(width|maxWidth)$/.test(prop)) continue;
    const group = Object.keys(defaults).find((g) => g !== prop && plain(defaults[g]) && prop in defaults[g] && plain(explicit[g]));
    if (group) {
      out[group] = { [prop]: value, ...defined(out[group]) };
      delete out[prop];
    }
  }
  // A Row's padding classes inset its content as in CSS: in its Columns (see row.ts), which src/model/elements.ts gives this;
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
  if (keys.length || keys.margin || keys.text || keys.current) out.style = { ...style, ...defined(explicit.style), [TAILWIND]: keys };
  const mobileGiven = defined(explicit.mobile);
  if (Object.keys(phoneRest).length) out.mobile = { ...phoneRest, ...mobileGiven, ...(phone.border && mobileGiven.border ? { border: { ...phone.border, ...defined(mobileGiven.border) } } : {}) };
  return out;
}
