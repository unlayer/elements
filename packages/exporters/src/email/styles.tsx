/**
 * Email styles: text as every client needs it (on the element with the text,
 * line heights in px), phone text styles inherited down to the text, and
 * hiding on phones or desktop.
 */
import { lineHeightPx, type Json, type ResolvedNode } from "@unlayer-internal/elements-core";
import { rule, type Style } from "../jsx";
import { fontFamily, px, textDeclarations, textValue, type Declarations } from "../shared/css";

/** Text styles a phone override changes, inherited down to the text that doesn't set them itself. */
export type MobileText = Record<string, Json>;
const TEXT_KEYS = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"];

/** Hidden on phones: a class. Hidden on desktop: inline, and shown on phones by a class (`display` is how it shows). */
export function hiding(node: ResolvedNode, display: string): { class?: string; style: Style } {
  if (node.hidden?.mobile) return { class: rule("phone", "&{display:none!important}"), style: {} };
  if (node.hidden?.desktop) return { class: rule("phone", `&{display:${display}!important}`), style: { display: "none" } };
  return { style: {} };
}

/** The phone text styles of a node's own text: its own overrides, and its parents' where it doesn't set the style itself. */
export function mobileTextOf(node: ResolvedNode, inherited: MobileText): MobileText {
  const out: MobileText = {};
  for (const key of TEXT_KEYS) if (inherited[key] !== undefined && node.style[key] === undefined) out[key] = inherited[key];
  for (const key of TEXT_KEYS) if (node.mobile?.[key] !== undefined) out[key] = node.mobile[key];
  return out;
}

/** Phone text styles as CSS; the line height in px, as inline, so a larger size gets a taller line. */
export function phoneText(node: ResolvedNode, mobile: MobileText): Declarations {
  const out: Declarations = [];
  for (const [key, value] of Object.entries(mobile)) {
    if (key === "lineHeight") continue;
    const written = textValue(key, value);
    if (written !== undefined) out.push([key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), written]);
  }
  if (mobile.fontSize !== undefined || mobile.lineHeight !== undefined) {
    const size = (mobile.fontSize as number | undefined) ?? node.text.fontSize;
    out.push(["line-height", px(lineHeightPx((mobile.lineHeight as never) ?? node.text.lineHeight, size))]);
  }
  return out;
}

/**
 * All of a node's text styles: every client gets them on the element with the
 * text, as Outlook doesn't carry styles down through tables. The line height
 * in px, exactly.
 */
export function fullText(node: ResolvedNode, { weight = false, align = true } = {}): Style {
  const { text } = node;
  return {
    color: text.color,
    fontFamily: fontFamily(text.fontFamily),
    fontSize: text.fontSize,
    fontWeight: weight || text.fontWeight !== 400 ? text.fontWeight : undefined,
    fontStyle: text.fontStyle === "italic" ? "italic" : undefined,
    lineHeight: px(text.lineHeightPx),
    msoLineHeightRule: "exactly",
    letterSpacing: text.letterSpacing || undefined,
    textAlign: align ? text.textAlign : undefined,
    textTransform: text.textTransform !== "none" ? text.textTransform : undefined,
  };
}

/** Text inside text: only what differs from its parent, and its line height in px where its size changes it. */
export function runText(node: ResolvedNode, parent: ResolvedNode, always: Array<"color"> = []): Declarations {
  const out = textDeclarations(node.text, parent.text, always).filter(([property]) => property !== "line-height");
  if (node.text.lineHeightPx !== parent.text.lineHeightPx) out.push(["line-height", px(node.text.lineHeightPx)]);
  return out;
}
