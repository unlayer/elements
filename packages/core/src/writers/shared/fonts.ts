/**
 * Web fonts: the root's `fonts` as `@font-face` rules, each face once, in the
 * order declared. Shared by every HTML target.
 */
import type { FontFace, FontFormat } from "../../kinds";
import type { ResolvedNode } from "../../resolve";

/** A CSS string, with what could end it or the stylesheet escaped. */
const cssString = (value: string) => `"${value.replace(/[\\"\n\r<>]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;

/** A file's format from its extension, where the face doesn't say. */
function formatOf(face: FontFace): FontFormat | undefined {
  if (face.format) return face.format;
  const extension = /\.(woff2|woff|ttf|otf)(?:[?#]|$)/i.exec(face.src)?.[1].toLowerCase();
  return extension === "ttf" ? "truetype" : extension === "otf" ? "opentype" : (extension as FontFormat | undefined);
}

/** `swap`: show the text in a fallback until the font loads (browsers; email clients load fonts before they show). */
export function fontFaces(root: ResolvedNode, { swap }: { swap: boolean }): string[] {
  const faces = new Map<string, string>();
  for (const face of (root.props.fonts as FontFace[] | undefined) ?? []) {
    const format = formatOf(face);
    const weight = Array.isArray(face.weight) ? face.weight.join(" ") : face.weight;
    const rule = [
      `font-family:${cssString(face.family)}`,
      `src:url(${cssString(face.src)})${format ? ` format(${cssString(format)})` : ""}`,
      weight !== undefined ? `font-weight:${weight}` : "",
      face.style ? `font-style:${face.style}` : "",
      swap ? "font-display:swap" : "",
    ]
      .filter(Boolean)
      .join(";");
    faces.set(rule, `@font-face{${rule}}`);
  }
  return [...faces.values()];
}
