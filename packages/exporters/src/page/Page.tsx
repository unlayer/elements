/**
 * The page's body: a `<main>` stacking its children at the content width,
 * centered; with Sections, the Sections span the window and the content
 * between them is kept to the content width.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { h, importedCss, type Style } from "../jsx";
import { textDeclarations } from "../shared/css";
import { runHidden } from "../shared/gaps";
import { isNode, type Component } from "./context";
import { alignSelf } from "./layout";
import { hidingClasses } from "./styles";

export const Page: Component = ({ node: root, style, render }) => {
  const width = root.width ?? 0;
  if (typeof root.compat?.css === "string") importedCss(root.compat.css);
  // A word too long for its line (a long link) breaks onto the next rather than widening the page past a phone's screen.
  const stack: Style = { display: "flex", flexDirection: "column", gap: style.gap };
  const wrap: Style = { overflowWrap: "break-word" };
  // The root's phone gap, between its children and in each run of them.
  const phone = root.mobile?.gap !== undefined ? { gap: root.mobile.gap } : undefined;
  const content = (children: ResolvedNode[]) => children.map((child) => render(child, alignSelf(child, root)));
  const nodes = root.children.filter(isNode);
  if (!nodes.some((node) => node.type === "Section")) {
    return (
      <main phone={phone} style={[{ maxWidth: width, margin: "0 auto" }, stack, wrap, textDeclarations(root.text, undefined)]}>
        {content(nodes)}
      </main>
    );
  }

  // Sections span the window: the other children are kept to the content width, in runs between them. A run
  // hides where all of its children do, so the gap beside it goes too.
  const parts: Array<ResolvedNode | ResolvedNode[]> = [];
  for (const node of nodes) {
    const last = parts[parts.length - 1];
    if (node.type === "Section") parts.push(node);
    else if (Array.isArray(last)) last.push(node);
    else parts.push([node]);
  }
  return (
    <main phone={phone} style={[stack, wrap, textDeclarations(root.text, undefined)]}>
      {parts.map((part) =>
        Array.isArray(part) ? (
          <div class={hidingClasses(runHidden(part))} phone={phone} style={[{ width: "100%", maxWidth: width, margin: "0 auto" }, stack]}>
            {content(part)}
          </div>
        ) : (
          render(part, [])
        )
      )}
    </main>
  );
};
