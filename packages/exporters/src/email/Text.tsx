/**
 * A Text: a div with all of its text styles (Outlook doesn't carry styles
 * down through tables), in its box. Paragraph and Heading are the same with
 * their own tags.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { h, type Html } from "../jsx";
import type { Context, Place, Writer } from "./context";
import { boxed } from "./layout";
import { fullText, inline, mobileTextOf, phoneClass, phoneText } from "./styles";

/** A block of text as `Tag`, with no margins (the browsers' own, and Word's spacing). */
export function textBlock(node: ResolvedNode, place: Place, context: Context, Tag: string, { weight = false } = {}): Html {
  const mobile = mobileTextOf(node, place.mobile);
  return boxed(node, context, place.fill, (id) => {
    const className = phoneClass(context, phoneText(node, mobile));
    return (
      <Tag id={id} class={className} style={[Tag === "div" ? null : { margin: 0 }, fullText(node, { weight }), { textDecoration: node.style.textDecoration }]}>
        {inline(node, context)}
      </Tag>
    );
  });
}

export const writeText: Writer = (node, place, context) => textBlock(node, place, context, "div");
