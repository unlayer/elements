/**
 * Email styles: text as every client needs it (on the element with the
 * text, line heights in px), and what inline styles can't do, as classes in
 * the stylesheet: phone overrides, hiding, hover.
 */
import { lineHeightPx, type ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, styleText, type Html, type Style, type StyleValue } from "../jsx";
import { css, fontFamily, px, textDeclarations, textValue, type Declarations } from "../shared/css";
import { inText, type Context, type MobileText } from "./context";

const TEXT_KEYS = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"];

// ─── Classes: phones, hiding, hover ─────────────────────────────────────────

/** The class of a phone rule, or nothing when the style is empty; `selector` follows the class (`>div`). */
export function phoneClass(context: Context, style: StyleValue, selector = ""): string | undefined {
  const text = styleText(style, true);
  return text ? context.sheet.classFor("phone", `&${selector}{${text}}`) : undefined;
}

/** Hidden on phones: a class. Hidden on desktop: inline, and shown on phones by a class (`display` is how it shows). */
export function hiding(node: ResolvedNode, context: Context, display: string): { className?: string; style: Style } {
  if (node.hidden?.mobile) return { className: context.sheet.classFor("phone", "&{display:none!important}"), style: {} };
  if (node.hidden?.desktop) return { className: context.sheet.classFor("phone", `&{display:${display}!important}`), style: { display: "none" } };
  return { style: {} };
}

export function hoverClass(node: ResolvedNode, context: Context): string | undefined {
  if (!node.hover) return undefined;
  const declarations: Declarations = [];
  for (const [key, value] of Object.entries(node.hover)) {
    if (key === "color") declarations.push(["color", value as string]);
    else if (key === "backgroundColor") declarations.push(["background-color", value as string]);
    else if (key === "textDecoration") declarations.push(["text-decoration", value as string]);
  }
  return context.sheet.classFor("all", `&:hover{${css(declarations, true)}}`);
}

/** What a phone override does to a box: its padding, border and background. */
export const phoneBox = (node: ResolvedNode): Style => ({ padding: node.mobile?.padding, border: node.mobile?.border, backgroundColor: node.mobile?.backgroundColor });

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

// ─── Text ───────────────────────────────────────────────────────────────────

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

/** A node's text and the runs in it. */
export function inline(node: ResolvedNode, context: Context): Html {
  return <>{node.children.map((child) => (typeof child === "string" ? child : context.render(child, inText(node))))}</>;
}
