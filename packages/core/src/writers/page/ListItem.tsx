/** A ListItem: `<li>`, the List's gap above it where an item before it shows (on desktop inline, on phones by a class where that differs). */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { gapsBefore } from "../shared/gaps";
import { isNode, type Component } from "./context";

export const ListItem: Component = ({ node, style, parent: list, classes, children }) => {
  const items = list.children.filter(isNode);
  const at = gapsBefore(items)[items.indexOf(node)];
  const gap = at.desktop ? list.style.gap : undefined;
  const phoneGap = at.phone ? (list.mobile?.gap ?? list.style.gap) : undefined;
  return (
    <li
      id={node.id}
      class={classes()}
      dir={node.props.dir as string | undefined}
      phone={phoneGap !== gap ? { marginTop: phoneGap ?? 0 } : undefined}
      style={[{ margin: 0, marginTop: gap }, textDeclarations(node.text, list.text), { textDecoration: style.textDecoration }]}
    >
      {children()}
    </li>
  );
};
