/** A Canvas as HTML, to look at: a box of its size, its content laid out in it as on a page, what's past it cut. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";
import { alignSelf, box, stackOf } from "./layout";

export const Canvas: Component = ({ node: root, rtl, render }) => (
  <main
    style={[
      { width: root.props.width as number, height: root.props.height as number, overflow: "hidden", boxSizing: "border-box" },
      stackOf(root),
      box(root, false),
      textDeclarations(root.text, undefined),
    ]}
  >
    {root.children.filter(isNode).map((child) => render(child, alignSelf(child, root, rtl)))}
  </main>
);
