/**
 * React Email component + CSS → Elements blocks and layout, shared by both
 * modes. Content (text, HTML, links) is a plain value in runtime mode and may
 * be an Expr (code) in codemod mode; the mapping is the same.
 */

import { el, isExpr, expr, type BoxSides, type ElementNode, type Expr, type ReportBuilder } from "@unlayer/convert-core";
import { phoneSides } from "./phone-styles";
import { alignOf, borderProp, borders } from "./boxes";
import {
  addSides,
  backgroundColor,
  boxSides,
  color,
  fontFamilyProp,
  margins,
  parseBorder,
  px,
  sidesToCss,
  toPx,
  unconverted,
  ZERO,
  type Inherited,
  type Style,
} from "./styles";

export interface MapCtx {
  report: ReportBuilder;
  inherited: Inherited;
  /** The root's font stack; blocks with the same one don't repeat it. */
  rootFont?: string;
}

/** A content block before margins become containerPadding. */
export interface Block {
  node: ElementNode;
  margin: BoxSides;
  padding: BoxSides;
  mobilePadding?: BoxSides;
  mobileMargin?: BoxSides;
}

export type Content = string | Expr;

/** Text as children: plain strings and code, no markup (codemod mode). */
export type Parts = Array<string | Expr>;

function needsSpan(style: Style): boolean {
  const decoration = style.textDecoration ?? style.textDecorationLine;
  return Boolean(style.textTransform || (style.fontStyle && style.fontStyle !== "normal") || (decoration && decoration !== "none"));
}

/** Browser defaults for headings: font size and margin, in em. */
const HEADINGS: Record<string, { size: number; margin: number }> = {
  h1: { size: 2, margin: 0.67 },
  h2: { size: 1.5, margin: 0.83 },
  h3: { size: 1.17, margin: 1 },
  h4: { size: 1, margin: 1.33 },
  h5: { size: 0.83, margin: 1.67 },
  h6: { size: 0.67, margin: 2.33 },
};

/** Say what a block's style shows that Elements can't (a shadow, a transform). */
export function noteUnconverted(style: Style, ctx: MapCtx, label: string): void {
  for (const what of unconverted(style)) ctx.report.note("style not converted", `${what} (${label})`);
}

/** A flex text (`flex justify-center`): its line sits where the flex box puts it. */
function flexTextAlign(style: Style): string | undefined {
  if (!/^(inline-)?flex$/.test(String(style.display ?? "").trim())) return undefined;
  const justify = String(style.justifyContent ?? "").trim();
  return justify === "center" ? "center" : /^(flex-end|end|right)$/.test(justify) ? "right" : undefined;
}

/** Text props, from the element's style and what it inherits. */
export function textProps(
  style: Style,
  ctx: MapCtx,
  defaults: { fontSize?: string; lineHeight?: string; fontWeight?: string | number }
) {
  const font = style.fontFamily ?? ctx.inherited.fontFamily;
  const weight = style.fontWeight ?? ctx.inherited.fontWeight ?? defaults.fontWeight;
  const mobile: Record<string, unknown> = {};
  for (const key of ["fontSize", "lineHeight", "textAlign"] as const) {
    const value = style._phone?.[key] ?? (style[key] === undefined ? ctx.inherited.mobile?.[key] : undefined);
    if (value !== undefined) mobile[key] = key === "fontSize" ? cssLength(value) : String(value);
  }
  return {
    ...(Object.keys(mobile).length ? { mobile } : {}),
    ...(style._phone?.display === "none" ? { hideOnMobile: true } : {}),
    color: color(style.color ?? ctx.inherited.color) ?? "#000000",
    fontSize: cssLength(style.fontSize ?? defaults.fontSize ?? ctx.inherited.fontSize),
    lineHeight: lineHeightValue(style.lineHeight ?? defaults.lineHeight ?? ctx.inherited.lineHeight),
    textAlign: (style.textAlign ?? flexTextAlign(style) ?? ctx.inherited.textAlign) as string | undefined,
    fontWeight: weight === undefined ? undefined : numericWeight(weight),
    letterSpacing: cssLength(style.letterSpacing ?? ctx.inherited.letterSpacing),
    fontFamily: font && font !== ctx.rootFont ? fontFamilyProp(String(font)) : undefined,
  };
}

/**
 * Text styles Elements has no prop for (text-transform, italics, underline)
 * stay on a span around the text, so they still show and stay editable.
 */
export function withInlineStyles(html: Content, style: Style): Content {
  const css: string[] = [];
  if (style.textTransform) css.push(`text-transform:${style.textTransform}`);
  if (style.fontStyle && style.fontStyle !== "normal") css.push(`font-style:${style.fontStyle}`);
  const decoration = style.textDecoration ?? style.textDecorationLine;
  if (decoration && decoration !== "none") css.push(`text-decoration:${decoration}`);
  if (!css.length) return html;
  const open = `<span style="${css.join(";")}">`;
  return isExpr(html) ? expr(`\`${open}\${${html.$expr}}</span>\``) : `${open}${html}</span>`;
}

/** React Email Text's own size; text outside a Text (`<Section>🌟</Section>`) inherits instead. */
export const TEXT_DEFAULTS = { fontSize: "14px", lineHeight: "24px" };
export const INHERITED: { fontSize?: string; lineHeight?: string } = {};

/**
 * React Email Text (or <p>): 14px/24px with 16px top and bottom margins.
 * Plain text with code (`parts`) stays as children: Elements escapes it.
 */
export function paragraphBlock(html: Content, style: Style, ctx: MapCtx, margin: BoxSides, parts?: Parts, defaults: { fontSize?: string; lineHeight?: string } = TEXT_DEFAULTS): Block {
  noteUnconverted(style, ctx, "text");
  const props = textProps(style, ctx, defaults);
  const asChildren = parts !== undefined && !needsSpan(style);
  return {
    node: asChildren ? el("Paragraph", props, parts) : el("Paragraph", { ...props, html: withInlineStyles(html, style) }),
    margin,
    padding: boxSides(style, "padding"),
    mobilePadding: phoneSides(style, "padding", boxSides(style, "padding")),
    mobileMargin: phoneSides(style, "margin", margin),
  };
}

/**
 * Heading (as h1–h6): browser defaults the Elements Heading doesn't share —
 * bold, 2em/1.5em/…, em-based margins, normal line height.
 */
export function headingBlock(
  level: string,
  content: { html: Content; plain: boolean; parts?: Parts },
  style: Style,
  marginProps: Style,
  ctx: MapCtx
): Block {
  noteUnconverted(style, ctx, "heading");
  const preset = HEADINGS[level] ?? HEADINGS.h1;
  const base = toPx(ctx.inherited.fontSize) ?? 16;
  const fontSize = toPx(style.fontSize) ?? preset.size * base;
  const margin = margins({ ...marginProps, ...style }, { top: preset.margin * fontSize, bottom: preset.margin * fontSize });
  const html = withInlineStyles(content.html, style);
  const asChildren = (content.plain || content.parts !== undefined) && !needsSpan(style);
  return {
    node: el(
      "Heading",
      {
        headingType: HEADINGS[level] ? level : "h1",
        ...textProps(style, ctx, { fontSize: px(fontSize), lineHeight: "normal", fontWeight: 700 }),
        ...(asChildren ? {} : { text: html }),
      },
      asChildren ? content.parts ?? [html] : []
    ),
    margin,
    padding: boxSides(style, "padding"),
    mobilePadding: phoneSides(style, "padding", boxSides(style, "padding")),
    mobileMargin: phoneSides(style, "margin", margin),
  };
}



/**
 * The text styles kept markup (an Html block) inherited from its ancestors in
 * the original — alignment, color, size — so it looks the same on its own.
 */
export function inheritedStyle(ctx: MapCtx): Record<string, string> | undefined {
  const i = ctx.inherited;
  const out: Record<string, string> = {};
  if (i.textAlign && i.textAlign !== "left" && i.textAlign !== "start") out.textAlign = i.textAlign;
  if (i.color) out.color = color(i.color) as string;
  // Even the browser's 16px: the editor's canvas shows HTML blocks at its own 14px otherwise.
  if (i.fontSize) out.fontSize = cssLength(i.fontSize) as string;
  if (i.lineHeight) out.lineHeight = lineHeightValue(i.lineHeight) as string;
  if (i.fontWeight !== undefined) out.fontWeight = String(i.fontWeight);
  if (i.letterSpacing) out.letterSpacing = cssLength(i.letterSpacing) as string;
  if (i.fontFamily && i.fontFamily !== ctx.rootFont) out.fontFamily = String(i.fontFamily).replace(/"/g, "'");
  return Object.keys(out).length ? out : undefined;
}

/** A React Email <Font>: its family and the web font file it loads. */
export interface FontSpec {
  family: string;
  url: string;
  format?: string;
  weight?: string | number;
  style?: string;
}

/**
 * Web fonts as the stylesheet URLs Elements links (`fonts` on the root).
 * A Google-hosted font file becomes its Google Fonts stylesheet; any other
 * file, a small @font-face stylesheet of its own.
 */
export function fontStylesheets(fonts: FontSpec[], linked: string[] = []): Array<{ url: string }> {
  const urls = fonts.map((font) => {
    const weight = font.weight !== undefined ? String(font.weight) : "400";
    const italic = font.style === "italic";
    if (/^https:\/\/fonts\.gstatic\.com\//.test(font.url)) {
      const axes = italic ? `:ital,wght@1,${weight}` : `:wght@${weight}`;
      return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family).replace(/%20/g, "+")}${axes}&display=swap`;
    }
    const format = font.format ? ` format('${font.format}')` : "";
    const css = `@font-face{font-family:'${font.family.replace(/'/g, "")}';src:url('${font.url}')${format};font-weight:${weight};font-style:${font.style ?? "normal"}}`;
    return `data:text/css,${encodeURIComponent(css)}`;
  });
  return [...new Set([...linked, ...urls])].map((url) => ({ url }));
}

/** Stylesheets a <style> imports (`@import url('…')`), usually web fonts: Elements links them. */
export function importedStylesheets(css: string): string[] {
  return [...css.matchAll(/@import\s+(?:url\(\s*)?(['"]?)(https?:\/\/[^'")\s;]+)\1\s*\)?/g)].map((m) => m[2]);
}

/**
 * Whether an image says how wide it is (attribute or style, px or %). One
 * that doesn't shows at its file's natural size, which isn't known without
 * loading it: an Elements Image would fill its column instead.
 */
export function hasWidth(width: unknown, style: Style): boolean {
  const given = (value: unknown) => value !== undefined && value !== null && value !== "" && value !== "auto";
  return given(width) || given(style.width) || given(style.maxWidth);
}

/** React Email Heading's m/mx/my/mt/mr/mb/ml props (numbers, in px). */
export function headingMarginProps(props: Record<string, any>): Style {
  const out: Style = {};
  const set = (keys: string[], value: unknown) => {
    if (value === undefined || Number.isNaN(Number.parseFloat(String(value)))) return;
    for (const key of keys) out[key] = `${value}px`;
  };
  set(["marginTop", "marginRight", "marginBottom", "marginLeft"], props.m);
  set(["marginLeft", "marginRight"], props.mx);
  set(["marginTop", "marginBottom"], props.my);
  set(["marginTop"], props.mt);
  set(["marginRight"], props.mr);
  set(["marginBottom"], props.mb);
  set(["marginLeft"], props.ml);
  return out;
}

/** Button (an inline-block <a>): no background or radius unless styled. */
export function buttonBlock(href: unknown, label: Content | Parts, style: Style, ctx: MapCtx): Block {
  noteUnconverted(style, ctx, "button");
  const padding = boxSides(style, "padding");
  // Its width: px or a share of the column as given; a block link with none fills the column.
  const given = typeof style.width === "string" ? style.width.trim() : style.width;
  const width =
    typeof given === "string" && given.endsWith("%") ? given : toPx(given) !== undefined ? `${toPx(given)}px` : style.display === "block" ? "100%" : undefined;
  // A block link ignores its parent's text-align: only auto margins move it.
  const block = style.display === "block";
  return {
    node: el(
      "Button",
      {
        href,
        backgroundColor: backgroundColor(style) ?? "transparent",
        ...textProps(style, ctx, { lineHeight: "120%" }),
        // An inline-block link: placed by the parent's text-align (left by default).
        textAlign: (block ? alignOf(style) ?? "left" : ctx.inherited.blockAlign ?? ctx.inherited.textAlign ?? "left") as string,
        color: color(style.color) ?? "#0000ee",
        padding: sidesToCss(padding),
        ...(style._phone ? { mobile: { ...textProps(style, ctx, {}).mobile, ...(phoneSides(style, "padding", padding) ? { padding: sidesToCss(phoneSides(style, "padding", padding)!) } : {}) } } : {}),
        borderRadius: style.borderRadius !== undefined ? cssLength(style.borderRadius) : "0px",
        // Every side, from the shorthand or longhands (Tailwind writes border-width/-style/-color).
        border: borderProp(borders(style)),
        ...(width ? { width } : {}),
      },
      Array.isArray(label) ? label : [label]
    ),
    margin: boxSides(style, "margin"),
    mobileMargin: phoneSides(style, "margin", boxSides(style, "margin")),
    padding: ZERO,
  };
}

/** Img (display: block): centred by `margin: 0 auto`, else left. */
export function imageBlock(
  attrs: { src: unknown; alt?: unknown; width?: unknown; height?: unknown; href?: unknown },
  style: Style,
  ctx: MapCtx
): Block {
  const width = toPx(attrs.width ?? style.width);
  const height = toPx(attrs.height ?? style.height);
  const margin = boxSides(style, "margin");
  const centered = String(style.margin ?? "").includes("auto") || style.marginLeft === "auto";
  const flex = ctx.inherited.blockAlign;
  const align = centered ? "center" : flex ? flex : ctx.inherited.textAlign === "center" && style.display !== "block" ? "center" : "left";
  if (style.borderRadius) ctx.report.note("image border radius dropped", String(style.borderRadius));
  noteUnconverted(style, ctx, "image");
  const src = isExpr(attrs.src)
    ? attrs.src
    : { url: String(attrs.src ?? ""), ...(width ? { width } : {}), ...(height ? { height } : {}) };
  return {
    node: el("Image", {
      src,
      ...(style._phone ? { mobile: { ...(style._phone.width === "100%" || style._phone.maxWidth === "100%" ? { autoWidth: true } : {}), ...(style._phone.textAlign ? { textAlign: style._phone.textAlign } : {}) }, ...(style._phone.display === "none" ? { hideOnMobile: true } : {}) } : {}),
      ...(style._phone?.width === "100%" || style._phone?.maxWidth === "100%" ? { values: { _override: { mobile: { src: { width: 0 } } } } } : {}),
      ...(width ? { width: `${width}px` } : {}),
      alt: attrs.alt,
      textAlign: align,
      action: attrs.href,
    }),
    margin: { ...margin, left: centered ? 0 : margin.left, right: centered ? 0 : margin.right },
    mobileMargin: phoneSides(style, "margin", margin),
    mobilePadding: phoneSides(style, "padding", boxSides(style, "padding")),
    padding: ZERO,
  };
}

/** Hr: React Email's 1px #eaeaea top border, browser 0.5em margins. */
export function dividerBlock(style: Style, ctx: MapCtx): Block {
  noteUnconverted(style, ctx, "divider");
  const top = parseBorder(style.borderTop ?? style.border ?? "1px solid #eaeaea");
  const base = toPx(ctx.inherited.fontSize) ?? 16;
  return {
    node: el("Divider", {
      ...(style._phone?.display === "none" ? { hideOnMobile: true } : {}),
      borderTopWidth: style.borderTopWidth !== undefined ? cssLength(style.borderTopWidth) : top.width ?? "1px",
      borderTopStyle: style.borderTopStyle ?? top.style ?? "solid",
      borderTopColor: color(style.borderTopColor ?? style.borderColor ?? top.color) ?? "#eaeaea",
      width: style.width !== undefined ? String(style.width) : "100%",
    }),
    mobileMargin: phoneSides(style, "margin", margins(style, { top: base / 2, bottom: base / 2 })),
    mobilePadding: phoneSides(style, "padding", boxSides(style, "padding")),
    margin: margins(style, { top: base / 2, bottom: base / 2 }),
    padding: ZERO,
  };
}

/** Margin collapse between consecutive blocks, then margins → containerPadding. */
export function collapse(blocks: Block[]): ElementNode[] {
  return blocks.map((block, i) => {
    const previous = blocks[i - 1];
    const top = previous ? Math.max(0, block.margin.top - previous.margin.bottom) : block.margin.top;
    const sides = addSides({ ...block.margin, top }, block.padding);
    if (block.node.type !== "#expr") {
      const phoneMargin = block.mobileMargin ?? block.margin;
      const priorPhone = previous?.mobileMargin ?? previous?.margin;
      const phoneTop = priorPhone ? Math.max(0, phoneMargin.top - priorPhone.bottom) : phoneMargin.top;
      const phone = addSides({ ...phoneMargin, top: phoneTop }, block.mobilePadding ?? block.padding);
      block.node.props = { ...block.node.props, containerPadding: sidesToCss(sides),
        ...(block.mobileMargin || block.mobilePadding ? { mobile: { ...(block.node.props?.mobile as object), containerPadding: sidesToCss(phone) } } : {}),
      };
    }
    return block.node;
  });
}

// ============================================
// Layout
// ============================================

export const LAYOUTS: Record<string, string> = {
  "1": "OneColumn",
  "1,1": "TwoEqual",
  "2,1": "TwoWideNarrow",
  "1,2": "TwoNarrowWide",
  "1,1,1": "ThreeEqual",
  "1,2,1": "ThreeNarrowWideNarrow",
  "1,1,1,1": "FourEqual",
  "1,1,1,1,1": "FiveEqual",
};

/** Known widths, with the unknown ones sharing what's left of `total`. */
export function fill(widths: Array<number | undefined>, total: number): number[] {
  const known = widths.filter((w): w is number => w !== undefined && w > 0);
  const unknown = widths.length - known.length;
  const rest = Math.max(0, total - known.reduce((a, b) => a + b, 0));
  return widths.map((w) => (w !== undefined && w > 0 ? w : rest / unknown || total / widths.length));
}

/** Column widths in px → small integer cells. */
export function cellsFrom(widths: number[]): number[] {
  if (widths.length === 0) return [1];
  const sum = widths.reduce((a, b) => a + b, 0) || 1;
  const percents = widths.map((w) => Math.max(1, Math.round((w / sum) * 100)));
  const divisor = percents.reduce(gcd);
  return percents.map((p) => p / divisor);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}






/** A number is a multiplier (`lineHeight: 1.25` in a style object), not px. */
function lineHeightValue(value: unknown): string | undefined {
  return typeof value === "number" ? String(value) : cssLength(value);
}

export function cssLength(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "number" ? `${value}px` : String(value);
}

function numericWeight(value: string | number): number | string {
  if (value === "bold") return 700;
  if (value === "normal") return 400;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}
