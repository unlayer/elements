/**
 * Rich text in a Paragraph's, Heading's or Button's children (`Hello <strong>world</strong>`, a link, a component
 * of yours or react-intl's <FormattedMessage>): it's rendered while the template is collected (see record.tsx),
 * and this keeps what text can hold. Inline formatting stays (with a link's href, target, rel and title, and
 * styles and classes, which the editor's text keeps too: a <Head>'s stylesheet styles them, and inside a <Tailwind> a
 * Paragraph's, Heading's or Button's classes are inlined as styles); other elements (a div, a table, an image) leave only their text, so no block gets into a paragraph; and
 * nothing that runs code (React writes no event handler; a `javascript:` URL or a CSS expression is left out, and a
 * tag that never ends), nor a <script>'s or <style>'s text, which React 19 writes as it is. Its tags are balanced, so
 * nothing in it runs on into what's after the block.
 */
import { balanced, commentEnd, rawTextEnd, readTag, type Tag } from "./html-tags";
import { decoded } from "./entities";

const INLINE = /^(strong|b|em|i|u|s|a|br|span|code|sup|sub|small|mark)$/;
/** Left out with their text, which isn't text (React 19 writes it as it is, markup and all). */
const RAW = /^(script|style)$/;

/** A tag kept, written again: its attributes those it may keep, each once (the first of a name, as a browser reads it). */
function kept(tag: Tag, image: boolean): string {
  if (tag.close) return tag.name === "br" || image ? "" : `</${tag.name}>`;
  let attributes = "";
  const seen = new Set<string>();
  for (const { name: key, value } of tag.attributes) {
    if (seen.has(key) || value === undefined) continue;
    seen.add(key);
    const allowed = /^(style|title|class)$/.test(key) || (tag.name === "a" && /^(href|target|rel)$/.test(key)) || (image && /^(src|alt|width|height)$/.test(key));
    // Read as the browser reads it (its references decoded, the characters it leaves out of a URL's scheme dropped), so
    // `&#106;avascript:` is one too. (Written double-quoted, its `"`, `<` and `>` as references, the same value to a
    // browser, so asWritten reads the tag whole.)
    if (allowed && !/(java|vb)script:|expression\(|^data:/i.test(decoded(value))) attributes += ` ${key}="${value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`;
  }
  return `<${tag.name}${attributes}${tag.name === "br" || image ? "/" : ""}>`;
}

/**
 * `images`: an <img> stays too (its src, alt, width and height): what a link alone holds (see the model's linkBlock).
 *
 * Read once as a browser reads it (src/utils/html-tags.ts): a tag is a tag as the browser's tokenizer ends it (`<b</span>`
 * is an element named `b<`, `<img src=x <style>` an image), a <script>'s or <style>'s text runs to the end tag a
 * browser ends it at (or the end), and a comment (or what a browser reads as one, `<!…>`, `<?…>`) or a tag the markup
 * ends in (before its `>`, or in a quote left open) is left out, with what follows it. What's kept is written again,
 * its tags balanced: an inline tag it leaves open (`<b>Sale!`, `<a href>`) ends with it, rather than running on into
 * every block after it on a page.
 */
export function inlineHtml(html: string, images = false): string {
  let out = "";
  // (Text's `>` as a reference, so asWritten reads each tag kept whole: a `<` that starts no tag is one too.)
  const text = (part: string) => part.replace(/>/g, "&gt;");
  for (let i = 0; i < html.length; ) {
    const lt = html.indexOf("<", i);
    if (lt < 0) {
      out += text(html.slice(i));
      break;
    }
    out += text(html.slice(i, lt));
    const comment = commentEnd(html, lt);
    if (comment !== undefined) {
      i = comment;
      continue;
    }
    const tag = readTag(html, lt);
    if (tag === undefined) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }
    if (tag === null) break;
    i = tag.end;
    if (!tag.close && RAW.test(tag.name)) {
      // (To its end tag's `>`, or the end where it has none.)
      i = readTag(html, rawTextEnd(html, tag.name, i))?.end || html.length;
      continue;
    }
    const image = images && tag.name === "img";
    if (INLINE.test(tag.name) || image) out += kept(tag, image);
  }
  return asWritten(balanced(out));
}

/**
 * A URL's escaped attribute value, an email service's `<% … %>` tag in it as written (SendGrid's
 * `<%asm_group_unsubscribe_raw_url%>`, ERB's `<%= order.id %>`), as a <Link> keeps one: on one line, with no `<`, `>` or
 * `"` in it, harmless in a quoted attribute, and the service reads it there.
 */
export const keepTags = (escaped: string): string => escaped.replace(/&lt;%((?:(?!&lt;|&gt;)[^\n"]){0,256}?)%&gt;/g, "<%$1%>");

/**
 * Markup's text as text given as a string writes it: its quotes as written (React writes `'` as `&#x27;` and `"` as
 * `&quot;`, which an email service's tag can't read: `{{ name | default: "friend" }}`), and an email service's
 * <%name%> tag. A tag's attributes keep theirs (each tag read to the next `<` or `>`, once, whatever the text holds:
 * inlineHtml writes a kept attribute's `<` and `>` as references, so a tag is read whole), and the quotes come back
 * before the <%name%> tags do, so no `>` of one is read as a tag's end.
 */
export function asWritten(html: string): string {
  // (A tag's attributes are double-quoted, so its `'` are as written too: a link's `{{ email | default: 'none' }}`.)
  const quoted = html.replace(/<[^<>]*>|&#x27;|&quot;/g, (part) => (part === "&#x27;" ? "'" : part === "&quot;" ? '"' : part.replace(/&#x27;/g, "'")));
  return quoted.replace(/&lt;%([\w.]+)%&gt;/g, "<%$1%>");
}
