# Upgrade Elements

- [Upgrade from 0.2.x to 0.3](#upgrade-from-02x-to-03)
- [Upgrade from 0.1.x to 0.2](#upgrade-from-01x-to-02)

## Upgrade from 0.2.x to 0.3

Elements 0.3 renders each block as the Unlayer editor exports it: the HTML `renderToHtml()` gives is the HTML the editor exports for the design `renderToJson()` gives. In 0.2, the two could differ by a few pixels, and some settings reached only one of them. Most templates look the same. The changes below are the ones to check.

It also renders your templates with a renderer of its own instead of react-dom: hooks, context, `useId` and Suspense work as in React's server renderer, each component runs once per render (again only where React runs one again: when it sets its state while rendering, or once a promise it waited for settles), and nothing in a render calls react-dom, which stays a peer dependency because the editor's exporters import it. So emails, pages and documents render in Next.js's server layers (Server Components, route handlers) and on edge runtimes, the App Router's included, where 0.2 failed: react-dom can't render with the React there. With webpack, a Pages Router edge API route also needs `unstable_allowDynamic: ["**/node_modules/@unlayer/exporters/**"]` in its `config`: the exporters have lodash's `Function("return this")()`, which webpack rejects on the edge though it never runs there.

```bash
npm install @unlayer/react-elements@0.3.0
```

React 18 and 19 are supported (the tests run on React 18.0, 18.2, 18.3, 19.1, 19.2 and 19.3, in React's development and production builds). As Elements renders with React's hooks itself, it checks the installed React before its first render: a newer React it isn't tested with renders if the check passes (with one warning in development), and if it fails, every render throws `[Unlayer] unsupported React x.y.z: <what failed>`. Set `UNLAYER_SKIP_REACT_CHECK=1` in the environment to render anyway.

### Upgrade checklist

1. **A part that fails fails the render.** 0.2 left out a component that threw, with a console message, and sent the rest of the email. In 0.3, by default, every renderer throws (the async ones reject), `renderToJson()` and `renderToPlainText()` too, for a component that throws or a Row whose Columns don't fit its `layout`; a block whose exporter fails fails the HTML and the plain text (`renderToJson()` runs no exporter). The error is a `RenderError` naming the component and where it is (`[Unlayer] no data (in <Hero> at Row 3 › Column 1 › Hero)`, also in `error.component` and `error.position`), with what it threw as `error.cause`. Error boundaries (`componentDidCatch`) don't catch while Elements renders, as in React's server renderer. To leave failed parts out as 0.2 did, set `onError: "omit"` (in the render's options, a root's `config` or an `<UnlayerProvider>`'s), or a function that gets each one instead of the console, and check what `renderToHtmlParts()` lists in `omitted` before you send. See [Errors](../README.md#errors).
2. **A Paragraph renders as the editor's text block.** 0.2 wrapped a Paragraph's text in a `<p>`, with `line-height: 1.4`. 0.3 writes the text with no `<p>` around it, with `line-height: 140%`, as the editor exports the design (whose line height was already `140%`). A line height you set is written as given. A percent line height is inherited as a fixed height, so a line that holds text of another size (a large price in a span, inline code, a superscript) can sit 1 to 20px from where 0.2 put it: where the editor puts it. Update snapshot tests, and CSS that selects the `<p>` in a text block.
3. **Images and video thumbnails are sized in the block's slot.** An image without a `containerPadding` of its own is sized to its column less the block's default 10px padding on each side, as the editor sizes it, on phones and in Outlook's `width` attribute. That's up to 20px narrower than in 0.2: a full-width image in a 500px email is 480px wide, where 0.2 made it 500px. A px width is now exactly that wide (in a 500px email, 0.2 drew `width="300px"` 313px wide). To fill the column as before, give the image `containerPadding="0px"`.
4. **The document's head has the editor's base stylesheet.** `renderToHtml()`'s `<style>` starts with the stylesheet the editor's export has for the mode. In email: the body's margins, table cells aligned to the top, `p { margin: 0 }`, `* { line-height: inherit }`, `sub`/`sup` line height and Apple's data-detector links. On a page or in a document: `box-sizing`, a 14px root font size (`rem`), the body's and a `<p>`'s margins, and `sub`/`sup` line height. So a `<p>` in a Paragraph's `html` or an Html block has no margins, as in the editor: write the margins inline where you want them. `renderToHtmlParts()` leaves the stylesheet out, since your page has its own.
5. **`<UnlayerProvider config>` applies.** In 0.2 it had no effect. Now a root's config is merged key by key, the most specific first: the render function's options, the root's `config` prop (its `textDirection` prop just under it), the nearest `<UnlayerProvider>`'s config, then the defaults. `renderToJson()` keeps its `textDirection` in the design. If a Provider around your templates did nothing before, check what its config sets now. See [UnlayerProvider](../README.md#unlayerprovider).
6. **Text starts on the right in a right-to-left template.** In a template with `textDirection="rtl"`, Paragraph and Heading default to `textAlign="right"`; 0.2 left them at the left edge unless you set it. A `textAlign="right"` you added for that can go. Set `textAlign="left"` where you want 0.2's alignment.
7. **A Row's `style` and `className` go on its content box.** Like every component's, they go on the element it renders: the Row's `.u-row` box, the content width its Columns sit in. 0.2 put them on a wrapper around the whole row, full width. For a full-width color, use the Row's `backgroundColor`.
8. **A Row's background image is full width.** `<Row backgroundImage={{ url }}>` rendered the image inside the content width, while the design (and so the editor) had it full width. The HTML now takes the editor's defaults: full width, centered, not repeated. Add `fullWidth: false` to keep it inside the content width.
9. **A root's `fonts` reach the design.** `<Email fonts={[{ url }]} fontFamily={…}>` loaded the font in the HTML only, so the editor showed the fallback. `renderToJson()` now writes each stylesheet's URL on the design's fonts of the families it names (`family=Inter` in a Google Fonts URL), and the editor loads them. A URL that names no family the design uses stays in the HTML only, with a warning once per render. See [web fonts](./fonts.md).
10. **The design records `displayMode`.** `renderToJson()` writes the body's `displayMode`: `email` for an `Email`, `web` for a `Page`, `document` for a `Document`. Design snapshots and comparisons that list every key change.
11. **Links and rules written in a Column render.** 0.2 left markup written straight in a Column out, without a word. In 0.3, a bare `<a>` (or `<Link>`) is a Paragraph and a bare `<hr>` a Divider; a link holding more than text (an image) or an `<hr>` with a style is an Html block, as written. Other markup is still left out, now with a warning: put it in an `<Html>` block.
12. **Inline JSX in Paragraph, Heading and Button children is kept.** 0.2 kept only the text of inline elements, and components there rendered nothing: `<Paragraph>Hello <strong>world</strong></Paragraph>` lost its bold. 0.3 keeps formatting tags, `<Link>`, and components that return them, such as react-intl's `<FormattedMessage>` and react-i18next's `<Trans>`, rendered with the template's context. Text in the children is still escaped.
13. **Async and suspending components fail a synchronous render.** 0.2 left out a component that was `async` or suspended (threw a promise, or `use()`d one), with a console message. 0.3's synchronous renderers throw a `RenderError` for it, naming it: `it is async or suspends, and this renderer is synchronous: …` (with `onError: "omit"` it's left out). For the template itself, or a component around its root, it's a `RenderError` naming that component, with a new message: `async and suspending templates need "@unlayer/react-elements/async"'s renderers, or their data loaded first and passed as props (in <Receipt>)`. A test that matches 0.2's (`aren't supported`) needs the new one. Render such templates with the renderers from `@unlayer/react-elements/async`, which wait for them, or load their data first and pass it as props. A `<Suspense>` around the template is passed through, as a Fragment is: its root's settings are read, its fallback (which isn't a document) never renders, and what suspends inside it fails a synchronous render as it does without the `<Suspense>`, while the async renderers wait for it. See [async templates](./async.md).
14. **The plain text differs from 0.2's in a few places.** Without options, `renderToPlainText()` writes the text as 0.2 did, except: preformatted text (`<pre>`, a CodeBlock) keeps its indentation and blank lines, on lines of its own; an element with `data-skip-in-text="true"` is left out whole (0.2 stopped at its first closing tag); each link is written with its own URL, whole, a heading's too (`PAY INVOICE (https://example.com/pay)`, where 0.2 wrote `PAY INVOICE`), and a URL is never put in capitals; a link in a Paragraph's or a Heading's children is `text (url)`, where 0.2 kept only its text; and a template that renders otherwise now (in an `<UnlayerProvider config={{ mode: "email" }}>`, item 5) has the text of what it renders. Update plain-text snapshots. The [changelog](../CHANGELOG.md) lists each one under "Plain-text options", the new `wordwrap`, `links`, `uppercaseHeadings` and `skip` options included.
15. **`useId()` gives React's ids.** 0.2's had Elements' name in them (`:unlayer-collect-R…:`). 0.3's are the ids React gives at each place in the tree, in the installed React's format (`:R1:` on React 18 and 19.0, `«R1»` on 19.1, `_R_1_` on 19.2 and later), the same every render and unique in the document, a template component's around the root included. Update snapshots and selectors that hold them; `idPrefix` prefixes them.
16. **`@unlayer/migrate` 0.2 needs Elements 0.3.** `@unlayer/migrate` renders with the Elements installed in your project, and stops before writing anything (exit code `1`) when it's outside its range: 0.1.x takes `^0.2.0`, and 0.2 (with the [MJML](./migrate-from-mjml.md) and [Beefree](./migrate-from-beefree.md) importers) `^0.3.0`. On Elements 0.2, it says `@unlayer/migrate needs @unlayer/react-elements ^0.3.0, but this project has 0.2.0`, with the install command. Upgrade Elements first, then migrate.
17. **An app's `renderToString` providers reach a template only till Elements learns the context's default.** 0.2 rendered with react-dom's `renderToStaticMarkup`, so a template rendered inside an app's `renderToString` (a component of the app's calling `renderToHtml()`) read the app's provider value for a context the template doesn't provide. 0.3 reads it there only before it has learned that context's default, on its first ordinary render (one outside React's renders); after that, its default, as alone and inside a streaming, client or Server Component render. Put the provider inside the element you render, or pass the value as a prop.

### Also changed

- **A `javascript:` URL runs nothing.** In every link and image Elements and the editor's exporters write (a Button's `href`, an Image's `action`, a Menu item's, a Social icon's, a `<Link>`'s, markup a component of yours renders), in every mode, with React 18 and 19, it's written as react-dom 19 writes it, a URL that throws when clicked, and so in the design, however it's written (spaces or control characters before it, tabs or line breaks in it, and in a block's link character references, `&#106;avascript:` or `javascript&colon;`, which a browser decodes there). 0.2 wrote a Button's, an Image's and an email's Menu and Social links as given, and the rest as given on React 18. Paragraph's `html`, Heading's and Button's `text`, `<Html>` and a Table's cells (`headers`, `data`) are still written as given: they're HTML (escape data you put in a table's cells). So are style props (`color`, `backgroundColor`, `padding`, a Menu's `separator`), as in 0.2: validate data you give one.
- **A link given as `null` is no link, and a `null` Menu item or Social icon is skipped.** `<Button href={null}>`, `<Image action={null}>`, and a `null` in a Menu's `items` or a Social's `icons` failed to render in 0.2; they render as with none now.
- **Zero lengths in the design are `0px`.** `containerPadding="0 0 12px"` is `"0px 0px 12px"` in the design, which Unlayer's design validation accepts. Lengths in other units, and the HTML, are as before.
- **A Paragraph's `text` and string children show as typed in the editor too.** The design stores them escaped, as the HTML has them. The `html` prop and inline JSX are HTML, as before.
- **A Row whose Columns don't fit its `layout` fails the render**, the HTML, the plain text and the design alike: `A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)`. 0.2 rendered no rows at all (and its design kept the Row); with `onError: "omit"`, 0.3 leaves out only that Row and renders the others.
- **The body's `linkStyle` colors its links.** Its CSS was written for an id the HTML didn't have.
- **A background image's URL with a quote, a bracket or a space is whole in the HTML.** Those characters are percent-encoded there; the design keeps the URL as given.
- **A Row's padding next to a content background is said.** A warning, once per render: the padding sits outside `columnsBackgroundColor`, as in the editor, so use the Columns' padding to inset the content.
- **A class component around the root is unwrapped.** 0.2 skipped one (react-intl's `<IntlProvider>`, for example) with a warning, so the root's `lang`, `dir`, fonts and phone styles inside it were ignored. 0.3 renders it as it calls a function wrapper, and reads them.

### New in 0.3

Each has its own entry, so the main entry doesn't grow:

- `@unlayer/react-elements/tailwind`: Tailwind classes on Elements components, with `<Tailwind>`. Its logical classes (`ps-*`, `me-*`, `border-s-*`, `rounded-s-*`, `text-start`, `text-end`) follow the text direction: in a right-to-left template, start is the right side, in the HTML and the design. See [Tailwind CSS in Elements](./tailwind.md) and its [right to left](./tailwind.md#right-to-left).
- `@unlayer/react-elements/markdown`: Markdown rendered as editable blocks. Raw HTML in it keeps only an allowlist of tags and attributes that display (no scripts, event handlers, URLs that run code or CSS that loads anything); `html="escape"` shows it as text and `html="drop"` leaves it out, for Markdown your users write. See [Markdown in Elements](./markdown.md) and its [raw HTML](./markdown.md#links-images-and-raw-html).
- `@unlayer/react-elements/code`: `CodeBlock` and `CodeInline`, syntax-highlighted with inline styles. See [Code in emails](./code.md).
- `@unlayer/react-elements/font`: `<Font>`, a web font declared once for the template, in the HTML and the design. See [Web fonts](./fonts.md).
- `@unlayer/react-elements/head`: `<Head>`, tags of your own for the document's head. See [Head](../README.md#head).
- `@unlayer/react-elements/async`: renderers for templates that `await` or suspend, and a `pretty` option for readable HTML. See [Async templates](./async.md).
- `@unlayer/react-elements/codegen`: `designToElements()`, an Unlayer design as Elements code. See [Unlayer designs as Elements code](./codegen.md).

In the main entry: `onError` and `RenderError` ([Errors](../README.md#errors)), `idPrefix` for what your components' `useId()`s start with, as React's `identifierPrefix` (`{ idPrefix: "welcome-" }` gives `«welcome-R1»` on React 19.1), for an email or page placed in a page of yours whose own ids it can't repeat ([renderToHtml](../README.md#rendertohtml)), `<Link>` for links in text and on their own in a Column ([Link](../README.md#link)), prop names from CSS and React Email (`align` for `textAlign`, `<Heading as="h2">`), and `values` that take only the keys you set. The [changelog](../CHANGELOG.md) lists every change.

## Upgrade from 0.1.x to 0.2

Elements 0.2 renders a template with React itself. In 0.1.x, `renderToHtml`, the head's CSS and `renderToJson` each walked the tree their own way, and they disagreed: rows from Fragments and components came out with a web layout in emails, ids repeated, a Context Provider never reached the design, and a component with hooks could blank its Column. In 0.2, one React render collects the template, and the HTML, the head and the design are all made from it. Hooks, Context, `useId`, Fragments, `memo`, `forwardRef` and conditions behave as React runs them.

Most templates render the same. The changes below are the ones to check. Coming from 0.1.x, check these and the [0.3 changes](#upgrade-from-02x-to-03), and install 0.3.0. To stay on 0.2, install 0.2.1:

```bash
npm install @unlayer/react-elements@0.2.1
```

React 18 and 19 are supported, as before. Use 0.2.1 rather than 0.2.0: 0.2.0 reads a random number on each render, which fails a Next.js 16 build that prerenders a page or route rendering an email.

### Upgrade checklist

1. **Text you pass as children now shows as typed.** Heading and Button children, `previewText`, and text placed straight in a Row or Column escape markup and entities, as React shows text. Move markup to Paragraph's `html` prop, Heading's or Button's `text` prop, or an `<Html>` block. Template syntax with `<` or `>` in it (`{% if a > b %}`) goes in a `text` prop too. In `previewText`, write the padding characters themselves, not `&nbsp;&zwnj;`.
2. **A template component as the root gets its own document shell.** `renderToHtml(<Welcome />)` now reads the settings of the root `Welcome` returns (fonts, `lang`, `dir`, phone styles), which 0.1.x dropped, also through a Provider, `StrictMode` or `Profiler` around it. A class template, or a root inside other markup, renders as before, with a console warning that its root's settings aren't read.
3. **Your components get only the props you give them.** 0.1.x also passed internal ones (`_config`, `bodyValues`, `cells`); don't read them. Markup your components return (a wrapper, a link) now renders where 0.1.x left it out.
4. **Keep side effects out of rendering.** Elements may call a component once more on its own, to take the HTML it puts in a Column or to say why it failed. Don't create a coupon code or write to a database while rendering.
5. **Load data before rendering.** The renderers are synchronous. A component that is `async`, suspends or throws is left out at the nearest Row, Column or root child, with a console message naming it, and the rest of the email renders. With such a component, 0.1.22 rendered no rows.
6. **Check `noStackMobile` rows.** `<Row noStackMobile>` now keeps its columns side by side on phones, which 0.1.x ignored, and the design saves it.
7. **Check email size.** Rows that come from Fragments and components are email tables with their own ids, where 0.1.x gave them a web layout. Emails built that way are larger: one went from 37KB to 81KB, closer to the size where Gmail clips a message (102KB).
8. **Fill in template tags in links before rendering.** `"`, `<` and `>` in link URLs are percent-encoded, so a Liquid filter with quotes in an `href` no longer survives. SendGrid's `<%name%>` tags stay as written.
9. **Check Menu text.** Menu item text in emails escapes markup and double quotes, also inside a template tag. Write a template's strings in single quotes: `{{ name | default: 'Shop' }}`.
10. **Expect a different `useId()` value.** Ids differ from 0.1.x's, but are unique, and the same in the HTML and the design.
11. **Snapshot tests will change.** Colors written as `rgb()` become hex, double-quoted font names use single quotes, every document's head carries the device CSS for `hideOnDesktop` and `hideOnMobile`, and a block's `values._meta.htmlID` is now its wrapper's id (so its hover and link styles apply).

### Fixed in 0.2

- `<Row noStackMobile>` works, and `rgb()` colors render (Tailwind writes them).
- Phone settings match the editor's device CSS, and `renderToJson` keeps phone settings, visibility flags and a Provider's context.
- The roots accept `fonts`, `textDirection` and `lang`.
- Security: text placed straight in a Row or Column, Heading and Button children, Menu and Social text, link URLs, `previewText`, phone settings written into the head's CSS, and `textDirection` could inject markup. They're escaped now. A `textDirection` other than `ltr`, `rtl` or `auto` is left out.
- Plain text breaks the line at a `<br>` in a heading, link or list item, and decodes entities in headings.
- 0.2.1 keeps each render apart from the next without reading a random number or the date, so Next.js 16 with Cache Components (`create-next-app`'s default) can prerender pages, route handlers and Client Components that render emails, as it could with 0.1.22. A render never leaks data into the next, and the same input always gives the same output.

### Other behavior changes

- An undefined component (a broken import) or an object as a child fails the render, as React's own render does.
- Text placed straight in a Row or Column logs a console warning, once per process: it isn't kept in the design.
- Markup written straight in a Row or Column is still left out, but a block, Column or Row inside it (a `<div>` around them) now renders.
- `renderToJson` leaves markup in a Column out, as the HTML does; 0.1.x threw.
- A root's `lang` and `fonts` are root settings, so the design's body values no longer copy them. A font URL given twice is linked once.
- Renders are slower: on the server, about 0.2 ms more per render on average (2.6 times 0.1.22's time); live-preview updates in the browser, 15–30% slower. The bundle grew from about 76KB to 118KB.

### Known limits

- In Next.js's edge runtime, react-dom can't render with React Server Components' React. `renderToHtml` fails there, as in 0.1.x, and `renderToJson` now fails too, with an error saying to use the Node.js runtime.
- Called inside an app's own `react-dom/server` render where no second react-dom module can share the app's React (a bundle with React in it, some test runners), Elements renders with the same module. Call it in the component's body, not in `useMemo` and not before another hook, or render first and pass the result as a prop.
- An ES module or a bundle on Node.js 18, or on 20 below 20.16, can't load that second react-dom module.
- In a live preview rendered with `createRoot`, a Context Provider around `<Email>` doesn't reach the components inside it.

The [v0.2.0 release notes](https://github.com/unlayer/elements/releases/tag/v0.2.0) list every change, and the [changelog](../CHANGELOG.md) each release.

### Upgrading from 0.1.16 or earlier

`renderToHtml()` returns a complete HTML document, from `<!DOCTYPE>` to `</html>`, since 0.1.17. Where you wrapped its output in your own document, use `renderToHtmlParts()`, which returns the `head` and `body` to embed.
