/**
 * A text or heading tool read back: a Paragraph or Heading in the styles its fields give (those it takes anyway left
 * out) and its hidden properties, its place's spacing its padding (or, where its box has its own, a Column's around
 * it). A `<p>`, or a list, is a block of its own, its margins and indent its padding; text with what no run holds is an
 * Html block of its markup.
 */
import { Heading as HeadingDefinition, type Json, type Node } from "@unlayer-internal/elements-core";
import { linkStyleOf, styled } from "../compat/blocks/text";
import { givenId, hidden as hiddenOn } from "../compat/lower";
import { color, fontWeight, font, serviceTag, sides, some, type Sides, type Values } from "../compat/values";
import { readHidden } from "./hide";
import { boxOf, defined, make, obj, phoneText, placed, str, textStyle, ZERO, type Context } from "./reading";
import { readText, richText } from "./text";

/** A text or heading tool: a Paragraph or Heading (a `<p>`, or a list, each a block of its own). */
export function textTool(tool: "text" | "heading", values: Values, context: Context): Node[] {
  const level = tool === "heading" ? Number(/^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1] ?? 1) : undefined;
  const type = tool === "heading" ? "Heading" : "Paragraph";
  const hidden = readHidden(tool, type, values, context.say);
  const taken: Record<string, Json> = tool === "heading" ? { ...(HeadingDefinition.defaultStyle as Record<string, Json>), ...(HeadingDefinition.defaultStyleBy!.values as Record<string, Record<string, Json>>)[String(level)] } : {};
  const style = { ...textStyle(values, taken, context), ...hidden.style };
  const mobile = { ...phoneText(values), ...hidden.mobile };
  const html = context.safe(richText(values, tool === "heading", str(values.textDirection) ?? context.dir));
  const weight = fontWeight(values.fontWeight) ?? (tool === "heading" ? 700 : context.inherited.fontWeight);
  const fontSize = (style.fontSize as number | undefined) ?? (taken.fontSize as number | undefined) ?? 16;
  const { parts, left } = readText(html, { weight, pages: context.document, fontSize });
  // An email service's tag ({% if %}, <%name%>) is written as it is for the service to fill in, as today's writers do.
  if (serviceTag(html)) left.push("an email service's tag, kept as written");
  const containerPadding = sides(values.containerPadding ?? "10px") ?? ZERO;
  const phonePadding = sides(obj(obj(values._override).mobile).containerPadding);
  const id = givenId(values);
  const props = defined({ ...(level && level !== 1 ? { level } : {}), dir: str(values.textDirection), ...hidden.props });
  const visibility = { ...hiddenOn(values), ...hidden.hidden };
  // Its links' style where it's its own (the builder's link style), as compat reads it; a hover style a page draws, said.
  const linkStyle = linkStyleOf(values, context.mode);
  if (linkStyle === null) context.say("its links' hover style, which a page draws, has no place: left out");
  const links = linkStyle ?? linkStyleOf(values, "email");
  if (left.length) {
    if (links && Object.keys(links).length) context.say("its links' style isn't kept in its markup: left out");
    context.say(`its text has what a ${type} doesn't hold (${[...new Set(left)].join(", ")}): it's an Html block of its markup`);
    return [placed(make("Html", { id, props: { html: markup(html, values) } }), containerPadding, undefined, phonePadding, visibility)];
  }
  const boxed = boxOf(hidden);
  const blockDir = str(values.textDirection) ?? context.dir;
  const nodes = parts.map((part, i) => {
    // A list takes the block's text styles; a heading's part beside one is a Paragraph in its styles.
    const own = part.node.type === "List" ? "List" : type;
    // A paragraph in a direction of its own is aligned as its block is (its block's alignment is the one it inherits).
    const dir = own === "List" ? undefined : (part.node.props?.dir as string | undefined);
    const turned = dir && dir !== blockDir && part.node.style?.textAlign === undefined ? { textAlign: (style.textAlign as string | undefined) ?? (taken.textAlign as string | undefined) ?? "left" } : {};
    const partStyle = { ...style, ...turned, ...part.node.style, ...(own === "List" && type === "Heading" ? headingAsText(taken, style) : {}) };
    // The margins between parts collapse into one: the larger, above the part below.
    const above = i === 0 ? part.margin.top : Math.max(part.margin.top, parts[i - 1].margin.bottom);
    const below = i === parts.length - 1 ? part.margin.bottom : 0;
    // A paragraph's indent is at the side its line starts.
    const start = (dir ?? blockDir) === "rtl" ? "right" : "left";
    const space = { top: above, bottom: below, [start]: part.indent ?? 0 } as Partial<Sides>;
    const partProps = own === "List" ? part.node.props : defined({ ...props, dir: dir && dir !== blockDir ? dir : props.dir });
    return { node: make(own, { id: i === 0 ? id : undefined, props: partProps, style: partStyle, mobile, children: part.node.children && (styled(part.node.children as never, links ?? undefined) as Node["children"]) }), space };
  });
  if (boxed) {
    // Its box's padding is its own (an indent inside it); its place's spacing is a Column's around it.
    return nodes.map(({ node, space }, i) => {
      const around = { ...containerPadding, top: i === 0 ? containerPadding.top + (space.top ?? 0) : (space.top ?? 0), bottom: i === nodes.length - 1 ? containerPadding.bottom + (space.bottom ?? 0) : 0 };
      const inside = space.left || space.right ? { padding: add((node.style?.padding as Sides | undefined) ?? ZERO, { ...ZERO, left: space.left ?? 0, right: space.right ?? 0 }) } : {};
      return placed({ ...node, ...(Object.keys(inside).length ? { style: { ...node.style, ...inside } } : {}) }, around, undefined, phonePadding, visibility);
    });
  }
  return nodes.map(({ node, space }, i) => {
    const padding = some({ top: (i === 0 ? containerPadding.top : 0) + (space.top ?? 0), right: containerPadding.right + (space.right ?? 0), bottom: (i === nodes.length - 1 ? containerPadding.bottom : 0) + (space.bottom ?? 0), left: containerPadding.left + (space.left ?? 0) });
    return make(node.type, { ...node, style: defined({ ...node.style, padding }), mobile: defined({ ...node.mobile, padding: phonePadding }), hidden: visibility });
  });
}

const add = (a: Sides, b: Sides): Sides => ({ top: a.top + b.top, right: a.right + b.right, bottom: a.bottom + b.bottom, left: a.left + b.left });

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
