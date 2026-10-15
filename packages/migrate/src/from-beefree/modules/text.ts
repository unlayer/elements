/**
 * Beefree's text modules as Unlayer text blocks: `text` (the legacy TinyMCE module, most templates' text),
 * `paragraph` and `list` as Paragraphs (a `text` block) with their HTML, `heading` as a Heading.
 */
import { align, color, fontFamily, fontWeight, inherits, lineHeight, px, pxString } from "../css";
import type { ModuleContext, ModuleResult } from "../context";
import { textOf } from "../html";
import { cleanRichText, legacyText, withDirection } from "../text";
import type { Values } from "../types";
import { blockDevice, blockPadding, linkStyle, textSettings } from "./common";

/** A text block's HTML in the direction its module sets, where the body's is the other one. */
function directed(html: string, direction: unknown, ctx: ModuleContext): string {
  const own = typeof direction === "string" ? direction.trim().toLowerCase() : "";
  return (own === "rtl" || own === "ltr") && own !== ctx.direction ? withDirection(html, own) : html;
}

/** Links in the module's link color, else the body's (Beefree exports each link with its color). */
const linkOptions = (linkColor: unknown, ctx: ModuleContext) => ({ color: color(linkColor) || undefined, fallback: ctx.linkColor });

/**
 * A block's link color, for its links (Beefree's links are written with it) and the ones added in the editor: set
 * where the block has links.
 */
function withLinks(values: Values, html: string, linkColor: unknown): void {
  const links = /<a\s/i.test(html) ? linkStyle(linkColor) : undefined;
  if (links) values.linkStyle = links;
}

/** Without a color of its own a text block shows the body's: Elements writes a color, so it's that one. */
const withColor = (values: Values, ctx: ModuleContext): Values => ({ color: ctx.textColor, ...values });

/** The legacy `text` module. */
export function text(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.text ?? {};
  const style = source.style ?? {};
  const { html, lifted } = legacyText(String(source.html ?? ""), { paragraphs: {}, links: linkOptions(source.computedStyle?.linkColor, ctx) });
  const values: Values = {};
  // Beefree exports the wrapper's size and font, and the module's color and line height.
  const size = px(lifted.fontSize) ?? px(style["font-size"]) ?? px(style.size);
  values.fontSize = pxString(size ?? 12);
  const font = fontFamily(!inherits(lifted.fontFamily) ? lifted.fontFamily : style["font-family"], ctx.webFonts);
  if (font) values.fontFamily = font;
  const paint = color(style.color) || color(lifted.color);
  if (paint) values.color = paint;
  values.lineHeight = lineHeight(style["line-height"]) ?? "120%";
  const side = align(lifted.textAlign) ?? align(descriptor.style?.["text-align"]) ?? align(source.computedStyle?.align);
  if (side) values.textAlign = side;
  withLinks(values, html, source.computedStyle?.linkColor);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("text", { containerPadding, ...withColor(values, ctx), text: html }, blockDevice(descriptor, ctx))];
}

/** The `paragraph` module. */
export function paragraph(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.paragraph ?? {};
  const spacing = px(source.computedStyle?.paragraphSpacing);
  const html = cleanRichText(String(source.html ?? ""), { paragraphs: { spacing: spacing ? pxString(spacing) : undefined }, links: linkOptions(source.computedStyle?.linkColor, ctx) });
  const values = textSettings(source.style, ctx);
  const weight = fontWeight(source.style?.["font-weight"]);
  if (weight !== undefined && weight !== 400) values.fontWeight = weight;
  withLinks(values, html, source.computedStyle?.linkColor);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("text", { containerPadding, ...withColor(values, ctx), text: directed(html, source.style?.direction, ctx) }, blockDevice(descriptor, ctx))];
}

/** The `list` module: its list, without the margins browsers give one, in the marker style it sets. */
export function list(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.list ?? {};
  const computed = source.computedStyle ?? {};
  const marker = typeof computed.listStyleType === "string" ? computed.listStyleType : undefined;
  const itemSpacing = px(computed.liSpacing);
  let html = cleanRichText(String(source.html ?? ""), { links: linkOptions(computed.linkColor, ctx) });
  html = html.replace(/<(ul|ol)\b([^>]*)>/gi, (_tag, name: string, attrs: string) => {
    const style = `margin-top: 0; margin-bottom: 0;${marker ? ` list-style-type: ${marker};` : ""}`;
    return /\sstyle="/i.test(attrs) ? `<${name}${attrs.replace(/\sstyle="/i, ` style="${style} `)}>` : `<${name}${attrs} style="${style}">`;
  });
  if (itemSpacing) html = html.replace(/<li\b(?![^>]*\sstyle=)/gi, `<li style="margin-bottom: ${pxString(itemSpacing)};"`);
  const values = textSettings(source.style, ctx);
  const weight = fontWeight(source.style?.["font-weight"]);
  if (weight !== undefined && weight !== 400) values.fontWeight = weight;
  withLinks(values, html, computed.linkColor);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("text", { containerPadding, ...withColor(values, ctx), text: directed(html, source.style?.direction, ctx) }, blockDevice(descriptor, ctx))];
}

/** The `heading` module. */
export function heading(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.heading ?? {};
  const level = /^h[1-6]$/i.test(String(source.title ?? "")) ? String(source.title).toLowerCase() : "h1";
  const html = cleanRichText(String(source.text ?? ""), { links: linkOptions(source.style?.["link-color"], ctx) });
  const values = textSettings(source.style, ctx);
  values.fontWeight = fontWeight(source.style?.["font-weight"]) ?? 700;
  withLinks(values, html, source.style?.["link-color"]);
  if (!textOf(html).trim()) ctx.warn("empty-text", `${ctx.where}: the heading is empty.`);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("heading", { containerPadding, headingType: level, ...withColor(values, ctx), text: directed(html, source.style?.direction, ctx) }, blockDevice(descriptor, ctx))];
}

