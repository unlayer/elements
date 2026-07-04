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
- **Storybook visual-drift gate**: `packages/react/scripts/storybook-visual.mjs` (`pnpm test:visual`, needs `pnpm build-storybook` first) — fingerprints the computed styles of every story (126 renders) at desktop + mobile widths in headless Chromium and diffs against the committed `scripts/storybook-visual-baseline.json` (dictionary-encoded; regenerate intentional changes with `UPDATE_VISUAL_BASELINE=1 pnpm test:visual`). Fails naming the exact stories and property-level diffs. Computed styles, not pixel screenshots — deterministic across macOS/Linux; blind only to pure rasterization differences.
- **Browser E2E gate**: `packages/react/scripts/browser-e2e.mjs` (`pnpm test:e2e`, needs `pnpm build` + `playwright install chromium` once) — renders full documents with the built `dist/` for all three modes and asserts in headless Chromium across eleven sections: (1) document contract — every `<p>` computes to 0px margins (the inline reset beats the UA default), exactly one `<body>`, title/styles/links applied, no console/page errors; (2) responsive — three columns side-by-side at desktop width, stacked full-width below the mobile breakpoint (480px web, contentWidth+20 email; document/print never stacks); (3) interaction — button `:hover` applies the configured hover colors; (4) RTL — `textDirection` reaches the computed direction; (5) style baseline — computed colors/fonts/radii/padding/column-widths diffed against the committed `scripts/browser-e2e-baseline.json` (regenerate intentional changes with `UPDATE_E2E_BASELINE=1 pnpm test:e2e`; computed values instead of pixel screenshots so the baseline is deterministic across macOS/Linux); (6) no horizontal overflow at mobile width; (7) preheader — `previewText` present but invisible/zero-size; (8) accessibility — img alt, link names, `role="presentation"` on layout tables; (9) image width pinning holds and stays inside its column; (10) every non-empty `<style>` parses into CSS rules; (11) document mode stays visible under print media emulation. Includes a negative control (a document with a bare `<p>`) that must fail the checks — a green run proves the gate can detect the regression it guards, not just that selectors matched nothing.

## CI Quality Gates

- TypeScript strict compilation
- All unit tests pass
- Bundle size < 75KB (ESM)
- Next.js integration build succeeds
- Browser E2E gate passes (rendered documents verified in Chromium: 0px `<p>` margins, single `<body>`, no errors)
- Storybook smoke test passes (every story renders, no console errors)
- Storybook visual-drift gate passes (every story's computed styles match the committed baseline)
- CSP safety gate passes (green in CI; may fail locally on some Node setups due to an ESM interop quirk under the V8 flag)

## Common Gotchas

- `fontFamily` must be `{ label: string, value: string }`, NOT a plain string
- `fontWeight` must be a number (400, 700), NOT a string
- Column count in a Row must match the layout (e.g., `TwoEqual` needs exactly 2 `<Column>` children)
- The shared package is private and bundled into react via tsup's `noExternal` — it's never installed separately
- `renderToHtml()` returns a complete HTML document (`<!DOCTYPE ...>` to `</html>`) with a per-mode shell matching the editor's export layouts; `renderToHtmlParts()` returns the embeddable `{ head, body }` chunks. Both use `renderToStaticMarkup` internally (no hydration markers)
