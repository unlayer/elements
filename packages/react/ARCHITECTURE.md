# How @unlayer/react-elements renders

This is the map of the renderer for people and coding agents changing it: the pipeline, the collecting render
(`src/engine`), which renders templates with react-dom/server through React's public API only (as React Email
does), what it does when part of a template fails, what it can't render, and the invariants the tests hold it to. The
[README](./README.md) is the API.

## The pipeline

```
template (JSX)                       <Welcome name="Ada" />
  │ unwrap                           template wrappers called, once, until the root        utils/unwrap-root.ts,
  ▼                                                                                        engine/capture.ts
root                                 <Email> … </Email>
  │ collect                          the content rendered by react-dom/server; Elements'   src/engine, utils/record.tsx,
  │                                  Rows, Columns and blocks recorded, the rest rendered  src/model/collect.ts
  │                                  by React: a tree of records, markup, text
  ▼
model                                Email > Row > Column > blocks, Elements' only         src/model
  ├──▶ design                        renderToJson()                                        utils/render-to-json.ts
  └──▶ exporters                     each row's and block's HTML (@unlayer/exporters)      components/*, utils/create-component.tsx
         ├──▶ HTML                   the rows in the mode's document, the head's CSS       utils/render-to-html.tsx, utils/extract-head.ts
         └──▶ plain text             the HTML as text                                      (shared) htmlToPlainText
```

- **Unwrap.** `renderToHtml(<Welcome />)` reads the root's settings (fonts, `lang`, `dir`, phone styles, config), so
  the components around the root are called first: function components, `memo`, `forwardRef`, class components, each
  once, with hooks, in a render of react-dom's of its own (`engine/capture.ts`: what it returned is kept, the render's
  output thrown away), inside the context providers around it and where the wrappers before it left the tree (so their
  `useId()`s and the content's are one document's). Providers, `<UnlayerProvider>`s and `<Tailwind>`s around the root
  move inside it, around its content; a Fragment, StrictMode or `<Suspense>` around it is passed through (a
  `<Suspense>` around the root is outside the document, and its fallback, not a root, never renders). An async
  wrapper, or one that throws a promise (React 18's Suspense: react-i18next's `useTranslation`), is awaited by the
  async renderers (`take` in `src/async/collect.ts`, along `unwrapSteps`), and called again once it settles; one that
  `use()`s a pending promise is rendered again by react-dom's streaming render, which waits for it and calls it again
  as React does; the synchronous renderers throw for both. A lazy template (`React.lazy`) is rendered where it is till
  the root it renders gives itself (`engine/root-capture.ts`: React's public API has no other way to what it loads),
  waited for as a wrapper that suspends is. A <Tailwind> or an <UnlayerProvider> inside what it loads, around its root,
  gives itself with the root (`aroundCapture`), so the root is in it as where it isn't lazy; a context's provider there
  isn't the content's (README and docs/async.md say to provide it inside the root, or around the lazy element).
  A template with no root (Rows, a block, markup) gives what it rendered instead
  (`Unwrapped.rendered`: its wrappers made again with what they returned, not called again), which renders as a root's
  content does, without the root's markup (`utils/root-content.ts`; a root its collecting render meets in it, where unwrapping
  stopped before it, renders as a document inside it, said once per render: `nestedRoot`): collected once, its Rows and
  blocks rendered with the render's config and numbered as the head numbers them, its head and plain text from the
  same render, and in the async renderers waited for as a root's content is. `renderToJson()` says it needs a root,
  without collecting it. What unwrapping finds (the root, the `<UnlayerProvider>`s' config, where the wrappers left the
  tree for the content) is the render's, in its scope, known by the elements unwrapping made or reached, never kept on
  the template's own elements: a root kept between renders, returned by a wrapper that calls `useId()` in one, has its
  own ids in the next.
- **Collect.** react-dom/server renders the root's content once per render (`engine/react-dom.ts`), in a `<noscript>`
  (where React 19 hoists nothing to a document's head and preloads no image) taken off again. Before React renders an
  element, the collector (`engine/collector.ts`) prepares it: a Row, Column or block (of any copy of Elements, by its
  markers: `utils/record.tsx`), a `<Tailwind>` scope or a `<Head>`/`<Font>` entry is recorded where it is, as a marker
  element (`<unlayer-mark data-n data-i>`) around what's inside it (a Row's Columns, rich text's markup, a `<Head>`'s
  tags: a head entry's is its own, not the content's); everything else (your components, markup, Fragments, Context,
  Suspense) is rendered by React. A function component is called by `Call`, a component at its place in the tree that
  calls it (its hooks and its `useId()`s are React's), catches what it throws (a marker standing for the error, named
  and placed: see Errors) and prepares what it returns; a class component by a subclass whose render does the same.
  Each component of the template's own in a list is in a boundary, the part that's left out when it fails and the
  render leaves failed parts out. The HTML react-dom writes is read back (`engine/parse.ts`) as the content as a tree
  (`Item` in `engine/output.ts`): text as React writes it, markup written whole, markup a record is in
  (`<p>Hello <Name /></p>`: "cut" by it), and the records with their content. Nothing the template gives is read for a
  marker: see invariant 2.
- **Model.** The content made the template as Elements components only (`src/model/elements.ts`), from that tree as it
  is: nothing is parsed. The HTML, the head and the design are all made from it, so they can't disagree.
- **Exporters.** Row, Column and each block call the editor's exporters (`@unlayer/exporters`) for their HTML; Body
  puts the rows in the mode's document shell (`document-layouts.ts`). Four of their web and document exporters
  (Divider, Html, Menu, Social) render with `react-dom/server` themselves, a render of their own for each block:
  Elements writes those as strings instead (`src/exporters`, with `engine/host.ts`'s markup writer), so the only
  react-dom renders in a template's are Elements' own (its collecting render).

A render (`renderToHtml`, `renderToJson`, …) has a scope (`utils/render-scope.ts`): what it works out once, what it
does with a part that fails (`onError`), and the parts it left out. Once: the content is collected, each Row, Column
and block made the Elements component it is (`model/elements.ts`, by its record), and the values the HTML of each
Row, Column and built-in block mapped from its props are kept for the head (`remember`), which doesn't map them again
(a custom tool's own head maps its block itself: its code could read its props otherwise). Body calls each Row as it
is (`renderOwn`: Elements' own components call no hooks), not through react-dom. The design's values are made as copies
(`pxMerged`): no object of the design is the defaults', and its px lengths' bare zeros are `0px` as they're made.
Each render function makes a scope of its own, whatever is rendering around it (the async renderers run the
synchronous renders in theirs, through `utils/internals.ts`), and the user's code runs outside the render's scope
(`guest`): a component, a template wrapper, a custom tool's exporter and head (and `toSafeHtml`, `headConfig`), an
`onError` function, a Tailwind rewrite (its plugins). So a render that code starts is a render of its own, and Body
that React renders there, or in an app's own React render (a live preview), makes a scope of its own; Body reached by a
render function renders in that render's. The scope is the module's only while a render runs synchronously, never
across an `await`: async code passes it on itself.

## The collecting render (`src/engine`)

| File | What it is |
|--|--|
| `react-dom.ts` | The renderer: react-dom/server's static render (the synchronous renderers) and its streaming one waited for whole (the async ones), in a `<noscript>`; what React 19's `use()` throws to suspend, found by identity once per renderer (the one message read, `suspendedInReact`, is React's own error for a suspension nothing of the collector's saw, a lazy component's); whether its static renderer is calling a component of an app's, and another module of it to render with there (`withFreeBuild`); and what it can't render, said by name (see below) |
| `collector.ts` | What react-dom renders, prepared: records and boundaries as markers, components called by `Call` (and classes by a subclass), HTML given whole kept out of react-dom's output (a placeholder stands for it), a lazy component rendered where it is (Elements' components in it collected through `…/collects`), a `<style>`'s or `<script>`'s text with no marker in it (in a `<Head>` on React 19, rendered to one string), React 18's `javascript:` URLs written as React 19 writes them, and in an async render the first error in tree order |
| `parse.ts` | react-dom's output read back as the content's parts: only a marker the collection made, rendered once, is one; what a lazy component renders read no further than the markers React wrote after it, with React 18's `javascript:` URLs there written as React 19 writes them |
| `capture.ts`, `root-capture.ts` | Template wrappers called in a render of react-dom's of their own; a lazy template's root, given by the root |
| `output.ts` | The parts (text, markup, records, boundaries, errors), flattened in tree order into the content's tree |
| `host.ts`, `attributes.ts` | Markup as react-dom writes it, for the string exporters (`src/exporters`): attributes and styles by React 18's property table or React 19's switch, escaping, a `<Head>`'s raw text rules (`rawText`) |
| `errors.ts` | Positions (`Row 3 › Column 1 › Hero`), names, and how a part left out is said |
| `records.ts`, `keys.ts` | The collector's records and boundaries; React's development key warnings for the template's lists (a list written in JSX is the one React's development build froze) |
| `shared.ts` | The work a render's Markdown and code blocks share (invariant 9) |
| `index.ts` | Entry points: `collect`, `collectAsync`, `renderStatic` (markup), `renderOwn` (one of Elements' own components, called as it is: a Row's, a root's HTML), `callCaptured` |

### What it can't render

Elements renders templates with react-dom/server, as React Email does, and react-dom can't render everywhere React
runs. Each of these fails the render with a `RenderError` that says so and what to do, never with React's own error:

- **React Server Components' React** (its `react-server` build), which Next.js's App Router gives route handlers and
  Server Components on the edge runtime: react-dom can't render with it at all. Render in the Node.js runtime (the
  default), in a Client Component, or with plain Node.js code. (A Server Component on the Node.js runtime renders.)
- **Two copies of React**, react-dom's and another Elements imports (two installs, a bundler's second copy): the
  template's hooks can't run. One with none renders.
- **A render started while a component of a template that a synchronous render is calling runs** (a component among
  the rows, a template wrapper, a class's render, a Consumer's function), **where there's no other module of
  react-dom's free** (a bundle, a browser, an edge runtime, or a render that's itself inside one): react-dom/server's
  static renderer keeps a render's hook state in its module, so a render inside one of its own breaks the hooks the
  component calls after it (the components it calls are known: `…/calling`, by `Symbol.for`). In Node.js it renders
  with another module (secondBuild), as a render of its own, the render around it as it was after, as 0.2.1 did.
  Elsewhere, render it before (and pass what it gives as a prop) or after; an async render started there renders once
  that call is over, and one started in a component an async render calls renders (react-dom's streaming renderer is
  another module). Elements' own components that call
  no hooks start renders of their own there (a root met in the content, Markdown's `url`).
- **One started inside a component of an app's own `renderToString` or `renderToStaticMarkup`, where there's no other
  module of react-dom's** (a bundle, a browser). Rendered with the app's module, the render would break the hook state
  it keeps for the page's component (React's `Cannot set properties of null` in the page's next hook). So before a
  synchronous render function renders anything (`withFreeBuild`), it asks whether react-dom/server's static renderer
  is calling a function component. React's API says nothing of it but this: a class component (no hook state of its
  own) that renderer renders calls `useTransition` (which keeps none there either), which fails ("Invalid hook call")
  where that renderer calls no function component and, where it calls one, gives that module's own start function,
  which tells it's that module and not another renderer of this React's (Next.js's server render of a Client
  Component, whose React is another copy than its react-dom's: a hook there meets the page's renderer). The first
  render that isn't inside one learns that function (`stateOf`); React's development warnings are kept off meanwhile.
  Where it is calling one (or may be), the whole render goes to another module of react-dom's, as 0.2.1 did: loaded
  once with a synchronous `require` (CommonJS's, or Node's from this module's file, the app's script or the folder
  Node started in, where `react` is this React), React 19's Bun build first (its browser one keeps Node running), one
  whose renders run this React's hooks and that isn't rendering. There, a context the template doesn't provide reads
  the page's value (as in 0.2). Where there's none (a bundle, a browser), the render fails by name where react-dom/
  server's is calling a component, and the page's render goes on: work the email out before the page's render, or
  render the page with react-dom's stream (another module). Where that can't be told yet (the first render of the
  process is inside one) it renders with react-dom/server's, as 0.2.1 did: the component that started it can't call a
  hook after it. Inside Elements' own static renders (counted on `…/calling`) it isn't asked, and their renders keep
  the module they render with. After each render, one of nothing on its module (`settle`) pops what React can leave
  pushed in it (a template's provider, where a <Suspense>'s fallback rendered or a part that suspended was left out):
  every module of react-dom's server renderers reads a context's value from one place, so the next render of any
  module, Elements' or the app's, read the template's value till then.
- **What a lazy component renders** is rendered by react-dom where it is (React's API has no way to the component it
  loads but rendering it), with the contexts around it, inside a context of the collection's (`…/collects`, by
  `Symbol.for`): Elements' Rows, Columns, blocks, `<Tailwind>`s and `<Head>`/`<Font>` entries React renders there give
  their element to the collection, which records it where it is, so one that loaded renders as the component it loads
  would. What isn't Elements' is react-dom's as it renders it (an error thrown there fails the render, even with
  `onError: "omit"`; HTML given whole there is read as markup, in a marker of the lazy component's own, and no further
  than the next marker or placeholder React wrote: a `<style>`, `<script>` or comment it leaves open is its text, as
  in the same component not lazy, an end tag in it ends only what's open in it, and a marker forged in it, or an end
  tag of one, fails the render by name), and a component of the user's own there that starts a synchronous render is
  said at the lazy one's place. One that
  hasn't loaded: a synchronous render says it's async, at its place (left out with `onError: "omit"`); an async one
  waits for it.

### React versions

CI runs the react package's suite on React 18.0, 18.2, 18.3, 19.1, 19.2 and the latest 19, in React's development and
production builds, and weekly against React's canary with a longer fuzz run (`.github/workflows/react-versions.yml`,
which `test.yml` runs on every push and pull request and `publish.yml` before it publishes; `react-canary.yml`). React
18 and 19 differ where Elements writes markup itself (`react-compat.ts`: by `React.version`), and in what they write of
a `<style>`'s or `<script>`'s text (React 18 escapes it; React 19 writes it as given, and no component, list or markup
in it).

### The async renderers

They render the content with react-dom's streaming render (`renderToPipeableStream` in Node, `renderToReadableStream`
elsewhere), waited for whole: React waits for what suspends (`use()`, a thrown promise, a lazy component), siblings at
once. An async component (which React's server renderer doesn't run) is called once by `Call`, which waits for its
promise. The output is in tree order whatever settles first. A render that fails fails with the first error in the
order react-dom first called the components in, once nothing before it can still fail, and stops react-dom's render:
it doesn't wait for what comes after it. A `<Suspense>` around the root, or around a template's own content, renders
what's in it. A template wrapper that waits is waited for as above (Unwrap).

### Ids

`useId()` is React's own, in the installed React's format (`:R1:`, `«R1»`, `_R_1_`): the collector moves nothing in
the tree (a record's content is where a list of three, its two ends and it, has it, so its ids are the ones the
previous releases gave it; a boundary, a marker and `Call` are no place of their own). `idPrefix` (render options, a root's `config`, an
`<UnlayerProvider>`'s) is React's `identifierPrefix` (`«em-R1»`). The template wrappers are the tree's top, and the
content continues from where they left it (a wrapper that called `useId()` forks it, found by a probe's id: no
internals), so their ids and the content's are one document's.

## Errors

A part of a template fails when a component throws (or is async, or suspends with no `<Suspense>` around it, in a
synchronous render), when a Row's Columns don't fit its `layout`, or when an exporter or a head function (a custom
tool's `head`, `utils/extract-head.ts`) fails. By default every renderer
throws, the synchronous and the async ones alike, `renderToJson` and `renderToPlainText` too (`renderToJson` for an
exporter's failure only where it leaves parts out: see below): a **`RenderError`**
whose `component` is the one that failed, `position` where it is in the template (`Row 3 › Column 1 › Hero`: Rows and
Columns numbered among their parent's, other components by name, numbered from the second of a name), and `cause` the
original error. The message reads `[Unlayer] <what it threw> (in <Hero> at Row 3 › Column 1 › Hero)`. A part that
fails in an async render is the first in tree order whatever fails first (the order react-dom first called the
components in); the render doesn't wait for what comes after it in the tree, and react-dom's render is stopped.

`onError` (render options, a root's `config`, an `<UnlayerProvider>`; `renderToJson(element, { onError })`) changes
that:

- `"omit"`: the part is left out of the HTML, the plain text and the design alike, and said once with `console.error`
  (`[Unlayer] Left out: …`, with the cause).
- a function: the part is left out and the RenderError given to it, instead of the console; it can throw it to fail
  the render.

Either way, `renderToHtmlParts()` (and the async one) lists the parts it left out in `omitted`, in the order found.
A string-returning renderer (`renderToHtml`, `renderToPlainText`) and `renderToJson` report them through the console
or the function.

What's left out: a component of the template's own in a list (the root's children, a Row's, a Column's, a text
block's, a `<Head>`'s), with what it rendered; markup React rejects (`<hr style="…">` given a string), where it is; a Row whose
Columns don't fit its layout; a block whose exporter fails (its id goes to the next block, in the HTML and the design);
a Row or Column whose own HTML fails (its exporter, or mapping its props: `utils/container-render.ts`), a Column with
its cell (the Row is made again without it, its Columns after it moving up; with no Column left, the Row is left out
with it); what a head function that fails gives the document's head (a RenderError naming its block, `<tool>'s head
failed: …`): the block itself renders, as in the design, which runs no head function and has no head to disagree with.
The render is then the template's without that part. A template that isn't one always fails the render,
`onError` or not: an undefined component (a broken or circular import), an object or a date as a child, a Client
Component in server code, a portal (see Not supported).

**The design and the exporters.** No exporter makes the design, so `renderToJson()` doesn't render the HTML: by
default, a template whose only failure is an exporter's gives its design, block included, while `renderToHtml()` and
`renderToPlainText()` throw. Nothing is sent that the design disagrees with, as the HTML isn't made. With `onError`
leaving parts out, `renderToJson()` renders the body's HTML first, which is what finds a failing exporter, so the same
row or block is left out of the HTML, the plain text and the design (the slower path, only where it's asked for).

### Not supported

- **Error boundaries.** A class component's `componentDidCatch`/`getDerivedStateFromError` don't catch: React's server
  renderer doesn't run them either. Nor does a `<Suspense>` catch what fails in it, where React's server renderer
  writes its fallback for the browser to render it again: the part fails, as every failed part does (nothing is left
  out without a word). What replaces them is the RenderError's `position` and `cause`, and `onError` to leave a failed
  part out.
- **Portals.** As in React's server renderer, they fail the render.
- **React 19's hoisting**: a `<title>`, `<meta>`, `<link>`, `<style precedence href>` or async `<script>` in the body
  stays where it is, written as React 19 writes one it doesn't hoist (`precedence`, not `data-precedence`), images get
  no preload `<link>`s, and an `<html>` at the top of a template with no root gets no `<head>` it doesn't have (put head
  tags in `<Head>`: Elements writes the document): the template renders in a `<noscript>`, where React hoists nothing.
  `src/engine/differential.test.tsx` lists each of these, and checks the collecting render gives back everything else
  as react-dom writes it.
- **Effects** never run, as on any server.

## Invariants

1. **React's public API only.** Templates render with react-dom/server's exported renderers; Elements reads and writes
   none of React's internals (no dispatcher slot, no context values, no lazy payloads, no elements' development
   marks): what it reads of React's elements is their public shape (`type`, `props`, `key`, the `$$typeof` of a memo,
   forwardRef, context, lazy or Suspense, a memo's `type`, a forwardRef's `render`, React 18's element `ref`). The four
   string exporters render with no react-dom (`src/exporters/no-react-dom.test.tsx`).
2. **Nothing the template gives is read for a marker.** The collecting render's markers carry its number (a count,
   `r1`, `r2`, …: invariant 8), which anyone can guess. So HTML given whole (`dangerouslySetInnerHTML`, an Html block)
   never reaches react-dom's output (the collection keeps it; a placeholder comment stands for it, swapped back by the
   parse), a `<style>`'s or `<script>`'s HTML is kept the same way and its text taken whole to a browser's end tag,
   never read for markers (the collector puts none there), and text and attributes are escaped by React. Only a marker the
   collection made and react-dom rendered (`Marker`, which says so) is one, read once: one that looks like it but
   isn't (another render's, a number out of range, one never rendered) is the markup it is, and one read twice fails
   the render by name (`src/engine/forged-markers.test.tsx`). Each is closed by its own end tag, whatever is still
   open in it ending with it, and every one React rendered in a part it kept is read: an end tag of a marker with none
   open (each forged `</unlayer-mark>` leaves one, React writing one per marker), a marker never ended and one never
   read fail the render too, so what a lazy component renders (HTML given whole as written there) can't move or hide
   a part of the template.
3. **One model per render.** The HTML, the head, the plain text and the design are made from the same collected
   content, in one scope: they can't disagree, and a failed part is in none of them.
4. **A render's output depends only on its arguments.** All per-render state lives in that render's scope: the module
   holds no facts keyed by the user's elements or by what a render gives (its errors), every render function makes a
   scope of its own, and the ambient scope is cleared before any of the user's code runs (`guest`), so a render's
   output and errors depend only on that call's arguments, whatever rendered before it or renders at once (the
   regression templates rendered again from kept elements in a shuffled order give their reviewed bytes, and random
   templates sharing kept elements give the same output after any other, and at once). A context the template doesn't
   provide reads its default, wherever the render runs (react-dom's static render starts from every context's default,
   and the module Elements renders with is put back after each of its renders: `settle`), alone or inside an app's
   render, client or server. react-dom keeps its static render's context values apart from its streams', so no
   stream's provider values reach the synchronous renderers, not even an async render's of Elements' own that waits
   under a provider (its stream leaves the values there till it resumes). Its other renders read them, but for the
   cases React's own renders have too: every react-dom build reads a context's value from one place, and a build puts
   back only what it left itself. So a template must provide every context it reads, and an app's renders every
   context they read (README, "Contexts and the async renderers"):
   - Inside an app's `renderToString`, where another module of react-dom's renders the template, it reads the page's
     value (as in 0.2).
   - The async renderers, which render with react-dom's Node.js stream, read a provider's value an app's stream of
     another build left (`react-dom/server.edge` or `.browser`, `react-dom/static.edge`'s `prerender`, after a part in a
     <Suspense> waited, failed or was aborted), till that build renders again; react-dom's own Node.js stream reads
     the same value there.
   - Every renderer, the synchronous ones too, reads a provider's value an app's `renderToString` of another build
     (`.edge`, `.browser`, `.bun`) left where a part inside the provider threw or suspended, a <Suspense> around it
     or not (the page then renders its fallback), till that build renders again.
   - The other way: while an async render waits, an app's stream of another build reads the template's provider
     values where its page doesn't provide the context, and a render that never settles leaves them there.
   - Both ways, even where each provides its own: while an app's stream of another build and an async render run at
     once, a part that resumes under a provider reads the other's value, as React doesn't push a provider again where
     its module last left it, and the other build changed it meanwhile ("Detected multiple renderers concurrently
     rendering the same context provider"). Re-providing the template's providers around each component's output
     (what Elements can do with public API) fixes what a resumed async component's children read, not a component that
     suspends and reads the context itself, nor the page's side; so it isn't done, and the README says to pass what's
     sensitive as props, render with the synchronous renderers, or in a worker or process of their own there.

   Each can be another request's, another tenant's data (`regression/render-isolation.test.tsx` holds all of them).
   React's API has no way to put back what another module left.
5. **Tree order.** Output, records, ids and the error a render throws don't depend on when promises settle.
6. **Components run as React runs them**: once, and again where React renders again (a component that sets its state
   while rendering, one that suspends once what it waits for settles); an async component's function once.
7. **Nothing is left out silently.** A part that fails throws, or is left out where `onError` says, and said.
8. **No randomness, no date**, so Next.js's Cache Components can prerender pages that render emails: the markers'
   numbers are a count.
9. **Across copies of Elements** (a package's ESM and CommonJS builds, a package still on another version) only type
   markers are shared, by `Symbol.for`: a Row's, Column's and block's (`@unlayer/react-elements/records`, and their
   `__unlayerRender`/`__unlayerItemConfig` statics), a root's (`…/root`, its name), a `<Head>`/`<Font>` entry's
   (`…/head-entry`), a `<Tailwind>`'s rewrite (`…/tailwind`), an `<UnlayerProvider>`'s (`…/provider`), so one copy's
   collecting render records another copy's Rows. What an async render compiled for its `<Tailwind config>`s is in its scope, and
   given to each `<Tailwind>`'s rewrite as an argument, where it's found by the `<Tailwind>` it's for (a render the
   user's code starts, with a scope of its own, has none); a `<Tailwind>` carries its copy's compiler
   (`…/tailwind-loader`, on its type), which the async renderers compile its config with, so two copies' classes don't
   mix (an older copy's `<Tailwind>`, which carries none, gets the compiler of the Tailwind entry loaded last). The
   work a render's Markdown and code blocks share (their budgets: `src/code/work.ts`) is the one piece of render state
   that is: the running render's, in one slot on globalThis (`…/render-work`, with the version of its shape:
   `engine/shared.ts`), set for the length of each render's synchronous run and each call of the user's code (a
   component's call: after an `await` in it there's none, so `highlightCode()` there is a call of its own), so a copy's
   Markdown and code entries read the render another copy runs (a copy that finds another version's slot keeps its
   own, and its blocks have their own work in another version's render). No other render state is shared: the render functions render a root of another copy (Body, Email, Page, Document, by its
   marker, or an older copy's by its name and its code: `utils/root-type.ts`; a component of yours named like one is
   called as written) as their own copy's (`utils/own-root.ts`), so the copy whose renderer was called renders the
   whole template in its render's scope, whichever copy its components are of; a `<Tailwind>`'s rewrites find the
   Columns of that render's Rows by their marker (`src/tailwind/column.ts`), and get the render's direction (its
   root's resolved `textDirection`, which the render scope holds, as its `onError`) as an argument, never reading a
   scope themselves (from an older copy, none: left to right). Before a render rewrites any component, it gives a
   `<Tailwind>`'s rewrite the props of the Rows, Columns and blocks in its scopes with that `tw` (or `config`), where
   the rewrite has a `prepare` (one object, so a later release can add to it; an older copy's has none), so their
   classes are compiled at once (`utils/tailwind.ts`); what reading a component's own classes throws (a Tailwind
   plugin's error for one of them, which never reaches Tailwind's compiler, kept for every render: `src/tailwind/guard.ts`)
   is that component's, which `onError: "omit"` leaves out (`model/elements.ts`'s `styled`), and a class that can't be
   read while Tailwind compiles again fails the render, which the async renderers wait for; and
   it gives the rewrites a key of its own (each call outside a render, its own), by which a handle reads a render's
   classes together: its first 2,000 different ones, so classes from data can't take more memory than that
   (`src/tailwind/declarations.ts`'s `capped`).
   Besides those, by `Symbol.for`: the collecting renders' count (`…/render-count`, their markers' numbers: invariant 2; not 0.2's `…/renders`, a number),
   the component a synchronous render is calling, how many static renders Elements runs and the module of react-dom's
   they render with (`…/calling`: see "What it can't render"), the context a lazy
   template's root gives itself to (`…/root-capture`), the one Elements' components in a lazy component give
   themselves to (`…/collects`), and the mark of Elements' components of other entries that call
   no hooks (`…/no-hooks`: Markdown, CodeBlock), so each copy's renders know another's.

## Where it's tested

| What | Tests |
|--|--|
| The collecting render gives back what react-dom writes, ids included, on hand-written and random trees; each attribute on each kind of element; every element React writes its own way (form controls, a style's, script's and title's text, resources React 19 hoists, where it doesn't); random markup where templates have it (a template with no root, a Page's, a component's in a Column, the async renderers'); and what it means to write otherwise, listed | `src/engine/differential.test.tsx` (`WALKER_FUZZ_SEEDS=5000` and `TEMPLATE_SEEDS=1000` for more) |
| Strings that look like the collecting render's markers or placeholders, in HTML given whole, a `<Head>`'s style and script, text: markup as any other, in a render alone and one started inside another; what a lazy component's HTML leaves open or ends | `src/engine/forged-markers.test.tsx` |
| The string exporters write what `@unlayer/exporters` writes with react-dom (12k cases; React 19's attributes); pages and documents render with the exporters' react-dom/server made to throw | `src/exporters/parity.test.tsx`, `react-19.test.ts`, `no-react-dom.test.tsx` |
| Siblings at once, tree order, determinism over random delays, renders at once, the first error in tree order without waiting | `src/engine/async.test.tsx` |
| The error policy, every renderer, every place `onError` goes; `renderToJson` calling no exporter by default | `src/utils/render-errors.test.tsx` |
| The head reusing the values the HTML mapped (no block mapped again); a `<Head>`'s style and script text, fuzzed against a browser's parser | `src/utils/extract-head.test.tsx`, `src/head/head.test.tsx` |
| `idPrefix`: against react-dom's `identifierPrefix`, and every renderer's | `src/engine/differential.test.tsx`, `src/utils/render-to-html.test.tsx` |
| React Server Components' React: each render says react-dom can't render with it; each ESM entry loads (none imports by name what it lacks) | `src/utils/react-server-react.test.tsx`, `src/regression/react-server-build.test.ts` |
| Two copies of React: a template with hooks says so; one with none renders | `src/regression/react-copies.test.tsx` |
| Renders inside an app's render (its stream, its browser build), and a render started while a component of a template is called (refused by name; started by an async render, an exporter, a root, Markdown) | `src/utils/nested-renders.test.tsx`, `src/regression/edge-cases.test.tsx` |
| A render's output whatever rendered before or around it: elements kept between renders, random templates sharing them (and async renders at once), the regression templates rendered again in a shuffled order, a render started from each place the user's code runs, a context the template doesn't provide after react-dom's renders left another request's value in it, and inside one that provides it | `src/regression/render-isolation.test.tsx` (`ISOLATION_RUNS=2000` for more), `src/regression/patterns.test.tsx`, `src/utils/nested-renders.test.tsx` |
| What suspends wherever it is (the template, a wrapper around it, a lazy template, a component, a class, a block's children, a template with no root): the async renderers wait, the synchronous ones say so | `src/async/async.test.tsx` |
| A template with no root: each component run once, its ids the head's, its failed parts as a root's | `src/utils/user-components.test.tsx` |
| Two copies of Elements: the module and CommonJS builds loaded together, either's components rendered by the other's renderers; another copy's Rows; Markdown's and code's work across copies and versions | `src/regression/node-exit.test.ts`, `src/regression/react-copies.test.tsx`, `src/regression/elements-copies.test.tsx` |
| The output against the previous release | `src/regression/*` (`GENERATED_SEEDS=5000` for more random templates) |
| Next.js route handlers, Server Components, Client Components, edge and Pages Router API routes, every entry, Turbopack and webpack; Cache Components | `tests/next*-integration` |
