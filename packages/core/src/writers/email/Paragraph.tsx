/**
 * A Paragraph: a `<p>` with all of its text styles (Outlook doesn't carry styles
 * down through tables), in its box. A Heading is the same with its own tag.
 */
import { h, type Html } from "../jsx";
import type { Props, Component } from "./context";
import { Box } from "./layout";
import { fullText } from "./styles";

/** A block of text as `Tag`, with no margins (the browsers' own, and Word's spacing). */
export const textBlock = ({ node, style, fill, phoneText, text }: Props, Tag: string, { weight = false } = {}): Html => (
  <Box node={node} fill={fill}>
    <Tag dir={node.props.dir as string | undefined} phone={phoneText} style={[{ margin: 0 }, fullText(node, { weight }), { textDecoration: style.textDecoration }]}>
      {text()}
    </Tag>
  </Box>
);

export const Paragraph: Component = (props) => textBlock(props, "p");
