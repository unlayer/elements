/**
 * Fonts with a source (`{ name, src }`) as `@font-face` rules, each once, in
 * the order the template first uses them. Shared by every HTML target.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";

/** A CSS string, with what could end it or the stylesheet escaped. */
const cssString = (value: string) => `"${value.replace(/[\\"\n\r<>]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;

/** `swap`: show the text in its fallback until the font loads (browsers; email clients load fonts before they show). */
export function fontFaces(root: ResolvedNode, { swap }: { swap: boolean }): string[] {
  const faces = new Map<string, string>();
  const visit = (node: ResolvedNode) => {
    const family = node.text.fontFamily;
    if (typeof family === "object" && family.src) {
      const key = `${family.name}\n${family.src}`;
      if (!faces.has(key)) faces.set(key, `@font-face{font-family:${cssString(family.name)};src:url(${cssString(family.src)})${swap ? ";font-display:swap" : ""}}`);
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return [...faces.values()];
}
