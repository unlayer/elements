# @unlayer/react-elements

Upgrading? See [upgrading](./docs/upgrading.md): what changed in 0.3 and in 0.2, and what to check.

## 0.3.0 (2026-10-22)

### New

- **Elements renders templates itself, without react-dom.** A renderer of its own (the walker) renders your components as React's server renderer does, hooks, context, `useId`, Suspense and all, with its own hooks dispatcher, and Elements' markup, and writes the HTML of the four blocks whose web and document exporters render with react-dom (Divider, Html, Menu, Social) as strings; react-dom stays a peer dependency only because the editor's exporters import it. It renders the same HTML, plain text and designs (196 templates and 3,000 random ones compared on React 18.3, 19.1 and 19.3), and writes markup as react-dom writes it for the installed React (a `<select>`'s value marking its options, React 19 writing a `<style>`'s CSS as given), but for what React 19 moves to the start of the markup (a `<title>`, `<meta>`, `<link>`, `<style precedence>` or async `<script>` stays where it is, and images get no preload links: put head tags in `<Head>`), inside any React render (an app's react-dom render, a Server Component, a component of the template), with React's react-server build, and on edge runtimes (emails, pages and documents). A context your template doesn't provide reads its default, as with 0.2, never what an app's render around it, or another request's render before it, provided (react-dom's streaming render leaves its values in React's contexts once it's done): give the template such a value as a prop, or put its provider in what you render. With the async renderers, async components render anywhere (also inside a component of yours on React 18), sibling components load their data at once, and the output is the same whatever order the data arrives in. A React version Elements isn't tested with renders if a check of what Elements relies on passes (`UNLAYER_SKIP_REACT_CHECK=1` skips it). It's faster too: `renderToHtml()` takes about half the time 0.3 took (as fast as 0.1.22, which rendered none of your components), `renderToPlainText()` about three quarters, and `renderToJson()` about a third (it renders no HTML). How it works: [ARCHITECTURE.md](./ARCHITECTURE.md).

- **`idPrefix`.** What your components' `useId()`s start with, as React's `identifierPrefix` (`{ idPrefix: "welcome-" }` gives `«welcome-R1»` on React 19.1), in every renderer's options, a root's `config` and an `<UnlayerProvider>`'s: for an email or page placed in a page of yours, whose own ids it can't repeat then.

- **`onError`, and `RenderError`.** A part of a template that fails is a `RenderError` that says which component and where (`(in <Hero> at Row 3 › Column 1 › Hero)`), with the original error as its `cause`. `onError: "omit"`, in the render's options, a root's `config` or an `<UnlayerProvider>`, leaves such parts out of the HTML, the plain text and the design alike (a component, a block, a Row or a Column whose exporter fails; what a custom tool's `head` gives, where it fails, the block still rendering), each said with `console.error`; a function gets them instead. `renderToHtmlParts()` lists them in `omitted`, and `renderToJson()` takes an `onError` option. See [Errors](./README.md#errors).

- **Tailwind CSS: `@unlayer/react-elements/tailwind`.** `<Tailwind>` turns Tailwind classes on Elements components into their props when the template renders, so the email gets inline styles and the design stays editable in the visual editor. Phone variants (`max-sm:`) become phone settings, `hover:` a Button's hover colors, and card grids keep their gutters. Classes no prop takes stay in the HTML only, and Elements says so. A declaration whose variables come to more than 4,096 characters is left out, and said, so classes from untrusted HTML (a Markdown's) whose variables use each other over and over can't take more memory than the process has. It needs Tailwind CSS 4, an optional peer dependency (`tailwindcss`) whose range takes any version, so installing Elements never fails over a project's Tailwind CSS 3; compiling with that one says to upgrade it. See [Tailwind CSS](./docs/tailwind.md).
  - **Tailwind padding classes on a Row inset its content.** `<Row className="bg-white p-8">` puts the padding inside the white box, as in CSS: the classes go to the Row's Columns, added to their own padding (on desktop the top and bottom to each, the left to the first and the right to the last, the other way around in a right-to-left template, where the first Column is on the right; on phones, where the Columns stack unless `noStackMobile`, the sides to each, the top to the first and the bottom to the last). A Column's margin classes (`mr-2`, `mx-4`, `m-2`) are the space between Columns, added the same way. The `padding` prop is unchanged.
  - **Tailwind card grids keep their gutters.** In `<Row className="bg-white px-10 py-4">` with `<Column className="bg-zinc-50 rounded-lg p-4 mr-2">` cards, the cards now sit inside the white panel, 40px from its sides and 16px apart, as in the browser. Before, the panel's padding stayed around the row (page-colored bands above and below the cards) and the margins were ignored. A card's gutter is a border in the color around it (the Row's content background, else its background, else the body's), as hand-written Elements templates do it, so the design opens in the editor with the same look. On phones, where the cards stack, each keeps the Row's side padding and the space between two cards is the space between them on desktop (an email's phone settings; a web page's keep the desktop gutters, said once, as the editor's web export has no phone border for a column). Rounded corners grow by the gutters, so they look the same; where the two gutters meeting at a corner differ (40px at the side, 16px on top), the editor can't draw that corner round, so the row's cards get square corners, with a warning that says how to keep them round. A card with a border of its own on a side a gutter needs, or a color around it that isn't one solid color (a background image, a translucent color), keeps the old behavior, with a warning that says why.
  - **Tailwind text classes on a Row, a Column or the root style the text inside.** `<Column className="bg-indigo-600 text-white text-center">` left its Paragraphs black and left-aligned: the classes were an inline style on the Column, which each text block's own color and alignment overrode, and the design didn't have them. As CSS inherits them, a container's text color, alignment, font family, size, weight, line height and letter spacing (and the phone and breakpoint variants of size, line height and alignment) are now the props of the text blocks inside that don't set their own, the nearest container's winning, so the design holds them: Paragraph and Heading take them all, a Menu its items', a Table its header's, content's and footer's, a Button its label's font and its place in the column (not its color, as its label sits on its own background), Social its place. The root's color is the body's `textColor` and its text blocks' too, so `<Email className="text-gray-800">` colors the text. Markup in a Column (an Html block) gets them as an inline style on the Column, for the HTML only, which Elements says.
  - **A prop given by another of its names wins over a Tailwind class.** `<Paragraph className="text-white" textColor="#333">` took the class's color: a prop's other names (`textColor` and `align` on Paragraph, Heading and Button, a Menu's `color`, a Social's `textAlign`) now count as the prop, as `color` and `textAlign` did.
  - **A Tailwind border without a color shows.** `border` or `border-t-2` without a color class gave a Column an invisible (transparent) border and a Divider the editor's gray line. It's now drawn in the text color, as Tailwind's `currentColor` is: a Button's in its label's color, a Column's or a Divider's in its own text color class's, else in the text color around it (the body's default black where nothing sets one), in the HTML and the design.
  - **Tailwind's logical classes follow the text direction.** In `<Email textDirection="rtl">`, `ps-4`, `pe-*`, `ms-*`/`me-*`, `border-s-*`/`border-e-*`, `rounded-s-*`/`rounded-e-*` and the `rounded-ss-*` corners, and `text-start`/`text-end` are the right side (or the left for the end), as CSS's logical properties are, in the HTML and the design; they were always the left. In an Html block's markup, an element's own `dir` (or the nearest one around it) decides, so `dir="rtl"` markup in a left-to-right email changes too. See [Right to left](./docs/tailwind.md#right-to-left).
  - **An Image's `max-w-*` holds with a width.** `<Image className="w-full max-w-xs">` rendered as wide as its column: the editor's image has one width, and the max width was dropped without a word. It's now the smaller of the two, as the browser shows it (320px here, in the HTML and the design), and a `min-w-*` wins over both, as in CSS; a percentage with pixels (`w-1/2 max-w-xs`), which depends on the column, keeps the width and says so. The root's `w-*`, `max-w-*` and `min-w-*` are its content width the same way: `<Email className="w-[600px] max-w-[800px]">` is 600px wide, where the max width won (800px).
  - **Classes in an Html block's or a Paragraph's markup are inline styles.** `<p class="text-gray-500 py-2">` in `html` gets their styles inline, with the same conversions, and the classes leave the attribute (your own stay). A phone, breakpoint or hover variant can't be inline: it's left out and said. A class that hides or shows the element where such a variant changes it (`hidden md:block`) isn't inlined either, so the element shows on every screen; any other class is inlined as it is on every screen (`px-4 md:pl-2` is `px-4`'s padding). See [Classes in HTML markup](./docs/tailwind.md#classes-in-html-markup).
  - **`w-auto` on an Image is its auto width.** It was an inline `width: auto` that undid the image's `width: 100%`, so a large image overflowed its column, and a phone's screen. It's now the editor's auto width, as wide as its column allows.

- **Markdown: `@unlayer/react-elements/markdown`.** `<Markdown>` renders Markdown as Elements blocks (headings as `Heading`, images as `Image`, tables as `Table`), so the design is editable. Raw HTML in it keeps only the tags and attributes that display (an allowlist: text, links, images, lists, tables and sections, without event handlers, URLs that run code or CSS that loads anything, in a style or in a class's arbitrary value (`bg-[url(…)]`), so the design holds none and a `<Tailwind>` inlines none), read as a browser reads it and written again, so what's left out can't join what's around it into a tag; `html="escape"` shows it as text and `html="drop"` leaves it out. See [Markdown](./docs/markdown.md).

- **Code: `@unlayer/react-elements/code`.** `CodeBlock` for syntax-highlighted code that email clients show as it looks in the browser (highlight.js themes, as inline styles), and `CodeInline` for code in a sentence. See [Code](./docs/code.md).

- **Web fonts: `@unlayer/react-elements/font`.** `<Font>` declares a web font once for the template: the head loads it (Outlook, which ignores web fonts, gets the fallback), and with `default` it's the template's font, in the HTML and the design. See [Web fonts](./docs/fonts.md).

- **Head tags: `@unlayer/react-elements/head`.** `<Head>` puts `<meta>`, `<link>`, `<style>` and `<title>` tags of your own in the document's head (HTML only: `renderToJson()` says so). A `<style>`'s CSS and a `<script>`'s text are written as given in React 18 and 19 alike, from a component of yours too, and nothing in them can end them early, whatever writes it (a string, a component of yours, a list, text in parts, markup): their own end tag, and that of a `<noscript>` or `<title>` they're in, is escaped as CSS or JavaScript reads it, and under an `<svg>` or `<math>`, where a browser doesn't read them as CSS or JavaScript, their text is escaped as any text. Components of yours in it render as the template's do: with its context, waited for by the async renderers, and failing as theirs fail (with `onError: "omit"`, left out of the head and listed).

- **Async templates: `@unlayer/react-elements/async`.** The same renderers for templates that `await` or suspend, and a `pretty` option for readable HTML, with prettier 3 (an optional peer dependency whose range, too, takes any version: with prettier 2, `pretty` says to upgrade it). See [Async templates](./docs/async.md).

- **`<Link>`.** A link in text (`<Paragraph>Read <Link href="…">the docs</Link>.</Paragraph>`), or on its own in a Column, where it's a Paragraph holding it. Its `style` and `className` stay on the link, in the HTML and the design.

- **`style`, `className` and `skipInText` on every component.** `style` and `className` go on the element a component renders (HTML only: `renderToJson()` says so), and `skipInText` leaves a block out of the plain text.

- **Plain-text options, and `toPlainText()`.** `renderToPlainText()` takes `wordwrap`, `links` (`"inline"`, `"after"` or `"none"`), `uppercaseHeadings` and `skip`; `toPlainText(html, options)` gives the plain text of any HTML. Without options, the text is written as 0.2 wrote it, but for these (0.2.1's text and this release's compared on every story, each block in each root, and the same HTML):
  - Preformatted text (`<pre>`, a CodeBlock's or in an Html block) keeps its indentation and blank lines, each line's trailing spaces aside, on lines of its own; 0.2 collapsed its spaces and ran it into the text after it. Markup in it gives its text, and a link its URL (an image or a rule in it, nothing).
  - An element with `data-skip-in-text="true"` is left out whole. 0.2 left it out only to its first closing tag, so the text after an element nested in it showed, and one without a closing tag (an `<img>`) took the text after it out instead.
  - Each link is written with its own URL, whole and as written: a heading's too, never in capitals, one with a `'` or two spaces in it, one after a `data-href`, an `<area>` or an attribute with a `>` in it, and one whose `href` has no quotes (see "A link in a heading keeps its URL in the plain text" below).
  - A link in a Paragraph's or a Heading's children is `text (url)`, as their HTML now holds it (see "Inline JSX in Paragraph, Heading and Button children" next); 0.2 kept only its text.
  - A template that now renders otherwise has the text of what it renders: one in an `<UnlayerProvider config={{ mode: "email" }}>` is an email now (see "`<UnlayerProvider config>` configures the templates inside it" below), so its Menu items, their separators and its Social icons are on lines of their own, as in any email's text.

- **Inline JSX in Paragraph, Heading and Button children.** Formatting tags (with their `style` and `class`), `<Link>`, and components that return them (react-intl's `<FormattedMessage>`, react-i18next's `<Trans>`) are kept, rendered with the template's context. 0.2 kept only their text. Text in them is still escaped.

- **A `<Font>`'s URL in the design.** `renderToJson()` writes a `<Font>`'s stylesheet URL on the design's fonts of its family (the body's and each block's `fontFamily`, matched by the stack's first family, as the editor matches fonts), where the editor keeps a web font: the editor loads it and exports its `<link>`. Before, a `<Font>` without `default` loaded the font in the HTML only, and the editor showed its fallback.

- **Designs as Elements code: `@unlayer/react-elements/codegen`.** `designToElements(design, options?)` turns an Unlayer design (the editor's `saveDesign()` JSON) into a `.tsx` module, `{ code, warnings }`, whose component renders back to the same design with `renderToJson()`. Settings become semantic props (only what differs from a component's defaults), rows `<Row layout={ColumnLayouts.X}>` or `cells`, a Paragraph's text `html`, a Heading's or Button's children, web fonts `<Font>`s, an image's fixed width the whole pixel it was written from, a link the URL the editor exports for it (an email link's `mailto:…`, a phone call's `tel:…`); what no prop holds goes in `values`. Blocks without a component become `<Html>` blocks with the design's exported HTML (`html` option), or TODO comments; every warning names its row and column. The code is written as prettier formats it; `formatElements(code, options?)` formats it with your prettier settings. Its own entry, pure (no React rendering, no Node APIs): it runs in a browser too, and the main entry doesn't grow. See [the guide](./docs/codegen.md).

- **Props by the names you reach for.** Where CSS or React Email names a prop differently, that name works too, typed: a Menu's `color` is its items' color (its `textColor` and `linkColor`: a linked item is in `linkColor`) and its `textAlign` its `align`, a Social's `textAlign` its `align`, and on Paragraph, Heading and Button `align` is `textAlign` and `textColor` is `color` (a Button's text color), on Image and Divider `align` is `textAlign`. The component's own prop wins when both are given. A prop a block doesn't take is still said once per render, now with the one it's a slip away from: `Menu ignores the prop \`textColour\`: did you mean \`textColor\`?`. (A lowercase `fontsize` is said too: it used to pass as a font prop.)

- **React Email's `as` on Heading.** `<Heading as="h2">` sets the heading level, typed as `headingType` and `level` take it, so React Email headings work as written. `headingType` wins over `level`, and `level` over `as`; like other props, all three win over a `values.headingType`.

- **`values` takes what you set.** Every component's `values` escape hatch takes as many of its values as you set, at any depth (`<Paragraph values={{ anchor: "intro" }}>`), where most components' types wanted all of them. Its keys are checked (a misspelled one is a type error, on Button, Image, Video and the roots too, whose `values` took anything), and its values take any text, number or true/false, as the builder stores them. The type is exported as `ValuesInput`, and `ColumnProps` is exported. `designToElements()` writes `values={{ … }}` as it is: the `builderValues` helper it declared is gone. A design key the types don't have is written `as unknown as <Component>Props["values"]`, for that object only.

- **`displayMode` in the design.** `renderToJson()` writes the body's `displayMode`: the mode its HTML renders in (`email` for an `Email`, `web` for a `Page`, `document` for a `Document`, a `Body`'s `mode`), which the editor keeps. `designToElements()` takes its root from it (it already read it), and `compareDesigns()` leaves it aside, as the editor's own saves may not have it.

### Fixed

- **Next.js builds with webpack.** `next build` without Turbopack (Next.js 15's default bundler, `next build --webpack` on 16) failed for an edge route that rendered an email: Elements imported `createContext` and `useContext` by name, which React's react-server build doesn't have, and webpack fails a build for that. Elements reads them off React now, and each of its entries builds and renders in route handlers, Server Components, Client Components, edge routes and Pages Router API routes, with either bundler. With webpack, a Pages Router edge API route also needs `unstable_allowDynamic: ["**/node_modules/@unlayer/exporters/**"]` in its `config`: the editor's exporters have lodash's `Function("return this")()`, which webpack rejects on the edge though it never runs there.

- **A Paragraph's HTML is the editor's export of its design.** `renderToJson()` writes a Paragraph as a text block, which the editor exports with `line-height: 140%` and its text in no `<p>`, while `renderToHtml()` rendered it as the newer paragraph block (`line-height: 1.4` and a `<p>` around the text). A percent line height is inherited as a fixed height, so in the editor a line holding text of another size (a large price in a span, inline code, a subscript or superscript) sat 1 to 20px apart from where Elements put it. The HTML is now the text block's, from the same HTML the design holds, in every mode: what the editor exports for the design. Formatted Lexical JSON given in `values.textJson` (bold, links, several paragraphs) is now kept in the design as its HTML, where it was cut to its plain text. Blocks from another copy of Elements (a package still on an earlier release) render as this release's.

- **The document has the editor's base stylesheet.** `renderToHtml()`'s `<style>` now starts with the stylesheet the editor's export has for the mode: in email, the body's margins, table cells aligned to the top, a `<p>`'s margins, `* { line-height: inherit }`, `sub`/`sup` line height and Apple's data-detector links; on a page or in a document, `box-sizing`, a 14px root font size (`rem`), the body's and a `<p>`'s margins and `sub`/`sup` line height. A `<p>` in a Paragraph's `html` or an Html block now has no margins, as in the editor. `renderToHtmlParts()` leaves it out: your page has its own.

- **An image is sized in its slot, less the block's padding.** An image without a `containerPadding` of its own was sized against its column (600px) instead of the slot the block's default 10px padding leaves (580px), up to 20px wider than in the editor, on phones and in Outlook's `width` attribute: a responsive image, a percent width, a pin at 100% and a video's thumbnail. All take the default now, as the design does.

- **A pinned image's percent is the design's.** A px width narrower than its column rendered as a percent rounded up (`11.04%`) while the design stored it rounded to the nearest (`11.03%`): the HTML now has the design's percent, with the px kept as its `max-width` and `width` attribute.

- **A root's `fonts` reach the design.** `<Email fonts={[{ url }]} fontFamily={…}>` loaded the font in the HTML only: the editor showed the fallback. `renderToJson()` now writes each stylesheet's URL on the design's fonts of the families it names (`family=` in a Google Fonts URL, or a `data:text/css` stylesheet's `@font-face`), as a `<Font>`'s, and says once per render a URL the design can't hold (one naming no family a font in it has). `@unlayer/from-react-email` leaves that warning out of a template's check: it lists the fonts for the editor.

- **A Row whose Columns don't fit its `layout` fails the render, the HTML, the plain text and the design alike.** `<Row layout={ColumnLayouts.TwoEqual}>` with one Column made `renderToHtml()` render the document without any rows (the valid ones too) and `renderToPlainText()` return nothing, while `renderToJson()` kept the row with two cells and one column. Now all three throw `A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)`; with `onError: "omit"` only that Row is left out, of all three, and the other rows render. `renderRowToJson()` of such a Row throws.

- **A class component around the root is unwrapped.** `<IntlProvider>` (react-intl's, a class) around `<Email>` wasn't called to find the root: its settings were ignored, with a warning, and the template's `<FormattedMessage>`s and `useIntl()` failed, so the email went out without its translated text. A class is now constructed and rendered as a function wrapper is called, inside the providers around it.

- **A `<Suspense>` around the template is unwrapped**, as a Fragment or StrictMode is: `renderToHtml(<Suspense fallback={…}><Welcome /></Suspense>)` renders the root `<Welcome>` returns, with its `lang`, `dir`, fonts and phone styles, and `renderToJson()` gives its design. Around the root, it's outside the document, and its fallback isn't a document, so it never renders: the async renderers wait for what's in it, the synchronous ones say it's async as they do without it, and a template in it that fails fails the render, naming it. Where unwrapping can't reach the root (inside markup, beside other elements, in what a component renders), the render says once that its settings are ignored: it renders as a document inside the content.

- **A component of yours named like a root renders as written.** A design-system wrapper given a root's name (`const Email = (props) => <UEmail backgroundColor="#f4f4f4" {...props} />; Email.displayName = "Email"`) was taken for the root itself, so the design lacked the props it sets. It's now called as any component is, in the HTML and the design alike: Elements knows its own roots by a marker (an older release's by their name and code).

- **A template whose wrapper sets its state while it renders renders its last render**, as React does, and a wrapper that throws fails the render once, naming it, instead of warning that it couldn't be unwrapped and then failing. `renderToJson()` throws that RenderError too (its `component` and `cause`), where it said it couldn't unwrap the template; it says so now only for an async one.

- **A Row's background image is full width unless it says otherwise.** `<Row backgroundImage={{ url }}>` rendered the image inside the content width, while the design (and so the editor) had it full width, the editor's default. The HTML now takes the editor's defaults for what the image doesn't set (full width, centered, not repeated), as the design does, so code generated from a design renders as the design does. `fullWidth: false` keeps it inside the content width.

- **A background image's URL with a quote, a bracket or a space is whole in the HTML.** The editor's exporters write a Row's and the body's background image in `url('…')`, so `https://example.com/it's (big).png` was cut off at its `'` (and a `"` could end the style attribute), while the design kept it whole. Those characters (and `"`, `<`, `>`, `\`) are now percent-encoded where the HTML writes it (`it%27s%20%28big%29.png`, the same address to a browser), in every mode; the design keeps the URL as given.

- **The body's link style colors its links.** A root's `linkStyle` (`<Email linkStyle={{ linkColor: "#e11d48" }}>`) had no effect in the HTML: its CSS was written for an element id the HTML doesn't have (`#u_content_body_1`). It's now written for the body's (`#u_body_1`), so links take the color and underline, as in the editor.

- **`<UnlayerProvider config>` configures the templates inside it.** It had no effect: a root (`Email`, `Page`, `Document`, `Body`) read only its own `config` prop, and the render functions replaced even that with their options. Now a root's config is merged key by key, the most specific first: the render function's options, the root's `config` prop (its `textDirection` prop just under it), the nearest `<UnlayerProvider>`'s config (one inside another merges over it), then the defaults. It works with the Provider as what you render or around a template component (`renderToHtml(<UnlayerProvider config={{ textDirection: "rtl" }}><Welcome /></UnlayerProvider>)`), through every renderer (the async ones too), and where React renders the tree itself; its `mode` makes a `<Body>` an email or a document, as the render function's would. `renderToJson()` keeps its `textDirection` in the design (and a root's `config.textDirection`, which it used to leave out), so the editor opens the design as it renders. In React Server Components, which have no context, the render functions still read a Provider around the root; a root React renders there gets only its own `config`.

- **A Paragraph's `text` shows as typed in the editor too.** `<Paragraph text="Use <b>bold</b> here" />`, and a Paragraph's string children, show the tags as typed in the HTML, but `renderToJson()` stored the text as it was, so the editor showed it bold (any markup in it, a user's included, was HTML there). The design now stores the text escaped, as the HTML has it, so the editor shows what the email shows. The `html` prop and inline JSX children are HTML as before; so are Heading's and Button's `text` props. Their children, Menu items, Table cells, Social names, Image alt text and `<Link>` text already showed the same in both.

- **Zero lengths in the design are `0px`.** `renderToJson()` wrote a padding, margin, radius or border width as the template gave it, so `containerPadding="0 0 12px"` became `"0 0 12px"` in the design, which Unlayer's design schema (px lengths) rejects: the API's design validation refused such templates. Each bare zero in a length whose every part is px or a zero is now written `0px` (`"0px 0px 12px"`), on blocks, columns, rows, the body and their phone settings. A length in another unit (`"1em 0"`, `"0 auto"`) and the rendered HTML are as before; a custom tool's values are as it writes them.

- **A Row's padding next to a content background is said.** A Row's `padding` is the editor's, around the row, outside the content box its `columnsBackgroundColor` (or a background image that isn't full width) paints, so it doesn't inset the content. Elements now warns once per render when a Row has both: `Row padding sits outside the row's content background, as in the editor; to inset the content use the Columns' padding.`

- **A template with no root renders as a root's content.** Rows, a block or markup rendered with no Email, Page, Document or Body around them (`renderToHtml(<Rows />)`) rendered apart from their head: every Row was `u_row_1` and a web row, in an email too, and the head was made from the template's `children`, not from what it rendered, its components run again for it. Its content now renders as a root's does, without the root's markup: walked once, each component run once, its Rows and blocks rendered with the render's config and in its mode, numbered as the head numbers them; a part that fails is a `RenderError` naming it and where it is, or is left out with `onError`. The async renderers wait for what's async in it, and compile a `<Tailwind config>` around it, as for a root's content. `renderToJson()` still says it needs a root.

- **A link in a heading keeps its URL in the plain text.** `renderToPlainText()` wrote `# [Pay invoice](https://example.com/pay)` as `PAY INVOICE`, as it did a Heading whose text or children hold a link and an `<h1>` to `<h6>` in an Html block: the link was in the HTML and the design, but not in the text email. A heading's links are now written as a paragraph's, in each `links` mode (`PAY INVOICE (https://example.com/pay)`), and a URL is never put in capitals, nor a link's text that is its URL. A URL with a `'` in it (`https://example.com/it's`, as a Button, a Menu item, an Image's link, a Table cell or markup can write it) was cut off at the `'`, and an `href` after a `data-href` gave that one's URL: each link's own URL is now whole.

- **Types for CommonJS projects and `moduleResolution: "node"`.** A TypeScript project that compiles to CommonJS (`module: "node16"` or `"nodenext"`, without `"type": "module"`) got Elements' ES module types for its `require()`s (arethetypeswrong: "Masquerading as ESM"), and the CommonJS ones (`.d.cts`) went unused. Each entry's `import` now resolves to its `.d.ts` types and its `require` to its `.d.cts` ones. With `moduleResolution: "node"` (TypeScript's `node10`), the entries other than the main one (`/tailwind`, `/code`, …) had no types (TS2307): `typesVersions` gives them. The JavaScript each import or `require()` loads is the same.

### Changed

- **Text starts on the right in a right-to-left template.** With `textDirection="rtl"`, a Paragraph and a Heading default to `textAlign="right"`, as in the editor; 0.2 left them on the left unless you set it. Set `textAlign="left"` where you want 0.2's alignment.

- **Links and rules written straight in a Column render.** 0.2 left markup written in a Column out without a word. Now a bare `<a>` is a Paragraph and a bare `<hr>` a Divider; a link holding more than text (an image) or an `<hr>` with a style is an Html block, as written. Other markup is still left out, now with a warning.

- **The error for an async or suspending template names the async renderers.** The synchronous renderers still throw for one, now a `RenderError` naming it (`error.component`), as for an async component inside the template: `[Unlayer] renderToHtml: async and suspending templates need "@unlayer/react-elements/async"'s renderers, or their data loaded first and passed as props (in <Receipt>)`.

- **A part of a template that fails fails the render.** A component that throws (or is async, or suspends, in a synchronous render), markup React rejects (a `style` string), a Row whose Columns don't fit its layout and a block whose exporter fails were left out with a console message (an exporter's as a red box in the email), so an email missing a part could go out; the async renderers already threw for a component that did. Every renderer now throws a `RenderError` naming the part and where it is, `renderToJson()` and `renderToPlainText()` too: the HTML, the text and the design never disagree. (`renderToJson()` doesn't render the HTML, which no design needs, so an exporter that fails fails the HTML and the text but not the design: nothing is sent that it disagrees with.) Set `onError: "omit"` to leave failed parts out as before, now listed. Error boundaries don't catch while Elements renders, as in React's server renderer.

- **A component's `useId()` is React's id, with nothing of Elements' in it.** It gave `:unlayer-collect-R…:` (an async render's with a number of its own in it, which changed from render to render). It's now the id React gives at its place in the tree, in the installed React's format (`:R1:`, `«R1»`, `_R_1_`), the same every render, and unique in the document, the template wrappers' too.

- **Components run once per render.** Elements called a component again to say why it failed, or to read the HTML it rendered in a Column, called template wrappers in throwaway renders of their own, and rendered a template with markup React rejects twice. A component now runs once (again only where React runs one again: when it sets its state while rendering, and after a promise its `use()` waited for, or that it threw, settles).

- **Any component's `dangerouslySetInnerHTML` in a Column is an Html block of what's in it.** A function component (`memo` and `forwardRef` ones too) returning `<div dangerouslySetInnerHTML={…} />` gave an Html block of the HTML in it, without the `<div>`; a class, a lazy component, a context's Consumer or Provider, or a StrictMode kept the `<div>` around it. Now every kind does as a function component does. Any other element a component returns (`<div style={…}>`) is kept whole, with its styles, as before.

- **Elements renders where its React isn't react-dom's.** Where a second install or a bundler gave Elements another copy of React than react-dom's, renders needed workarounds (and failed where they couldn't tell); Elements doesn't render with react-dom now, and records the Rows of another copy of Elements too.

- **React's key warnings, in development.** A list without keys in a template (`items.map(…)`) gets React's warning in development builds, once per component, as React 19 gives it where it renders: Elements renders it now. 0.2 hid it.

- **A Row's `style` and `className` go on its content box.** Like every component's, they go on the element it renders: a Row's `.u-row` box, the content width its Columns sit in (a Column's on its cell). 0.2 put a Row's on a wrapper around the whole row, full width. For a full-width color, use the Row's `backgroundColor`.

## 0.2.1 (2026-10-13)

- Renders without reading a random number or the date, so Next.js 16 with Cache Components can prerender pages, route handlers and Client Components that render emails. 0.2.0 failed those builds. ([#65](https://github.com/unlayer/elements/pull/65))

## 0.2.0 (2026-10-13)

- One React render collects the template, and the HTML, the head and the design JSON are all made from it. Your own components, hooks, Context, `useId`, Fragments, `memo` and `forwardRef` work in `renderToHtml` and `renderToJson`.
- `renderToHtml(<Template />)` renders a template component as its root and reads the root's settings (fonts, `lang`, `dir`, phone styles).
- A component that throws, suspends or is async is left out with a console message naming it, and the rest of the email renders.
- `<Row noStackMobile>` works, `rgb()` colors render, phone settings match the editor's device CSS, and `renderToJson` keeps phone settings and hide-on-device options.
- `Email`, `Page` and `Document` accept `fonts`, `textDirection` and `lang`.
- Security: text placed straight in a Row or Column, Heading and Button children, Menu and Social text, link URLs, `previewText`, phone settings and `textDirection` are escaped.
- Behavior changes: text children show as typed, link URLs percent-encode `"`, `<` and `>`, and rows from Fragments and components are email tables. See [upgrading](./docs/upgrading.md). ([#61](https://github.com/unlayer/elements/pull/61))

## 0.1.22 (2026-09-22)

- `PageBreak` starts a new page in document output.
- `Document` accepts `documentSize` and `documentOrientation`.
- `Table` accepts `repeatHeaderOnEachPage`, `enableFooter` and `repeatFooterOnEachPage`.
- Updates `@unlayer/exporters` and `@unlayer/types` to 1.497.0. ([#57](https://github.com/unlayer/elements/pull/57))

## 0.1.21 (2026-08-13)

- `renderToPlainText` decodes common named HTML entities (`&pound;`, `&euro;`, `&eacute;`, `&deg;`, `&times;`…) instead of printing them. ([#54](https://github.com/unlayer/elements/pull/54))

## 0.1.20 (2026-07-15)

- Updates `@unlayer/exporters` and `@unlayer/types` to 1.455.0, with a check that the package loads in a browser runtime. ([#47](https://github.com/unlayer/elements/pull/47))

## 0.1.19 (2026-07-04)

- `renderToHtmlParts` also returns the `css`, `js` and `tags` its `head` is built from. ([#38](https://github.com/unlayer/elements/pull/38))

## 0.1.18 (2026-07-04)

- `registerTool` (also exported as `registerElementsTool`) renders an editor custom tool's definition from code, and `renderToJson` writes it as the custom tool the editor opens. ([#37](https://github.com/unlayer/elements/pull/37))

## 0.1.17 (2026-07-04)

- **Breaking:** `renderToHtml` returns a complete HTML document, with the editor's shell for each mode, and takes `title` and `fonts` options. Use `renderToHtmlParts` for the `head` and `body` to embed in your own document.
- Paragraph margins are reset inline, as in the editor's exports.
- Web-mode columns stack on phones (480px); document output never stacks.
- `renderToHtmlParts(<Email>)` returns the email CSS (it returned the web CSS). ([#36](https://github.com/unlayer/elements/pull/36))

## 0.1.16 (2026-06-28)

- A Row with several Columns and no `layout` or `cells` gives each Column an equal share (the columns rendered `width="NaN"`).
- Number border widths render in px. ([#35](https://github.com/unlayer/elements/pull/35))

## 0.1.15 (2026-06-28)

- An image's fixed width set in `src={{ width }}` stays fixed in the editor, as the flat `width` prop does.
- Button links given as `{ name, attrs: { href } }` render; Social `iconSize` and `spacing` accept px strings; an image given as a URL keeps its own aspect ratio. ([#34](https://github.com/unlayer/elements/pull/34))

## 0.1.14 (2026-06-28)

- A fixed image width survives opening the design in the editor. ([#33](https://github.com/unlayer/elements/pull/33))

## 0.1.13 (2026-06-28)

- Images are sized against the real content width of their column.
- `containerPadding` is a typed prop on every block.
- `renderToHtml` writes unique element ids. ([#32](https://github.com/unlayer/elements/pull/32))

## 0.1.12 (2026-06-28)

- `renderToJson` accepts a template component as its root, as `renderToHtml` does.
- Menu's text props accept the same inputs as Heading's and Paragraph's. ([#31](https://github.com/unlayer/elements/pull/31))

## 0.1.11 (2026-06-27)

- Prop types accept the natural forms (a shared border object, numeric sizes) and reject wrong values. ([#30](https://github.com/unlayer/elements/pull/30))

## 0.1.10 (2026-06-27)

- Explicit image and button widths survive opening the design in the editor.
- CSS-style values work: a string `fontFamily`, `fontWeight="700"`, numeric sizes, `width="300px"` on an image, `letterSpacing`.
- Heading accepts `level` and `h1`–`h6`; `Table` with `columns` and `rows` renders an empty grid instead of crashing; `previewText` reaches the design JSON. ([#28](https://github.com/unlayer/elements/pull/28))

## 0.1.9 (2026-06-21)

- Each block's `containerPadding` applies (blocks rendered with the column's padding).
- `contentWidth` on the root sets the web column widths (they assumed 500px). ([#26](https://github.com/unlayer/elements/pull/26))

## 0.1.8 (2026-05-24)

- Updates `@unlayer/exporters` and `@unlayer/types` to 1.415.0.

## 0.1.7 (2026-05-08)

- Links render: Button `href`, Image `action`, Menu items and Video `href` rendered an empty `href`. ([#15](https://github.com/unlayer/elements/pull/15))

## 0.1.6 (2026-04-12)

- Updates `@unlayer/exporters` and `@unlayer/types` to 1.400.0. ([#13](https://github.com/unlayer/elements/pull/13))

## 0.1.5 (2026-03-26)

- Updates `@unlayer/exporters` and `@unlayer/types` to 1.394.0. ([#10](https://github.com/unlayer/elements/pull/10))

## 0.1.4 (2026-03-26)

- Published from the same commit as 0.1.3.

## 0.1.3 (2026-03-26)

- README and npm keywords for the open-source release. ([#7](https://github.com/unlayer/elements/pull/7))

## 0.1.2 (2026-03-25)

- No changes to the package: the first release published by CI on merge to `main`. ([#3](https://github.com/unlayer/elements/pull/3))

## 0.1.1 (2026-03-20)

- Published the day 0.1.0 was; no release tag or recorded changes.

## 0.1.0

- Initial release
- React components for building emails, pages, and documents
- Server-side rendering support (Node.js, Next.js Server Components)
- Dependencies: @unlayer/exporters, @unlayer/types
