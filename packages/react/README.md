# @unlayer/react-elements

React component library for transactional emails, email templates, landing pages, invoices, reports, documents, and PDFs. Render email-safe HTML, responsive web HTML, and print-ready HTML for PDF from the same React components. Full SSR support — works with `renderToHtml`, `renderToString`, Next.js, Remix, and any server-side framework.

## Installation

```bash
npm install @unlayer/react-elements
# or
pnpm add @unlayer/react-elements
```

Elements works with React 18 and 19 (its tests run on React 18.0, 18.2, 18.3, 19.1, 19.2 and 19.3, the latest, in React's development and production builds, and its renderer is checked against React's canary every week), in Node.js, edge runtimes, browsers and Next.js's Server Components alike. It renders templates with a renderer of its own, which uses React's hooks as React's server renderer does, so before its first render it checks the installed React: a newer React it isn't tested with renders if that check passes (with one warning in development), and if it fails, every render throws `[Unlayer] unsupported React x.y.z: <what failed>`. To render anyway, set `UNLAYER_SKIP_REACT_CHECK=1` in the environment. `react-dom` stays a peer dependency because the editor's exporters import it, though no render calls it. How it works: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick Start

```tsx
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button } from '@unlayer/react-elements';

function WelcomeEmail() {
  return (
    <Email backgroundColor="#f0f0f0" contentWidth="600px">
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="20px">
        <Column>
          <Heading
            fontSize="24px"
            fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }}
          >
            Hello World
          </Heading>
        </Column>
        <Column>
          <Paragraph html="Welcome to our newsletter!" fontSize="14px" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} padding="10px">
        <Column>
          <Button
            href="https://example.com"
            backgroundColor="#0879A1"
            color="#ffffff"
          >
            Click Me
          </Button>
        </Column>
      </Row>
    </Email>
  );
}
```

**Try it in your browser:** the [Elements Playground](https://examples.unlayer.com/examples/elements-playground/) renders Elements code as an email, page, or document with nothing to install, and can open the result in the Unlayer builder.

## Using with AI agents (Claude, Cursor, etc.)

Assembling these templates in code is something AI coding agents do well. The official **`unlayer-elements`** skill teaches them the strict structure, the canonical prop shapes, the image-sizing model, and the patterns that make generated emails actually look good:

```bash
npx skills add unlayer/unlayer-skills
```

This installs the `unlayer-elements` skill (alongside the other Unlayer skills). Your agent then knows how to build emails, pages, and documents with these components and render them via `renderToHtml` / `renderToJson`. See [unlayer/unlayer-skills](https://github.com/unlayer/unlayer-skills).

Agents can also preview Elements code without installing anything through the [Elements Playground](https://examples.unlayer.com/examples/elements-playground/):

- Open `https://examples.unlayer.com/examples/elements-playground/#code=<base64url of the code>` to render a snippet. Add `&mode=email|page|document` to pick the output and `&view=preview` to hide the editor.
- In browsers with [WebMCP](https://webmachinelearning.github.io/webmcp/), the page registers `render_elements` (code to HTML, design JSON, or plain text) and `show_elements_preview` tools.

## Task guides and runnable examples

- [Transactional email in React](https://github.com/unlayer/elements/blob/main/packages/react/docs/transactional-email.md): render HTML and plain text, then send a receipt.
- [Resend, AWS SES, Postmark, SendGrid, Nodemailer, Mailgun, Brevo, and more](https://github.com/unlayer/elements/blob/main/packages/react/docs/email-providers.md): complete integrations for fourteen email providers.
- [One React template to email, web, and PDF](https://github.com/unlayer/elements/blob/main/packages/react/docs/one-template-email-web-pdf.md): shared invoice content with output-specific roots.
- [Translations with react-intl, react-i18next, and next-intl](https://github.com/unlayer/elements/blob/main/packages/react/docs/i18n.md): load messages before rendering, and right-to-left emails.
- [Monorepos with npm, pnpm, Yarn, and Bun](https://github.com/unlayer/elements/blob/main/packages/react/docs/monorepo.md): a shared emails package that apps import, and one copy of React.
- [React invoice PDF with Playwright](https://github.com/unlayer/elements/blob/main/packages/react/docs/react-to-pdf.md): generate actual PDF bytes from document HTML.
- [React to Unlayer visual editing](https://github.com/unlayer/elements/blob/main/packages/react/docs/visual-editing.md): `renderToJson()`, editor loading, export, and supported tree constraints.
- [Tailwind CSS in Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/tailwind.md): `className` with Tailwind classes on any component, as React Email's `<Tailwind>`, kept as props in the HTML and the design.
- [Markdown in Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/markdown.md): `<Markdown>` as Headings, Paragraphs, Images, Tables and code blocks, editable in the design.
- [Code in emails, pages and documents](https://github.com/unlayer/elements/blob/main/packages/react/docs/code.md): `CodeBlock` and `CodeInline`, syntax-highlighted with inline styles that email clients (Outlook included) show.
- [Web fonts in Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/fonts.md): `<Font>` loads a web font in the head and makes it the template's font, with a fallback for Outlook.
- [Async templates and readable HTML](https://github.com/unlayer/elements/blob/main/packages/react/docs/async.md): `@unlayer/react-elements/async` renders templates with async components and Suspense, and formats HTML with `pretty`.
- [Unlayer designs as Elements code](https://github.com/unlayer/elements/blob/main/packages/react/docs/codegen.md): `designToElements()` from `@unlayer/react-elements/codegen` turns a template made in the Unlayer editor into a `.tsx` component that renders back to the same design.

See [when to choose Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/README.md) and the [runnable example](https://github.com/unlayer/elements/tree/main/examples/content-workflows).

## Critical Rules

These props have non-obvious shapes that **must** be followed exactly:

- **fontFamily**: Accepts a string, a family name or a whole stack (`fontFamily="Georgia"`, `fontFamily="Georgia, serif"`), or `{ label, value }` (recommended for a stack: `label` is the name the visual editor's font menu shows, where a string is both).
  ```tsx
  fontFamily={{ label: "Arial", value: "arial, sans-serif" }}
  ```
- **fontWeight**: Accepts a number (`700`), a numeric string (`"700"`), or a CSS keyword (`"bold"`).
- **fontSize / padding**: Accept a CSS string (`"28px"`, `"20px 40px"`) or a bare number (treated as px: `fontSize={28}` → `28px`).
- **lineHeight**: Accepts a CSS string (`"1.4"`, `"140%"`) or a bare number (kept **unitless**: `lineHeight={1.4}` → `"1.4"`).
- **Wrapper component**: Use `<Email>`, `<Page>`, or `<Document>` as root — they set the rendering mode automatically.
- **href**: Can be a plain string URL (auto-wrapped) or `{ name: "web", values: { href, target } }`.
- **Image sizing**: `src` is a plain URL string or `{ url, width?, height?, ... }`, where `width`/`height` are the image's **natural** size. By default an image is **responsive** — it fills its container, capped at its natural size. A `width` prop is its **display** size: a percent of the column (`width="50%"`), or pixels (`width={120}`, `width="120px"`), which it renders at in every mode (narrower on a narrower screen, and the column's width when wider than it). The design keeps a pixel width as the editor does, a percent of the column.
- **Heading level**: `headingType` (or its aliases `level` and React Email's `as`) accepts `h1`–`h6`.
- **Row padding** is the editor's: around the row, outside its content box. With a `columnsBackgroundColor`, the padding is outside that background and doesn't inset the content (Elements warns): inset the content with the Columns' `padding`. A Row's Tailwind `p-*` classes do inset it, as in CSS, and its Columns' `m-*` classes space them, cards included. See [Row](#row).
- **children**: Text components accept children as shorthand. `<Heading>Hello</Heading>` sets the heading text. Paragraph, Heading and Button children keep inline JSX: `<Paragraph>Hello <strong>world</strong>, read <a href="https://example.com">this</a>.<br />Next line</Paragraph>` (see Paragraph below).
- **Paragraph text**: Use children (text and inline JSX, `<Link>` included), the `text` prop (plain text) or the `html` prop (an HTML string with inline formatting like `<b>`, `<a>`). Text in `text` or in string children shows as typed (`"Use <b>bold</b>"` shows the tags), in the HTML and in the editor: the design stores it escaped.
- **`style` and `className`** (every component): inlined on, and added to, the element the component renders (see [style, className and skipInText](#style-classname-and-skipintext)). They're HTML only: `renderToJson()` leaves them out and says so (a `<Link>`'s in text are in the text, which the design holds). A prop given wins over the same property in `style`.
- **Text shows as typed**: Heading and Button children (their strings; JSX elements in them are formatting) and text placed straight in a Row or Column show markup and entities as written, as React shows text (`{"Terms &amp; Conditions"}` shows `&amp;`; in JSX text, `Terms &amp; Conditions` is already `&`). Put markup in Paragraph's `html` prop or an `<Html>` block, and template syntax with `<` or `>` in it (a Liquid `{% if count > 1 %}`) in the `text` prop. An email service's `<%name%>` tag stays as written, for it to fill in. Menu item text shows markup as typed; in an email, an entity (`&rarr;`) and a single quote stay as written, as in 0.1.22, and a double quote is escaped, also in a template tag (the text is also written in an `aria-label`): write a template's string in single quotes (`{{ name | default: 'you' }}`; in Go templates, backticks).
- **`text` and `html` props are HTML**: Heading's and Button's `text` prop, like Paragraph's `html`, `<Html>` and a Table's cells (`headers` and `data`, HTML as the editor's table holds them), is written into the email as given (as in 0.1.22), as React's `dangerouslySetInnerHTML` is: nothing in it is checked, so a link in it with a `javascript:` URL runs it. Put only markup you wrote there: a value a user typed (a name, a message) goes in as children, which show it as text, and a URL from data as a prop (`href`, `action`, a Menu item's or Social icon's), where a `javascript:` URL is written as one that throws. Escape data you put in a table's cells (`&`, `<`, `>`).
- **Link URLs**: `"`, `<` and `>` are percent-encoded, so a URL can't end its attribute. Fill template tags that contain them (a Liquid filter with quotes) in before rendering; a `<%name%>` tag stays as written.
- **Your own components** render as React renders them: hooks, Context (also from a Provider around the root; a context the template doesn't provide reads its default, standalone and inside an app's streaming, client or Server Component render, which Elements learns on its first ordinary render; inside an app's `renderToString` it reads the app's value only before that, so put the provider inside the element you render or pass the value as a prop: see [ARCHITECTURE.md](./ARCHITECTURE.md), invariant 4), Fragments, `useId`, `memo`, `forwardRef` and class components work, and async components and `use()` with the [async renderers](#async-templates-and-pretty). Each component runs once per render (and again where React runs one again: one that sets its state while rendering, and one whose `use()` waited for a promise, or that threw one). One that throws (or is async, in a synchronous render) fails the render with a `RenderError` naming it and where it is, or is left out with `onError: "omit"`: see [Errors](#errors). Keep side effects, like creating a coupon code, out of rendering.
- **Inside your own render**: `renderToHtml`, `renderToJson` and `renderToPlainText` can run while React renders (a preview page's `useMemo`, a client component, Next.js's server render of one, react-dom/server's `renderToString`), and the component's hooks after the call work: Elements renders templates itself, not with react-dom, and leaves React's hooks as it found them. Edge runtimes render too: Vercel Edge Functions, Cloudflare Workers, Next.js Pages Router API routes with `export const config = { runtime: "edge" }`, and App Router route handlers and Server Components, built with Turbopack or webpack (Next.js 15's default). With webpack, a Pages Router edge API route also needs `unstable_allowDynamic: ["**/node_modules/@unlayer/exporters/**"]` in that `config`: the editor's exporters have lodash's `Function("return this")()`, which webpack rejects on the edge though it never runs there. Where react-dom can't render (React Server Components' React, as in an App Router route on the edge runtime), emails, pages and documents render: nothing in a render calls react-dom (it's still a peer dependency, as the editor's exporters import it). `pretty` doesn't work on edge runtimes (prettier is loaded when it runs): format at build time there. How Elements renders: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Structure: Email/Page/Document > Row > Column > Items

```
<Email>          ← root wrapper for email-safe HTML (tables)
<Page>           ← root wrapper for responsive web (div + flexbox)
<Document>       ← root wrapper for print/PDF

  <Row>          ← layout container, use layout={ColumnLayouts.X} or cells={[1,1]}
    <Column>     ← must match layout column count
      <Button /> ← item components go inside columns
      <Paragraph />
    </Column>
  </Row>
</Email>
```

## Components

### Root Wrappers

| Component | Description |
|-----------|-------------|
| `<Email>` | Root wrapper for email-safe HTML (tables for Outlook, Gmail, Yahoo). |
| `<Page>` | Root wrapper for responsive web display (div + flexbox). |
| `<Document>` | Root wrapper for print-optimized / PDF rendering. |

### Layout

| Component | Description |
|-----------|-------------|
| `<Row>` | Layout container. Accepts `layout={ColumnLayouts.X}` or `cells={[1, 1]}`. |
| `<Column>` | Column inside a Row. Number of Columns must match the layout. |

### Content

| Component | Description |
|-----------|-------------|
| `<Button>` | CTA button with hover states, links, and full styling |
| `<Paragraph>` | Rich text: children (text and inline JSX) or the `html` prop |
| `<Heading>` | Heading (h1–h6) with `headingType` prop |
| `<Image>` | Responsive image with `src` / `altText` props |
| `<Divider>` | Horizontal rule / separator |
| `<Social>` | Social media icons with `icons` shorthand array |
| `<Menu>` | Navigation menu with `items` shorthand array |
| `<Table>` | Data table with `headers` / `data` shorthands |
| `<PageBreak>` | Force subsequent document content onto a new PDF page |
| `<Video>` | Video embed with `videoUrl` shorthand |
| `<Html>` | Custom HTML passthrough |
| `<Link>` | A link in text, or on its own in a Column (a Paragraph holding it) |
| `<Head>` | Tags for the document's head (`meta`, `link`, `style`, `title`), from `@unlayer/react-elements/head` |

## Component Reference

### Email
Root wrapper for email-safe HTML. Same props as Body (without `mode`).
- `backgroundColor?: string` — `"#F7F8F9"`
- `contentWidth?: string` — `"500px"`
- `contentAlign?: string` — `"center"`
- `fontFamily?: { label: string, value: string }` — `{ label: "Arial", value: "arial,helvetica,sans-serif" }`
- `textColor?: string` — `"#000000"`
- `linkStyle?: { linkColor, linkHoverColor, linkUnderline, linkHoverUnderline }` — the links in the content, as the editor's body link style
- `previewText?: string` — plain text shown in email client inboxes, escaped for HTML. Pass `"Fish & chips"`, not `"Fish &amp; chips"`; entities supplied in the string display literally.
- `textDirection?: string` — document direction (`"ltr"` or `"rtl"`), kept in design JSON. When opening the design in the editor, also set its direction with `unlayer.setTextDirection(...)`.
- `fonts?: Array<{ url: string }>` — web-font stylesheets the document's head links (`renderToHtml`). `renderToJson()` writes each URL on the design's fonts of the families it names (`family=` in a Google Fonts URL), as [`<Font>`](https://github.com/unlayer/elements/blob/main/packages/react/docs/fonts.md) does, and says once per render a URL it can't place.
- `lang?: string` — document language, such as `"ar"`; emitted on `<html>` by `renderToHtml`. Language is document metadata and is not stored in design JSON. Renderer options override both props. A right-to-left template also gets `dir="rtl"` and its `lang` on `<body>` and the content's wrapper, for email clients that drop the `<html>` tag; a left-to-right one is unchanged.

### Page
Root wrapper for responsive web display. Same props as Email.

### Document
Root wrapper for print/PDF rendering. It accepts the shared Body props plus:
- `documentSize?: "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid"` — `"A4"`
- `documentOrientation?: "portrait" | "landscape"` — `"portrait"`

### Row
Layout container. Must be child of Email/Page/Document/Body.
- `layout?: ColumnLayout` — use `ColumnLayouts.X`
- `cells?: number[]` — alternative to layout
- `backgroundColor?: string` — the full-width band behind the row
- `columnsBackgroundColor?: string` — the content width behind its columns
- `backgroundImage?: { url, fullWidth?, repeat?, size?, position? }` — full width (`fullWidth: true`), not repeated and centered unless it says otherwise, as in the editor; `fullWidth: false` puts it behind the content width
- `padding?: string | number` — `"0px"`; around the row, as in the editor (see below)
- `noStackMobile?: boolean` — `false`

A Row's `padding` (and its `mobile={{ padding }}`) is the editor's Row padding, in every mode: on the row's outer container, around its content box, so the design opens in the editor as it renders. A `columnsBackgroundColor` (or a background image that isn't full width) paints the content box only, so the padding sits outside that background and doesn't inset the content; Elements warns once per render when a Row has both. To inset the content inside the background, give the Columns padding:

```tsx
<Row columnsBackgroundColor="#fffaf3">
  <Column padding="44px 48px 8px">…</Column>  {/* the cream box, its content inset 48px */}
</Row>
```

A Row's Tailwind padding classes (`<Row className="bg-white p-8">`) inset the content, as in CSS: they go to its Columns' padding, added to theirs, as its Columns' margin classes do. Around cards (Columns with a background or a border) they're borders in the color around them, so a card grid keeps its gutters in the editor too (see the [Tailwind guide](./docs/tailwind.md#card-grids)).

A Row's Columns must fit its `layout` (two for `ColumnLayouts.TwoEqual`). One that doesn't fails the render with a `RenderError` naming its layout and how many Columns it has (`A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)`); with `onError: "omit"` it's left out of the HTML, the plain text and the design alike, and the other rows render (see [Errors](#errors)).

### Column
Must be child of Row. Count must match layout (a Row that doesn't fit its layout fails the render).
- `padding?: string` — `"10px"`
- `backgroundColor?: string`
- `borderRadius?: string`

### Button
- `text?: string` — `"Button"` (or use children: text and inline JSX)
- `href?: string | Href` — plain string auto-wrapped
- `target?: string` — where the link opens: `"_blank"` (a new tab, the default), `"_self"`, … (one with a `"`, `'`, `<`, `>` or a backtick, which could end its HTML attribute, or one that isn't a string, is a new tab, said)
- `backgroundColor?: string` — `"#0879A1"`
- `color?: string` — `"#FFFFFF"`
- `hoverBackgroundColor?: string`
- `hoverColor?: string`
- `fontSize?: string` — `"14px"`
- `fontWeight?: number` — `400`
- `fontFamily?: { label: string, value: string }`
- `padding?: string` — `"10px 20px"`
- `borderRadius?: string` — `"4px"`
- `width?: number | string` — display width; `width="100%"` makes the button full-width, `width="200px"` pins it
- `textAlign?: "left" | "center" | "right"` — `"center"`
- aliases: `align` for `textAlign`, `textColor` for `color`

### Paragraph
- `html?: string` — **rich HTML string** with inline formatting: `<b>`, `<i>`, `<u>`, `<s>`, `<a>`, `<code>`
- `text?: string` — plain text: markup and entities in it show as typed, in the HTML and in the design (`renderToJson()` stores it escaped)
- `children` — text, with inline JSX kept as formatting: `strong`/`b`, `em`/`i`, `u`, `s`, `a` (href, target, rel, title, style, class), `br`, `span` (style, class), `code`, `sup`, `sub`, `small`, `mark`, nested, in Fragments and arrays, and components that return them (`<Link>`, yours, react-intl's `<FormattedMessage>`, react-i18next's `<Trans>`, `CodeInline`), rendered with the template's context
- `fontSize?: string` — `"14px"`
- `color?: string` — `"#000000"`
- `textAlign?: "left" | "center" | "right"` — `"left"` (`"right"` in a right-to-left template, unless set)
- `lineHeight?: string` — `"140%"`
- `fontFamily?: { label: string, value: string }`
- aliases: `align` for `textAlign`, `textColor` for `color`

Text in children is escaped, as React shows it, but for an email service's `<%first_name%>` tag, kept as written in the HTML and the plain text. Other elements (a `div`, a `table`, an image) leave only their text, so no block gets into a paragraph, and nothing that runs code is kept (event handlers, `javascript:` URLs however they're written: `&#106;avascript:`, `javascript&colon;`, in markup a component writes as HTML). A component that is async or suspends fails a synchronous render, naming it (see [Errors](#errors)). The design (`renderToJson()`) keeps the same HTML, and the plain text writes links as `text (url)`.

A Paragraph is a text block in the design, and renders as the editor exports that block: plain text in no `<p>`, and its line height as given (`140%`, which text of another size inside it inherits as a fixed height, as in the editor).

```tsx
<Paragraph fontSize="14px">
  Hello <strong>world</strong>, read <a href="https://example.com">this</a>.<br />
  <FormattedMessage id="welcome.next" />
</Paragraph>
<Paragraph html="Hello <b>bold</b> and <a href='#'>link</a>" fontSize="14px" />
```

### Heading
- `text?: string` — `"Heading"` (or use children: text and inline JSX, as Paragraph's)
- `headingType?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"` — `"h1"` (or its aliases `level` and `as`, React Email's name; `headingType` wins, then `level`)
- `fontSize?: string` — `"22px"`
- `fontWeight?: number` — `400`
- `fontFamily?: { label: string, value: string }`
- `color?: string` — `"#000000"`
- `textAlign?: "left" | "center" | "right"` — `"left"` (`"right"` in a right-to-left template, unless set)
- `lineHeight?: string` — `"110%"`
- aliases: `align` for `textAlign`, `textColor` for `color`
- `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml` — margin shortcuts, as React Email's Heading takes them: its `containerPadding` (the space around it), each side not given its default `10px`; a number is px. `<Heading mt={32} mb={8}>` is `containerPadding="32px 10px 8px 10px"`. An explicit `containerPadding` wins.

### Divider
- `borderTopWidth?: string` — `"1px"`
- `borderTopColor?: string` — `"#BBBBBB"`
- `borderTopStyle?: string` — `"solid"`
- `textAlign?: "left" | "center" | "right"` — `"center"` (or its alias `align`)

### Image
- `src?: string | { url, width?, autoWidth?, maxWidth? }` — string URLs auto-wrapped
- `altText?: string` — alt text for accessibility (or its alias `alt`)
- `textAlign?: "left" | "center" | "right"` — `"center"` (or its alias `align`)
- `action?: { name: "web", values: { href, target } }`

### Video
- `videoUrl?: string` — YouTube/Vimeo URL, auto-parsed
- `video?: { type: "youtube" | "vimeo", videoId, thumbnail }` — manual control

### Html
- `html?: string` — `"<p>Custom HTML content</p>"`

### Link
A link, for text (`<Paragraph>Read <Link href="https://example.com/docs">the docs</Link>.</Paragraph>`) or on its own in a Column, where it's a Paragraph holding it (an editable text block in the design). A bare `<a>` in a Column is too, and a bare `<hr>` is a Divider; a link holding more than text holds (an image) or a rule with a style is an `<Html>` block, as it is. Other markup there is left out with a warning (put it in an `<Html>` block).
- `href: string`
- `target?: string` — `"_blank"` (a new tab)
- `rel?: string` — `"noopener"` for a new tab
- `title?: string`, `style?: CSSProperties`, `className?: string` — on its `<a>`, in the text: in the HTML and in the design, as the editor's text keeps them (a `<Head>`'s `<style>` can style the class)
- `containerPadding`, `hideOnMobile`, `hideOnDesktop` — on its own in a Column

### Head
From `@unlayer/react-elements/head`. Tags of your own for the document's head: `<meta>`, `<link>`, `<style>`, `<title>`. Place it in an Email, Page or Document (or a component of yours there); it renders nothing in the body. The head has them after Elements' meta tags and before its styles (a rule of yours that overrides one of them needs `!important`). A `<style>`'s CSS and a `<script>`'s text (`type="application/ld+json"` data on a page) are written as given, in a component of yours too and in React 18 and 19 alike (only a `</style` or `</script` that would end them, or a tag that would start one, is escaped, as CSS or JavaScript reads it, whatever writes it: a string, a component, a list, markup; so is the end tag of a `<noscript>` or `<title>` they're in; under an `<svg>` or `<math>`, where they aren't CSS or JavaScript to a browser, their text is escaped as any text), and a `<title>`'s text is all its children's (`<title>Hi {name}</title>`), as in React 18. Components of yours in it render as the template's do: with its context, waited for by the async renderers, and failing as theirs fail (a RenderError naming one and where it is, `Head › Meta`; with `onError: "omit"`, left out of the head and listed). The design for the visual editor can't hold them: `renderToJson()` says so, once per render. Use `renderToHtml`'s `title` option or a `<title>` here, not both.

```tsx
import { Head } from "@unlayer/react-elements/head";

<Email>
  <Head>
    <meta name="color-scheme" content="light dark" />
    <style>{`@media (prefers-color-scheme: dark) { .brand { color: #ffffff !important; } }`}</style>
  </Head>
  <Row>…</Row>
</Email>
```

### style, className and skipInText
Every component takes these.
- `style?: CSSProperties` — inlined on the element it renders, after the renderer's own styles: a Paragraph's or Heading's text, a Button's link, an Image's `img`, a Column's cell, a Row's container, the root's body (the wrapper in it, on a web page). A number is px (but `lineHeight`, `fontWeight`, `opacity`, `zIndex`, `flex`, `order`). A prop given wins over the same property in `style`, and a value that could end the attribute or the rule is left out, as it is from `mobile` settings and Tailwind classes. Style props (`color`, `backgroundColor`, `padding`, `fontFamily`, a Menu's `separator`, …) are written as given, as in 0.2.1: validate a value from data before you give it to one.
- `className?: string` — class names on the same element, before the renderer's own, for a stylesheet of yours (a `<Head>`'s `<style>`).
- `skipInText?: boolean` (blocks) — left out of the plain text (`renderToPlainText`), as a footer or a button often is. Any element with `data-skip-in-text="true"` is left out too.

`style` and `className` are HTML only: the design for the visual editor can't hold them, so `renderToJson()` leaves them out and warns once per render:

```
[Unlayer] Paragraph `style.textTransform` is kept in HTML but not in the design for the visual editor.
```

Prefer props for what the editor should edit. A prop a block has no use for (a typo, an event handler) is warned about too:

```
[Unlayer] Button ignores the prop `onClick`.
```

### Table
- `headers?: string[]` — shorthand for column headers (HTML, written as given, as the editor's table holds it)
- `data?: string[][]` — shorthand for row data (HTML, written as given: escape data you put in it)
- `columns?: number` — `2` (set from `headers` when given)
- `rows?: number` — `2` (set from `data` when given)
- `enableHeader?: boolean` — `true`
- `repeatHeaderOnEachPage?: boolean` — `true`
- `enableFooter?: boolean` — `false`
- `repeatFooterOnEachPage?: boolean` — `true`

### PageBreak
Forces the next block onto a new page in document output. It is inert in email and web output.

```tsx
<Document>
  <Row>
    <Column>
      <Paragraph>Page one</Paragraph>
      <PageBreak />
      <Paragraph>Page two</Paragraph>
    </Column>
  </Row>
</Document>
```

### Social
- `icons?: { name: string, url: string }[]` — shorthand
- `iconType?: "circle" | "rounded" | "squared"` — `"circle"`
- `iconSize?: number` — `32`
- `spacing?: number` — `10`
- `align?: "left" | "center" | "right"` — `"center"` (or its alias `textAlign`)

### Menu
- `items?: { text: string, href: string, target?: string }[]` — shorthand (a `target` that could end its HTML attribute, or isn't a string, is a new tab)
- `layout?: "horizontal" | "vertical"` — `"horizontal"`
- `separator?: string` — `"|"`
- `align?: "left" | "center" | "right"` — `"center"` (or its alias `textAlign`)
- `textColor?: string` — the color of an item without a link, and of the separator
- `linkColor?: string` — the color of an item with a link
- `color?: string` — both: the items' color, linked or not (`textColor` and `linkColor` win where given)

An alias is the name CSS or React Email gives a prop (`color`, `align`): where a component has its own name for it, the alias stands for that prop, and the component's own prop wins when both are given. A prop no component takes is said once per render (`Menu ignores the prop \`textColour\`: did you mean \`textColor\`?`), with the prop it's a slip away from.

## Column Layouts

Pre-built layouts for common column configurations:

```tsx
import { Row, Column, ColumnLayouts } from '@unlayer/react-elements';

// Each Row must contain the matching number of <Column> children.
<Row layout={ColumnLayouts.OneColumn}>                {/* [1]       → 100% */}
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoEqual}>                 {/* [1,1]     → 50% + 50% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoWideNarrow}>            {/* [2,1]     → 67% + 33% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoNarrowWide}>            {/* [1,2]     → 33% + 67% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.ThreeEqual}>               {/* [1,1,1]   → 33% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.ThreeNarrowWideNarrow}>    {/* [1,2,1]   → 25% + 50% + 25% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.FourEqual}>                {/* [1,1,1,1] → 25% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.FiveEqual}>                {/* [1,1,1,1,1] → 20% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row cells={[3, 1]}>                                  {/* Custom ratio */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
```

Number of `<Column>` children must match the layout. A Row whose Columns don't fails the render (`A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)`), or is left out with `onError: "omit"` while the other rows render; `renderRowToJson()` of one throws.

## Rendering Modes

Use the semantic wrapper component that matches your target:

```tsx
<Email>...</Email>       // Email-client safe (tables for Outlook, Gmail, Yahoo)
<Page>...</Page>         // Responsive web (div + flexbox)
<Document>...</Document> // Print/PDF optimized
```

Each wrapper threads the correct mode to all children automatically.

## renderToHtml

Render any element tree to a complete, ready-to-use HTML document — from `<!DOCTYPE ...>` to `</html>` — with no React hydration markers. Perfect for email sending and PDF generation:

```tsx
import { renderToHtml, Email, Row, Column, ColumnLayouts, Paragraph, Button } from '@unlayer/react-elements';

const html = renderToHtml(
  <Email backgroundColor="#f4f4f4">
    <Row layout={ColumnLayouts.OneColumn}>
      <Column>
        <Paragraph html="Hello World" fontSize="14px" />
        <Button
          backgroundColor="#3b82f6"
          color="#ffffff"
        >
          Click me
        </Button>
      </Column>
    </Row>
  </Email>,
  { title: "Welcome" }
);
```

The document shell matches the mode: `<Email>` gets the XHTML transitional doctype plus the MSO conditional comments Outlook needs, `<Page>` gets a standard HTML5 shell, and `<Document>` gets a print/PDF-friendly XHTML shell. Its `<style>` starts with the editor's base stylesheet for the mode (the body's and a `<p>`'s margins, `sub`/`sup` line height, and the table and Apple data-detector rules in email; box sizing and a 14px root font size on a page or document), as the editor's export does. Options accept config overrides plus:

- `title` — document `<title>`
- `fonts` — web-font stylesheet URLs to load via `<link>` tags, e.g. `[{ url: "https://fonts.googleapis.com/css2?family=Inter" }]`

And with every renderer (`renderToJson` and the async ones too), and in a root's `config` or an `<UnlayerProvider>`'s:

- `idPrefix` — what your components' `useId()`s start with, as React's `identifierPrefix` (`{ idPrefix: "welcome-" }` gives `«welcome-R1»` on React 19.1), for an email or page you put in a page of yours, whose own `useId()`s it then can't repeat. A template component around the root (`<Welcome />`) takes it from the render's options or an `<UnlayerProvider>` around it, as it's called before the root's `config` is read. Elements' own ids (`u_row_1`) are the editor's export's, without it.

If your app owns the document shell (an existing page template, an ESP template, an iframe `srcdoc`), use `renderToHtmlParts` instead — it returns `{ head, body }` plus the granular pieces (`css`, `js`, `tags`) for pipelines that need them separately, e.g. CSS inlining. This mirrors the editor's [chunk parameters](https://docs.unlayer.com/builder/latest/export-html#chunk-parameters) with two deliberate differences: `tags` is extra (components can contribute head tags, and reassembling from `css` + `js` alone would drop them), and there is no `fonts` chunk (Elements has no font registry — pass font stylesheet URLs via `renderToHtml`'s `fonts` option instead).

Its `head` and `css` don't have the base stylesheet: your page has its own.

```tsx
const { head, body, css, js, tags } = renderToHtmlParts(<Email>...</Email>);
// head = css/js/tags pre-assembled; css = raw stylesheet (no <style> wrapper)
```

## renderToPlainText

The text version of an email: headings in capitals, links as `text (url)`, images as their alt text, the preview text and blocks with `skipInText` left out.

```tsx
import { renderToPlainText, toPlainText } from '@unlayer/react-elements';

const text = renderToPlainText(<Receipt />, { links: "after", wordwrap: 72 });
const fromHtml = toPlainText(html, { skip: [".footer"] }); // any HTML
```

Options (the config's too):
- `wordwrap?: number` — wrap lines at this many characters, between words (default: no wrapping); the URLs listed with `links: "after"` aren't wrapped
- `links?: "inline" | "after" | "none"` — `text (url)` (the default), `text [1]` with the URLs listed at the end, or the text only; in headings and preformatted text too, the URL as written (never in capitals)
- `uppercaseHeadings?: boolean` — h1 and h2 in capitals (default `true`)
- `skip?: string[]` — elements left out with what's in them, by tag (`"img"`) or class (`".footer"`)

Without options, the text is written as 0.2 wrote it, but for preformatted text (`<pre>`, code), now kept as written on lines of its own, an element with `data-skip-in-text` (now left out whole), and links (each with its own URL, a heading's too, never in capitals): see the [changelog](./CHANGELOG.md).

### Async templates and `pretty`

The renderers above are synchronous: an async component, or one that suspends, fails the render, naming it. For templates that load data as they render, use the same renderers from `@unlayer/react-elements/async`. They return Promises, and resolve async templates, async components (anywhere, on React 18 too), Suspense (`use()` on React 19, thrown promises on React 18) and `<Tailwind config>`, with each component run once and sibling components loading at once. A part that fails rejects the render with a `RenderError`, as in the synchronous renderers (see [Errors](#errors)). Their `renderToHtml` and `renderToHtmlParts` also take `pretty: true` to format the HTML for reading (with prettier 3, an optional peer dependency); Outlook's conditional comments are kept as they were. See the [async guide](https://github.com/unlayer/elements/blob/main/packages/react/docs/async.md), including what React 18 supports (and its types: TypeScript needs React's canary types for an async component in JSX).

```tsx
import { renderToHtml } from "@unlayer/react-elements/async";

async function Receipt({ id }: { id: string }) {
  const order = await getOrder(id);
  return <Email><Row><Column><Paragraph>Order {order.number}</Paragraph></Column></Row></Email>;
}

const html = await renderToHtml(<Receipt id="A-1001" />, { title: "Receipt", pretty: true });
```

`pretty(html)` from `@unlayer/react-elements/async` formats any HTML the same way (the synchronous renderers' too). It doesn't work on edge runtimes, which can't load prettier as they run: format at build time there.

## Errors

A part of a template that fails fails the render, the synchronous and the async renderers alike, `renderToJson()` and `renderToPlainText()` too: a component that throws (or is async, or suspends, in a synchronous render), a Row whose Columns don't fit its `layout`, an exporter that fails, or a head function (a custom tool's `head`) that fails (`renderToJson()` doesn't run the exporters or the head functions, which make the HTML, not the design: it gives the design, while `renderToHtml()` throws). The error is a `RenderError` that says which component and where it is, with what it threw as its `cause`:

```
RenderError: [Unlayer] Cannot read properties of undefined (reading 'name') (in <Hero> at Row 3 › Column 1 › Hero)
```

`error.component` is `"Hero"`, `error.position` is `"Row 3 › Column 1 › Hero"`, and `error.cause` the original error, whose stack points at the line that threw. An email that's missing a part doesn't send by mistake.

To leave failed parts out instead (a live preview, a digest whose sections are optional), set `onError`: in the render's options, in a root's `config`, or in an `<UnlayerProvider>`'s:

```tsx
import { renderToHtml, renderToHtmlParts, renderToJson, type RenderError } from "@unlayer/react-elements";

// Left out of the HTML, the plain text and the design alike, each said with console.error
const html = renderToHtml(<Digest />, { onError: "omit" });
const design = renderToJson(<Digest />, { onError: "omit" });

// Listed, to check or report: renderToHtmlParts (and the async one) gives what it left out
const { body, omitted } = renderToHtmlParts(<Digest />, { onError: "omit" });
for (const error of omitted) report(error.position, error.cause);

// Or a function, instead of the console (it can throw the error to fail the render)
renderToHtml(<Digest />, { onError: (error: RenderError) => logger.warn(error.message, { cause: error.cause }) });
```

What's left out is the part that failed: a component of yours (with what it rendered), markup React rejects, a Row whose Columns don't fit its layout, a block, Row or Column whose exporter failed (a Column with its cell, so the Row's other Columns share its width; a Row with its last Column), and what a head function that failed gives the head (its block still renders, as in the design). The HTML, the plain text and the design are then the template's without it. A template that isn't one fails anyway: a component that's `undefined` (a broken or circular import), an object or a date as a child. Error boundaries (`componentDidCatch`) don't catch while Elements renders, as in React's server renderer: `onError` and the error's position are what to use.

## Designs as code

`designToElements()`, from `@unlayer/react-elements/codegen`, turns an Unlayer design (the editor's `saveDesign()` JSON) into Elements code: a `.tsx` module whose component renders back to the same design with `renderToJson()`. It's pure (no React rendering, no Node APIs), so it runs in a CLI and in a browser.

```ts
import { designToElements } from "@unlayer/react-elements/codegen";

const { code, warnings } = designToElements(design, { componentName: "Welcome" });
// code: `import { Email, Row, Column, … } from "@unlayer/react-elements"; export default function Welcome() { … }`
```

Settings become the props you'd write (`backgroundColor`, `fontSize`, `href`, `layout={ColumnLayouts.TwoEqual}`), a Paragraph's text becomes `html` and a Heading's or Button's children, and only what differs from a component's defaults is written. What no prop holds goes in the component's `values`; a row's padding is `<Row padding>`, the editor's. Blocks without an Elements component (custom tools, forms, timers) become `<Html>` blocks when you pass the design's exported HTML (`html` option), and TODO comments otherwise. Each warning names the row and column. See the [guide](https://github.com/unlayer/elements/blob/main/packages/react/docs/codegen.md).

## Custom Tools

**A custom tool is the custom component you create.** We keep the editor's term — Custom Tools — because it's the same API across the Builder and Elements, and that shared vocabulary is where the power is: the same definition you pass to the editor's [`unlayer.registerTool`](https://docs.unlayer.com/builder/tools/custom) renders from code too. Elements uses the `renderer.exporters` and `renderer.head` halves of the definition; the editor-only parts (`label`, `icon`, `options`, `Viewer`, `validator`) are accepted and ignored:

```tsx
import { registerTool, Email, Row, Column, renderToHtml, renderToJson } from '@unlayer/react-elements';
import { countdownTool } from './countdown-tool'; // the same object you register in the editor

const Countdown = registerTool(countdownTool); // same term, same config as the editor

const tree = (
  <Email>
    <Row><Column>
      <Countdown endTime="2026-08-01T00:00:00Z" digitColor="#e11d48" />
    </Column></Row>
  </Email>
);

renderToHtml(tree);  // renders via YOUR exporters — identical output to editor exports
renderToJson(tree);  // emits { type: "custom", slug: "countdown", values } — opens in the Builder as the real tool
```

- Props are the tool's `values` (flat), merged over the definition's defaults; `values={{...}}` works as an escape hatch.
- Modes fall back like the editor: `document` uses the `web` exporter; an email-only tool renders via its `email` exporter everywhere.
- **Sanitization:** when your config provides `toSafeHtml`, the tool's HTML output is passed through it (matching editor exports). The default config has no sanitizer — configure one if tool values can contain untrusted content.

## UnlayerProvider

Set config once for every root inside it (`Email`, `Page`, `Document` or `Body`): the CDN for assets (`cdnBaseUrl`), merge tags (`mergeTagState`), text direction (`textDirection`), a sanitizer (`toSafeHtml`), head options (`headConfig`), what failed parts do (`onError`), the `useId()`s' prefix (`idPrefix`), and the mode of a `<Body>`:

```tsx
import { UnlayerProvider, Email, Row, Column, ColumnLayouts, Social, Menu, renderToHtml, renderToJson } from '@unlayer/react-elements';

const Welcome = () => (
  <Email>
    <Row layout={ColumnLayouts.OneColumn}>
      <Column>
        <Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} />
        <Menu items={[{ text: "Home", href: "/" }, { text: "About", href: "/about" }]} />
      </Column>
    </Row>
  </Email>
);

const email = (
  <UnlayerProvider config={{ cdnBaseUrl: "https://my-cdn.example.com", textDirection: "rtl" }}>
    <Welcome />
  </UnlayerProvider>
);

renderToHtml(email);  // icons from my-cdn.example.com, right to left
renderToJson(email);  // body.values.textDirection: "rtl", so the editor opens it right to left too
```

A root's config is merged key by key, the most specific first:

1. the render function's options (`renderToHtml(email, { cdnBaseUrl })`);
2. the root's own `config` prop (`<Email config={{ … }}>`; its `textDirection` prop comes just under it);
3. the nearest `<UnlayerProvider>`'s `config` (one inside another merges over it, key by key);
4. `DEFAULT_CONFIG`.

A key a level leaves out, or sets to `undefined`, comes from the level under it; an object value (`mergeTagState`, `headConfig`) is taken whole, not merged. `mode` sets a `<Body>`'s mode: `<Email>`, `<Page>` and `<Document>` keep theirs.

The Provider works around the root or around a template component that returns one, through every render function (`renderToHtml`, `renderToHtmlParts`, `renderToPlainText`, `renderToJson`, and those from `@unlayer/react-elements/async`) and where React renders the tree itself (`renderToStaticMarkup`, a client component). The design keeps what it can hold of the config: `textDirection`. Put the Provider around the root: a Provider inside it doesn't configure it. Your components read the Provider's config with `useUnlayerConfig()`.

In React Server Components there's no context: the render functions still read the Provider around the root (they find it on the element), but a root that React itself renders there gets only its own `config` prop. Pass config to the root, or render with a render function.

## Types

All types are exported and sourced from `@unlayer/types`:

```tsx
import type {
  ButtonValues, SocialValues, TableValues,
  Href, Icons, TextAlign, LinkStyle,
  SocialIcon, MenuItem,
  ButtonProps, MenuProps, ImageProps,
  OnError, RenderToJsonOptions,
} from '@unlayer/react-elements';
```

`RenderError` (a class: `error instanceof RenderError`) is exported too.

## Common Font Stacks

`fontFamily` takes a string or `{ label, value }` (see [Critical Rules](#critical-rules)); for a stack, the object gives the visual editor a short name to show. Here are ready-to-use stacks:

```tsx
const sansFont = { label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" };
const serifFont = { label: "Georgia", value: "Georgia, 'Times New Roman', Times, serif" };
const monoFont = { label: "Monospace", value: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace" };
```

## Common Design Patterns

### Header with Logo

```tsx
<Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px">
  <Column>
    <Image src="https://example.com/logo.png" altText="Logo" textAlign="left" />
  </Column>
</Row>
```

### Accent Bar

```tsx
<Row layout={ColumnLayouts.OneColumn} backgroundColor="#4f46e5" padding="0px">
  <Column>
    <Divider borderTopWidth="3px" borderTopColor="#4f46e5" borderTopStyle="solid" />
  </Column>
</Row>
```

### Feature Grid (2×2)

```tsx
<Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 40px">
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Feature 1</Heading>
    <Paragraph html="Description of the feature." fontSize="13px" color="#71717a" />
  </Column>
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Feature 2</Heading>
    <Paragraph html="Description of the feature." fontSize="13px" color="#71717a" />
  </Column>
</Row>
```

### Metric Cards (3-column)

```tsx
<Row layout={ColumnLayouts.ThreeEqual} backgroundColor="#ffffff" padding="0px 40px">
  <Column>
    <Heading headingType="h2" fontSize="28px" fontWeight={700} color="#0f172a" textAlign="center">1.2M</Heading>
    <Paragraph html="API Calls" fontSize="12px" color="#94a3b8" textAlign="center" />
  </Column>
  {/* Repeat for each metric */}
</Row>
```

### Product Card (image + details)

```tsx
<Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="20px 40px">
  <Column>
    <Image src="https://example.com/product.jpg" altText="Product" />
  </Column>
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Product Name</Heading>
    <Paragraph html="Matte White · Medium" fontSize="13px" color="#a1a1aa" />
    <Heading headingType="h3" fontSize="16px" fontWeight={700} color="#1a1a1a">$89.00</Heading>
  </Column>
</Row>
```

### Footer

```tsx
<Row layout={ColumnLayouts.OneColumn} padding="20px 40px 40px 40px">
  <Column>
    <Paragraph html="Company Name · City, State" fontSize="12px" color="#a1a1aa" textAlign="center" />
  </Column>
</Row>
```

## Common Mistakes

1. **Column count mismatch** — `TwoEqual` layout requires exactly 2 `<Column>` children (a Row that doesn't fit its layout fails the render)
2. **Missing Column** — Items must be inside `<Column>`, never directly in `<Row>`
3. **Missing Row** — Columns must be inside `<Row>`, never directly in `<Email>`/`<Page>`/`<Document>`
4. **Block elements in text children** — `<Paragraph>Hi <div>x</div></Paragraph>` keeps only the div's text: text children hold inline formatting (`<b>`, `<a>`, `<br />` …). Put blocks in their own Elements blocks, or HTML in an `<Html>` block.

> Note: the CSS-idiom forms that used to be mistakes now work — a string `fontFamily`, a string/number `fontWeight`, a numeric `fontSize`, `padding="0"`, and `<Paragraph text="..." />` are all accepted and normalized. The object/numeric forms above are still recommended for clarity.

## Phone settings

Rows, columns and content items accept `mobile` settings with the same flat CSS inputs as desktop props. For example:

```tsx
<Column padding="24px 40px" mobile={{ padding: "16px 20px" }}>
  <Heading fontSize={32} mobile={{ fontSize: 24, lineHeight: "120%", textAlign: "center" }}>Welcome</Heading>
  <Image src={{ url: "https://example.com/photo.png", width: 800 }} width="50%" mobile={{ autoWidth: true }} />
  <Paragraph hideOnMobile>Desktop detail</Paragraph>
  <Paragraph hideOnDesktop>Phone detail</Paragraph>
</Column>
```

Supported settings are padding, content `containerPadding`, font size, line height, text alignment and image/button width (`width`, `maxWidth`, `autoWidth`), where the component supports them. Numeric padding and font sizes use pixels; numeric line height is a multiplier. Phone CSS applies at 480px and below, matching the editor. `noStackMobile` still controls column stacking separately.

`hideOnMobile` and `hideOnDesktop` work on rows and content, as in the editor; a column can't be hidden on its own (hide its content or its row). `renderToJson` stores these settings in `_override.mobile` and `_override.desktop`, so designs keep them when opened in the visual editor. Image `autoWidth` follows the editor's natural-size cap. Document output keeps its desktop settings.

## Development

```bash
pnpm build          # Build the package
pnpm test           # Run tests
pnpm storybook      # Launch Storybook
```

How the renderer works, and the invariants its tests hold: [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

MIT
