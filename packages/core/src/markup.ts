/**
 * The words of markup an Html block holds, for what can't show markup: the plain-text version, a PDF, an image. Not a
 * browser: what a browser hides (a style sheet, a script, a comment, which holds Outlook's own markup) is left out, a
 * block ends its line, and the entities text uses most are read; everything else is its words as written.
 */

const DROPPED = /<(style|script|head|title|template)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->/gi;
/** Tags that end a line (a block, a cell's row, a line break). */
const LINE = /<\s*(br|\/?(p|div|h[1-6]|li|ul|ol|tr|table|blockquote|section|article|header|footer|pre))\b[^>]*>/gi;
const TAG = /<[^>]*>/g;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", trade: "™", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·", euro: "€", pound: "£" };

const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
    if (name[0] !== "#") return Object.prototype.hasOwnProperty.call(ENTITIES, name.toLowerCase()) ? ENTITIES[name.toLowerCase()] : match;
    const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });

/** Markup's words, a line for each block, blank lines between none. */
export function markupText(html: string): string {
  const text = decode(html.replace(DROPPED, "").replace(LINE, "\n").replace(TAG, ""));
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t\r\f\v\u00a0]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** An Html block's plain text: its own, else its markup's words. */
export function htmlText(node: { props: Record<string, unknown> }): string {
  return (typeof node.props.text === "string" ? node.props.text : markupText(String(node.props.html ?? ""))).trim();
}
