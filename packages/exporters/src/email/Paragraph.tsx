/** A Paragraph: a `<p>` with all of its text styles, in its box. */
import type { Writer } from "./context";
import { textBlock } from "./Text";

export const writeParagraph: Writer = (node, place, context) => textBlock(node, place, context, "p");
