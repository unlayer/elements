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
| Tables | `Table` (in a list or a quote, an HTML table in its `Paragraph`, its cells written as a `Table`'s are) |
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
  - Attributes: `abbr` `align` `alt` `axis` `background` `bgcolor` `border` `cellpadding` `cellspacing` `char` `charoff` `cite` `class` `clear` `color` `colspan` `compact` `datetime` `dir` `face` `frame` `headers` `height` `href` `hreflang` `hspace` `id` `lang` `name` `noshade` `nowrap` `open` `rel` `reversed` `role` `rowspan` `rules` `scope` `size` `span` `src` `start` `style` `summary` `target` `title` `type` `valign` `value` `vspace` `width`, and `aria-*`. `href` and `cite` are kept with a web, `mailto:` or `tel:` URL (or one with no scheme), `src` and `background` with a web or `cid:` URL or a PNG, GIF, JPEG or WebP data URL, `style` without `url()`, `image()`, `image-set()`, `expression()`, `behavior`, `-moz-binding`, an old Internet Explorer's `progid:` filter, `javascript:` or a comment, and `class` without a name whose arbitrary value would be such CSS (`bg-[url(…)]`, `[background:url(…)]`, written as it is or hidden behind an HTML reference or a CSS escape), so the HTML and the design built from it hold none, whatever renders them later. Event handlers (`on…`), `data-*`, `srcset`, `srcdoc` and every other attribute are left out.
  - Left out with what's in them: `script`, `style`, `iframe`, `frameset`, `noframes`, `noembed`, `noscript`, `object`, `applet`, `template`, `svg`, `math`, `select`, `textarea`, `title`, `xmp` and `plaintext`. Any other tag is left out alone, what's in it kept (`<form><b>Hi</b></form>` is `<b>Hi</b>`). Comments (Outlook's conditional ones too), doctypes, CDATA and a tag the HTML ends in are left out; a `<` that starts no tag is text.

  Inside a `<Tailwind>`, the classes in its HTML become inline styles (see [Classes in HTML markup](./tailwind.md#classes-in-html-markup)), and what they give is checked again: a declaration a `style` couldn't have is left out, with a warning. The classes of your own markup (an `Html` block's) are inlined as you wrote them.

  `html="escape"` shows raw HTML as text, and `html="drop"` leaves it out. For Markdown your users write, use `"escape"` or `"drop"`.

`sanitizeHtml(html)` and `safeUrl(url, kind)` are exported for markup you build yourself.

A table in a list or a quote is written as a top-level one's cells are: `html`, `url`, `linkAttributes`, `imageAttributes`, `styles` and `inlineCode` apply to its cells too.

## Markdown from data: what it can't make a render do

Markdown your users write can't make a render take more than its size calls for:

- **Tables**: a Markdown's tables can have, in all, as many cells as the Markdown has characters, or 1,000 where that's more, each row counted as wide as the header (marked, the parser, fills a short row out to the header's width). A table whose cells are all written out (each one at least its `|`) always fits, however large. One that doesn't, a table whose short rows would be filled out past that (`|a|b|…|` and rows of `|`: a few kilobytes of them are millions of cells, and a `Table` writes about 350 bytes of HTML for each), fails as a component of yours fails: a `RenderError` naming the Markdown and where it is (`A table of 853 columns and 853 rows is 728462 cells, more than the Markdown can render: … (in <Markdown> at Row 1 › Column 1 › Markdown)`), or, with `onError: "omit"`, left out and listed while the Markdown's other blocks render (a table in a list or a quote, with that list or quote). See [Errors](../README.md#errors). The 1,000 are for tables with short rows: 20 columns and 50 rows is about 350 KB of HTML, more than three times what Gmail shows before it clips a message (102 KB).
- **Nesting**: quotes and lists nest 32 deep (counted together). Deeper, a quote's `>` and a list's marker are text, in the block they're in, and the rest of the email renders: nothing is left out. Emphasis, strikethrough and links nest 32 deep too (counted together): deeper, their delimiters are text.
- **Inline syntax**: marked reads an emphasis, strikethrough, link, code or raw HTML opener by looking ahead for what closes it, to the end of the paragraph where nothing does, so a paragraph of openers nothing closes (`*a *a *a …`, `[a]([a](…`) took time growing with its size squared: a minute for 100 KB of `*a `. Elements gives each of marked's rules only as much of the text as it can look at, so it reads the same, and counts what it looks at: a Markdown's inline syntax can take 32 steps for each of its characters, and about a million more. That's far more than Markdown as people write it takes (31 MB of READMEs, changelogs and documentation, read alike, took at most 6 steps a character, and none more than half the million), and past it the rest of the Markdown's inline syntax is text: nothing is left out, and the render takes about 0.2 s for 100 KB of the worst of those shapes, 0.9 s for 500 KB.
- **Size**: the rest grows with the Markdown, linearly, and so does the time a render takes. Each block is an Elements block, with the editor's markup around it (a few hundred bytes of HTML), so the HTML depends on how short the Markdown's blocks are: a kilobyte of it is about 11 KB of HTML in prose with links and bold text, 100 KB in quotes nested as deep as they go (32) around a few characters each, as each quote is a block in the one around it, and 140 to 200 KB where every few characters are a block of their own (a heading, a list item, a rule, a table row: a line underlined with `=` under each one-letter line is the most, 196 KB). A render takes about 0.2 MB of memory per kilobyte in prose and up to 1.2 MB in those short blocks, on top of what the process holds already (the process's peak, measured on Node 24: 100 KB of Markdown is 0.1 to 19 MB of HTML, in 0.06 to 0.35 s, peaking at 170 to 350 MB, and renders in a 128 MB heap; 1 MB is 1 to 196 MB of HTML, in 0.3 to 3 s, peaking at 200 MB to 1.4 GB). Cap what users can give: 100 KB is far more than an email holds (Gmail clips a message past 102 KB of HTML), and keeps a render's process under about 350 MB, whatever its shape.

## Plain text

`renderToPlainText()` reads the blocks as it reads any template: headings in capitals (`h1`, `h2`), links as `text (url)` (a heading's too: `# [Pay invoice](https://example.com/pay)` is `PAY INVOICE (https://example.com/pay)`, its URL as written), list items with a dash, code with its indentation.

## Agent rules

- Put `<Markdown>` in a `Column`, never straight in a `Row` or the root.
- Style blocks with `blocks` and markup with `styles`. Don't post-process the HTML.
- For Markdown from users, pass `html="escape"` (or `"drop"`) and keep the default URL checks, and cap its size (100 KB, say: see [Markdown from data](#markdown-from-data-what-it-cant-make-a-render-do)). Render it with `onError: "omit"` (or a function) where a table too large for it should leave the rest of the email rendering.
