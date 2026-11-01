/** A Heading: `<h1>`–`<h6>` without margins, its size and weight always written (the browser has its own). */
import type { Component } from "./context";
import { textBlock } from "./Text";

export const Heading: Component = (props) => textBlock(props, `h${props.node.props.level}`, ["fontSize", "fontWeight"]);
