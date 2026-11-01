/**
 * The page's body: a `<main>` stacking its children at the content width,
 * centered; with Sections, the Sections span the window and the content
 * between them is kept to the content width.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { h, type Style } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";
import { alignSelf } from "./layout";

export const Page: Component = ({ node: root, style, render }) => {
  const width = root.width ?? 0;
  const stack: Style = { display: "flex", flexDirection: "column", gap: style.gap };
  const content = (children: ResolvedNode[]) => children.map((child) => render(child, alignSelf(child, root)));
  const nodes = root.children.filter(isNode);
  if (!nodes.some((node) => node.type === "Section")) {
    return <main style={[{ maxWidth: width, margin: "0 auto" }, stack, textDeclarations(root.text, undefined)]}>{content(nodes)}</main>;
  }

  // Sections span the window: the other children are kept to the content width, in runs between them.
  const parts: Array<ResolvedNode | ResolvedNode[]> = [];
  for (const node of nodes) {
    const last = parts[parts.length - 1];
    if (node.type === "Section") parts.push(node);
    else if (Array.isArray(last)) last.push(node);
    else parts.push([node]);
  }
  return (
    <main style={[stack, textDeclarations(root.text, undefined)]}>
      {parts.map((part) => (Array.isArray(part) ? <div style={[{ width: "100%", maxWidth: width, margin: "0 auto" }, stack]}>{content(part)}</div> : render(part, [])))}
    </main>
  );
};
