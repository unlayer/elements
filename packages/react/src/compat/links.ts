/**
 * The links of today's components: a block's own link style, and the body's, which the editor's stylesheet gives every
 * link that doesn't set its own.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { cssValueSafe } from "@unlayer-internal/shared-elements";
import type { Place, TreeNode } from "./lower";
import type { Values } from "./values";
import { linkStyleOf } from "../builder/read-values";

export { linkStyleOf, styled } from "../builder/read-values";

/** CSS for a declaration's value: what can't end its rule. */
export const declared = (property: string, value: unknown) => (value !== undefined && value !== "" && cssValueSafe(String(value)) ? `${property}: ${value};` : "");

/** What a block's links change to under the pointer: what differs from their style (an email's stylesheet has none). */
export function linkHoverOf(values: Values, mode: Place["mode"]): Record<string, Json> {
  const style = values.linkStyle;
  if (!style || style.inherit !== false || mode === "email") return {};
  const line = style.linkHoverUnderline !== false;
  return { ...(typeof style.linkHoverColor === "string" && style.linkHoverColor && style.linkHoverColor !== style.linkColor ? { color: style.linkHoverColor } : {}), ...(line !== (style.linkUnderline !== false) ? { textDecoration: line ? "underline" : "none" } : {}) };
}

/**
 * The body's link style, which the editor's stylesheet gives every link that doesn't set its own: what isn't a link's
 * own already (blue and underlined).
 */
export function bodyLinks(body: Values, mode: Place["mode"]): { style: Record<string, Json>; hover: Record<string, Json> } {
  if (!body.linkStyle || typeof body.linkStyle !== "object") return { style: {}, hover: {} };
  const values = { linkStyle: { ...body.linkStyle, inherit: false } };
  const { color, ...style } = linkStyleOf(values, "email") ?? {};
  return { style: { ...style, ...(typeof color === "string" && !/^#0000ee$/i.test(color) ? { color } : {}) }, hover: linkHoverOf(values, mode) };
}

/** A block's links: its own style where it has one (a color it doesn't give is the body's), else the body's. */
export function blockLinks(values: Values, body: Values, mode: Place["mode"]): { style: Record<string, Json>; hover: Record<string, Json> } {
  const fromBody = bodyLinks(body, mode);
  const own = linkStyleOf(values, "email");
  if (!own) return fromBody;
  return { style: { ...(fromBody.style.color === undefined ? {} : { color: fromBody.style.color }), ...own }, hover: linkHoverOf(values, mode) };
}

/** The body's link style for markup of the user's own, which has no Link to hold it. */
export function bodyLinkCss(body: Values, mode: Place["mode"]): string {
  const { style, hover } = bodyLinks(body, mode);
  const rule = (selector: string, of: Record<string, Json>) => {
    const declarations = [declared("color", of.color), declared("text-decoration", of.textDecoration)].filter(Boolean).join(" ");
    return declarations ? `${selector} { ${declarations} }` : "";
  };
  return [rule("a", style), rule("a:hover", hover)].filter(Boolean).join("\n");
}

