/**
 * The writers' HTML indented, for reading it: a new line, indented by depth,
 * only between two tags where at least one is structural (the document's
 * head, tables and their rows and cells, a page's main and sections), never
 * inside text or between inline elements, where white space would show.
 * Chromium lays the result out as it does the compact HTML
 * (test/browser/pretty.test.ts); it's for reading, not for sending: some
 * email clients (Word) may treat the white space differently.
 */

const STRUCTURAL = new Set(["html", "head", "body", "meta", "title", "style", "link", "table", "thead", "tbody", "tr", "td", "th", "colgroup", "col", "main", "section"]);
const VOID = new Set(["meta", "link", "col", "img", "br", "hr", "wbr"]);

type Token = { text: string; tag?: string; closing?: boolean };

function tokens(html: string): Token[] {
  const out: Token[] = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>|[^<]+/g)) {
    const text = match[0];
    const tag = match[1]?.toLowerCase();
    out.push(tag ? { text, tag, closing: text.startsWith("</") } : { text });
  }
  return out;
}

export function prettyHtml(html: string): string {
  const parts = tokens(html);
  let depth = 0;
  let out = "";
  parts.forEach((token, index) => {
    const previous = parts[index - 1];
    if (token.tag && token.closing) depth = Math.max(0, depth - 1);
    const between = previous && (previous.tag || previous.text.startsWith("<!")) && (token.tag || token.text.startsWith("<!"));
    const structural = (previous?.tag && STRUCTURAL.has(previous.tag)) || (token.tag && STRUCTURAL.has(token.tag));
    if (index > 0 && between && structural) out += `\n${"  ".repeat(depth)}`;
    out += token.text;
    if (token.tag && !token.closing && !VOID.has(token.tag) && !token.text.endsWith("/>")) depth++;
  });
  return out;
}
