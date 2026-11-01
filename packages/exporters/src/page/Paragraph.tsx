/** A Paragraph: a `<p>` without its margins. */
import type { Component } from "./context";
import { textBlock } from "./Text";

export const Paragraph: Component = (props) => textBlock(props, "p");
