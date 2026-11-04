/**
 * A menu block as its exporter draws it, in a Column with the block's padding. Horizontal: its links and separators
 * each a Text in the links' padding on a line that wraps, separators left out on phones (a printed document has none).
 * Vertical: its links one under another, no separators. Its lines are a page's 1.5, or in an email or a printed document
 * the font's own height. In an email's markup its items are a word space apart. An item with no link is text in the
 * text's color: a page's markup has it a link to nothing, an email's plain text. It always draws: what can't be read is
 * said, and drawn as CSS draws a value it can't read, without it.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { normalizeLinkValue } from "@unlayer-internal/shared-elements";
import type { TreeNode } from "../lower";
import { fontOfValues } from "../quirks";
import { ALIGN, deviceValues, drawnLink, ENTITY, fontWeight, letterSpacing, nearestWeight, px, sides, some, type Values } from "../values";
import type { Lowering } from "./index";

/** A word space at 16px in Arial, where a page holds an email's markup (a page's Row has no words to space). */
const WORD_SPACE = 4.45;

export const menu: Lowering = (block, place): TreeNode => {
  const { values, phone } = deviceValues(block.values, ["containerPadding", "padding", "fontSize"], place.mode);
  const asEmail = (values.mode ?? place.mode) === "email";
  const said = (what: string, value: unknown) => place.note(`A menu's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const read = <T>(value: unknown, what: string, reader: (value: unknown) => T | undefined): T | undefined => {
    if (value === undefined || value === null || value === "") return undefined;
    const out = reader(value);
    if (out === undefined) said(what, value);
    return out;
  };
  const padding = read(values.padding ?? "5px 15px", "links' padding", sides);
  const blockPadding = read(values.containerPadding ?? "10px", "padding", sides);
  const size = read(values.fontSize ?? "14px", "font size", px);
  const weight = values.fontWeight === "normal" ? undefined : read(values.fontWeight, "font weight", (value) => fontWeight(value) ?? nearestWeight(value));
  const spacing = read(values.letterSpacing, "letter spacing", (value) => letterSpacing(value, size ?? 16));
  let align = ALIGN[values.align ?? "center"];
  if (!align) {
    said("alignment", values.align);
    align = "start";
  }
  const phoneSize = read(phone.fontSize, "font size on phones", px);
  const phonePadding = read(phone.padding, "links' padding on phones", sides);
  const phoneBlock = read(phone.containerPadding, "padding on phones", sides);
  const text: Record<string, Json> = Object.fromEntries(
    Object.entries({ fontSize: size, fontWeight: weight, letterSpacing: spacing || undefined, fontFamily: fontOfValues(values.fontFamily) }).filter(([, v]) => v !== undefined)
  ) as Record<string, Json>;
  const phoneText: Record<string, Json> = { ...(phoneSize !== undefined ? { fontSize: phoneSize } : {}), ...(phonePadding ? { padding: phonePadding } : {}) };
  const textColor: Record<string, Json> = typeof values.textColor === "string" && values.textColor ? { color: values.textColor } : {};
  const linkColor = typeof values.linkColor === "string" && values.linkColor ? values.linkColor : "#0068A5";
  const box: Record<string, Json> = { ...(some(padding) ? { padding: padding! } : {}), ...text };
  const mobile = Object.keys(phoneText).length ? { mobile: phoneText } : {};
  // An email's markup has an item's text as HTML: its tags and entity references as written. A page's has it as text.
  const shown = (words: string) => (asEmail ? place.keep(place.keep(words), ENTITY) : words);
  if (values.menu?.items !== undefined && !Array.isArray(values.menu.items)) said("items", values.menu.items);
  const listed: unknown[] = Array.isArray(values.menu?.items) ? values.menu.items : [];
  const items = listed
    .filter((item): item is Values => {
      if (!item || typeof item !== "object") said("item", item);
      return !!item && typeof item === "object";
    })
    .map((item) => {
      // (An email's markup has a tag in its link as written; a page's has it escaped.)
      const own = item.link ? drawnLink(item.link, asEmail ? place.keep : (text) => text, place.note) : undefined;
      const url = (own?.href as { href?: string } | undefined)?.href;
      // No URL: on a page's markup a link to nothing, in an email's none, in the text's color.
      const linked = url || !asEmail;
      const text = item.text === undefined || item.text === null ? "" : shown(String(item.text));
      const label = `Menu item - ${text}`;
      const props = { ...(url ? own! : { href: { href: "", ...(item.link && normalizeLinkValue(item.link)?.target === "_blank" ? { target: "_blank" } : {}) } }), "aria-label": label };
      return { text, url, linked, props, label };
    });
  const words = (item: (typeof items)[number]): Array<TreeNode | string> => {
    const held = item.text ? [item.text] : [];
    return item.linked ? [{ type: "Link", props: item.props as Record<string, Json>, style: { ...(item.url ? { color: linkColor } : textColor), textDecoration: "none" }, children: held }] : held;
  };
  const inBlock = (children: TreeNode[]): TreeNode => ({ type: "Column", style: some(blockPadding) ? { padding: blockPadding! } : {}, ...(phoneBlock ? { mobile: { padding: phoneBlock } } : {}), compat: { ariaLabel: "menu" }, children });
  // Text with no link has the label a link has on its own box.
  const labelled = (item: (typeof items)[number]) => (item.linked ? {} : { compat: { ariaLabel: item.label } });
  // The template's lines: a page's 1.5 is what its text inherits; the font's own elsewhere.
  const lines: Record<string, Json> = place.mode === "web" ? {} : { lineHeight: "normal" };
  if (!items.length) {
    const { compat: _, ...none } = inBlock([]);
    return asEmail ? inBlock([]) : none;
  }
  // As legacy's plain text reads it: an email's markup has its items on lines of their own, a page's side by side.
  const reading = (parts: Array<Array<TreeNode | string>>): TreeNode => (asEmail ? { type: "Column", children: parts.map((part) => ({ type: "Column", children: [{ type: "Paragraph", children: part }] })) } : { type: "Paragraph", children: parts.flat() });
  if ((values.layout ?? "horizontal") === "vertical") {
    return {
      ...inBlock(items.map((item): TreeNode => ({ type: "Text", ...labelled(item), ...mobile, style: { ...box, ...lines, textAlign: align === "start" ? "left" : align === "end" ? "right" : "center", ...(item.url ? {} : textColor) }, children: words(item) }))),
      textAs: reading(items.map(words)),
    };
  }
  const separator = typeof values.separator === "string" ? shown(values.separator) : "";
  const hidden = place.mode === "document" ? {} : { hidden: { mobile: true } };
  const children: TreeNode[] = items.flatMap((item, index) => [
    ...(index && separator ? [{ type: "Text", compat: { ariaLabel: "menu separator" }, ...hidden, ...mobile, style: { flex: "none", ...box, ...textColor }, children: [separator] } as TreeNode] : []),
    { type: "Text", ...labelled(item), ...mobile, style: { flex: "none", ...box, ...(item.url ? {} : textColor) }, children: words(item) },
  ]);
  const flow: Record<string, Json> = asEmail ? (place.mode === "email" ? { flexWrap: "words", ...(text.letterSpacing !== undefined ? { letterSpacing: text.letterSpacing } : {}) } : { flexWrap: "wrap", gap: WORD_SPACE }) : { flexWrap: "wrap" };
  const rtl = (place.config.textDirection ?? place.body.textDirection) === "rtl";
  const row: TreeNode = { type: "Row", props: { stackOnMobile: false, ...(rtl ? { dir: "ltr" } : {}) }, style: { ...flow, ...lines, justifyContent: align }, children };
  return { ...inBlock([row]), textAs: reading(items.flatMap((item, index) => [...(index && separator ? [[separator]] : []), words(item)])) };
};
