/**
 * Rich text in a Paragraph's, Heading's or Button's children (`Hello <strong>world</strong>`, a link, a component
 * of yours or react-intl's <FormattedMessage>): it's rendered while the template is collected (see record.tsx),
 * and this keeps what text can hold. Inline formatting stays (with a link's href, target, rel and title, and
 * styles and classes, which the editor's text keeps too: a <Head>'s stylesheet styles them, and inside a <Tailwind> a
 * Paragraph's, Heading's or Button's classes are inlined as styles); other elements (a div, a table, an image) leave only their text, so no block gets into a paragraph; and
 * nothing that runs code (React writes no event handler; a `javascript:` URL or a CSS expression is left out), nor a
 * <script>'s or <style>'s text, which React 19 writes as it is.
 */
import { decoded } from "./entities";

const INLINE = /^(strong|b|em|i|u|s|a|br|span|code|sup|sub|small|mark)$/;

export function inlineHtml(html: string): string {
  return html
    // A <script>'s or <style>'s text isn't text (React 19 writes it as it is, markup and all): out, with them.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(<\/\1\s*>|$)/gi, "")
    .replace(/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g, (_, close: string, name: string, attributes: string) => {
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
    })
    // An email service's <%name%> tag stays as written, as in text given as a string.
    .replace(/&lt;%([\w.]+)%&gt;/g, "<%$1%>");
}
