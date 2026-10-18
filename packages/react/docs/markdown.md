# Markdown in Elements

Render Markdown (release notes, a support reply, AI-written copy) as Elements blocks. Headings become `Heading` blocks, images `Image` blocks, tables `Table` blocks, so the email, page or document renders like the rest of your template, and `renderToJson()` gives a design the visual editor can edit block by block, not one opaque HTML blob.

```bash
npm install @unlayer/react-elements
```

The parser ([marked](https://github.com/markedjs/marked)) is built into `@unlayer/react-elements/markdown`: there's nothing more to install, and the main entry never loads it.

## Render Markdown

Put `<Markdown>` in a `Column`, with the Markdown as its children or its `markdown` prop:

```tsx
import { Email, Row, Column, renderToHtml, renderToJson } from "@unlayer/react-elements";
import { Markdown } from "@unlayer/react-elements/markdown";

const notes = (
  <Email>
    <Row>
      <Column>
        <Markdown blocks={{ paragraph: { fontSize: "16px" } }}>{`
          # Release notes

          **Faster exports**, and \`renderToJson()\` keeps your [links](https://example.com/changelog).

          - Smaller bundles
          - [x] Dark code themes
        `}</Markdown>
      </Column>
    </Row>
  </Email>
);

renderToHtml(notes); // email HTML
renderToJson(notes); // a Heading, a Paragraph, a Paragraph with the list
```

The indentation every line shares (a template literal's) is taken off first. Rendering stays synchronous.

## What each element becomes

| Markdown | Block |
|----------|-------|
| `#` … `######` headings | `Heading` (`h1` … `h6`, sizes 28px down to 14px, bold) |
| Paragraphs | `Paragraph` |
| Lists, task lists, nested lists | `Paragraph` holding the `<ul>`/`<ol>` |
| Quotes | `Paragraph` holding the `<blockquote>` |
| An image on a line of its own (also inside a link) | `Image` (its link as the image's link) |
| `---` | `Divider` |
| Tables | `Table` |
| Fenced and indented code | `CodeBlock` (see [Code](./code.md)) |
| Raw HTML, and anything else | `Html` |

Inside text, bold, italics, strikethrough, links, images and line breaks are HTML in the block's text, and inline code is `codeInline()`'s email-safe `<code>`.

## Style the blocks

- `blocks`: props for each kind of block, over Markdown's own: `heading` for every heading, `h1` … `h6` for one level, `paragraph`, `list`, `blockquote`, `image`, `divider`, `table`, `code` (a CodeBlock's `theme`, `lineNumbers`, `fontSize` …) and `html`.
- `styles`: inline CSS for markup in the text, by tag: `a`, `strong`, `em`, `del`, `img`, `ul`, `ol`, `li`, `blockquote`, `p`, `hr`. One you give replaces Markdown's default for that tag.
- `inlineCode`: inline code's `theme` and `fontFamily`.
- `breaks`: a line break in a paragraph is a break (as in comments on GitHub), not a space.

```tsx
<Markdown
  blocks={{ heading: { color: "#0f172a" }, h1: { fontSize: "32px" }, code: { theme: "dark", lineNumbers: true } }}
  styles={{ a: "color: #2563eb; text-decoration: none", blockquote: "margin: 0; padding-left: 16px; border-left: 4px solid #2563eb" }}
>
  {changelog}
</Markdown>
```

## Links, images and raw HTML

- Links get `target="_blank" rel="noopener"`. Pass `linkAttributes` (an object, or a function of the URL) for others, and `imageAttributes` for images in text. Event handlers (`on…`) and `href`/`src`/`style` aren't taken there.
- `url(url, kind)` rewrites each link's and image's URL (`kind` is `"link"` or `"image"`): add tracking parameters, point images at a CDN. Return `undefined` to leave it out: a link's text stays, an image goes.
- URLs that could run code are left out before that: links may be web, `mailto:` or `tel:` URLs, images web or `cid:` URLs or PNG, GIF, JPEG and WebP data URLs. A URL with no scheme (`/pricing`, `#faq`, `{{unsubscribe_url}}`) is kept.
- Raw HTML (`html="sanitize"`, the default) keeps only the tags and attributes that display, read as a browser reads it and written again, so what's left out can't join what's around it into a tag:
  - Tags: `p` `div` `span` `br` `hr` `wbr` `h1`–`h6` `a` `img` `b` `strong` `i` `em` `u` `s` `strike` `del` `ins` `sub` `sup` `small` `big` `font` `center` `mark` `abbr` `cite` `q` `dfn` `time` `code` `pre` `kbd` `samp` `var` `tt` `bdi` `bdo` `blockquote` `address` `ul` `ol` `li` `dl` `dt` `dd` `table` `caption` `colgroup` `col` `thead` `tbody` `tfoot` `tr` `th` `td` `section` `article` `header` `footer` `main` `nav` `aside` `figure` `figcaption` `details` `summary`.
  - Attributes: `abbr` `align` `alt` `axis` `background` `bgcolor` `border` `cellpadding` `cellspacing` `char` `charoff` `cite` `class` `clear` `color` `colspan` `compact` `datetime` `dir` `face` `frame` `headers` `height` `href` `hreflang` `hspace` `id` `lang` `name` `noshade` `nowrap` `open` `rel` `reversed` `role` `rowspan` `rules` `scope` `size` `span` `src` `start` `style` `summary` `target` `title` `type` `valign` `value` `vspace` `width`, and `aria-*`. `href` and `cite` are kept with a web, `mailto:` or `tel:` URL (or one with no scheme), `src` and `background` with a web or `cid:` URL or a PNG, GIF, JPEG or WebP data URL, `style` without `url()`, `image-set()`, `expression()`, `behavior`, `-moz-binding`, `javascript:` or a comment. Event handlers (`on…`), `data-*`, `srcset`, `srcdoc` and every other attribute are left out.
  - Left out with what's in them: `script`, `style`, `iframe`, `frameset`, `noframes`, `noembed`, `noscript`, `object`, `applet`, `template`, `svg`, `math`, `select`, `textarea`, `title`, `xmp` and `plaintext`. Any other tag is left out alone, what's in it kept (`<form><b>Hi</b></form>` is `<b>Hi</b>`). Comments (Outlook's conditional ones too), doctypes, CDATA and a tag the HTML ends in are left out; a `<` that starts no tag is text.

  `html="escape"` shows raw HTML as text, and `html="drop"` leaves it out. For Markdown your users write, use `"escape"` or `"drop"`.

`sanitizeHtml(html)` and `safeUrl(url, kind)` are exported for markup you build yourself.

## Plain text

`renderToPlainText()` reads the blocks as it reads any template: headings in capitals (`h1`, `h2`), links as `text (url)`, list items with a dash, code with its indentation.

## Agent rules

- Put `<Markdown>` in a `Column`, never straight in a `Row` or the root.
- Style blocks with `blocks` and markup with `styles`. Don't post-process the HTML.
- For Markdown from users, pass `html="escape"` (or `"drop"`) and keep the default URL checks.
