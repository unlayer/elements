/** A Layer: a CSS grid of one cell, each child in it over the ones before (`layerPlacement`), placed by its alignment. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";
import { box } from "./layout";

export const Layer: Component = ({ node, style, parent, placement, classes, children }) => (
  <div
    id={node.id}
    class={classes()}
    style={[
      placement,
      {
        display: "grid",
        gridTemplate: "minmax(0, 1fr) / minmax(0, 1fr)",
        alignItems: style.alignItems,
        justifyItems: style.justifyItems,
        // Its corners cut what's in it, as an email's background is cut.
        overflow: style.borderRadius !== undefined ? "hidden" : undefined,
      },
      box(node, parent.type !== "Row"),
      textDeclarations(node.text, parent.text),
    ]}
  >
    {children()}
  </div>
);
