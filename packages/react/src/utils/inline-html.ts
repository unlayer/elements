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
  // A <script>'s or <style>'s text isn't text (React 19 writes it as it is, markup and all): out, with them, and a tag
  // that never ends. Then each tag, as `/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g` reads it, but read once (see replaceTags).
  const tags = replaceTags(toUnfinishedTag(withoutRaw(html)), /<\/?[a-zA-Z]/y, (written) => {
    // (Its name, then its attributes to its `>`, the tag's last character.)
    const [start, close, name] = /^<(\/?)([a-zA-Z][\w:-]*)/.exec(written)!;
    const attributes = written.slice(start.length, -1);
    const tag = name.toLowerCase();
    if (!INLINE.test(tag)) return "";
    if (close) return tag === "br" ? "" : `</${tag}>`;
    let kept = "";
    // As React writes attributes: name="escaped value"; read as the browser reads it (its references decoded, the
    // characters it leaves out of a URL's scheme dropped), so `&#106;avascript:` in markup written as HTML is one too.
    for (const [attribute, key, value] of attributes.matchAll(/\s([\w-]+)="([^"]*)"/g)) {
      const allowed = /^(style|title|class)$/.test(key) || (tag === "a" && /^(href|target|rel)$/.test(key));
      if (allowed && !/(java|vb)script:|expression\(|^data:/i.test(decoded(value))) kept += attribute;
    }
    return `<${tag}${kept}${tag === "br" ? "/" : ""}>`;
  });
  // An email service's <%name%> tag stays as written, as in text given as a string.
  return tags.replace(/&lt;%([\w.]+)%&gt;/g, "<%$1%>");
}
