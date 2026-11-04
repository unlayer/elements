/** A Divider: an `<hr>` drawn by its top border, in a padded div where it has padding; placed by its parent's text alignment. */
import { h, raw, type Style } from "../jsx";
import type { Component } from "./context";

const MARGIN: Record<string, string> = { center: "0 auto", right: "0 0 0 auto" };

export const Divider: Component = ({ node, style, parent, placement, classes }) => {
  const line: Style = {
    margin: MARGIN[({ center: "center", end: "right" } as Record<string, string>)[parent.style.alignItems as string] ?? parent.text.textAlign] ?? "0",
    border: "0",
    borderTop: style.borderTop,
    width: style.width,
  };
  const label = node.compat?.ariaLabel as string | undefined;
  // A template of today's components: its line sits in a line of no height, by the font's middle, as the editor's does.
  const inLine = node.compat?.inLine === true && (
    <div style={{ textAlign: parent.text.textAlign, lineHeight: 0 }}>
      <div style={{ borderTop: style.borderTop, width: style.width ?? "100%", display: "inline-block", lineHeight: "1px", height: 0, verticalAlign: "middle" }}>{raw("&nbsp;")}</div>
    </div>
  );
  if (style.padding === undefined) return inLine ? <div id={node.id} class={classes()} aria-label={label} style={placement}>{inLine}</div> : <hr id={node.id} class={classes()} aria-label={label} style={[placement, line]} />;
  return (
    <div id={node.id} class={classes()} aria-label={label} style={[placement, { boxSizing: "border-box", padding: style.padding }]}>
      {inLine || <hr style={line} />}
    </div>
  );
};
