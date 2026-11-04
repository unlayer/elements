/** What inline styles can't do, as classes in the stylesheet: phone overrides, hiding, hover, a Row stacking on phones. */
import type { Json, ResolvedNode } from "@unlayer-internal/elements-core";
import { rule } from "../jsx";
import { border, css, insets, length, textValue, type Declarations } from "../shared/css";

const OVERRIDE: Record<string, (value: Json) => Declarations> = {
  width: (v) => [["width", length(v)]],
  maxWidth: (v) => [["max-width", length(v)]],
  padding: (v) => [["padding", insets(v)]],
  border: (v) => border(v),
  gap: (v) => [["gap", length(v)]],
  backgroundColor: (v) => [["background-color", v as string]],
  textDecoration: (v) => [["text-decoration", v as string]],
  alignSelf: (v) => [["align-self", v as string]],
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
export function classesFor(node: ResolvedNode): string | undefined {
  const classes: string[] = [];
  if (node.mobile) {
    // A Divider's length is its line's.
    const { width, ...rest } = node.mobile;
    if (Object.keys(rest).length) classes.push(rule("phone", `&{${css(declarationsOf(rest), true)}}`));
    const line = node.type === "Divider" && node.style.padding !== undefined ? ">hr" : "";
    if (width !== undefined) classes.push(rule("phone", `&${line}{${css(declarationsOf({ width }), true)}}`));
  }
  classes.push(...hidingClasses(node.hidden));
  if (node.hover) classes.push(rule("all", `&:hover{${css(declarationsOf(node.hover), true)}}`, "hover"));
  if (node.type === "Row" && node.props.stackOnMobile !== false) {
    classes.push(
      rule("phone", "&{flex-direction:column!important;align-items:stretch!important}&>*{flex:0 0 auto!important;width:auto!important;max-width:100%!important;align-self:stretch!important}", "layout")
    );
  }
  return classes.length ? classes.join(" ") : undefined;
}

/** The classes that hide something on phones or on desktop. */
export function hidingClasses(hidden: ResolvedNode["hidden"]): string[] {
  const classes: string[] = [];
  if (hidden?.mobile) classes.push(rule("phone", "&{display:none!important}"));
  if (hidden?.desktop) classes.push(rule("desktop", "&{display:none!important}"));
  return classes;
}
