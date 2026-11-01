/** A Paragraph: a `<p>` with all of its text styles, in its box. */
import type { Component } from "./context";
import { textBlock } from "./Text";

export const Paragraph: Component = (props) => textBlock(props, "p");
