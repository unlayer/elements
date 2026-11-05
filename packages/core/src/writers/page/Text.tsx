/**
 * A Text: a div with the text styles that differ from its parent's. Paragraph
 * and Heading are the same with their own tags.
 */
import type { ResolvedText } from "../../resolve";
import { h, type Html } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Props, Component } from "./context";
import { box } from "./layout";

/**
 * A block of text as `Tag`; `always`: the text styles written even where inherited (a heading's size and weight: the
 * browser has its own).
 */
export const textBlock = ({ node, style, parent, placement, classes, children }: Props, Tag: string, always: ReadonlyArray<keyof ResolvedText> = []): Html => (
  <Tag
    id={node.id}
    class={classes()}
    dir={node.props.dir as string | undefined}
    style={[placement, Tag === "div" ? null : { margin: 0 }, textDeclarations(node.text, parent.text, always), { textDecoration: style.textDecoration }, box(node, parent.type !== "Row")]}
  >
    {children()}
  </Tag>
);

export const Text: Component = (props) => textBlock(props, "div");
