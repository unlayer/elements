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
  the root move inside it, around its content. An async wrapper, or one that `use()`s or throws a promise (React 18's
  Suspense: react-i18next's `useTranslation`), is awaited by the async renderers (`take` in `src/async/collect.ts`, along
  `unwrapSteps`), and called again once it settles; the synchronous ones throw for it. A template with no root (Rows, a
  block, markup) gives what it rendered instead (`Why.rendered`: its wrappers made again with what they returned, not
  called again), which renders as a root's content does, without the root's markup (`utils/root-content.ts`): walked
  once, its Rows and blocks rendered with the render's config and numbered as the head numbers them, its head and
  plain text from the same walk, and in the async renderers waited for as a root's content is. `renderToJson()` says it
  needs a root, without walking it.
- **Walk.** The engine renders the root's content once per render. It asks a collector (`utils/record.tsx`) about each
  element: a Row, Column or block (of any copy of Elements, by its markers), a `<Tailwind>` scope or a `<Head>`/`<Font>`
  entry is recorded where it is, and what's inside it (a Row's Columns, rich text's markup) walked inside its record;
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
Body rendered by an app's own React (a live preview) makes a scope of its own.

## The engine (`src/engine`)

| File | What it is |
|--|--|
| `walk.ts` | The walker: elements, components, Context, Fragments, memo, forwardRef, lazy, Suspense, classes; where something suspends, the async walk's `wait` (src/async/collect.ts) or a throw to the nearest `<Suspense>` |
| `dispatcher.ts` | Elements' hooks dispatcher, put in React's slot around each component call |
| `host.ts`, `attributes.ts` | Host markup (`<div>`, `<img>`, …) as react-dom writes it: void, custom and form elements; each attribute and style by React 18's property table or React 19's switch; escaping. The walker and the string exporters write with it |
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
provider in the walk gives has the value React has for it then: its default, or an outer render's), `useId` from the
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

`react-compat.ts` has a row per React minor Elements is tested with (18.3, 19.0, 19.1, 19.2, 19.3): the dispatcher
slot's path per build, `useId`'s format (`:R1:`, `«R1»`, `_R_1_`), the context shape (React 18's `Ctx.Provider`
object, React 19's `<Ctx>`), and whether it has `use()`. The walker throws its own errors for what React's server
renderer rejects (an object as a child, an invalid element type, a portal) and reads no React error message.

Before the first render, `self-test.ts` checks the installed React: the slot is where the table says, the dispatcher
installs there and the previous one is put back, a `useId()` has the table's format, a context reads through the
walker's stack, `use()` reads a fulfilled thenable. A version the table doesn't have takes the row of the nearest one
before it: if it passes, it renders (with one warning in development); if it fails, every render throws
`[Unlayer] unsupported React x.y.z: <what failed>`. **`UNLAYER_SKIP_REACT_CHECK=1`** in the environment skips the
check, to render anyway.

CI runs the react package's suite on React 18.3, 19.1, 19.2 and the latest 19, in React's development and production
builds, and weekly against React's canary with a longer fuzz run (`.github/workflows/test.yml`, `react-canary.yml`).
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
at that component's place in the tree.

## Errors

A part of a template fails when a component throws (or is async, or suspends with no `<Suspense>` around it, in a
synchronous render), when a Row's Columns don't fit its `layout`, or when an exporter fails. By default every renderer
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
block's), with what it rendered; markup React rejects (`<hr style="…">` given a string), where it is; a Row whose
Columns don't fit its layout; a block whose exporter fails (its id goes to the next block, in the HTML and the design);
a Row or Column whose own HTML fails (its exporter, or mapping its props: `utils/container-render.ts`), a Column with
its cell (the Row is made again without it, its Columns after it moving up; with no Column left, the Row is left out
with it). The render is then the template's without that part. A template that isn't one always fails the render,
`onError` or not: an undefined component (a broken or circular import), an object or a date as a child, a portal, a Client
Component in server code.

**The design and the exporters.** No exporter makes the design, so `renderToJson()` doesn't render the HTML: by
default, a template whose only failure is an exporter's gives its design, block included, while `renderToHtml()` and
`renderToPlainText()` throw. Nothing is sent that the design disagrees with, as the HTML isn't made. With `onError`
leaving parts out, `renderToJson()` renders the body's HTML first, which is what finds a failing exporter, so the same
row or block is left out of the HTML, the plain text and the design (the slower path, only where it's asked for).

### Not supported

- **Error boundaries.** A class component's `componentDidCatch`/`getDerivedStateFromError` don't catch: React's server
  renderer doesn't run them either. What replaces them is the RenderError's `position` and `cause`, and `onError` to
  leave a failed part out.
- **Portals.** As in React's server renderer, they fail the render.
- **React 19's hoisting**: a `<title>`, `<meta>` or `<link>` in the body stays where it is, and images get no preload
  `<link>`s (put head tags in `<Head>`); `<select value>` doesn't mark its `<option>`s; forms' actions aren't written.
- **Effects** never run, as on any server.

## Invariants

1. **No react-dom in a render.** The engine renders templates and Elements' markup, and the string exporters the four
   blocks whose exporters would call `react-dom/server` (`src/exporters/no-react-dom.test.tsx` renders whole pages and
   documents with it made to throw).
2. **React's dispatcher is Elements' only during a component call**, set and restored synchronously, never held across
   an `await`; a render Elements runs in, or that runs in it, keeps its own.
3. **One model per render.** The HTML, the head, the plain text and the design are made from the same collected
   content, in one scope: they can't disagree, and a failed part is in none of them.
4. **Tree order.** Output, records, ids and the error a render throws don't depend on when promises settle.
5. **Components run once per render**, but as React runs them again: a component that sets its state while rendering,
   and one `use()` suspends, which is called again once the promise settles.
6. **Nothing is left out silently.** A part that fails throws, or is left out where `onError` says, and said.
7. **No randomness, no date**, so Next.js's Cache Components can prerender pages that render emails.
8. **Across copies of Elements** (a package's ESM and CommonJS builds, a package still on another version) only type
   markers are shared, by `Symbol.for`: a Row's, Column's and block's (`@unlayer/react-elements/records`, and their
   `__unlayerRender`/`__unlayerItemConfig` statics), a root's (`…/root`, its name), a `<Head>`/`<Font>` entry's
   (`…/head-entry`), a `<Tailwind>`'s rewrite (`…/tailwind`), an `<UnlayerProvider>`'s (`…/provider`), so one copy's
   walk records another copy's Rows. The async and Tailwind entries, separate bundles, share the handles an async
   render compiled (`…/tailwind-scopes`), found by the `<Tailwind>` they're for; a `<Tailwind>` carries its copy's
   compiler (`…/tailwind-loader`, on its type), which the async renderers compile its config with, so two copies'
   classes don't mix (an older copy's `<Tailwind>`, which carries none, gets the compiler of the Tailwind entry loaded
   last). No render state is shared: the render functions render a root of another copy (Body, Email, Page, Document,
   by its marker, or an older copy's by its name and its code: `utils/root-type.ts`; a component of yours named like
   one is called as written) as their own copy's (`utils/own-root.ts`), so the copy whose renderer was called renders
   the whole template in its render's scope, whichever copy its components are of; a `<Tailwind>`'s rewrites find the
   Columns of that render's Rows by their marker (`src/tailwind/column.ts`).

## Where it's tested

| What | Tests |
|--|--|
| The walker writes what react-dom writes, ids included, on hand-written and random trees, and each attribute on each kind of element | `src/engine/differential.test.tsx` (`WALKER_FUZZ_SEEDS=5000` for more) |
| The string exporters write what `@unlayer/exporters` writes with react-dom (12k cases; React 19's attributes); pages and documents render with react-dom/server made to throw | `src/exporters/parity.test.tsx`, `react-19.test.ts`, `no-react-dom.test.tsx` |
| Every hook of the installed React; an unknown one's error; the slot put back | `src/engine/dispatcher.test.tsx` |
| The version table and the self-check | `src/engine/react-compat.test.ts` |
| Siblings at once, tree order, determinism over random delays, renders at once, error order | `src/engine/async.test.tsx` |
| The error policy, every renderer, every place `onError` goes; `renderToJson` calling no exporter by default | `src/utils/render-errors.test.tsx` |
| The head reusing the values the HTML mapped (no block mapped again) | `src/utils/extract-head.test.tsx` |
| `idPrefix`: the walker's against react-dom's `identifierPrefix`, and every renderer's | `src/engine/differential.test.tsx`, `src/utils/render-to-html.test.tsx` |
| React's react-server build (React 19): a render, and each ESM entry loading (none imports by name what it lacks) | `src/regression/react-server-build.test.ts` |
| Renders inside an app's render, and inside each other | `src/utils/nested-renders.test.tsx`, `src/regression/edge-cases.test.tsx` |
| What suspends wherever it is (the template, a wrapper around it, a component, a class, a block's children, a template with no root): the async renderers wait, the synchronous ones say so | `src/async/async.test.tsx` |
| A template with no root: each component run once, its ids the head's, its failed parts as a root's | `src/utils/user-components.test.tsx` |
| Two copies of Elements: the module and CommonJS builds loaded together, either's components rendered by the other's renderers; another copy's Rows | `src/regression/node-exit.test.ts`, `src/regression/react-copies.test.tsx` |
| The output against the previous release | `src/regression/*` (`GENERATED_SEEDS=5000` for more random templates) |
| Next.js route handlers, Server Components, Client Components, edge and Pages Router API routes, every entry, Turbopack and webpack; Cache Components | `tests/next*-integration` |
