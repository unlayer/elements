/**
 * The page's body: a `<main>` stacking its children at the content width,
 * centered; with Sections, the Sections span the window and the content
 * between them is kept to the content width.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { h, type Html, type Style } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Context } from "./context";
import { alignSelf } from "./layout";

export function writePage(root: ResolvedNode, context: Context): Html {
  const width = root.width ?? 0;
  const stack: Style = { display: "flex", flexDirection: "column", gap: root.style.gap };
  const text = textDeclarations(root.text, undefined);
  const nodes = root.children.filter(isNode);
  const content = (children: ResolvedNode[]) => children.map((child) => context.render(child, root, alignSelf(child, root)));

  if (!nodes.some((node) => node.type === "Section")) {
    return <main style={[{ maxWidth: width, margin: "0 auto" }, stack, text]}>{content(nodes)}</main>;
  }
  // Sections span the window: the other children are kept to the content width, in runs between them.
  const parts: Html[] = [];
  let run: ResolvedNode[] = [];
  const flush = () => {
    if (run.length) parts.push(<div style={[{ width: "100%", maxWidth: width, margin: "0 auto" }, stack]}>{content(run)}</div>);
    run = [];
  };
  for (const node of nodes) {
    if (node.type === "Section") {
      flush();
      parts.push(context.render(node, root, []));
    } else run.push(node);
  }
  flush();
  return <main style={[stack, text]}>{parts}</main>;
}
