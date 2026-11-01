/**
 * What email can't do as a template asks, found in one pass before the
 * email is written: each check is here, not in the components. Warnings where
 * the email shows something else than asked, notes where only classic Outlook
 * does. Size budgets are checked on the written email (index.ts).
 */
import { Diagnostics, type Diagnostic, type ResolvedNode } from "@unlayer-internal/elements-core";
import { isNode, shown } from "./context";

export function emailSupport(root: ResolvedNode): Diagnostic[] {
  const d = new Diagnostics();
  const visit = (node: ResolvedNode) => {
    check(node, d);
    for (const child of node.children) if (isNode(child) && shown(child)) visit(child);
  };
  visit(root);
  return d.list;
}

function check(node: ResolvedNode, d: Diagnostics): void {
  const { style, path, id } = node;
  const children = node.children.filter(isNode).filter(shown);

  if (node.type === "Row") {
    if (style.wrap === "wrap") d.warning("email/unsupported", 'wrap: "wrap" isn\'t possible in email; this Row stacks on phones instead', `${path}.style.wrap`, id);
    if (style.align === "stretch" && children.some((child) => child.style.backgroundColor !== undefined || child.style.border !== undefined)) {
      d.add("email/degraded", "info", "A Row's children aren't stretched to one height in email: each background or border ends with its content", `${path}.style.align`, id);
    }
    if (style.justify === "between") d.warning("email/unsupported", 'justify: "between" isn\'t possible in email; the children start at the left', `${path}.style.justify`, id);
    for (const child of children) {
      if (child.width === null) {
        d.warning("email/width", `This ${child.type} takes its own size in a Row, and its size isn't known: give it a width, so Outlook can lay the Row out`, `${child.path}.style.width`, child.id);
      }
    }
  }
  if (node.type === "Column" && style.justify !== undefined && style.justify !== "start") {
    d.add("email/degraded", "info", "justify on a Column has no effect in email: its children start at the top", `${path}.style.justify`, id);
  }
  if (node.type === "Image" && node.width === null) {
    d.warning("email/image-width", "This Image has no width: Outlook shows it at the size of its file, however wide that is. Give it a width, or the file's width in src", `${path}.props.src`, id);
  }
  // Word draws no rounded corners; a Button's are only a look.
  if (style.borderRadius !== undefined && node.type !== "Button") {
    d.add("email/outlook-degraded", "info", `borderRadius on this ${node.type} shows square corners in classic Outlook`, `${path}.style.borderRadius`, id);
  }
}
