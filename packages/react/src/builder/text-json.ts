/**
 * A tool's rich text (its editor's Lexical JSON, `textJson`) as HTML, for reading it back: the shared generator's (as
 * compat and today's exporters write it), with the editor's links kept. The editor saves a link, an automatic one too,
 * as an `extended-link`, and Lexical's automatic link is an `autolink`; the generator knows neither (it writes their
 * words only). Each is a `link` here, with its URL, target and rel, which the generator writes, and with what it
 * doesn't write but the editor draws (a title, a style, a class, a click handler, a download, its own attributes)
 * added to its `<a>`: the run parser reads what a Link holds, and keeps the text as markup otherwise. An automatic
 * link its writer unlinked is its words. Pure: the JSON isn't changed.
 */
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";

type Item = Record<string, unknown>;

const LINKS = new Set(["link", "extended-link", "autolink"]);
const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A link's attributes the generator doesn't write, as markup (with a space before each). */
function unwritten(link: Item): string {
  const named: Array<[string, unknown]> = [["title", link.title], ["style", link.style], ["class", link.className], ["onclick", link.onClick], ["download", link.download]];
  const own = link.customAttrs && typeof link.customAttrs === "object" && !Array.isArray(link.customAttrs) ? Object.entries(link.customAttrs as Item) : [];
  // An attribute the editor couldn't set (its name isn't one) isn't drawn.
  return [...named, ...own.filter(([name]) => /^[A-Za-z_:][\w:.-]*$/.test(name))].flatMap(([name, value]) => (text(value) ? [` ${name}="${escape(text(value)!)}"`] : [])).join("");
}

/** The rich text as HTML, its links as the editor draws them. */
export function textJsonHtml(textJson: string): string {
  try {
    const parsed = JSON.parse(textJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || "__html" in parsed) return generateHtmlFromTextJson(textJson);
    // Each link's attributes the generator won't write, in the order its `<a>`s come (links don't nest).
    const added: string[] = [];
    const walk = (node: unknown): unknown => {
      if (!node || typeof node !== "object" || Array.isArray(node)) return node;
      const item = node as Item;
      const linked = typeof item.type === "string" && LINKS.has(item.type) && item.isUnlinked !== true;
      if (linked) added.push(unwritten(item));
      const children = Array.isArray(item.children) ? item.children.map(walk) : item.children;
      // An automatic link its writer unlinked: its words.
      if (item.type === "autolink" && !linked) return { type: "unlinked", children };
      return linked ? { ...item, type: "link", url: text(item.url) ?? "", target: text(item.target), rel: text(item.rel), children } : { ...item, children };
    };
    const html = generateHtmlFromTextJson(JSON.stringify({ ...parsed, root: walk((parsed as Item).root) }));
    let at = 0;
    return html.replace(/<a(?=[\s>])/g, (open) => `${open}${added[at++] ?? ""}`);
  } catch {
    // JSON that isn't, or nested too deep to walk: as the generator reads it.
    return generateHtmlFromTextJson(textJson);
  }
}
