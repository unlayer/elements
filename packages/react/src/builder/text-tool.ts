/**
 * A text or heading tool read back: a Paragraph or Heading in the styles its fields give (those it takes anyway left
 * out) and its hidden properties, its place's spacing its padding (or, where its box has its own, a Column's around
 * it). A `<p>` with the browser's margins, or a list, is a block of its own; text with what no run holds is an Html
 * block of its markup.
 */
import { Heading as HeadingDefinition, type Json, type Node } from "@unlayer-internal/elements-core";
import { givenId, hidden as hiddenOn } from "../compat/lower";
import { color, fontWeight, font, sides, some, type Values } from "../compat/values";
import { readHidden } from "./hide";
import { boxOf, defined, make, obj, phoneText, placed, str, textStyle, ZERO, type Context } from "./reading";
import { readText } from "./text";

/** A text or heading tool: a Paragraph or Heading (a `<p>` with margins, or a list, each a block of its own). */
export function textTool(tool: "text" | "heading", values: Values, context: Context): Node[] {
  const level = tool === "heading" ? Number(/^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1] ?? 1) : undefined;
  const type = tool === "heading" ? "Heading" : "Paragraph";
  const hidden = readHidden(tool, type, values, context.say);
  const taken: Record<string, Json> = tool === "heading" ? { ...(HeadingDefinition.defaultStyle as Record<string, Json>), ...(HeadingDefinition.defaultStyleBy!.values as Record<string, Record<string, Json>>)[String(level)] } : {};
  const style = { ...textStyle(values, taken, context), ...hidden.style };
  const mobile = { ...phoneText(values), ...hidden.mobile };
  const html = typeof values.text === "string" ? values.text : "";
  const weight = fontWeight(values.fontWeight) ?? (tool === "heading" ? 700 : context.inherited.fontWeight);
  const { parts, left } = readText(html, { weight, pages: context.document });
  const containerPadding = sides(values.containerPadding ?? "10px") ?? ZERO;
  const phonePadding = sides(obj(obj(values._override).mobile).containerPadding);
  const id = givenId(values);
  const props = defined({ ...(level && level !== 1 ? { level } : {}), dir: str(values.textDirection), ...hidden.props });
  const visibility = { ...hiddenOn(values), ...hidden.hidden };
  if (left.length) {
    context.say(`its text has what a ${type} doesn't hold (${[...new Set(left)].join(", ")}): it's an Html block of its markup`);
    return [placed(make("Html", { id, props: { html: markup(html, values) } }), containerPadding, undefined, phonePadding, visibility)];
  }
  const boxed = boxOf(hidden);
  const fontSize = (style.fontSize as number | undefined) ?? (taken.fontSize as number | undefined) ?? 16;
  const nodes = parts.map((part, i) => {
    // A list takes the block's text styles; a heading's part beside one is a Paragraph in its styles.
    const own = part.node.type === "List" ? "List" : type;
    const partStyle = { ...style, ...part.node.style, ...(own === "List" && type === "Heading" ? headingAsText(taken, style) : {}) };
    // The margins between parts collapse into one: the larger, above the part below.
    const above = i === 0 ? part.margin : Math.max(part.margin, parts[i - 1].margin);
    const below = i === parts.length - 1 ? part.margin : 0;
    const space = { top: above * fontSize, bottom: below * fontSize };
    return { node: make(own, { id: i === 0 ? id : undefined, props: own === "List" ? part.node.props : props, style: partStyle, mobile, children: part.node.children }), space };
  });
  if (boxed) {
    // Its box's padding is its own; its place's spacing is a Column's around it.
    return nodes.map(({ node, space }, i) => {
      const around = { ...containerPadding, top: i === 0 ? containerPadding.top + space.top : space.top, bottom: i === nodes.length - 1 ? containerPadding.bottom + space.bottom : 0 };
      return placed(node, around, undefined, phonePadding, visibility);
    });
  }
  return nodes.map(({ node, space }, i) => {
    const padding = some({ ...containerPadding, top: (i === 0 ? containerPadding.top : 0) + space.top, bottom: (i === nodes.length - 1 ? containerPadding.bottom : 0) + space.bottom });
    return make(node.type, { ...node, style: defined({ ...node.style, padding }), mobile: defined({ ...node.mobile, padding: phonePadding }), hidden: visibility });
  });
}

/** A heading's text styles for a list in it (which has no heading defaults of its own). */
const headingAsText = (taken: Record<string, Json>, style: Record<string, Json>) => defined({ fontSize: style.fontSize ?? taken.fontSize, fontWeight: style.fontWeight ?? taken.fontWeight, lineHeight: style.lineHeight ?? taken.lineHeight });

/** A text block's markup with the styles its tool draws it in, for an Html block. */
function markup(html: string, values: Values): string {
  const css = defined({
    "font-family": font(values.fontFamily),
    "font-size": str(values.fontSize),
    "font-weight": values.fontWeight === undefined ? undefined : String(fontWeight(values.fontWeight) ?? ""),
    color: color(values.color),
    "line-height": str(values.lineHeight),
    "text-align": str(values.textAlign),
    "letter-spacing": str(values.letterSpacing),
  });
  const declarations = Object.entries(css).filter(([, v]) => v !== "").map(([k, v]) => `${k}:${String(v).replace(/"/g, "'")}`).join(";");
  return `<div style="${declarations}">${html}</div>`;
}
