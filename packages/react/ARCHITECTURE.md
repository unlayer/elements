# How @unlayer/react-elements renders

This is the map of the renderer for people and coding agents changing it: the pipeline, the engine that renders
templates (`src/engine`), its hooks dispatcher, what it does when part of a template fails, and the invariants the
tests hold it to. The [README](./README.md) is the API.

## The pipeline

```
template (JSX)                       <Welcome name="Ada" />
  │ unwrap                           template wrappers called, once, until the root        utils/unwrap-root.ts
  ▼
root                                 <Email> … </Email>
  │ walk (collect)                   the content rendered by the engine; Elements' Rows,   src/engine, utils/record.tsx,
  │                                  Columns and blocks recorded, the rest rendered as     src/model/collect.ts
  │                                  React renders it: a tree of records, markup, text
  ▼
model                                Email > Row > Column > blocks, Elements' only         src/model
  ├──▶ design                        renderToJson()                                        utils/render-to-json.ts
  └──▶ exporters                     each row's and block's HTML (@unlayer/exporters)      components/*, utils/create-component.tsx
         ├──▶ HTML                   the rows in the mode's document, the head's CSS       utils/render-to-html.tsx, utils/extract-head.ts
         └──▶ plain text             the HTML as text                                      (shared) htmlToPlainText
```

- **Unwrap.** `renderToHtml(<Welcome />)` reads the root's settings (fonts, `lang`, `dir`, phone styles, config), so
  the components around the root are called first: function components, `memo`, `forwardRef`, class components, each
  once, with hooks, inside the context providers around them. Providers, `<UnlayerProvider>`s and `<Tailwind>`s around
  the root move inside it, around its content; a Fragment, StrictMode or `<Suspense>` around it is passed through (a
  `<Suspense>` around the root is outside the document, and its fallback, not a root, never renders). An async
  wrapper, or one that `use()`s or throws a promise (React 18's Suspense: react-i18next's `useTranslation`), is
  awaited by the async renderers (`take` in `src/async/collect.ts`, along `unwrapSteps`), and called again once it
  settles; the synchronous ones throw for it. So is a lazy template (`React.lazy`): the component it loads is
  unwrapped once it has loaded. A template with no root (Rows, a block, markup) gives what it rendered instead
  (`Unwrapped.rendered`: its wrappers made again with what they returned, not called again), which renders as a root's
  content does, without the root's markup (`utils/root-content.ts`; a root its walk meets in it, where unwrapping
  stopped before it, renders as a document inside it, said once per render: `nestedRoot`): walked once, its Rows and
  blocks rendered with the render's config and numbered as the head numbers them, its head and plain text from the
  same walk, and in the async renderers waited for as a root's content is. `renderToJson()` says it needs a root,
  without walking it. What unwrapping finds (the root, the `<UnlayerProvider>`s' config, where the wrappers left the
  tree for the content) is the render's, in its scope, known by the elements unwrapping made or reached, never kept on
  the template's own elements: a root kept between renders, returned by a wrapper that calls `useId()` in one, has its
  own ids in the next.
- **Walk.** The engine renders the root's content once per render. It asks a collector (`utils/record.tsx`) about each
  element: a Row, Column or block (of any copy of Elements, by its markers), a `<Tailwind>` scope or a `<Head>`/`<Font>`
  entry is recorded where it is, and what's inside it (a Row's Columns, rich text's markup, a `<Head>`'s tags) walked
  inside its record (a head entry's is its own, not the content's: its tags are the HTML they render);
  everything else (your components, markup, Fragments, Context, Suspense) is rendered as react-dom's static server
  render would. Each component of the template's own in a list is in a boundary, the part that's left out when it fails
  and the render leaves failed parts out (see Errors). What the walk gives is the content as a tree (`Item` in
  `engine/output.ts`): text as React writes it, markup written whole, markup a record is in (`<p>Hello <Name /></p>`:
  "cut" by it), and the records with their content.
- **Model.** The content made the template as Elements components only (`src/model/elements.ts`), from that tree as it
  is: nothing is parsed. The HTML, the head and the design are all made from it, so they can't disagree.
- **Exporters.** Row, Column and each block call the editor's exporters (`@unlayer/exporters`) for their HTML; Body
  puts the rows in the mode's document shell (`document-layouts.ts`). Four of their web and document exporters
  (Divider, Html, Menu, Social) render with `react-dom/server`: Elements writes those as strings instead
  (`src/exporters`), with the engine's host markup, so nothing in a render calls react-dom. `react-dom` is still a peer
  dependency because `@unlayer/exporters` imports `react-dom/server` when it loads.

A render (`renderToHtml`, `renderToJson`, …) has a scope (`utils/render-scope.ts`): what it works out once, what it
does with a part that fails (`onError`), and the parts it left out. Once: the content is collected, each Row, Column
and block made the Elements component it is (`model/elements.ts`, by its record), and the values the HTML of each
Row, Column and built-in block mapped from its props are kept for the head (`remember`), which doesn't map them again
(a custom tool's own head maps its block itself: its code could read its props otherwise). Body calls each Row as it
is (`renderOwn`: Elements' own components call no hooks), not through a walk. The design's values are made as copies
(`pxMerged`): no object of the design is the defaults', and its px lengths' bare zeros are `0px` as they're made.
Each render function makes a scope of its own, whatever is rendering around it (the async renderers run the
synchronous renders in theirs, through `utils/internals.ts`), and the user's code runs outside the render's scope
(`guest`): a component, a template wrapper, a custom tool's exporter and head (and `toSafeHtml`, `headConfig`), an
`onError` function, a Tailwind rewrite (its plugins). So a render that code starts is a render of its own, and Body
that React renders there, or in an app's own React render (a live preview), makes a scope of its own; Body reached by a
render function renders in that render's. The scope is the module's only while a render runs synchronously, never
across an `await`: async code passes it on itself.

## The engine (`src/engine`)

| File | What it is |
|--|--|
| `walk.ts` | The walker: elements, components, Context, Fragments, memo, forwardRef, lazy, Suspense, classes; where something suspends, the async walk's `wait` (src/async/collect.ts) or a throw to the nearest `<Suspense>` |
| `dispatcher.ts` | Elements' hooks dispatcher, put in React's slot around each component call |
| `host.ts`, `attributes.ts` | Host markup (`<div>`, `<img>`, …) as react-dom writes it for the installed React: void, custom and preformatted elements; form controls (a `<select>`'s value marking its options, the format context the walker carries for it); a `<style>`'s, `<script>`'s and `<title>`'s text (React 18 escapes it, React 19 writes it as given); each attribute and style by React 18's property table or React 19's switch; escaping. In a `<Head>`, a `<style>`'s and `<script>`'s text is written as given in every React, whatever writes it (a string, a component, a list, markup: the whole of what's between its tags is its text), but for its own end tag and that of each element it's in whose content runs to its end tag (a `<noscript>`, a `<title>`), escaped as CSS or JavaScript reads them; under an `<svg>` or `<math>`, where a parser may read it as markup, it's escaped as any text (`head.test.tsx` fuzzes it against a browser's parser). The walker and the string exporters write with it |
| `output.ts` | The walk's output (text, markup, records, holes, boundaries, errors), flattened in tree order into the content's tree |
| `tree-id.ts` | Where a component is in the tree (Fizz's tree context), and `useId()` from it |
| `react-compat.ts` | What the walker relies on, per React version, and where React's dispatcher slot is |
| `self-test.ts` | The once-per-process check of the installed React |
| `errors.ts` | Positions (`Row 3 › Column 1 › Hero`), names, and how a part left out is said |
| `records.ts`, `keys.ts` | The collector's records and boundaries; React's development key warnings |
| `index.ts` | Entry points: `collect`, `walkAsync` (the async entry's walk), `renderStatic` (markup), `renderOwn` (one of Elements' own components, called as the walk would: a Row's, a root's HTML), `callComponent` |

### The hooks dispatcher

React's hook functions (`useState`, `useId`, `use`, …) call whatever dispatcher is in a slot of React's internals:
`__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current` in React 18,
`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H` in React 19, and
`__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H` in React 19's react-server build (Next.js's Server
Components and route handlers). `callWithHooks` puts Elements' dispatcher there synchronously around one component call
and puts back what was there in `finally`: never across an `await`. A render Elements runs inside (the app's react-dom
render, Next.js's Flight render) finds its own dispatcher when the call returns; a render inside a component (an
`Elements` render in a template's `useMemo`) saves and restores it the same way. Elements' own components (roots,
Rows, Columns, blocks) call no hooks, and `renderStatic` calls them with the slot holding the dispatcher of the render
around it, as that render would: react-dom puts its context back after a render started inside one of its renders
(an exporter's) only when its own dispatcher is there.

What the hooks do is what React's server renderer does: context from the walker's provider stack (a context no
provider in the walk, or around the component that started it, gives reads its fallback, worked out once per
top-level render: its default, as Elements learns it; see invariant 4), `useId` from the
tree position, initial state (a state set while rendering renders the component again, its last render counts, as in
React), `useSyncExternalStore`'s server snapshot, effects and `useInsertionEffect`/`useLayoutEffect` never run,
`useOptimistic`/`useActionState` their initial state, react-dom's `useFormStatus` not pending, `useEffectEvent`'s
function failing if it's called while rendering, and `use()` of a pending promise suspending. A hook the dispatcher
doesn't have (a newer React's) reaches a Proxy behind it, which throws
`<Hero> calls useNewHook, which Elements' renderer doesn't support (React x.y.z)` instead of React's
`dispatcher.useNewHook is not a function`. React's react-server build has no `useState`, `useContext`, `useEffect`, …:
a template calling one fails with a RenderError saying so and what to do. Elements' own modules import nothing by
name that build lacks (webpack, Next.js 15's default bundler, fails the build of a module that does: `createContext`
and `useContext` are read off React), and its one context, `<UnlayerProvider>`'s, is made when it's first read.

### React versions

`react-compat.ts` has a row per React minor Elements is tested with (18.0 to 18.3, 19.0, 19.1, 19.2, 19.3): the dispatcher
slot's path per build, `useId`'s format (`:R1:`, `«R1»`, `_R_1_`), the context shape (React 18's `Ctx.Provider`
object, React 19's `<Ctx>`), and whether it has `use()`. The walker throws its own errors for what React's server
renderer rejects (an object as a child, an invalid element type, a portal) and reads no React error message.

Before the first render, `self-test.ts` checks the installed React: the slot is where the table says, the dispatcher
installs there and the previous one is put back, a `useId()` has the table's format, a context reads through the
walker's stack, `use()` reads a fulfilled thenable. A version the table doesn't have takes the row of the nearest one
before it (one older than all, the first): if it passes, it renders (with one warning in development, saying it's
newer or older than the table's); if it fails, every render throws
`[Unlayer] unsupported React x.y.z: <what failed>`. **`UNLAYER_SKIP_REACT_CHECK=1`** in the environment skips the
check, to render anyway.

CI runs the react package's suite on React 18.0, 18.2, 18.3, 19.1, 19.2 and the latest 19, in React's development and production
builds, and weekly against React's canary with a longer fuzz run (`.github/workflows/react-versions.yml`, which `test.yml`
runs on every push and pull request and `publish.yml` before it publishes, so a release ships only a commit every one
passed; `react-canary.yml`).
To support a new version: add its row, run the suite on it (`pnpm --filter @unlayer/react-elements add -D react@x
react-dom@x`), and add a hook it adds to `dispatcher.ts` and to the list in `dispatcher.test.tsx`.

### The async walk

The synchronous and the async renderers share one synchronous walk; the async entry (`src/async/collect.ts`) gives
it how to wait (its `wait`: the holes, and flattening them once they've settled), so the main entry has none of it. Where a component suspends (an async component,
`use()` of a pending promise, a thrown promise, a lazy component, a promise as a child), the synchronous walk throws to
the nearest `<Suspense>`, which renders its fallback as react-dom's synchronous render does, whatever `onError` says
(with none, it's a failed part: see Errors). The async walk leaves a hole in its output and walks on, so the promises of the siblings after it
start at once; when the promise settles, the hole is filled by walking that component again (a `use()` component is
called again with the results it had; one that threw a promise is called, or a class rendered, again; an async
component's resolved value is walked) at the tree position, with the context and in the place it had. A component that
throws a promise again once it has rejected fails with what it rejected with, as `use()` of it does. The output is
flattened in tree order, whatever settled first: the HTML, the records' order (head tags, Tailwind configs) and the ids
are byte-identical from run to run.

### Ids

`useId()` is Fizz's (react-dom's server renderer's) algorithm on the walker's tree position, in the installed React's
format, with no prefix of Elements': `:R1:` (18, 19.0), `«R1»` (19.1), `_R_1_` (19.2 and later). `idPrefix` (render
options, a root's `config`, an `<UnlayerProvider>`'s) is React's `identifierPrefix` (`«em-R1»`): the render scope holds
it for the content's walk, and the template wrappers take the render options' or the Providers' around them, as
they're called before the root's config is read. The template
wrappers are the tree's top, and the content continues from where they left it, so their ids and the content's are
one document's. A walk a component starts (a nested Email among the rows, an Elements render inside a component) starts
at that component's place in the tree, inside the providers around it (see invariant 4); one a template wrapper starts,
at the top.

## Errors

A part of a template fails when a component throws (or is async, or suspends with no `<Suspense>` around it, in a
synchronous render), when a Row's Columns don't fit its `layout`, or when an exporter or a head function (a custom
tool's `head`, `utils/extract-head.ts`) fails. By default every renderer
throws, the synchronous and the async ones alike, `renderToJson` and `renderToPlainText` too (`renderToJson` for an
exporter's failure only where it leaves parts out: see below): a **`RenderError`**
whose `component` is the one that failed, `position` where it is in the template (`Row 3 › Column 1 › Hero`: Rows and
Columns numbered among their parent's, other components by name, numbered from the second of a name), and `cause` the
original error. The message reads `[Unlayer] <what it threw> (in <Hero> at Row 3 › Column 1 › Hero)`. A part that
fails in an async render is the first in tree order whatever fails first; the render doesn't wait for what comes after
it in the tree.

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
`onError` or not: an undefined component (a broken or circular import), an object or a date as a child, a portal, a Client
Component in server code.

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
  tags in `<Head>`: Elements writes the document). A form's or a button's action that's a function isn't written
  (React 19 writes a script that runs it). `src/engine/differential.test.tsx` lists each of these, and checks the walker
  writes everything else as react-dom does.
- **Effects** never run, as on any server.

## Invariants

1. **No react-dom in a render.** The engine renders templates and Elements' markup, and the string exporters the four
   blocks whose exporters would call `react-dom/server` (`src/exporters/no-react-dom.test.tsx` renders whole pages and
   documents with it made to throw).
2. **React's dispatcher is Elements' only during a component call**, set and restored synchronously, never held across
   an `await`; a render Elements runs in, or that runs in it, keeps its own.
3. **One model per render.** The HTML, the head, the plain text and the design are made from the same collected
   content, in one scope: they can't disagree, and a failed part is in none of them.
4. **A render's output depends only on its arguments**, and on where a component starts it. All per-render state lives
   in that render's scope: the module holds no facts keyed by the user's elements or by what a render gives (its
   errors), every render function makes a scope of its own, and the ambient scope is cleared before any of the user's
   code runs (`guest`), so a render's output and errors depend only on that call's arguments, whatever rendered before
   it or renders at once (the regression templates rendered again from kept elements in a shuffled order give their
   reviewed bytes, and random templates sharing kept elements give the same output after any other, and at once). The
   exception, by design, is the walker's, not the scope's: a walk started while the walker is calling a component (an
   Elements render in its body or its `useMemo`, a nested Email's content, a render anything that call runs starts)
   starts at that component's place in the tree and inside the context providers around it (`calling` in
   `engine/walk.ts`), so its `useId()`s continue the document's and a context it has no provider of its own for reads
   the value it has there, as React's renders inside a render do. A render started outside any component's call (by a
   template wrapper, an exporter, a head, `onError`, a Tailwind plugin) starts at the top, as alone
   (`src/utils/nested-renders.test.tsx` holds both). The providers of a render of React's own around it (an app's
   react-dom render) aren't the walk's: a context neither gives reads its default, standalone and inside an app's
   streaming, client or Server Component render. React keeps a context's default only in the two values its renders
   set while they render (`_currentValue`, react-dom's streaming and client renders'; `_currentValue2`, renderToString's
   and renderToStaticMarkup's, and other secondary renderers'), and they don't always put them back: a stream leaves
   the first holding what its last part that waited was given (another request's tenant, theme or locale), and
   renderToString one that failed or suspended inside a provider the second. So `defaultOf` in `engine/dispatcher.ts`
   takes the default from where they agree, and learns it there while no render of React's is running (each time, a
   fact of the context, not of a render: a default never changes; a WeakMap by context); where they differ, it's the
   default learned, else the second, which react-dom's streaming render never sets. A render of React's is running
   where React's dispatcher slot holds a dispatcher that is neither Elements' own nor idle: React 18 and 19 leave their
   ContextOnlyDispatcher (its hooks one function) in the slot after a client render and during its effects, which
   is no render running, so Elements learns there too (`isIdleDispatcher`, which compares the hooks' identities; a
   shape it doesn't know is a render running, where nothing is learned). During a yielded concurrent transition the
   slot is idle, but `_currentValue` can hold the values of providers mid-tree: they aren't learned, as
   `_currentValue2` doesn't hold them, and the fallback there is `_currentValue2`. A walk reads a context's fallback
   once, at its first read (`fallbacks`, the top-level render's, shared with the template's wrappers and with any
   render a component of it starts: `renderFallbacks` in `engine/index.ts`), so a render that starts inside an app's
   render and goes on after it (an async one) reads one value throughout. What it can't know, it reads as React has
   it: before it has learned the context's default, inside an app's renderToString that render's value (0.2, which
   rendered with react-dom there, passed an app's renderToString providers through; 0.3 does only till it learns the
   default, on its first ordinary render), and the second's value where a renderToString that failed or suspended
   inside a provider of it left it: the one known leak, rare, a context Elements has never read outside React's
   renders, read right after that; and a value both hold, the same, from two such renders, till a render of
   react-dom's puts one of them back (`src/regression/render-isolation.test.tsx` pins each).
5. **Tree order.** Output, records, ids and the error a render throws don't depend on when promises settle.
6. **Components run once per render**, but as React runs them again: a component that sets its state while rendering,
   and one `use()` suspends, which is called again once the promise settles.
7. **Nothing is left out silently.** A part that fails throws, or is left out where `onError` says, and said.
8. **No randomness, no date**, so Next.js's Cache Components can prerender pages that render emails.
9. **Across copies of Elements** (a package's ESM and CommonJS builds, a package still on another version) only type
   markers are shared, by `Symbol.for`: a Row's, Column's and block's (`@unlayer/react-elements/records`, and their
   `__unlayerRender`/`__unlayerItemConfig` statics), a root's (`…/root`, its name), a `<Head>`/`<Font>` entry's
   (`…/head-entry`), a `<Tailwind>`'s rewrite (`…/tailwind`), an `<UnlayerProvider>`'s (`…/provider`), so one copy's
   walk records another copy's Rows. What an async render compiled for its `<Tailwind config>`s is in its scope, and
   given to each `<Tailwind>`'s rewrite as an argument, where it's found by the `<Tailwind>` it's for (a render the
   user's code starts, with a scope of its own, has none); a `<Tailwind>` carries its copy's compiler
   (`…/tailwind-loader`, on its type), which the async renderers compile its config with, so two copies' classes don't
   mix (an older copy's `<Tailwind>`, which carries none, gets the compiler of the Tailwind entry loaded last). No
   render state is shared: the render functions render a root of another copy (Body, Email, Page, Document, by its
   marker, or an older copy's by its name and its code: `utils/root-type.ts`; a component of yours named like one is
   called as written) as their own copy's (`utils/own-root.ts`), so the copy whose renderer was called renders the
   whole template in its render's scope, whichever copy its components are of; a `<Tailwind>`'s rewrites find the
   Columns of that render's Rows by their marker (`src/tailwind/column.ts`), and get the render's direction (its
   root's resolved `textDirection`, which the render scope holds, as its `onError`) as an argument, never reading a
   scope themselves (from an older copy, none: left to right). Before a render rewrites any component, it gives a
   `<Tailwind>`'s rewrite the props of all it collected, where the rewrite has a `prepare` (one object, so a later
   release can add to it; an older copy's has none), so their classes are compiled at once (`utils/tailwind.ts`).

## Where it's tested

| What | Tests |
|--|--|
| The walker writes what react-dom writes, ids included, on hand-written and random trees; each attribute on each kind of element; every element React writes its own way (form controls, a style's, script's and title's text, resources React 19 hoists, where it doesn't); random markup where templates have it (a template with no root, a Page's, a component's in a Column, the async renderers'); and what it means to write otherwise, listed | `src/engine/differential.test.tsx` (`WALKER_FUZZ_SEEDS=5000` and `TEMPLATE_SEEDS=1000` for more) |
| The string exporters write what `@unlayer/exporters` writes with react-dom (12k cases; React 19's attributes); pages and documents render with react-dom/server made to throw | `src/exporters/parity.test.tsx`, `react-19.test.ts`, `no-react-dom.test.tsx` |
| Every hook of the installed React; an unknown one's error; the slot put back | `src/engine/dispatcher.test.tsx` |
| The version table and the self-check | `src/engine/react-compat.test.ts` |
| Siblings at once, tree order, determinism over random delays, renders at once, error order | `src/engine/async.test.tsx` |
| The error policy, every renderer, every place `onError` goes; `renderToJson` calling no exporter by default | `src/utils/render-errors.test.tsx` |
| The head reusing the values the HTML mapped (no block mapped again) | `src/utils/extract-head.test.tsx` |
| `idPrefix`: the walker's against react-dom's `identifierPrefix`, and every renderer's | `src/engine/differential.test.tsx`, `src/utils/render-to-html.test.tsx` |
| React's react-server build (React 19): a render, and each ESM entry loading (none imports by name what it lacks) | `src/regression/react-server-build.test.ts` |
| Renders inside an app's render, and inside each other | `src/utils/nested-renders.test.tsx`, `src/regression/edge-cases.test.tsx` |
| A render's output whatever rendered before or around it: elements kept between renders, random templates sharing them (and async renders at once), the regression templates rendered again in a shuffled order, a render started from each place the user's code runs, a context the template doesn't provide after react-dom's renders left another request's value in it, and inside one that provides it | `src/regression/render-isolation.test.tsx` (`ISOLATION_RUNS=2000` for more), `src/regression/patterns.test.tsx`, `src/utils/nested-renders.test.tsx` |
| What suspends wherever it is (the template, a wrapper around it, a component, a class, a block's children, a template with no root): the async renderers wait, the synchronous ones say so | `src/async/async.test.tsx` |
| A template with no root: each component run once, its ids the head's, its failed parts as a root's | `src/utils/user-components.test.tsx` |
| Two copies of Elements: the module and CommonJS builds loaded together, either's components rendered by the other's renderers; another copy's Rows | `src/regression/node-exit.test.ts`, `src/regression/react-copies.test.tsx` |
| The output against the previous release | `src/regression/*` (`GENERATED_SEEDS=5000` for more random templates) |
| Next.js route handlers, Server Components, Client Components, edge and Pages Router API routes, every entry, Turbopack and webpack; Cache Components | `tests/next*-integration` |
