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
- Raw HTML is kept without scripts, style sheets, frames, forms, embedded objects, comments, event handlers, URLs that run code or CSS expressions (`html="sanitize"`, the default). `html="escape"` shows it as text, and `html="drop"` leaves it out. For Markdown your users write, use `"escape"` or `"drop"`.

`sanitizeHtml(html)` and `safeUrl(url, kind)` are exported for markup you build yourself.

## Plain text

`renderToPlainText()` reads the blocks as it reads any template: headings in capitals (`h1`, `h2`), links as `text (url)`, list items with a dash, code with its indentation.

## Agent rules

- Put `<Markdown>` in a `Column`, never straight in a `Row` or the root.
- Style blocks with `blocks` and markup with `styles`. Don't post-process the HTML.
- For Markdown from users, pass `html="escape"` (or `"drop"`) and keep the default URL checks.
