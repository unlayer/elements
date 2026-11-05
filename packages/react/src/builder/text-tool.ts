/**
 * A text or heading tool read back: a Paragraph or Heading in the styles its fields give (those it takes anyway left
 * out) and its hidden properties, its place's spacing its padding (or, where its box has its own, a Column's around
 * it). A `<p>`, or a list, is a block of its own, its margins and indent its padding; text with what no run holds is an
 * Html block of its markup.
 */
import { Heading as HeadingDefinition, type Json, type Node } from "@unlayer-internal/elements-core";
import { color, fontWeight, font, givenId, hidden as hiddenOn, linkStyleOf, serviceTag, sides, some, styled, type Sides, type Values } from "./read-values";
import { readHidden } from "./hide";
import { boxOf, defined, make, obj, phoneText, placed, str, textStyle, ZERO, type Context } from "./reading";
import { readText, richText, type TextToolName, withParagraphMargin } from "./text";

/** A text or heading tool: a Paragraph or Heading (a `<p>`, or a list, each a block of its own). */
export function textTool(tool: "text" | "heading", given: Values, context: Context, builderTool: TextToolName = tool): Node[] {
  // A heading the builder saved with no weight of its own, it draws at 400, not as a heading's bold.
  const values = tool === "heading" && !given.fontWeight ? { ...given, fontWeight: 400 } : given;
  const level = tool === "heading" ? Number(/^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1] ?? 1) : undefined;
  const type = tool === "heading" ? "Heading" : "Paragraph";
  const hidden = readHidden(tool, type, values, context.say);
  const taken: Record<string, Json> = tool === "heading" ? { ...(HeadingDefinition.defaultStyle as Record<string, Json>), ...(HeadingDefinition.defaultStyleBy!.values as Record<string, Record<string, Json>>)[String(level)] } : {};
  const style = { ...textStyle(values, taken, context), ...hidden.style };
  const mobile = { ...phoneText(values), ...hidden.mobile };
  const rich = richText(values, builderTool, str(values.textDirection) ?? context.dir);
  if (rich.said) context.say(rich.said);
  const html = context.safe(rich.html);
  const weight = fontWeight(values.fontWeight) ?? (tool === "heading" ? 700 : context.inherited.fontWeight);
  const fontSize = (style.fontSize as number | undefined) ?? (taken.fontSize as number | undefined) ?? 16;
  const { parts, left } = readText(html, { weight, pages: context.document, fontSize, lineHeight: (style.lineHeight as Json | undefined) ?? (taken.lineHeight as Json | undefined) ?? 1.5 });
  if (rich.markup) left.push(rich.markup);
  // An email service's tag ({% if %}, <%name%>) is written as it is for the service to fill in, as today's writers do.
  if (serviceTag(html)) left.push("an email service's tag, kept as written");
  const containerPadding = sides(values.containerPadding ?? "10px") ?? ZERO;
  const phonePadding = sides(obj(obj(values._override).mobile).containerPadding);
  const id = givenId(values);
  const props = defined({ ...(level && level !== 1 ? { level } : {}), dir: str(values.textDirection), ...hidden.props });
  const visibility = { ...hiddenOn(values), ...hidden.hidden };
  // Its links' style where it's its own (the builder's link style), as today's components read it; a hover style a page draws, said.
  const linkStyle = linkStyleOf(values, context.mode);
  if (linkStyle === null) context.say("its links' hover style, which a page draws, has no place: left out");
  const links = linkStyle ?? linkStyleOf(values, "email");
  if (left.length) {
    if (links && Object.keys(links).length) context.say("its links' style isn't kept in its markup: left out");
    context.say(`its text has what a ${type} doesn't hold (${[...new Set(left)].join(", ")}): it's an Html block of its markup`);
    // What its markup can't hold: its values on phones, its hidden properties.
    const lost = [...Object.keys(phoneText(values)).map((key) => `${key} on phones`), ...Object.keys(hidden.style)];
    if (lost.length) context.say(`its ${lost.join(", ")} aren't kept in its markup: left out`);
    return [placed(make("Html", { id, props: { html: markup(context.safe(withParagraphMargin(rich.html, "margin:0")), values, level) } }), containerPadding, undefined, phonePadding, visibility)];
  }
  const boxed = boxOf(hidden);
  const blockDir = str(values.textDirection) ?? context.dir;
  const nodes = parts.map((part, i) => {
    // A list takes the block's text styles, as a heading in text does its own; a heading's part beside one is a
    // Paragraph in its styles.
    const own = part.node.type === "List" || part.node.type === "Heading" ? part.node.type : type;
    // A paragraph in a direction of its own is aligned as its block is (its block's alignment is the one it inherits).
    const dir = own === "List" ? undefined : (part.node.props?.dir as string | undefined);
    const turned: Record<string, Json> = dir && dir !== blockDir && part.node.style?.textAlign === undefined ? { textAlign: (style.textAlign as string | undefined) ?? (taken.textAlign as string | undefined) ?? "left" } : {};
    const partStyle = { ...style, ...turned, ...part.node.style, ...(own === "List" && type === "Heading" ? headingAsText(taken, style) : {}) };
    // The margins between parts collapse into one: the larger, above the part below.
    const above = i === 0 ? part.margin.top : Math.max(part.margin.top, parts[i - 1].margin.bottom);
    const below = i === parts.length - 1 ? part.margin.bottom : 0;
    // A paragraph's indent is at the side its line starts.
    const start = (dir ?? blockDir) === "rtl" ? "right" : "left";
    const space = { top: above, bottom: below, [start]: part.indent ?? 0 } as Partial<Sides>;
    const partProps = own === "List" ? part.node.props : defined({ ...props, ...(part.node.type === "Heading" ? { level: part.node.props!.level } : {}), dir: dir && dir !== blockDir ? dir : props.dir });
    return { node: make(own, { id: i === 0 ? id : undefined, props: partProps, style: partStyle, mobile, children: part.node.children && (styled(part.node.children as never, links ?? undefined) as Node["children"]) }), space };
  });
  if (boxed) {
    // Its box's padding is its own (an indent inside it); its place's spacing is a Column's around it.
    return nodes.map(({ node, space }, i) => {
      const around = { ...containerPadding, top: i === 0 ? containerPadding.top + (space.top ?? 0) : (space.top ?? 0), bottom: i === nodes.length - 1 ? containerPadding.bottom + (space.bottom ?? 0) : 0 };
      const indented = space.left || space.right ? { ...node, style: { ...node.style, padding: add((node.style?.padding as Sides | undefined) ?? ZERO, { ...ZERO, left: space.left ?? 0, right: space.right ?? 0 }) as Json } } : node;
      return placed(indented, around, undefined, phonePadding, visibility);
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

/** A text block's markup with the styles its tool draws it in, for an Html block: a heading's in its tag (h1 to h6), without its margins. */
function markup(html: string, values: Values, level: number | undefined): string {
  const css = defined({
    margin: level ? "0" : undefined,
    "font-family": font(values.fontFamily),
    "font-size": str(values.fontSize),
    "font-weight": values.fontWeight === undefined ? undefined : String(fontWeight(values.fontWeight) ?? ""),
    color: color(values.color),
    "line-height": str(values.lineHeight),
    "text-align": str(values.textAlign),
    "letter-spacing": str(values.letterSpacing),
  });
  const declarations = Object.entries(css).filter(([, v]) => v !== "").map(([k, v]) => `${k}:${String(v).replace(/"/g, "'")}`).join(";");
  const tag = level ? `h${level}` : "div";
  const dir = ["ltr", "rtl", "auto"].includes(values.textDirection) ? ` dir="${values.textDirection}"` : "";
  return `<${tag}${dir} style="${declarations}">${html}</${tag}>`;
}
