/**
 * Rich text in a Paragraph's, Heading's or Button's children (`Hello <strong>world</strong>`, a link, a component
 * of yours or react-intl's <FormattedMessage>): it's rendered while the template is collected (see record.tsx),
 * and this keeps what text can hold. Inline formatting stays (with a link's href, target, rel and title, and
 * styles and classes, which the editor's text keeps too: a <Head>'s stylesheet styles them, and inside a <Tailwind> a
 * Paragraph's, Heading's or Button's classes are inlined as styles); other elements (a div, a table, an image) leave only their text, so no block gets into a paragraph; and
 * nothing that runs code (React writes no event handler; a `javascript:` URL or a CSS expression is left out, and a
 * tag that never ends), nor a <script>'s or <style>'s text, which React 19 writes as it is.
 */
import { replaceTags, rewrite } from "@unlayer-internal/shared-elements";
import { decoded } from "./entities";

const INLINE = /^(strong|b|em|i|u|s|a|br|span|code|sup|sub|small|mark)$/;
const RAW = /<(script|style)\b/iy;
const ENDS: Record<string, RegExp> = { script: /<\/script\s*>/gi, style: /<\/style\s*>/gi };

/**
 * `html` without each <script> and <style>, as `/<(script|style)\b[^>]*>[\s\S]*?(<\/\1\s*>|$)/gi` takes them out: from
 * its start tag to its end tag, or the end. Read once: where a start tag's `>` is the last (it then takes out the end
 * tags after it), that regex read to the end again from each `<` after it.
 */
function withoutRaw(html: string): string {
  return rewrite(html, (at) => {
    RAW.lastIndex = at;
    const name = RAW.exec(html)?.[1];
    if (!name) return at + 1;
    // (Where its start tag has no `>`, no start tag after it has one.)
    const open = html.indexOf(">", RAW.lastIndex);
    if (open < 0) return;
    const end = ENDS[name.toLowerCase()];
    end.lastIndex = open + 1;
    const close = end.exec(html);
    return [close ? close.index + close[0].length : html.length, ""];
  });
}

/**
 * `html` without its comments (`<!--…-->`, to its end where none closes, as a browser reads one), nor what a browser
 * reads as one (`<!…>`, `<?…>`): kept, one left open would hide the rest of the email.
 */
function withoutComments(html: string): string {
  return rewrite(html, (at) => {
    if (html.startsWith("<!--", at)) {
      // (`<!-->` and `<!--->` end at once, as a browser reads them.)
      const abrupt = html.startsWith(">", at + 4) ? at + 5 : html.startsWith("->", at + 4) ? at + 6 : -1;
      const end = abrupt > 0 ? abrupt - 3 : html.indexOf("-->", at + 4);
      return [end < 0 ? html.length : end + 3, ""];
    }
    if (html[at + 1] !== "!" && html[at + 1] !== "?") return at + 1;
    const end = html.indexOf(">", at + 2);
    return [end < 0 ? html.length : end + 1, ""];
  });
}

/**
 * `html` to the first tag that never ends (no `>` after it: `<img src=x onerror=…` before an unclosed <style>, which
 * takes the end tags after it out), as a browser reads such a tag: to the end, with what follows it. Kept, its
 * attributes would be a tag's in the markup the text is written into.
 */
function toUnfinishedTag(html: string): string {
  const start = /<\/?[a-zA-Z]/g;
  start.lastIndex = html.lastIndexOf(">") + 1;
  const at = start.exec(html)?.index;
  return at === undefined ? html : html.slice(0, at);
}

export function inlineHtml(html: string): string {
  // A <script>'s or <style>'s text isn't text (React 19 writes it as it is, markup and all): out, with them, and
  // comments and a tag that never ends. Then each tag, as `/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g` reads it, but read once (see replaceTags).
  // Each tag it keeps is set apart (\u0001…\u0002), so a `<` or `>` in the text around one is text, written as a
  // reference: what's left beside a tag taken out can't make a tag (raw markup's own \u0001 and \u0002 are dropped first).
  const apart = replaceTags(toUnfinishedTag(withoutComments(withoutRaw(html.replace(/[\u0001\u0002]/g, "")))), /<\/?[a-zA-Z]/y, (written) => {
    // (Its name, then its attributes to its `>`, the tag's last character.)
    const [start, close, name] = /^<(\/?)([a-zA-Z][\w:-]*)/.exec(written)!;
    const attributes = written.slice(start.length, -1);
    const tag = name.toLowerCase();
    if (!INLINE.test(tag)) return "";
    if (close) return tag === "br" ? "" : `\u0001</${tag}>\u0002`;
    let kept = "";
    // As React writes attributes: name="escaped value"; read as the browser reads it (its references decoded, the
    // characters it leaves out of a URL's scheme dropped), so `&#106;avascript:` in markup written as HTML is one too.
    for (const [, key, value] of attributes.matchAll(/\s([\w-]+)="([^"]*)"/g)) {
      const allowed = /^(style|title|class)$/.test(key) || (tag === "a" && /^(href|target|rel)$/.test(key));
      // (Its `<` and `>` as references, the same value to a browser, so the tag is one to asWritten, read whole.)
      if (allowed && !/(java|vb)script:|expression\(|^data:/i.test(decoded(value))) kept += ` ${key}="${value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`;
    }
    return `\u0001<${tag}${kept}${tag === "br" ? "/" : ""}>\u0002`;
  });
  const tags = apart.replace(/\u0001[^\u0002]*\u0002|[<>]/g, (part) => (part.length > 1 ? part.slice(1, -1) : part === "<" ? "&lt;" : "&gt;"));
  return asWritten(tags);
}

/**
 * Markup's text as text given as a string writes it: its quotes as written (React writes `'` as `&#x27;` and `"` as
 * `&quot;`, which an email service's tag can't read: `{{ name | default: "friend" }}`), and an email service's
 * <%name%> tag. A tag's attributes keep theirs (each tag read to the next `<` or `>`, once, whatever the text holds:
 * inlineHtml writes a kept attribute's `<` and `>` as references, so a tag is read whole), and the quotes come back
 * before the <%name%> tags do, so no `>` of one is read as a tag's end.
 */
export function asWritten(html: string): string {
  const quoted = html.replace(/<[^<>]*>|&#x27;|&quot;/g, (part) => (part === "&#x27;" ? "'" : part === "&quot;" ? '"' : part));
  return quoted.replace(/&lt;%([\w.]+)%&gt;/g, "<%$1%>");
}
