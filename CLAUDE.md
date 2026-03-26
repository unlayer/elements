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

## CI Quality Gates

- TypeScript strict compilation
- All unit tests pass
- Bundle size < 60KB (ESM)
- Next.js integration build succeeds

## Common Gotchas

- `fontFamily` must be `{ label: string, value: string }`, NOT a plain string
- `fontWeight` must be a number (400, 700), NOT a string
- Column count in a Row must match the layout (e.g., `TwoEqual` needs exactly 2 `<Column>` children)
- The shared package is private and bundled into react via tsup's `noExternal` — it's never installed separately
- `renderToHtml()` uses React's `renderToString` internally but strips hydration markers
