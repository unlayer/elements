/** What inline styles can't do, as classes in the stylesheet: phone overrides, hiding, hover, a Row stacking on phones. Also the text in a node. */
import type { Json, ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, type Html } from "../jsx";
import { border, css, insets, length, textValue, type Declarations } from "../shared/css";
import type { Context } from "./context";

const OVERRIDE: Record<string, (value: Json) => Declarations> = {
  width: (v) => [["width", length(v)]],
  maxWidth: (v) => [["max-width", length(v)]],
  padding: (v) => [["padding", insets(v)]],
  border: (v) => border(v),
  gap: (v) => [["gap", length(v)]],
  backgroundColor: (v) => [["background-color", v as string]],
  textDecoration: (v) => [["text-decoration", v as string]],
};

function declarationsOf(values: Record<string, Json>): Declarations {
  const out: Declarations = [];
  for (const [key, value] of Object.entries(values)) {
    const textual = textValue(key, value);
    if (textual !== undefined) out.push([key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), textual]);
    else if (OVERRIDE[key]) out.push(...OVERRIDE[key](value));
  }
  return out;
}

/** The classes of the stylesheet's rules for the node (phone styles, hiding, hover, stacking), if any. */
export function classesFor(node: ResolvedNode, context: Context): string | undefined {
  const { sheet } = context;
  const classes: string[] = [];
  if (node.mobile) {
    // A Divider's length is its line's.
    const { width, ...rest } = node.mobile;
    if (Object.keys(rest).length) classes.push(sheet.classFor("phone", `&{${css(declarationsOf(rest), true)}}`));
    const line = node.type === "Divider" && node.style.padding !== undefined ? ">hr" : "";
    if (width !== undefined) classes.push(sheet.classFor("phone", `&${line}{${css(declarationsOf({ width }), true)}}`));
  }
  if (node.hidden?.mobile) classes.push(sheet.classFor("phone", "&{display:none!important}"));
  if (node.hidden?.desktop) classes.push(sheet.classFor("desktop", "&{display:none!important}"));
  if (node.hover) classes.push(sheet.classFor("all", `&:hover{${css(declarationsOf(node.hover), true)}}`));
  if (node.type === "Row" && node.style.wrap === "stack") {
    classes.push(
      sheet.classFor("phone", "&{flex-direction:column!important;align-items:stretch!important}&>*{flex:0 0 auto!important;width:auto!important;max-width:100%!important;align-self:stretch!important}")
    );
  }
  return classes.length ? classes.join(" ") : undefined;
}

/** A node's text and the runs in it. */
export function inline(node: ResolvedNode, context: Context): Html {
  return <>{node.children.map((child) => (typeof child === "string" ? child : context.render(child, node, [])))}</>;
}
