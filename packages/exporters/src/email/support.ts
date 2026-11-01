/**
 * What email can't do as a template asks, found in one pass before the
 * email is written: what each style and prop declares for email (the shared
 * pass, `shared/support.ts`), and what no single style or prop says: a Row
 * child whose size isn't known, an image without a width, a hidden table
 * cell, a font stack that ends on a web font. Size budgets are checked on the
 * written email (index.tsx).
 */
import { Diagnostics, fontStack, type Diagnostic, type FontFace, type ResolvedNode } from "@unlayer-internal/elements-core";
import { support } from "../shared/support";
import { isNode, shown } from "./context";

export function emailSupport(root: ResolvedNode): Diagnostic[] {
  const d = new Diagnostics();
  d.list.push(...support(root, "email"));
  const webFonts = new Set(((root.props.fonts as FontFace[] | undefined) ?? []).map((face) => face.family.toLowerCase()));
  const visit = (node: ResolvedNode) => {
    structure(node, d);
    fallback(node, webFonts, d);
    for (const child of node.children) if (isNode(child) && shown(child)) visit(child);
  };
  visit(root);
  return d.list;
}

/** A stack that ends on a web font leaves the client to choose a font where that one doesn't load. */
function fallback(node: ResolvedNode, webFonts: Set<string>, d: Diagnostics): void {
  const stack = node.style.fontFamily;
  if (typeof stack !== "string" || !webFonts.size) return;
  const families = fontStack(stack);
  const last = families[families.length - 1];
  if (!last || !webFonts.has(last.toLowerCase())) return;
  d.warning(
    "email/font-fallback",
    `This font stack ends with the web font "${last}": where it doesn't load (Gmail, classic Outlook) the email client picks its own font. Add one it has: "${stack}, Arial, sans-serif"`,
    `${node.path}.style.fontFamily`,
    node.id
  );
}

/** What email can't do that no single style or prop says. */
function structure(node: ResolvedNode, d: Diagnostics): void {
  const { path, id } = node;
  if (node.type === "Row") {
    // A Link or a line of Text is as wide as its text in a cell of its own, in Outlook too (today's Menu writes its
    // links so): only a box whose size isn't known needs a width.
    for (const child of node.children.filter(isNode).filter(shown)) {
      if (child.width === null && child.type !== "Link" && child.type !== "Text") {
        d.warning("email/width", `This ${child.type} takes its own size in a Row, and its size isn't known: give it a width, so Outlook can lay the Row out`, `${child.path}.style.width`, child.id);
      }
    }
  }
  if (node.type === "TableCell" && node.hidden) {
    d.warning("email/unsupported", "A TableCell can't be hidden in email (its row would lose a column): hide its TableRow", `${path}.hidden`, id);
  }
  if (node.type === "Image" && node.width === null) {
    d.warning("email/image-width", "This Image has no width: Outlook shows it at the size of its file, however wide that is. Give it a width, or the file's width in src", `${path}.props.src`, id);
  }
}
