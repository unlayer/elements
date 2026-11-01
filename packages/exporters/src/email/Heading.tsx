/** A Heading: `<h1>`–`<h6>` with all of its text styles, its weight too (the browsers' own is bold), in its box. */
import type { Writer } from "./context";
import { textBlock } from "./Text";

export const writeHeading: Writer = (node, place, context) => textBlock(node, place, context, `h${node.props.level}`, { weight: true });
