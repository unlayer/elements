/**
 * A Row's Tailwind padding classes (`p-8`, `px-6`, `max-sm:p-4`) and its Columns' margin classes (`mr-2`, `mx-2`), as
 * in CSS: the padding inside what the row paints, around its content, so `bg-white p-8` insets the content in the
 * white box; the margins around each Column, between them. A Row's `padding` prop is the editor's, around the row,
 * outside its content background, and a Column has no margins in the editor: the classes go to its Columns instead.
 * Each Column's gutter is the row's padding on its outer sides (the top and bottom of each, the left of the first and
 * the right of the last; in a right-to-left document, where the first is on the right, the right of the first and the
 * left of the last) and its own margins. On phones, where the Columns stack (unless `noStackMobile`), each gets the
 * row's sides, the first the row's top and the last its bottom, and the space between two is the space between them on
 * desktop (the one's right margin below it, the next's left margin above it; right to left, the one's left margin and
 * the next's right one).
 *
 * A Column that paints nothing takes its gutter as padding, added to its own. A card (a Column with a background or a
 * border) takes it as borders in the color around it (the row's content background, else its background, else the
 * body's), as hand-written Elements templates do, so its own padding stays inside its box; its corners grow by the
 * gutters (a corner's radius is its outer edge's). The design gets the same: the row's padding 0px, each column's
 * padding or border, its phone ones in its phone settings.
 *
 * Where a card's gutter can't be a border (one of its own is on that side, the color around it isn't one opaque
 * color, a length isn't in pixels), the row's padding classes stay its padding, around it, its Columns' margins are
 * ignored, and that's said. A rounded corner whose two gutters differ can't stay round in the editor (its corners are
 * circles), nor one whose gutters differ on phones (a Column's corners are the same there), so the row's cards get
 * square corners, which is said too.
 */
import React from "react";
import { BodyDefaults } from "@unlayer/exporters";
import { isColumn } from "./column";

/** On a component's `style` (beside the keys its classes inlined): what its classes give its Row (see props.ts). */
const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

/** A Column's margin classes, for its Row to place: its four sides on desktop and on phones, and how to say they're ignored. */
export interface Margins {
  desktop: string[];
  phone?: string[];
  ignored(): void;
}

/** A box's four sides from CSS shorthand: `10px 20px` → top, right, bottom, left. */
export function sidesOf(value: unknown): string[] {
  const parts = (typeof value === "number" ? `${value}px` : String(value ?? "0px")).trim().split(/\s+/).map((p) => (p === "0" ? "0px" : p));
  const [t, r = t, b = t, l = r] = parts;
  return [t, r, b, l];
}

export const shorthand = ([t, r, b, l]: string[]) => (l !== r ? `${t} ${r} ${b} ${l}` : b !== t ? `${t} ${r} ${b}` : r !== t ? `${t} ${r}` : t);

const ZERO = /^0[a-z%]*$/;
const LENGTH = /^(\d*\.?\d+)([a-z%]+)$/;
const Z = "0px";
const SIDES = ["Top", "Right", "Bottom", "Left"];
const px = (value: string) => (ZERO.test(value) ? 0 : /^\d*\.?\d+px$/.test(value) ? parseFloat(value) : NaN);

/** Two lengths added: in one unit, or one of them zero; undefined where they can't be. */
export function plus(a: string, b: string): string | undefined {
  if (ZERO.test(b)) return a;
  if (ZERO.test(a)) return b;
  const [x, y] = [LENGTH.exec(a), LENGTH.exec(b)];
  return x && y && x[2] === y[2] ? `${parseFloat((Number(x[1]) + Number(y[1])).toFixed(2))}${x[2]}` : undefined;
}

/** A color one can see nothing through (a gutter's border paints over the card's background). */
function opaque(color: string): boolean {
  const c = color.trim().toLowerCase();
  const alpha = /^(?:rgb|hsl)a?\(.*[,/]\s*([\d.]+)(%?)\s*\)$/.exec(c);
  if (alpha) return parseFloat(alpha[1]) >= (alpha[2] ? 100 : 1);
  return c !== "transparent" && !/^#([\da-f]{3}[\da-e]|[\da-f]{6}([\da-f][\da-e]|[\da-e][\da-f]))$/.test(c);
}

/** A Column's values from its props (flat, in a group, in `values`). */
const valuesOf = (props: Record<string, any>) => ({ ...props.values, ...props.values?.border, ...props, ...props.border });

/** A Column's border sides from its props (flat, in `border`, in `values`), each `{ Width, Style, Color }`. */
function borderOf(props: Record<string, any> | undefined): Array<Record<string, string>> {
  const v = props ? valuesOf(props) : {};
  return SIDES.map((side) => Object.fromEntries(["Width", "Style", "Color"].flatMap((part) => (v[`border${side}${part}`] != null ? [[part, String(v[`border${side}${part}`])]] : []))));
}

/** Whether a border side shows: a width, a style that draws, a color one sees. */
const shows = (side: Record<string, string>) => parseFloat(side.Width) > 0 && !/^(none|hidden)$/.test(side.Style ?? "") && side.Color?.trim() !== "transparent";
/** A Column's flat border props, each unset: its gutter's `border` holds its sides. */
const UNSET = Object.fromEntries(SIDES.flatMap((side) => ["Width", "Style", "Color"].map((part) => [`border${side}${part}`, undefined])));

/** A card: a Column that paints its own box (a background or a border). Rounded corners alone paint nothing. */
function paints(props: Record<string, any>): boolean {
  const v = valuesOf(props);
  return (!!v.backgroundColor && v.backgroundColor !== "transparent") || borderOf(props).some(shows);
}

/** The border a gutter gives a card, all four sides (a phone setting replaces them all): the gutter's, or its own. */
function borderObject(gutter: string[], own: Array<Record<string, string>>, color: string): Record<string, string> {
  const out: Record<string, string> = {};
  SIDES.forEach((side, i) => {
    const parts = px(gutter[i]) > 0 ? { Width: gutter[i], Style: "solid", Color: color } : { Width: Z, Style: "solid", Color: "transparent", ...own[i] };
    for (const [part, value] of Object.entries(parts)) out[`border${side}${part}`] = value;
  });
  return out;
}

/**
 * A card's corners grown by its gutters (a radius is its outer edge's): each rounded corner by the gutter on its two
 * sides, which must be equal (within 2px) for it to stay a circle; where they aren't, those two gutters.
 */
function grown(radius: number[], gutter: string[]): string | string[] {
  const g = gutter.map(px);
  // Top left (left, top), top right (right, top), bottom right (right, bottom), bottom left (left, bottom).
  const pairs = [[g[3], g[0]], [g[1], g[0]], [g[1], g[2]], [g[3], g[2]]];
  const at = radius.findIndex((r, c) => r > 0 && Math.abs(pairs[c][0] - pairs[c][1]) > 2);
  return at >= 0 ? pairs[at].map((n) => `${n}px`) : shorthand(radius.map((r, c) => (r > 0 ? `${parseFloat((r + Math.max(...pairs[c])).toFixed(2))}px` : Z)));
}

/**
 * The Row's rewrite of its children (src/model/elements.ts gives it them, its props, the root's and whether the
 * document reads right to left): `padding` and `phone` (its phone padding) from its classes, and its Columns'
 * margins, in its Columns. It takes the padding it puts in them out of the Row's props.
 */
export function insetColumns(padding: string | undefined, phone: string | undefined, warn: (text: string) => void) {
  const said = new Set<string>();
  const say = (text: string) => {
    if (!said.has(text)) warn(text);
    said.add(text);
  };

  return (children: React.ReactNode[], props: Record<string, any>, root?: Record<string, any>, rtl = false): React.ReactNode[] => {
    const columns = children.filter(isColumn);
    if (!columns.length) return children;
    const margins: Array<Margins | undefined> = columns.map((column) => column.props.style?.[TAILWIND]?.margin);
    /** What can't be done: the padding from its classes stays the Row's, around it, and the margins are ignored. */
    const keep = (why: string) => {
      say(`${padding !== undefined || phone !== undefined ? "keeps the padding from its classes around its Columns, as the editor's padding: its cards' gutters would be" : "can't give its cards gutters: they'd be"} borders in the color around them, and ${why}`);
      margins.forEach((m) => m?.ignored());
      return children;
    };
    const n = columns.length;
    const stacks = !(props.noStackMobile ?? props.values?.noStackMobile ?? props.values?._override?.mobile?.noStackMobile);
    const [row, rowPhone] = [sidesOf(padding), sidesOf(phone ?? padding)];
    /** A Column's gutter: the row's padding on its outer sides and its own margins (on phones, stacked, see above). */
    const gutterOf = (i: number, onPhone: boolean): Array<string | undefined> => {
      const m = (onPhone ? (margins[i]?.phone ?? margins[i]?.desktop) : margins[i]?.desktop) ?? [Z, Z, Z, Z];
      const [r, first, last] = [onPhone ? rowPhone : row, i === 0, i === n - 1];
      // The side toward the Column before it (the one on the left, or right to left on the right), and toward the next.
      const [before, after] = rtl ? [1, 3] : [3, 1];
      if (onPhone && stacks) return [plus(first ? r[0] : m[before], m[0]), r[1], plus(last ? r[2] : m[after], m[2]), r[3]];
      return [plus(r[0], m[0]), plus((rtl ? first : last) ? r[1] : Z, m[1]), plus(r[2], m[2]), plus((rtl ? last : first) ? r[3] : Z, m[3])];
    };
    const gutters = columns.map((_, i) => [gutterOf(i, false), gutterOf(i, true)]);
    const cards = columns.map((column) => paints(column.props));
    const ownPhoneBorder = (own: Record<string, any>) => own.mobile?.border ?? own.values?._override?.mobile?.border;

    let color = "";
    if (cards.some(Boolean)) {
      const v = { ...props.values, ...props };
      const body = root && { ...root.values, ...root };
      color = [v.columnsBackgroundColor, v.backgroundColor, body?.backgroundColor ?? (body && BodyDefaults.backgroundColor)].find((c) => c && c !== "transparent") ?? "";
      if (v.backgroundImage?.url || (!v.columnsBackgroundColor && !v.backgroundColor && body?.backgroundImage?.url)) return keep("a background image is around them, not one color");
      if (!color) return keep("that color isn't known for a Row on its own (give the Row a background, `bg-*`)");
      if (!opaque(color)) return keep(`that color (\`${color}\`) isn't opaque`);
      for (const [i, column] of columns.entries()) {
        if (!cards[i]) continue;
        const sides = gutters[i].flat();
        if (sides.includes(undefined)) return keep("their padding and margins from classes are in lengths that can't be added up");
        const odd = sides.find((side) => Number.isNaN(px(side!)));
        if (odd !== undefined) return keep(`a gutter of \`${odd}\` isn't in pixels`);
        const own = borderOf(column.props);
        const ownPhone = borderOf(ownPhoneBorder(column.props));
        const clash = own.some((side, s) => shows(side) && px(gutters[i][0][s]!) > 0) || ownPhone.some((side, s) => shows(side) && px(gutters[i][1][s]!) > 0);
        if (clash) return keep("a card has a border of its own on a side its gutter needs");
      }
    }

    // Out of the Row, where the classes put it (a prop given wins over a class: then it's not theirs).
    if (padding !== undefined) delete props.padding;
    if (phone !== undefined && props.mobile) {
      const { padding: _phone, ...rest } = props.mobile;
      props.mobile = Object.keys(rest).length ? rest : undefined;
    }

    // Cards' corners, the row's alike: grown by their gutters, or all square where one can't stay round. A Column's
    // corners are the same on phones (Elements has no phone setting for them), so its gutters there must give the same.
    const held = columns.flatMap((_, i) => (cards[i] ? [i] : []));
    const radii = held.map((i) => sidesOf(valuesOf(columns[i].props).borderRadius).map((r) => px(r) || 0));
    let why = "";
    const corners = held.map((i, k) => {
      const [desktop, phone] = gutters[i].map((gutter) => grown(radii[k], gutter as string[]));
      if (typeof desktop != "string") why ||= `the gutters that meet at one differ (${desktop.join(" and ")})`;
      else if (typeof phone != "string") why ||= `on phones the gutters that meet at one differ (${phone.join(" and ")})`;
      else if (phone !== desktop) why ||= "a corner's gutters on phones differ from its gutters on desktop, and its radius is the same on both";
      return desktop as string;
    });
    if (why && radii.flat().some((r) => r > 0))
      say(`can't keep its cards' rounded corners, so they're square: in the editor a corner is a circle, and ${why}. Make each corner's two gutters equal, and the same on phones (the Row's padding, the Columns' margins), to keep them round`);

    // Its Columns, each with its gutter: padding added to its own, or a card's border (its phone settings too).
    const out = columns.map((column, i): Record<string, any> => {
      const own = column.props;
      const [desktopGutter, phoneGutter] = gutters[i] as string[][];
      if (!cards[i]) {
        // Padding, added to its own (a length that can't be is said, and that Column keeps its own).
        const ownPhone = own.mobile?.padding ?? own.values?._override?.mobile?.padding;
        const sum = (base: unknown, more: Array<string | undefined>) =>
          shorthand(
            sidesOf(base).map((side, s) => {
              const total = more[s] === undefined ? undefined : plus(side, more[s]!);
              if (total === undefined) say(more[s] === undefined ? "can't add up its padding and its Columns' margins from classes, in lengths of different units, so a Column keeps its own" : `padding \`${more[s]}\` from its classes can't be added to a Column's \`${side}\`, so that Column keeps its own`);
              return total ?? side;
            })
          );
        const base = own.padding ?? own.values?.padding;
        const padding = sum(base, desktopGutter);
        const phonePadding = sum(ownPhone ?? base, phoneGutter);
        return { padding, ...(ownPhone !== undefined || phonePadding !== padding ? { mobile: { ...own.mobile, padding: phonePadding } } : {}) };
      }
      const k = held.indexOf(i);
      // A phone border replaces all four sides: written whole where the phone's differ, or the card has one of its own.
      const phoneBorder = ownPhoneBorder(own);
      const mobile = {
        ...own.mobile,
        ...(phoneBorder || desktopGutter.some((side, s) => side !== phoneGutter[s]) ? { border: borderObject(phoneGutter, borderOf(phoneBorder ?? own), color) } : {}),
      };
      return { ...UNSET, border: borderObject(desktopGutter, borderOf(own), color), ...(radii[k].some((r) => r > 0) ? { borderRadius: why ? Z : corners[k] } : {}), ...(Object.keys(mobile).length ? { mobile } : {}) };
    });
    // A web page's phone settings for a Column's border are written for an element its HTML doesn't have.
    if (root?.mode === "web" && stacks && out.some((props, i) => cards[i] && props.mobile?.border))
      say("keeps its cards' desktop gutters on phones: the editor's web export has no phone border for a Column");

    margins.forEach((m) => m && (m.ignored = () => {}));
    return children.map((child) => {
      const i = columns.indexOf(child as React.ReactElement<Record<string, any>>);
      return i < 0 ? child : React.cloneElement(columns[i], out[i]);
    });
  };
}
