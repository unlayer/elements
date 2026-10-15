/**
 * Rich text in a Paragraph's, Heading's or Button's children (`Hello <strong>world</strong>`, a link, a component
 * of yours or react-intl's <FormattedMessage>): React renders it while the template is collected (see record.tsx),
 * and this keeps what text can hold. Inline formatting stays (with a link's href, target, rel and title, and
 * styles); other elements (a div, a table, an image) leave only their text, so no block gets into a paragraph; and
 * nothing that runs code (React writes no event handler; a `javascript:` URL or a CSS expression is left out).
 */
const INLINE = /^(strong|b|em|i|u|s|a|br|span|code|sup|sub|small|mark)$/;

export function inlineHtml(html: string, classes?: boolean): string {
  return html
    .replace(/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g, (_, close: string, name: string, attributes: string) => {
      const tag = name.toLowerCase();
      if (!INLINE.test(tag)) return "";
      if (close) return tag === "br" ? "" : `</${tag}>`;
      let kept = "";
      // As React writes attributes: name="escaped value". Classes only where a <Tailwind> makes them styles.
      for (const [attribute, key, value] of attributes.matchAll(/\s([\w-]+)="([^"]*)"/g)) {
        const allowed = key === "style" || key === "title" || (classes && key === "class") || (tag === "a" && /^(href|target|rel)$/.test(key));
        if (allowed && !/(java|vb)script:|expression\(|^data:/i.test(value.replace(/[\s\u0000-\u001f]|&[#\w]+;?/g, ""))) kept += attribute;
      }
      return `<${tag}${kept}${tag === "br" ? "/" : ""}>`;
    })
    // An email service's <%name%> tag stays as written, as in text given as a string.
    .replace(/&lt;%([\w.]+)%&gt;/g, "<%$1%>");
}
