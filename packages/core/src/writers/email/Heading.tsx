/** A Heading: `<h1>`–`<h6>` with all of its text styles, its weight too (the browsers' own is bold), in its box. */
import type { Component } from "./context";
import { textBlock } from "./Paragraph";

export const Heading: Component = (props) => textBlock(props, `h${props.node.props.level}`, { weight: true });
