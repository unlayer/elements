/** A Paragraph: a `<p>` without its margins. */
import type { Writer } from "./context";
import { textBlock } from "./Text";

export const writeParagraph: Writer = (node, parent, context, placement) => textBlock(node, parent, context, placement, "p");
