/**
 * The builder's design JSON, as the converters hand it on.
 */

/**
 * The editor's canvas gives every `img` `width: auto`, which overrides a width
 * attribute: an image in a text or HTML block also gets its width in its style.
 * What the design renders to is unchanged.
 */
export function pinImageWidths<T>(design: T): T {
  const pin = (html: string) =>
    html.replace(/<img\b[^>]*>/g, (tag) => {
      const width = /\swidth=["']?(\d+(?:\.\d+)?%?)/.exec(tag)?.[1];
      const style = /\sstyle="([^"]*)"/.exec(tag);
      if (!width || (style && /(^|;)\s*width\s*:/.test(style[1]))) return tag;
      const value = width.endsWith("%") ? width : `${width}px`;
      if (style) return tag.replace(style[0], ` style="${style[1].replace(/;?\s*$/, "")}${style[1].trim() ? ";" : ""}width:${value}"`);
      return tag.replace(/^<img\b/, `<img style="width:${value}"`);
    });
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, (k === "text" || k === "html") && typeof v === "string" ? pin(v) : walk(v)]));
  };
  return walk(design) as T;
}
