/** A ListItem: its text in a div with all of its text styles, and the Lists nested in it, in order. */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, type Html } from "../jsx";
import type { Component } from "./context";
import { fullText } from "./styles";

export const ListItem: Component = ({ node, style, phoneText, render }) => {
  // Runs of text between nested Lists.
  const parts: Array<ResolvedNode | Array<ResolvedNode | string>> = [];
  for (const child of node.children) {
    const last = parts[parts.length - 1];
    if (typeof child !== "string" && child.type === "List") parts.push(child);
    else if (Array.isArray(last)) last.push(child);
    else parts.push([child]);
  }
  const blocks: Html[] = parts.map((part, index) =>
    Array.isArray(part) ? (
      <div id={index === 0 ? node.id : undefined} dir={node.props.dir as string | undefined} phone={phoneText} style={[fullText(node), { textDecoration: style.textDecoration }]}>
        {part.map((child) => (typeof child === "string" ? child : render(child, { inline: true })))}
      </div>
    ) : (
      render(part)
    )
  );
  // An item that starts with a nested List: its id goes on a div around it all, as the List has its own.
  return node.id && parts.length > 0 && !Array.isArray(parts[0]) ? <div id={node.id}>{blocks}</div> : <>{blocks}</>;
};
