/** A TableRow: its background on the row (and its cells, for Word); its text styles are its cells'. */
import { h, NotOutlook } from "../jsx";
import { isNode, type Component } from "./context";
import { bgcolor } from "./markup";
import { hiding } from "./styles";

export const TableRow: Component = ({ node, style, render }) => {
  const hidden = hiding(node, "table-row");
  const row = (
    <tr id={node.id} class={hidden.class} bgcolor={bgcolor(style.backgroundColor)} style={[{ backgroundColor: style.backgroundColor }, hidden.style]}>
      {node.children.filter(isNode).map((cell) => render(cell))}
    </tr>
  );
  // What's hidden on desktop isn't Outlook's at all.
  return node.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
};
