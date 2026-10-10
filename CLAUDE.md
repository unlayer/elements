# CLAUDE.md — Unlayer Elements

## What is this project?

A monorepo providing React components that render to email-safe HTML (tables for Outlook/Gmail), responsive web HTML, and print/PDF HTML. The core value: write JSX once, get production-ready HTML for any output target.

## Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages (shared → react)
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
| `@unlayer/react-elements` | `packages/react` | Yes (npm) | React components, renderers, context |
| `@unlayer-internal/shared-elements` | `packages/shared` | No (private, bundled into react) | Framework-agnostic types, config, utils |
| `@unlayer/elements-demo` | `packages/demo` | No | Demo/showcase app |
| `@unlayer/from-react-email` | `packages/from-react-email` | No (private, bundled into migrate; API at `@unlayer/migrate/react-email`) | React Email → Elements converter (codemod, runtime with merge tags, check against the original); fidelity benchmark in `bench/`, results in `FIDELITY.md` |
| `@unlayer/migrate` | `packages/migrate` | Yes (npm) | React Email converter API at `@unlayer/migrate/react-email`; `npx @unlayer/migrate` CLI: migrate React Email templates, check them, write a report; `compare` for templates migrated by hand |
| `@unlayer/convert-core` | `packages/convert-core` | No (private, bundled into the converters) | Elements tree, conversion report, TSX printer and content check that converters share |

### Component Hierarchy (strict)

```
Email/Page/Document (sets render mode)
  └─ Row (layout container, uses ColumnLayouts or cells prop)
      └─ Column (must match layout column count)
          └─ Button/Paragraph/Image/... (content items, no nesting)
```

### Factory Pattern

Most content components are NOT hand-written. They're created by `createItemComponent()` in `packages/react/src/utils/create-component.tsx`:

```typescript
const Button = createItemComponent<ButtonValues>('button', ButtonDefaults, mapButtonProps);
```

This factory:
1. Takes a component type name, default values, and a semantic prop mapper
2. Returns a React component that maps flat props → nested `@unlayer/types` values
3. Attaches a `[UNLAYER_RENDER_KEY]` static for `renderToJson()` to use

**When adding a new component, use the factory.**

### Rendering Pipeline

```
JSX flat props
  → mapSemanticProps() converts to nested values matching @unlayer/types
  → Body component uses ReactDOMServer.renderToString() for children innerHTML
  → BodyExporter from @unlayer/exporters produces final HTML per mode
```

Three render modes: `email` (table-based), `web` (div+flexbox), `document` (print).

### Semantic Props System

Components expose flat, ergonomic props (`fontSize`, `backgroundColor`) that get mapped to the deeply nested structure expected by `@unlayer/exporters`. The mapping logic lives in `packages/shared/src/utils/semantic-props.ts`.

Example: `<Button fontSize="16px">` → `{ style: { fontSize: "16px" } }` in the nested values.

### Key External Dependencies

- **`@unlayer/exporters`** — the actual HTML rendering engine. Converts component values → HTML for each mode. Pinned version in `pnpm-workspace.yaml` catalog.
- **`@unlayer/types`** — TypeScript type definitions for all component value shapes. Same pinned version.
- These are updated automatically by the `update-deps.yml` GitHub workflow.

## Key Files

| File | Purpose |
|------|---------|
| `packages/react/src/index.ts` | Main barrel export |
| `packages/react/src/utils/create-component.tsx` | Component factory |
| `packages/react/src/utils/render-to-html.tsx` | `renderToHtml()` implementation |
| `packages/react/src/utils/document-layouts.ts` | Per-mode document shells (email/web/document), kept in parity with the editor's exported documents |
| `packages/react/src/utils/render-to-json.ts` | `renderToJson()` implementation |
| `packages/react/src/utils/semantic-props.ts` | Flat → nested prop mapper |
| `packages/react/src/components/Body.tsx` | Core container component (handles all 3 modes) |
| `packages/react/src/components/Row.tsx` | Row layout with column management |
| `packages/shared/src/config.ts` | `UnlayerConfig` interface and defaults |
| `packages/shared/src/types.ts` | Shared type definitions |
| `packages/shared/src/utils/merge-values.ts` | Deep merge utility |

## Testing

- **Unit tests**: Vitest + Testing Library, co-located as `Component.test.tsx`
- **Snapshot tests**: `packages/react/src/components/snapshots.test.tsx` — every component in web + email modes
- **Golden template test**: `packages/react/src/golden-template.test.tsx` — full realistic email through all 4 render pipelines
- **Node environment test**: `packages/react/src/node-import.test.ts` — verifies no browser API dependency
- **Next.js integration**: `tests/nextjs-integration/` — real Next.js 15 app build with Server Components
- **Storybook smoke test**: `packages/react/.storybook/test-runner.ts` — opens every story in headless Chromium and asserts each component paints visible content with no console / page errors. Runs against both the dev server (`pnpm test-storybook`) and the production static build (`pnpm test-storybook:ci`). Note: Storybook bundles from `src/` via Vite — the published `dist/` artifact is covered by the Next.js integration and the CSP gate.
- **CSP safety gate**: `packages/react/scripts/csp-probe.mjs` (`pnpm test:csp`) — imports + renders the built `dist/` bundle under V8's `--disallow-code-generation-from-strings` (a Content-Security-Policy without `'unsafe-eval'`). **Hard gate**: fails if this package _or_ its pinned `@unlayer/exporters` evaluates a string (`eval` / `new Function`) at import or render. It stays red until the workspace catalog pins a precompiled / CSP-safe `@unlayer/exporters` release — a green check must mean the package is genuinely CSP-safe.
- **Storybook visual-drift gate**: `packages/react/scripts/storybook-visual.mjs` (`pnpm test:visual`, needs `pnpm build-storybook` first) — fingerprints the computed styles and the visible text of every story (276 renders) at desktop + mobile widths in headless Chromium and diffs against the committed `scripts/storybook-visual-baseline.json` (dictionary-encoded; regenerate intentional changes with `UPDATE_VISUAL_BASELINE=1 pnpm test:visual`). Fails naming the exact stories and property-level diffs. Computed styles, not pixel screenshots — deterministic across macOS/Linux; blind only to pure rasterization differences.
- **Browser E2E gate**: `packages/react/scripts/browser-e2e.mjs` (`pnpm test:e2e`, needs `pnpm build` + `playwright install chromium` once) — renders full documents with the built `dist/` for all three modes and asserts in headless Chromium across eleven sections: (1) document contract — every `<p>` computes to 0px margins (the inline reset beats the UA default), exactly one `<body>`, title/styles/links applied, no console/page errors; (2) responsive — three columns side-by-side at desktop width, stacked full-width below the mobile breakpoint (480px web, contentWidth+20 email; document/print never stacks), and a `noStackMobile` row kept side by side in proportion on phones even when a stacking row follows it; (3) interaction — button `:hover` applies the configured hover colors; (4) RTL — `textDirection` reaches the computed direction; (5) style baseline — computed colors/fonts/radii/padding/column-widths diffed against the committed `scripts/browser-e2e-baseline.json` (regenerate intentional changes with `UPDATE_E2E_BASELINE=1 pnpm test:e2e`; computed values instead of pixel screenshots so the baseline is deterministic across macOS/Linux); (6) no horizontal overflow at mobile width; (7) preheader — `previewText` present but invisible/zero-size; (8) accessibility — img alt, link names, `role="presentation"` on layout tables; (9) image width pinning holds and stays inside its column; (10) every non-empty `<style>` parses into CSS rules; (11) document mode stays visible under print media emulation. Includes a negative control (a document with a bare `<p>`) that must fail the checks — a green run proves the gate can detect the regression it guards, not just that selectors matched nothing.

- **Previous-release parity**: `packages/react/src/regression/previous-release.test.tsx` — the realistic examples (`src/examples`) rendered with this build and with the last published Elements (`@unlayer/react-elements-previous`, an npm alias in devDependencies): designs and plain text must be identical; HTML is compared with reviewed file snapshots (`src/regression/__snapshots__`), so any change fails until updated with `vitest -u` and reviewed. `previous-release-patterns.test.tsx` does the same for the ways users write their own components (hooks, context, `useId`, Fragments, memo/forwardRef, a template component, entities in text): each states what React shows, and must match the previous release where it showed that. **After each release, move the alias to it.**
- **Template patterns**: `src/regression/patterns.test.tsx` — the ways templates are put together that broke before (Fragments, components returning arrays or null, hooks, memo/forwardRef, a reused element, HTML from a component, text in Rows/Columns, RTL, device hiding) rendered to HTML and designs against reviewed snapshots.
- **Hostile inputs**: `src/regression/hostile-input.test.tsx` — every value that often comes from users (text, links, image sources and text, menu items, social links, preview text, direction, language, font URLs, title) given markup in every mode; the parsed output must have no element or attribute it adds.
- **Render isolation**: `src/regression/render-isolation.test.tsx` — a render never leaks into the next (data, kept elements, order), and the same input always gives the same output.
- **Migration fidelity smoke test**: `packages/from-react-email/bench/smoke.ts` (`pnpm --filter @unlayer/from-react-email test:fidelity`, needs `playwright install chromium` once) — converts the templates in `packages/from-react-email/test/fixtures` both ways (codemod and runtime) and renders them next to their React Email originals in Chromium at 700px and 375px, with the network off. Fails on lost or added words, links or images, on any word shown at another font size on desktop, or on words moved on desktop (and on phones for the fixtures that match there, listed in `PHONE_EXACT`); a 2% tolerance absorbs font rendering differences between macOS and Linux. The full benchmark (`pnpm --filter @unlayer/from-react-email bench`, results in `FIDELITY.md`) runs the 106-template corpus locally.
- **The migration check's styles**: `packages/convert-core/src/cascade.ts` (tests in `packages/convert-core/test/cascade.test.ts`) — the content check reads both documents with a small CSS cascade (inline styles, the `<style>` rules that apply at a desktop width, the browser's defaults, inheritance) and compares each word's size, bold, italics, letter case, underline, color, the background behind it and a link's target; a gradient of written-out opaque colors counts as its first stop, and a `url()` image behind the original's text that the migration lost is a difference unless the box set a color under it that the migration shows (as where images don't load); `<html>`'s background and text styles count. The same cascade decides what's hidden (display:none, the `hidden` attribute, `max-height:0;overflow:hidden`, visibility, opacity, text only screen readers get: `sr-only` clipping or placed far off the page, compound selectors). It reads what React Email writes: Tailwind's `sm:` as `@media` nested in the rule (range syntax), custom properties (an unset one drops the declaration, as in the browser), `:not()` and the structural pseudo-classes, and drops a selector the browser can't read (`&gt;`); `initial`/`revert` take the property's initial value or the browser's style for the element, a box's `opacity` fades the text in it (compared as its color), and text that's the inbox preview on one side and in the email on the other differs. It also reads both documents at a phone's width (375px), where the same words must show, and places each word across the page at desktop width without a browser (`packages/convert-core/src/geometry.ts`: table cells, `display: table-cell`, inline-blocks, flex rows, widths, padding, auto margins, `align`): a word whose line sits more than 120px elsewhere (a column stacked or moved, a block on the other side) fails the check. On the 106 benchmark templates the model reads at most 100px apart where Chromium shows no move; images aren't compared (their place often depends on sizes inferred from content). **It fails closed**: a property, whether words show (on desktop or on phones), or where a word sits, unknown on one side only (a selector, condition or value it can't evaluate; a rule it can't read counts at the highest weight it could have), is `unverified` with the rule that caused it, and the check fails; unknown on both sides the same way (markup kept as it was) isn't. Every caller decides pass or fail the same way (`checkFails` in `verify.ts`; the CLI's `problems()` lists each part): the run, `compare` and each flipped boolean prop. On the 106-template benchmark every conversion has no style difference and nothing unverified; a change that adds either is a regression to look at.

## CI Quality Gates

- TypeScript strict compilation
- All unit tests pass
- Bundle size < 96KB (ESM)
- Elements output matches the previous release (designs, plain text) and the reviewed snapshots (HTML, template patterns); hostile inputs add no markup
- Next.js integration build succeeds
- Browser E2E gate passes (rendered documents verified in Chromium: 0px `<p>` margins, single `<body>`, no errors)
- Migration fidelity smoke test passes (fixture templates keep their content, text sizes and desktop layout)
- The migration check compares text styles as well as words, links and images (`cascade.test.ts`, and the converters' tests)
- Storybook smoke test passes (every story renders, no console errors)
- Storybook visual-drift gate passes (every story's computed styles and text match the committed baseline)
- CSP safety gate passes (green in CI; may fail locally on some Node setups due to an ESM interop quirk under the V8 flag)

## Review bar for the migration tool

What blocks a merge of the converter, the check or the CLI (`packages/convert-core`, `packages/from-react-email`, `packages/migrate`), and of Elements changes made for them:

1. **Elements regressions**: code that rendered with the last release renders differently (HTML, plain text, design) and the change isn't a documented fix.
2. **Check false passes**: the check passes a migration a reader sees differently, within what it promises (words, links, images, the compared text styles, what shows on desktop and phones, where lines sit beyond 120px).
3. **Destructive writes**: the CLI changes a file it wasn't asked to, or one git can't restore (`--write` refuses those unless `--allow-dirty`).
4. **Wrong exit codes**: a run that skipped, failed or checked nothing exits `0`.

Not blockers: a template the converter can't convert, or that the check fails (it fails closed: a refusal, with its reason, is the guarantee working); a check that fails a migration that looks the same (a false fail: worth fixing, not blocking); polish. Each blocker fix comes with a test that fails without it. A false pass found by the differential test (`pnpm --filter @unlayer/from-react-email test:differential`) is committed as a fixture it replays.

## Common Gotchas

- `fontFamily` must be `{ label: string, value: string }`, NOT a plain string
- `fontWeight` must be a number (400, 700), NOT a string
- Column count in a Row must match the layout (e.g., `TwoEqual` needs exactly 2 `<Column>` children)
- The shared package is private and bundled into react via tsup's `noExternal` — it's never installed separately
- `renderToHtml()` returns a complete HTML document (`<!DOCTYPE ...>` to `</html>`) with a per-mode shell matching the editor's export layouts; `renderToHtmlParts()` returns the embeddable `{ head, body }` chunks. Both use `renderToStaticMarkup` internally (no hydration markers)
