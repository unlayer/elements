/**
 * A Text: a div with the text styles that differ from its parent's. Paragraph
 * and Heading are the same with their own tags.
 */
import type { ResolvedNode, ResolvedText } from "@unlayer-internal/elements-core";
import { h, type Html } from "../jsx";
import { textDeclarations, type Declarations } from "../shared/css";
import type { Context, Writer } from "./context";
import { box } from "./layout";
import { classesFor, inline } from "./styles";

/** A block of text as `Tag`; `always`: the text styles written even where inherited (a heading's size and weight: the browser has its own). */
export function textBlock(node: ResolvedNode, parent: ResolvedNode, context: Context, placement: Declarations, Tag: string, always: ReadonlyArray<keyof ResolvedText> = []): Html {
  const classes = classesFor(node, context);
  return (
    <Tag
      id={node.id}
      class={classes}
      style={[placement, Tag === "div" ? null : { margin: 0 }, textDeclarations(node.text, parent.text, always), { textDecoration: node.style.textDecoration }, box(node, parent.type !== "Row")]}
    >
      {inline(node, context)}
    </Tag>
  );
}

export const writeText: Writer = (node, parent, context, placement) => textBlock(node, parent, context, placement, "div");
