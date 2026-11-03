/**
 * Text and heading blocks as a Paragraph and a Heading: their HTML as runs (runs.ts), their text styles, padding and
 * phone settings. A block whose HTML holds what no run can (an image, a list, a paragraph's own style) keeps its
 * legacy HTML.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { parseRuns } from "../runs";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import { fontOfValues, spaceBeforeTag, textTransformOfText } from "../quirks";
import { fontWeight, letterSpacing, lineHeight, px, sides, some, type Values } from "../values";

const ALIGNS = new Set(["left", "center", "right", "justify"]);
const DIRECTIONS = new Set(["ltr", "rtl", "auto"]);

/** A block's text styles as legacy writes them, or undefined where one can't be drawn the same. */
export function textStyles(values: Values, defaults: { weight?: number } = {}): Record<string, Json> | undefined {
  const size = px(values.fontSize);
  const height = lineHeight(values.lineHeight);
  const weight = values.fontWeight === undefined || values.fontWeight === "" ? defaults.weight : fontWeight(values.fontWeight);
  const spacing = values.letterSpacing === undefined || values.letterSpacing === "" ? 0 : letterSpacing(values.letterSpacing, size);
  const family = fontOfValues(values.fontFamily);
  if (size === undefined || height === undefined || weight === undefined && values.fontWeight !== undefined) return undefined;
  if (spacing === undefined) return undefined;
  if (values.textAlign !== undefined && !ALIGNS.has(values.textAlign)) return undefined;
  return Object.fromEntries(
    Object.entries({
      fontSize: size,
      lineHeight: height,
      fontWeight: weight,
      color: typeof values.color === "string" && values.color ? values.color : undefined,
      textAlign: values.textAlign,
      fontFamily: family,
      letterSpacing: spacing || undefined,
      textTransform: textTransformOfText(values.textTransform),
    }).filter(([, value]) => value !== undefined)
  ) as Record<string, Json>;
}

/** A block's phone settings (its padding, font size, line height and alignment), or undefined where one can't be read. */
export function phoneText(values: Values, padding = "containerPadding"): { mobile?: Record<string, Json> } | undefined {
  const phone: Values = values._override?.mobile ?? {};
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries(phone)) {
    if (key === "hideMobile") continue;
    if (key === padding) {
      const s = sides(value);
      if (!s) return undefined;
      out.padding = s;
    } else if (key === "fontSize" && px(value) !== undefined) out.fontSize = px(value)!;
    else if (key === "lineHeight" && lineHeight(value) !== undefined) out.lineHeight = lineHeight(value)!;
    else if (key === "textAlign" && ALIGNS.has(value)) out.textAlign = value;
    else return undefined;
  }
  return Object.keys(out).length ? { mobile: out } : {};
}

/**
 * A text or heading block's HTML as its exporter writes it: a text's from its textJson (the design's `text` is that
 * without its formatting), through the configured sanitizer, a non-breaking space before a tag made a space (legacy's
 * own step).
 */
export const textHtml = (values: Values, place: Place): string => {
  const textJson = place.source?.textJson;
  const html = typeof textJson === "string" ? generateHtmlFromTextJson(textJson) : typeof values.text === "string" ? values.text : "";
  return spaceBeforeTag(place.config.toSafeHtml ? place.config.toSafeHtml(html) : html);
};

/** The color legacy gives a block's links: its own link color where it doesn't take the body's, else the browser's. */
function linkColor(values: Values): string | undefined {
  const style = values.linkStyle;
  return style && style.inherit === false && typeof style.linkColor === "string" && style.linkColor ? style.linkColor : undefined;
}

/** The links among runs, in the block's link color (where a link has none of its own). */
function colored(runs: Array<TreeNode | string>, color: string | undefined): Array<TreeNode | string> {
  if (!color) return runs;
  return runs.map((run) => {
    if (typeof run === "string") return run;
    const children = run.children && colored(run.children, color);
    if (run.type === "Link" && run.style?.color === undefined) return { ...run, style: { ...run.style, color }, ...(children ? { children } : {}) };
    return children ? { ...run, children } : run;
  });
}

function textBlock(type: "Paragraph" | "Heading", block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  // A block given a mode of its own is drawn in that output's markup, whatever its template's.
  if (values.mode !== undefined && values.mode !== place.mode) return undefined;
  if (values.textDirection !== undefined && !DIRECTIONS.has(values.textDirection)) return undefined;
  // A heading's tag is bold where it says no weight.
  const style = textStyles(values, type === "Heading" ? { weight: 700 } : {});
  const phone = phoneText(values);
  const padding = sides(values.containerPadding ?? "10px");
  if (!style || !phone || !padding) return undefined;
  const { children, left } = parseRuns(textHtml(values, place), { weight: (style.fontWeight as number | undefined) ?? 400 });
  if (left.length) return undefined;
  const level = type === "Heading" ? Number(/^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1]) : undefined;
  if (type === "Heading" && !level) return undefined;
  return {
    type,
    ...(level || values.textDirection ? { props: { ...(level ? { level } : {}), ...(values.textDirection ? { dir: values.textDirection } : {}) } } : {}),
    style: { ...style, ...(some(padding) ? { padding } : {}) },
    ...phone,
    // An empty block is a line of its height, as legacy's.
    children: children.length ? colored(children, linkColor(values)) : ["​"],
  };
}

export const heading = (block: DesignBlock, place: Place) => textBlock("Heading", block, place);
export const text = (block: DesignBlock, place: Place) => textBlock("Paragraph", block, place);
