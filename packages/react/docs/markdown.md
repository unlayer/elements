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

- **Tables**: a Markdown's tables can have, in all, as many cells as the Markdown has characters, or 1,000 where that's more, each row counted as wide as the header (marked, the parser, fills a short row out to the header's width). A table whose cells are all written out (each one at least its `|`) always fits, however large. One that doesn't, a table whose short rows would be filled out past that (`|a|b|…|` and rows of `|`: a few kilobytes of them are millions of cells, and a `Table` writes about 350 bytes of HTML for each), fails as a component of yours fails: a `RenderError` naming the Markdown and where it is (`A table of 853 columns and 853 rows is 728462 cells, more than the Markdown can render: … (in <Markdown> at Row 1 › Column 1 › Markdown)`), or, with `onError: "omit"`, left out and listed while the Markdown's other blocks render (a table in a list or a quote, with that list or quote). See [Errors](../README.md#errors). The 1,000 are for tables with short rows: 20 columns and 50 rows is about 350 KB of HTML, more than three times what Gmail shows before it clips a message (102 KB). A line that could be a table's header is read as marked reads it from it and the line after (the delimiter row), as that's all that tells whether it starts a table: marked's rule read every line after them as rows first, so 100 KB of `a` over `-` (a heading underlined with one dash) took 14 s.
- **Nesting**: quotes and lists nest 32 deep (counted together). Deeper, a quote's `>` and a list's marker are text, in the block they're in, and the rest of the email renders: nothing is left out. Emphasis, strikethrough and links nest 32 deep too (counted together): deeper, their delimiters are text.
- **Inline syntax**: marked reads an emphasis, strikethrough, link, code or raw HTML opener by looking ahead for what closes it, to the end of the paragraph where nothing does, so a paragraph of openers nothing closes (`*a *a *a …`, `[a]([a](…`) took time growing with its size squared: a minute for 100 KB of `*a `. Elements gives each of marked's rules only as much of the text as it can look at, so it reads the same, and counts what it looks at: a Markdown's inline syntax can take 32 steps for each of its characters, and about a million more. That's far more than Markdown as people write it takes (31 MB of READMEs, changelogs and documentation, read alike, took at most 6 steps a character, and none more than half the million), and past it the rest of the Markdown's inline syntax is text: nothing is left out (what marked reads in a link's text to see whether raw HTML in it runs past its `]`, from each `<`, is counted too: `[` and 25,000 unclosed `<!--` took 7 s), and the render takes about 0.2 s for 100 KB of the worst of those shapes, 0.9 s for 500 KB.
- **Quotes and task lists**: marked reads a quote a chunk at a time (its `>` lines, up to a line without one that continues it), and after each chunk the lines left again, and where the chunk ends in a list, that list with all of them, so a quote with such a line every other line took time growing with its size squared: 100 KB of `>- a` and `b` lines took 6.6 s, and blocked the event loop as long. Elements counts what each quote takes marked to read, 32 steps for each of the Markdown's characters and about four million more, far more than Markdown as people write it takes (46 MB of READMEs, changelogs and documentation took at most a quarter of a million, and less than one step a character); past it, each quote ends at its first line without a `>`, which is read on outside it: nothing is left out, and 100 KB of the worst shapes renders in about 0.3 s, 500 KB in 1.5 s. marked also took each task item's `[ ]` out of the text left to read by looking for it from the Markdown's end, for each item again (400 KB of `- [ ]` items took 13 s); Elements does it as marked does, in time linear in the list. And a quote holding lists continued by such lines no longer takes the first characters of what follows it, as marked's did.
- **Lines**: marked reads a list item's text a line at a time. Before each line, its setext heading rule read the rest of the item for an underline, and each line added to the text before it read all that text again; and to tell whether a paragraph's line starts a table, it read all the lines after it as the table's rows. So a list item of 200 KB of short lines took 6 s, and 100 KB of `|` over `-` 5 s. Elements tells where a heading can start from the text once, and whether a table starts from the line and the one after, as marked's rules tell them, and counts the lines added to an item's text with its quotes' work: past it, the rest of the item is text. marked also looks for reference links (`[a]`, `[a][b]`) from each `[` of a paragraph, as far as 999 steps; Elements doesn't where the Markdown defines none, or the paragraph has no `*`, `_` or `~` (nothing reads what that finds). The slowest shape is then a paragraph of escaped brackets (`\[`) with a `*` in a Markdown that defines a reference: 0.6 s for 100 KB, 6 s for 1 MB, growing with its size.
- **Code**: highlight.js's time grows with a block's size squared on some code (100 KB of INI in a fence took 27 s), so a Markdown's code blocks are highlighted while their sizes squared add up to 8,192²: a block of 8,192 characters, or many smaller ones (64 of 1,024 characters, a thousand of 256), about 0.4 s at the most. A block past that is shown without colors (escaped, in the CodeBlock's own style), said once in the render; 21 of the 4,782 READMEs and documents with code in 46 MB hold more. See [Code](./code.md).
- **Size**: the rest grows with the Markdown, linearly, and so does the time a render takes. Each block is an Elements block, with the editor's markup around it (a few hundred bytes of HTML), so the HTML depends on how short the Markdown's blocks are: a kilobyte of it is about 10 KB of HTML in prose with links and bold text (a list is one block), 120 KB in quotes nested as deep as they go (32) around a few characters each, as each quote is a block in the one around it, and 100 to 280 KB where every few characters are a block of their own (a heading, a rule, a table row, a fence, a quote that ends at once, or, past the work its quotes can take, each quote and line without a `>`: a quote holding only a fence's opening line, every other line, is the most, 276 KB). A render takes about 0.2 MB of memory per kilobyte in prose and up to 1.8 MB in those short blocks, on top of what the process holds already (the process's peak, measured on Node 24, sync and async alike: 100 KB of Markdown is 0.5 to 28 MB of HTML, in 0.05 to 0.38 s, peaking at 90 to 350 MB, and renders in a 128 MB heap, the densest shape in 192 MB; 1 MB is 5 to 276 MB of HTML, in 0.3 to 3.4 s, peaking at 270 MB to 1.9 GB). Cap what users can give: 100 KB is far more than an email holds (Gmail clips a message past 102 KB of HTML), and keeps a render's process under about 350 MB, whatever its shape.

## Plain text

`renderToPlainText()` reads the blocks as it reads any template: headings in capitals (`h1`, `h2`), links as `text (url)` (a heading's too: `# [Pay invoice](https://example.com/pay)` is `PAY INVOICE (https://example.com/pay)`, its URL as written), list items with a dash, code with its indentation.

## Agent rules

- Put `<Markdown>` in a `Column`, never straight in a `Row` or the root.
- Style blocks with `blocks` and markup with `styles`. Don't post-process the HTML.
- For Markdown from users, pass `html="escape"` (or `"drop"`) and keep the default URL checks, and cap its size (100 KB, say: see [Markdown from data](#markdown-from-data-what-it-cant-make-a-render-do)). Render it with `onError: "omit"` (or a function) where a table too large for it should leave the rest of the email rendering.
