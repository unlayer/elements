/**
 * The links of today's components: a block's own link style, and the body's, which the editor's stylesheet gives every
 * link that doesn't set its own.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { cssValueSafe } from "@unlayer-internal/shared-elements";
import type { Place, TreeNode } from "./lower";
import type { Values } from "./values";

/** CSS for a declaration's value: what can't end its rule. */
export const declared = (property: string, value: unknown) => (value !== undefined && value !== "" && cssValueSafe(String(value)) ? `${property}: ${value};` : "");

/**
 * The style legacy gives a block's links where it doesn't take the body's: their color, and no underline where it
 * says none. Null on a page where its hover style is another: for what has no place for that (a text tool read back).
 */
export function linkStyleOf(values: Values, mode: Place["mode"]): Record<string, Json> | undefined | null {
  const style = values.linkStyle;
  if (!style || style.inherit !== false) return undefined;
  const color = typeof style.linkColor === "string" && style.linkColor ? style.linkColor : undefined;
  const underline = style.linkUnderline !== false;
  if (mode === "web" && (style.linkHoverColor !== style.linkColor || (style.linkHoverUnderline !== false) !== underline)) return null;
  return { ...(color ? { color } : {}), ...(underline ? {} : { textDecoration: "none" }) };
}

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

/** The body's link style for markup of the user's own, which has no Link to hold it. */
export function bodyLinkCss(body: Values, mode: Place["mode"]): string {
  const { style, hover } = bodyLinks(body, mode);
  const rule = (selector: string, of: Record<string, Json>) => {
    const declarations = [declared("color", of.color), declared("text-decoration", of.textDecoration)].filter(Boolean).join(" ");
    return declarations ? `${selector} { ${declarations} }` : "";
  };
  return [rule("a", style), rule("a:hover", hover)].filter(Boolean).join("\n");
}

/** The links among runs in the block's link style (in what a link doesn't set itself), and under the pointer. */
export function styled(runs: Array<TreeNode | string>, style: Record<string, Json> | undefined, hover: Record<string, Json> = {}): Array<TreeNode | string> {
  if (!Object.keys(style ?? {}).length && !Object.keys(hover).length) return runs;
  return runs.map((run) => {
    if (typeof run === "string") return run;
    const children = run.children && styled(run.children, style, hover);
    if (run.type === "Link") return { ...run, style: { ...style, ...run.style }, ...(Object.keys(hover).length ? { hover } : {}), ...(children ? { children } : {}) };
    return children ? { ...run, children } : run;
  });
}
