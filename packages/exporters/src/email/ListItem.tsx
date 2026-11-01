/** A ListItem: its text in a div with all of its text styles, and the Lists nested in it, in order. */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, NotOutlook, type Html } from "../jsx";
import { shown, type Component, type Props } from "./context";
import { fullText, hiding } from "./styles";

export const ListItem: Component = ({ node, style, phoneText, render }) => {
  // Runs of text between nested Lists.
  const parts: Array<ResolvedNode | Array<ResolvedNode | string>> = [];
  for (const child of node.children) {
    const last = parts[parts.length - 1];
    if (typeof child !== "string" && child.type === "List") parts.push(child);
    else if (Array.isArray(last)) last.push(child);
    else parts.push([child]);
  }
  const blocks: Array<Html | null> = parts.map((part, index) =>
    Array.isArray(part) ? (
      <div id={index === 0 ? node.id : undefined} dir={node.props.dir as string | undefined} phone={phoneText} style={[fullText(node), { textDecoration: style.textDecoration }]}>
        {part.map((child) => (typeof child === "string" ? child : render(child, { inline: true })))}
      </div>
    ) : (
      nested(part, render)
    )
  );
  // An empty item keeps its id.
  if (parts.length === 0) return node.id ? <div id={node.id} /> : <></>;
  // An item that starts with a nested List: its id goes on a div around it all, as the List has its own.
  return node.id && parts.length > 0 && !Array.isArray(parts[0]) ? <div id={node.id}>{blocks}</div> : <>{blocks}</>;
};

/** A List nested in an item, hidden where it's hidden itself (a List takes no hiding of its own, its parent's row does that elsewhere). */
function nested(list: ResolvedNode, render: Props["render"]): Html | null {
  if (!shown(list)) return null;
  if (!list.hidden?.desktop && !list.hidden?.mobile) return render(list);
  const hidden = hiding(list, "block");
  const block = (
    <div class={hidden.class} style={hidden.style}>
      {render(list)}
    </div>
  );
  return list.hidden?.desktop ? <NotOutlook>{block}</NotOutlook> : block;
}
