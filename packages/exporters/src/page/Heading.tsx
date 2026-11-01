/** A Heading: `<h1>`–`<h6>` without margins, its size and weight always written (the browser has its own). */
import type { Writer } from "./context";
import { textBlock } from "./Text";

export const writeHeading: Writer = (node, parent, context, placement) => textBlock(node, parent, context, placement, `h${node.props.level}`, ["fontSize", "fontWeight"]);
