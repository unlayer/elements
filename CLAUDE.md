# CLAUDE.md — Unlayer Elements

## What is this project?

A monorepo providing React components that render to email-safe HTML (tables for Outlook/Gmail), responsive web HTML, and print/PDF HTML. The core value: write JSX once, get production-ready HTML for any output target.

## Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages (core → react → the rest)
pnpm test             # Run all tests (vitest)
pnpm test:coverage    # Run tests with coverage
```

Package-specific:
```bash
cd packages/react && pnpm test -- --watch   # Watch mode
cd packages/react && pnpm storybook         # Storybook dev server
```

## Architecture

### Packages

| Package | Path | Published | Purpose |
|---------|------|-----------|---------|
| `@unlayer/react-elements` | `packages/react` | Yes (npm) | The components and `render()` (main entry), the builder adapter (`/builder`), a `Document` written as a PDF with react-pdf (`/pdf`: `renderPdf()`) and a `Canvas` as PNG or SVG with Satori and resvg (`/image`: `renderImage()`); both are entries of their own with their engines as optional peer dependencies, so the main entry loads none (`dist/primitives.js` imports no engine) |
| `@unlayer/migrate` | `packages/migrate` | Yes (npm) | `npx @unlayer/migrate` CLI: migrate React Email templates, check them, write a report; `compare` for templates migrated by hand. The React Email → Elements converter (`src/react-email/`: codemod, runtime with merge tags, check against the original; API at `@unlayer/migrate/react-email`), what converters share (`src/convert/`: Elements tree, conversion report, TSX printer, content check; Elements 0.2's codemod at `@unlayer/migrate/elements`); fidelity benchmark in `bench/`, results in `FIDELITY.md` |
| `@unlayer-internal/elements-core` | `packages/core` | No (private, bundled into react) | The new API's internals (RFC 0001): the template tree (internal, never public), component definitions, value kinds, validation, custom components, layout resolution, and Elements' own writers (`src/writers/`): a laid-out template as web HTML, email HTML (tables, px widths from the resolver, Outlook's markup in conditional comments) and plain text, with the stylesheet under short rule-named classes; and the writers of `/pdf` and `/image` (`src/pdf/`, `src/image/`: a Document or Canvas as plain data to draw, and the one adapter file that imports each engine), as entries of their own (`./pdf`, `./image`). Framework-neutral apart from those two; used by `@unlayer/react-elements` |
| `@unlayer/elements-demo` | `examples/demo` | No | Demo/showcase app |

### Template structure

```
Email/Page/Document/Canvas (the root: which output render() writes)
  └─ Section (a band across the window, optional)
      └─ Row (its Columns side by side, stacked on phones)
          └─ Column (its children stacked)
              └─ Heading/Paragraph/Text/Button/Image/... (text runs inside: Span, Link, LineBreak, MergeTag)
```

A root, a `Section` and a `Column` stack what they hold. Styles go in `style` (typed, a number is px), phone styles in
`mobile`, hover styles in `hover`; there are no margins (a parent's `gap`). Every component and prop:
`packages/react/GUIDE.md` and `REFERENCE.md`, written from the definitions by
`src/primitives/reference.ts`.

### Components

The components aren't hand-written: each is a definition in `packages/core/src/components.ts` (props, styles,
children, targets, support per output, editors), and `packages/react/src/primitives/components.tsx` makes a React
component of each, whose props' types come from the same definition that validates them. `component()`
(`src/primitives/custom.tsx`) makes a template's own component of them.

### Rendering Pipeline

```
JSX
  → one React render collects the template (src/primitives/collect.tsx): each component records its props and renders
    markers around its children, and React renders everything else (the user's components, hooks, Context, Fragments)
  → packages/core checks it (validation, custom components expanded) and lays it out (each block's width)
  → its writers (packages/core/src/writers) write the root's output: email HTML, page HTML, print HTML (a Document), and plain text
```

`render()` is async and rejects with an `ElementsError` listing the template's problems; `validate()` checks without
rendering, `outline()` prints the laid-out template. A component that is async or suspends is an error (`jsx/async`).
The collecting render runs with a module of react-dom's that isn't rendering (`src/utils/server-renderer.ts`), so
an app's server render can work out a design or HTML while it renders and call hooks after. The stack of collecting
renders and the render count behind each render's nonce are shared by every copy of Elements in a process
(`Symbol.for`, `src/utils/collect.ts`), not React context, so it works in Server Components.

### Key External Dependencies

- The published package has no dependencies: React and react-dom are peers, and `packages/core` is bundled in (tsup's `noExternal`).
- The closed `@unlayer/exporters` is gone. Don't add it back: HTML comes from `packages/core/src/writers`, and each builder tool's default values from `packages/react/src/builder/tool-defaults.ts`. CI fails if a bundle imports it.

## Key Files

| File | Purpose |
|------|---------|
| `packages/react/src/primitives/index.ts` | The main entry: the components, `component()`, async `render()` (output from the root), `validate()`, `outline()` and `prepare()`; JSX only |
| `packages/core/src/components.ts` | Primitive component definitions (props, styles, children, targets, each style's and prop's support per output, editors) |
| `packages/core/src/writers/{email,page}/` | The new writers, one file per component (`Button.tsx`, `Row.tsx`, …) per output, in JSX that writes strings (`packages/core/src/writers/jsx.ts`, no React), each output's document shell in its `index.tsx`; `packages/core/README.md` explains the layout, the JSX and how to add a component |
| `packages/react/src/utils/` | The render that collects a template: `collect.ts` (the stack every copy of Elements shares, each render's nonce), `server-renderer.ts` (which module of react-dom's a render runs with), `render-scope.ts` |
| `docs/rfcs/0001-primitives-and-exporters.md` | The new engine's design: decisions (dated), components, styles, layout, support per output, the writers, the builder adapter, status and order of work |
| `packages/react/src/builder/` | The builder adapter (`/builder`): `toDesign()` writes a template as the Unlayer builder's design JSON (`raise.ts` and `tools.ts` make its rows, columns and blocks; `design.ts` writes them over each tool's defaults, numbered as the builder numbers them, key for key as Elements 0.2's `renderToJson` wrote them), `fromDesign()` reads one back (`read.ts`, `rows.ts`, `blocks.ts`), its values and text as Elements 0.2's components read them (`read-values.ts`, `read-runs.ts`, `lexical.ts`). It imports only its own files, the main entry's and React (`imports.test.ts`). `manifest.ts` lists every hidden property (a style or prop a tool has no field for, kept in its values) and the builder's own keys; a test holds `toDesign()` to it |
| `packages/react/src/builder/tool-defaults.ts` | Each tool's default values and the design's schema version, plain data in the editor's key order |

## Testing

- **Unit tests**: Vitest, co-located as `name.test.ts(x)`; the new components' own in `src/primitives` (`template.test.tsx`, `custom.test.tsx`, `content.test.tsx`, `reference.test.tsx`; `types.test-d.tsx` is the type contract `pnpm typecheck` checks) and the builder adapter's in `src/builder`
- **Node environment test**: `packages/react/src/node-import.test.ts` — the main entry and `/builder` import and render with no browser API, and each entry's types resolve under every `moduleResolution`
- **Next.js integration**: `tests/nextjs-integration/` — real Next.js 15 app build (Turbopack) that renders an email in a route handler, a Server Component and an edge route (`verify.mjs`); `tests/next14-integration/` the same on Next.js 14 with React 18; `tests/next16-integration/` on Next.js 16 with Cache Components (create-next-app's default), where the route handler, Server Component and Client Component are prerendered when the app builds, which fails if a render reads a random number or the date (`src/regression/render-isolation.test.tsx` checks that too); `tests/jest-integration/` the packed package in Jest 30's jsdom environment with React 19
- **Storybook smoke test**: `packages/react/.storybook/test-runner.ts` — opens every story in headless Chromium and asserts each component paints visible content with no console / page errors. Runs against both the dev server (`pnpm test-storybook`) and the production static build (`pnpm test-storybook:ci`). Note: Storybook bundles from `src/` via Vite — the published `dist/` artifact is covered by the Next.js integration and the CSP gate.
- **CSP safety gate**: `packages/react/scripts/csp-probe.mjs` (`pnpm test:csp`) — imports + renders the built main entry and `/builder` (`dist/primitives.js`, `dist/builder.js`) under V8's `--disallow-code-generation-from-strings` (a Content-Security-Policy without `'unsafe-eval'`). **Hard gate**: fails if the built package evaluates a string (`eval` / `new Function`) at import or render — a green check must mean the package is genuinely CSP-safe.
- **Storybook visual-drift gate**: `packages/react/scripts/storybook-visual.mjs` (`pnpm test:visual`, needs `pnpm build-storybook` first) — fingerprints the computed styles and the visible text of every story at desktop + mobile widths in headless Chromium and diffs against the committed `scripts/storybook-visual-baseline.json` (dictionary-encoded; regenerate intentional changes with `UPDATE_VISUAL_BASELINE=1 pnpm test:visual`). Fails naming the exact stories and property-level diffs. Computed styles, not pixel screenshots — deterministic across macOS/Linux; blind only to pure rasterization differences.
- **Browser E2E gate**: `packages/react/scripts/browser-e2e.mjs` (`pnpm test:e2e`, needs `pnpm build` + `playwright install chromium` once) — renders an Email, a Page and a Document of the same content with the built main entry (`dist/primitives.js`) and asserts in headless Chromium across fourteen sections: (1) document contract — every `<p>` computes to 0px margins (the inline reset beats the UA default), exactly one `<body>`, title/styles/links applied, no console/page errors; (2) responsive — three columns side-by-side at desktop width, stacked full-width below the phone breakpoint (480px for a Page, an Email's width + 20px; a Document never stacks), and a Row with `stackOnMobile={false}` kept side by side in proportion on phones even when a stacking row follows it; (3) interaction — button `:hover` applies the configured hover colors; (4) RTL — the root's `dir` reaches the computed direction; (5) style baseline — computed colors/fonts/radii/padding/column-widths diffed against the committed `scripts/browser-e2e-baseline.json` (regenerate intentional changes with `UPDATE_E2E_BASELINE=1 pnpm test:e2e`; computed values instead of pixel screenshots so the baseline is deterministic across macOS/Linux); (6) no horizontal overflow at mobile width; (7) preheader — `previewText` present but invisible/zero-size; (8) accessibility — img alt, link names, `role="presentation"` on layout tables; (9) an image's width holds and stays inside its column; (10) every non-empty `<style>` parses into CSS rules; (11) a Document stays visible under print media emulation; (12) an email Row's side padding stays inside the email, centred, with no sideways scroll; (13) phone settings (a Column's `mobile` padding, an Image's `mobile` width, `hidden`) apply at 375px and leave desktop as it was, with a negative control; (14) a block the builder keeps as markup fills its place in a block, a flex box and a grid. Includes a negative control (a document with a bare `<p>`) that must fail the checks — a green run proves the gate can detect the regression it guards, not just that selectors matched nothing.

- **Primitives layout gate**: `packages/core/test/browser/` (`pnpm --filter @unlayer-internal/elements-core test:browser`, needs `playwright install chromium`) — renders one template (`fixture.ts`: nested Rows, Columns, a Section, images, maxWidth boxes, hidden columns) as a Page (`layout.test.ts`) and as an Email (`email-layout.test.ts`), and asserts every box's width in Chromium equals the width the resolver (`packages/core/src/resolve.ts`) worked out, on desktop, and that Rows stack and hidden content hides at phone width. The email is also measured with its `<style>` removed (Gmail drops it for some accounts): desktop widths must still match, and Rows must still stack on phones by their fluid-hybrid columns. The resolver's widths are what every target reads, so a difference here is a difference between targets.
- **PDF and image output**: `packages/react/test/pdf/` and `packages/react/test/image/` (run with the rest of `pnpm test`, in Node) — the PDF read back with pdf.js and the image's size and bytes, no network, the same bytes for the same template, every diagnostic, and that each engine is imported by one file (in `packages/core/src/pdf` and `src/image`). `pnpm --filter @unlayer/react-elements test:browser` (needs `playwright install chromium`) runs `test/*/browser/`: Chromium lays out the same HTML, and each line of the PDF starts within a point of it, and the image matches Chromium's drawing pixel by pixel, the edges of shapes and letters aside.
- **Primitives support per output**: `packages/core/test/writers/support.test.ts` — every style and prop of every primitive declares how each output with a writer (email, web) shows it; each, at every enum value and a sample of others, must change the output or give a diagnostic (nothing dropped silently), and every limit declared is reported by `validate()`.
- **Hostile inputs**: `src/regression/hostile-input.test.tsx` — every value that often comes from users (text, links, image sources and text, menu items, social icons, video titles, table cells, merge tag names, the root's title, language, preview text, description and fonts) given markup in every root; the parsed HTML must have no element or attribute it adds (nor what Outlook reads in its conditional comments), and the builder's design no markup where the builder reads HTML.
- **Render isolation**: `src/regression/render-isolation.test.tsx` — a render never leaks into the next (data, kept elements, order, `useId`), the same input always gives the same output, and a render reads no random numbers or the date (Next.js's Cache Components fail a build on one).
- **Renders inside renders**: `src/utils/nested-renders.test.tsx`, `src/regression/edge-cases.test.tsx` and `src/regression/client-render.test.tsx` — an app's server render (react-dom/server or its browser build) or client render working out a design, a layout or the HTML and calling hooks after; React's hooks and wrappers in a template; a template's own errors and undefined components failing every render. `src/utils/react-server-react.test.tsx`: React Server Components' React says to render in Node.js. `src/regression/node-exit.test.ts`: the built entries exit Node on React 18 and 19, load only react-dom/server, and use no `import.meta` or computed `require`.
- **Migration fidelity smoke test**: `packages/migrate/bench/smoke.ts` (`pnpm --filter @unlayer/migrate test:fidelity`, needs `playwright install chromium` once) — converts the templates in `packages/migrate/test/react-email/fixtures` both ways (codemod and runtime) and renders them next to their React Email originals in Chromium at 700px and 375px, with the network off. Fails on lost or added words, links or images, on any word shown at another font size on desktop, or on words moved on desktop (and on phones for the fixtures that match there, listed in `PHONE_EXACT`); a 2% tolerance absorbs font rendering differences between macOS and Linux. The full benchmark (`pnpm --filter @unlayer/migrate bench`, results in `FIDELITY.md`) runs the 106-template corpus locally.
- **The migration check's styles**: `packages/migrate/src/convert/cascade.ts` (tests in `packages/migrate/test/convert/cascade.test.ts`) — the content check reads both documents with a small CSS cascade (inline styles, the `<style>` rules that apply at a desktop width, the browser's defaults, inheritance) and compares each word's size, bold, italics, letter case, underline, color, the background behind it and a link's target; a gradient of written-out opaque colors counts as its first stop, and a `url()` image behind the original's text that the migration lost is a difference unless the box set a color under it that the migration shows (as where images don't load); `<html>`'s background and text styles count. The same cascade decides what's hidden (display:none, the `hidden` attribute, `max-height:0;overflow:hidden`, visibility, opacity, text only screen readers get: `sr-only` clipping or placed far off the page, by position, `text-indent` or a `transform`, compound selectors), and reads the text `::before` and `::after` draw as words. It reads what React Email writes: Tailwind's `sm:` as `@media` nested in the rule (range syntax), custom properties (an unset one drops the declaration, as in the browser), `:not()` and the structural pseudo-classes, and drops a selector the browser can't read (`&gt;`); `initial`/`revert` take the property's initial value or the browser's style for the element, a box's `opacity` fades the text in it (compared as its color), and text that's the inbox preview on one side and in the email on the other differs. It also reads both documents at a phone's width (375px), where the same words, links and images must show (and the same styles, a difference listed as a look), at each wider width where a rule for wider screens applies on either side (Tailwind's `md:`, `lg:`), where the words, links, images and styles must match (`widerScreens`), in dark mode where either side has a `prefers-color-scheme: dark` rule (a logo or text swapped for dark mode), where the words, links and images must match, and places each word across the page at desktop width without a browser (`packages/migrate/src/convert/geometry.ts`: table cells, `display: table-cell`, inline-blocks, flex rows, widths, padding, auto margins, `align`; cells without a width beside others are as wide as the browser's automatic table layout makes them, from their text's estimated widths, so a word must stay in place at a low and a high estimate and at any size of an image without a px width (none, or wider than the row), and a cell whose content can't be measured — a flex box, a box sized in % — leaves its words unverified. The converter sizes such columns the same way, from the text the preview props give): a word whose line sits more than 120px elsewhere (a column stacked or moved, a block on the other side) fails the check. On the 106 benchmark templates the model reads at most 100px apart where Chromium shows no move; images aren't compared (their place often depends on sizes inferred from content). **It fails closed**: a property, whether words show (on desktop or on phones), or where a word sits, unknown on one side only (a selector, condition or value it can't evaluate; a rule it can't read counts at the highest weight it could have), is `unverified` with the rule that caused it, and the check fails; unknown on both sides for the same reason (the same rule: markup kept as it was) isn't, for different reasons (another condition on each side) is, and where a word sits unknown on both sides is too. It fails closed on CSS it doesn't model too: each word carries the declarations around it that can change how it shows (`StyledDocument.look`: any property not in `MODELED` or `INERT`, at a value that changes something — `white-space`, `letter-spacing`, `transform`, `filter`, `text-shadow`, an inset `box-shadow`, `position` with offsets, `overflow` with a set height or unwrapped lines, `display: grid`, a reversed row, `order`, `direction`/`dir`, `::before`/`::after` content, a list item's marker, `<q>`, and the HTML attributes that set styles: `<font size>`, `<sup>`, `nowrap`), and both sides must carry the same (lengths within a third of a pixel), or the word is unverified (`what: "look"`). `INERT` lists, with why, what can't change the words (borders, corners, outer shadows, heights, line wrapping, Outlook's `mso-*`, rendering hints); a property in neither list is in doubt by default. A `<style media>` applies as its query does (a print stylesheet never), in the check and in both converter modes. Geometry is default-closed too: it places only what it models (block and inline flow, floats, tables with automatic or fixed layout and their cell spacing, nowrap flex rows with gap/justify-content/place-content, stretched flex columns, boxes that shrink to their content, logical inline sides, `box-sizing`, right-to-left rows from the right), and `unmodeled()` in `geometry.ts` makes everything else unknown (a grid, multicol, absolute/fixed/sticky, wrapping flex, non-stretch flex columns, vertical writing, size containment, an aspect-ratio width, a display it doesn't know); unknown on both sides is unverified, so the same CSS kept on both sides still fails there. An image's `srcset` isn't compared. `checkFails` in `verify.ts` says whether the check found anything (what the differential tests); what the CLI does with it is its own policy, the same for the run, `compare` and each flipped boolean prop: `contentProblems()` (words, links and images lost or added, on desktop or phones, whether they show where that can't be told, preview text shown in the email, a block the editor wouldn't get, a flipped prop that fails to render, content the original shows or hides by its props that the codemod drops — `lostShown` — and words CSS the check doesn't read adds or hides: `::before` content, an ellipsis, a line clamp, a clipping `overflow`) flags a template `✗` and exits 2, and `lookProblems()` (styles, where words sit, the look, what it can't read, styles computed from props, and phone styles the original applies up to another width than Elements' 480px, which the check doesn't read between the two) lists it under `looks` ("looks different"). Every template is written either way (content that differs is a converter bug, since anything it can't map is kept as HTML); `--strict` fails and doesn't write a template with any difference (`--force` writes it anyway). On the 106-template benchmark no conversion has a style difference on desktop (three have one on phones: text the converter makes smaller so its words fit a phone), and two have something unverified, both `white-space` the converter can't carry (a comment shown with `pre-wrap`, a price kept on one line with `nowrap`): they're written, listed as looking different (and fail with `--strict`). No conversion's content differs; any other difference or doubt is a regression to look at.

## CI Quality Gates

- TypeScript strict compilation
- All unit tests pass
- Bundle sizes within their budgets (`.github/workflows/test.yml`), and no bundle imports `@unlayer/exporters`
- Hostile inputs add no markup
- Next.js integration build succeeds
- Browser E2E gate passes (rendered documents verified in Chromium: 0px `<p>` margins, single `<body>`, no errors)
- Migration fidelity smoke test passes (fixture templates keep their content, text sizes and desktop layout)
- The migration check compares text styles as well as words, links and images (`cascade.test.ts`, and the converters' tests)
- Storybook smoke test passes (every story renders, no console errors)
- Storybook visual-drift gate passes (every story's computed styles and text match the committed baseline)
- CSP safety gate passes (green in CI; may fail locally on some Node setups due to an ESM interop quirk under the V8 flag)

## Review bar for the migration tool

The tool's goal is an editable Unlayer template with the same content, not pixel parity: every template is written, content that differs is flagged (`✗`, exit 2) and how it looks is listed ("looks different"). What blocks a merge of the converter, the check or the CLI (`packages/migrate`: `src/convert`, `src/react-email` and the CLI), and of Elements changes made for them:

1. **Elements regressions**: code that rendered with the last release gives a reader something else (words, links, images, layout, plain text) or another design, and the change isn't a documented difference.
2. **Content the check misses**: it passes a migration whose content a reader gets differently: a word, link, image or alt text lost, added or out of order, or shown where the original hides it (or the other way round), on desktop, phones, wider screens or in dark mode.
3. **Broken or destructive writes**: the CLI changes a file it wasn't asked to, or one git can't restore (`--write` refuses those unless `--allow-dirty`), or writes a migrated template that doesn't compile where the original did.
4. **Wrong exit codes**: a run that skipped a real template, failed, or checked nothing exits `0`.

Not blockers: how a migration looks. A look difference (a style, where words sit, CSS the check doesn't model or can't read) is listed for the user to fix in the editor, and one the check misses is a gap in that list: worth fixing, not blocking. Also not blockers: a template the converter can't map (it's kept as HTML that renders as before), a check that lists a difference where there is none (a false fail), polish. Each blocker fix comes with a test that fails without it. A false pass found by the differential test (`pnpm --filter @unlayer/migrate test:differential`) is committed as a fixture it replays.

## Common Gotchas

- Styles go in `style={{ … }}`, never as props, and a number is px; there are no margins (space between blocks is the parent's `gap`)
- An `Image` takes its file's size: `src={{ src, width, height }}`; `style.width` is the size shown
- `render()` is async (`await render(element)`); `validate()`, `outline()`, `toDesign()` and `fromDesign()` aren't
- Text goes in `Heading` or `Paragraph`; markup outside an `Html` block is an error (`jsx/markup`), and so is a component that's async or suspends (`jsx/async`)
- `packages/core` is private and bundled into react via tsup's `noExternal` — it's never installed separately
