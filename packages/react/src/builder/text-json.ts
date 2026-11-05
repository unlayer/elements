/**
 * A tool's rich text (its editor's Lexical JSON, `textJson`) as HTML, for reading it back: the generator's
 * (lexical.ts, as today's components write it), with each node the builder's editor saves written as the editor's own export writes it. The
 * generator knows Lexical's nodes (text, paragraph, heading, list, list item, link, line break); the editor saves
 * its own, which it writes as their words only, or not at all. Each is turned into the generator's node, and what the
 * generator doesn't write of it but the editor does is added to its tag:
 *
 * - a link (`extended-link`, an `autolink`): a `link` with its URL, target and rel, and its title, style, class, click
 *   handler, download and own attributes; an automatic link its writer unlinked is its words;
 * - a merge tag (`merge_tag`): its text, the tag as the editor writes it (`{{first_name}}`), in its format and style;
 * - a list (`extended-list`) and its items (`extended-listitem`): a `list` of its type with its start, marker and
 *   direction, and `listitem`s with their direction and alignment (one holding only a nested list shows no marker);
 * - a heading in text (`extended-heading`): its tag with its style; a heading's or a button's line
 *   (`heading-paragraph`): a `<span>`, as a paragraph of theirs;
 * - a node with attributes of its own (`custom_node`): its element as the editor writes it, which the run parser
 *   keeps as markup.
 *
 * Any other node is said in `unread`. Pure: the JSON isn't changed.
 */
import { generateHtmlFromTextJson } from "./lexical";

/** What isn't Lexical's JSON or an HTML passthrough, as `unread` says it. */
const NOT_RICH_TEXT = "rich text that isn't the editor's";

type Item = Record<string, unknown>;

/** The nodes the generator writes. */
const KNOWN = new Set(["root", "paragraph", "extended-paragraph", "heading", "text", "extended-text", "linebreak", "link", "list", "listitem"]);
const ALIGNS: Record<string, string> = { "1": "left", "2": "center", "3": "right", "4": "justify", left: "left", center: "center", right: "right", justify: "justify" };
/** The tags a node of the editor's own (custom_node) is written in. */
const TAGS = new Set(["span", "p", "a", "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup", "label", "abbr", "cite", "code", "kbd", "samp", "var", "time", "q", "dfn", "ins", "del"]);
/** Where a custom node's markup goes in the generator's HTML (characters no text holds: Unicode's private use). */
const MARK = (i: number) => `${i}`;

/** The generator's HTML: a passthrough of something other than a string (`{"__html": 42}`) is none. */
const generated = (json: string): TextJsonHtml => {
  const html: unknown = generateHtmlFromTextJson(json);
  return typeof html === "string" ? { html, unread: [] } : { html: "", unread: [NOT_RICH_TEXT] };
};
const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attribute = (name: string, value: unknown) => (text(value) && /^[A-Za-z_:][\w:.-]*$/.test(name) ? ` ${name}="${escape(text(value)!)}"` : "");
const attributes = (pairs: Array<[string, unknown]>) => pairs.map(([name, value]) => attribute(name, value)).join("");
const own = (value: unknown): Array<[string, unknown]> => (value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value as Item) : []);

export interface TextJsonHtml {
  html: string;
  /** The node types the editor's export writes that this doesn't, left out. */
  unread: string[];
}

/** The rich text as HTML, each node the editor saves as its export writes it. */
export function textJsonHtml(textJson: string): TextJsonHtml {
  const unread = new Set<string>();
  try {
    const parsed = JSON.parse(textJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || "__html" in parsed || textJson.includes("")) return generated(textJson);
    // What the generator won't write, by the tag it writes (in the order those tags come: a tag holding another
    // comes first, and links don't nest), and each custom node's markup.
    const added: Record<"a" | "list" | "li" | "h", string[]> = { a: [], list: [], li: [], h: [] };
    const custom: string[] = [];
    const walk = (node: unknown): unknown => {
      if (!node || typeof node !== "object" || Array.isArray(node)) return node;
      const item = node as Item;
      const type = String(item.type);
      if (type === "merge_tag") {
        // Its text in its bold, italic, underline and strike (its export writes those), and its style.
        return { type: "extended-text", text: text(item.text) ?? text(own(item.properties).find(([key]) => key === "value")?.[1]) ?? "", format: Number(item.format) & 15, style: item.style };
      }
      if (type === "custom_node") {
        const tag = typeof item.tagName === "string" && TAGS.has(item.tagName) ? item.tagName : "span";
        custom.push(`<${tag}${attributes(own(item.attributes))}${attribute("style", item.style)}>${escape(text(item.text) ?? "")}</${tag}>`);
        return { type: "extended-text", text: MARK(custom.length - 1) };
      }
      // Its own nodes the generator writes otherwise, or not; what they add, kept for their tags.
      const linked = (type === "link" || type === "extended-link" || type === "autolink") && item.isUnlinked !== true;
      if (linked) added.a.push(attributes([["title", item.title], ["style", item.style], ["class", item.className], ["onclick", item.onClick], ["download", item.download], ...own(item.customAttrs)]));
      const listed = type === "list" || type === "extended-list";
      if (listed) {
        const start = item.listType === "number" && typeof item.start === "number" && item.start !== 1 ? String(item.start) : undefined;
        added.list.push(attributes([["start", start], ["style", text(item.listStyleType) && `list-style-type: ${item.listStyleType}`], ["dir", item.direction === "rtl" ? "rtl" : undefined]]));
      }
      const itemized = type === "listitem" || type === "extended-listitem";
      if (itemized) {
        // An item holding a nested list shows no marker (the editor's export hides it).
        const nested = Array.isArray(item.children) && item.children.some((child) => String((child as Item | undefined)?.type).includes("list"));
        const css = [ALIGNS[String(item.format)] && `text-align: ${ALIGNS[String(item.format)]}`, nested && "list-style-type: none"].filter(Boolean).join("; ");
        added.li.push(attributes([["dir", item.direction === "rtl" ? "rtl" : undefined], ["style", css]]));
      }
      if (type === "extended-heading" || type === "heading") added.h.push(attribute("style", item.style));
      const children = Array.isArray(item.children) ? item.children.map(walk) : [];
      if (itemized) return { ...item, type: "listitem", children };
      if (type === "extended-heading") return { ...item, type: "heading", children };
      if (type === "heading-paragraph") return { ...item, type: "paragraph", isInlineTool: true, children };
      if (linked) return { ...item, type: "link", url: text(item.url) ?? "", target: text(item.target), rel: text(item.rel), children };
      if (listed) return { ...item, type: "list", children };
      // An automatic link its writer unlinked is its words (the generator writes a root's children as they are).
      if (type === "autolink") return { type: "root", children };
      if (!KNOWN.has(type)) unread.add(type);
      return { ...item, children };
    };
    let html = generateHtmlFromTextJson(JSON.stringify({ ...parsed, root: walk((parsed as Item).root) }));
    const at = { a: 0, list: 0, li: 0, h: 0 };
    html = html.replace(/<(a|ul|ol|li|h[1-6])(?=[\s>])/g, (open, tag: string) => {
      const kind = tag === "a" || tag === "li" ? tag : tag[0] === "h" ? "h" : "list";
      return `${open}${added[kind][at[kind]++] ?? ""}`;
    });
    html = html.replace(/(\d+)/g, (_, i: string) => custom[Number(i)] ?? "");
    return { html, unread: [...unread] };
  } catch {
    // JSON that isn't, or nested too deep to walk: as the generator reads it.
    return generated(textJson);
  }
}
