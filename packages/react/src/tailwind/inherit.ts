/**
 * Text styles on a Row, a Column or the root (`text-white`, `text-center`, `text-sm`, `font-bold`, `leading-7`,
 * `tracking-wide`, `font-serif`, and their phone variants) for the text inside, as CSS inherits them: each text block
 * takes them as its own props where it sets none (by its classes or its props), the nearest container's winning, so
 * the design holds them too. A Paragraph and a Heading take them all; a Button its label's font, size, weight,
 * spacing and line height and, as an inline-block in CSS, its place (`text-center` centers it), not the color (its
 * label sits on its own background, and an email client gives a link its own color); a Menu its items' (`textColor`,
 * `align`, no line height: it has none); a Table its header's, content's and footer's (the content's weight and line
 * height); Social its place. What has text but no such props (an Html block, markup, a custom tool) gets them as CSS
 * does, from an inline style on its Column: the HTML's, not the design's, which is said.
 *
 * A border set without a color (`border`, `border-t-2`) is Tailwind's `currentColor`: the text color. A Column's or a
 * Divider's without a text class of its own is the text color around it, set here (the root's `textColor`, the
 * editor's default, where no class sets one).
 *
 * A Row's rewrite (src/model/elements.ts gives it the Row's Columns, its props, the root's and the direction) does both, then places the
 * Row's padding and its Columns' margins (see row.ts). The root's rewrite, a Column's and a Row's are the same: a Row
 * takes its own, else one of its Columns', else the root's.
 */
import React from "react";
import { BodyDefaults } from "@unlayer/exporters";
import { classesToProps, given } from "./props";
import { insetColumns } from "./row";
import { isColumn } from "./column";
import type { ClassDeclaration } from "./declarations";

const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");
const PASSED = Symbol.for("@unlayer/react-elements/tailwind-text");
/** How a block's component says its name and defaults (see create-component.tsx). */
const CONFIG = "__unlayerItemConfig";

/** Blocks that take the text styles around them as props. */
const TAKES = new Set(["Paragraph", "Heading", "Button", "Menu", "Table", "Social"]);
/** Blocks with no text for them to style. */
const TEXTLESS = new Set(["Image", "Divider", "Video", "PageBreak"]);
const PARTS = ["header", "content", "footer"];

type Props = Record<PropertyKey, any>;
const camel = (property: string) => property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** A Table's text props from a Paragraph's: its header's, content's and footer's (see the comment above). */
function tableProps(p: Props): Props {
  const out: Props = {};
  for (const part of PARTS) {
    if (p.color !== undefined) out[`${part}Color`] = p.color;
    if (p.fontSize !== undefined) out[`${part}FontSize`] = p.fontSize;
    if (p.textAlign !== undefined) out[`${part}TextAlign`] = p.textAlign;
    if (p.fontFamily !== undefined) out[`${part}FontFamily`] = { label: p.fontFamily, value: p.fontFamily };
  }
  if (p.lineHeight !== undefined) out.contentLineHeight = p.lineHeight;
  if (p.fontWeight !== undefined) out.contentFontWeight = p.fontWeight;
  return out;
}

/** The props a block takes from the text styles around it: those it doesn't set itself (by its classes or props). */
function inherited(name: string, defaults: Props, props: Props, decls: ClassDeclaration[], rtl: boolean): Props {
  const own = name === "Button" ? decls.filter((d) => d.property !== "color") : decls;
  if (!own.length) return {};
  const from = classesToProps(name === "Table" ? "Paragraph" : name, { declarations: own, ignored: [] }, {}, name === "Table" ? {} : defaults, true, rtl);
  const { mobile, style: _style, ...base } = name === "Table" ? tableProps(from) : from;
  const out: Props = {};
  for (const [prop, value] of Object.entries(base)) if (!given(props, prop, name)) out[prop] = value;
  // On phones: where it sets nothing for a prop, on any screen.
  const theirs = { ...props.values?._override?.mobile, ...props.mobile };
  for (const [prop, value] of Object.entries((mobile ?? {}) as Props)) if (!given(props, prop, name) && theirs[prop] === undefined) out.mobile = { ...(out.mobile ?? props.mobile), [prop]: value };
  return out;
}

/** Sets `color` on the border side `at` names (`borderTopColor`, or `mobile.borderTopColor` for phones). */
function paint(into: Props, props: Props, at: string, color: string): void {
  if (!at.startsWith("mobile.")) return void (into[at] = color);
  const mobile = into.mobile ?? props.mobile ?? {};
  into.mobile = { ...mobile, border: { ...mobile.border, [at.slice(7)]: color } };
}

/** A Column with its text blocks given the text styles around them (the root's, the Row's, its own), in a right-to-left document with `rtl`. */
function inColumn(column: React.ReactElement<Props>, rootText: ClassDeclaration[], rowText: ClassDeclaration[], root: Props | undefined, say: (text: string) => void, rtl: boolean): React.ReactElement<Props> {
  const keys = column.props.style?.[TAILWIND];
  const ownText: ClassDeclaration[] = keys?.text ?? [];
  const around = [...rootText, ...rowText];
  const decls = [...around, ...ownText];
  // The text color: the nearest class's, else the root's (its props, or the editor's default).
  const colorOf = (list: ClassDeclaration[]) => list.filter((d) => d.property === "color" && d.when === "always").pop()?.value;
  const color = (list: ClassDeclaration[]) => colorOf(list) ?? root?.textColor ?? root?.values?.textColor ?? BodyDefaults.textColor;
  const changes: Props = {};
  for (const at of keys?.current ?? []) paint(changes, column.props, at, color(around));
  let markup = false;
  const kids: React.ReactNode[] = Array.isArray(column.props.children) ? column.props.children : [column.props.children];
  const children = kids.map((child) => {
    if (!React.isValidElement<Props>(child)) {
      if (typeof child === "string" || typeof child === "number") markup ||= String(child).trim() !== "";
      return child;
    }
    const item = (child.type as unknown as Props)?.[CONFIG];
    const name: string = item?.name;
    const next: Props = {};
    for (const at of child.props.style?.[TAILWIND]?.current ?? []) paint(next, child.props, at, color(decls));
    if (TAKES.has(name)) Object.assign(next, inherited(name, item.defaultValues ?? {}, child.props, decls, rtl));
    else if (!TEXTLESS.has(name)) markup = true;
    return Object.keys(next).length ? React.cloneElement(child, next) : child;
  });
  // Markup in it takes them as CSS gives them: an inline style on the Column (the HTML's), but for the root's color,
  // which is the body's (the design's).
  const inline: Props = {};
  const listed: string[] = [];
  if (markup) {
    for (const d of [...rootText.filter((d) => d.property !== "color"), ...rowText, ...ownText]) {
      if (d.when !== "always") {
        say(`Column can't pass \`${d.property}: ${d.value}\` (class \`${d.className}\`) on to the markup in it for one screen size`);
        continue;
      }
      inline[camel(d.property)] = d.value + (d.important ? " !important" : "");
      say(`Column \`${d.property}: ${d.value}\` from class \`${d.className}\` is kept in HTML (an inline style) for the markup in it, but not in the design for the visual editor`);
    }
    for (const key in inline) if (column.props.style?.[key] === undefined) listed.push(key);
  }
  if (listed.length) {
    const was: string[] & Props = keys ?? [];
    changes.style = { ...inline, ...column.props.style, [TAILWIND]: Object.assign([...was, ...listed], was) };
  }
  if (children.some((child, i) => child !== kids[i])) changes.children = children;
  return Object.keys(changes).length ? React.cloneElement(column, changes) : column;
}

/**
 * A Row's rewrite (see the comment above): `padding` and `phone`, the padding its classes give it (row.ts places it
 * in its Columns); `warn`, how what it can't do is said.
 */
export function rowRewrite(padding: string | undefined, phone: string | undefined, warn: (text: string) => void) {
  const inset = insetColumns(padding, phone, warn);
  const said = new Set<string>();
  const say = (text: string) => {
    if (!said.has(text)) console.warn(`[Unlayer] ${text}.`);
    said.add(text);
  };
  // (`rtl`: the document reads right to left; an older copy of Elements gives none.)
  return (children: React.ReactNode[], props: Props, root?: Props, rtl = false): React.ReactNode[] => {
    const rootText: ClassDeclaration[] = root?.[PASSED] ?? [];
    const rowText: ClassDeclaration[] = props[PASSED] ?? [];
    let list = children.map((child) => (isColumn(child) ? inColumn(child, rootText, rowText, root, say, rtl) : child));
    if (padding !== undefined || phone !== undefined || list.some((child) => isColumn(child) && child.props.style?.[TAILWIND]?.margin)) list = inset(list, props, root, rtl);
    return list;
  };
}
