# Contributing to Unlayer Elements

Thanks for your interest in contributing! This guide will help you get set up and understand how the project works.

## Prerequisites

- **Node.js** v20+ (CI runs Node 20; `.nvmrc` pins v22 for local dev)
- **pnpm** v9.7+

## Getting Started

```bash
# Clone the repo
git clone https://github.com/unlayer/elements.git
cd elements

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
packages/
  react/       → Published package (@unlayer/react-elements)
  shared/      → Internal shared logic (bundled into react, not published)
  demo/        → Demo application
tests/
  nextjs-integration/  → Integration test with Next.js 15 + Server Components
```

## Development Workflow

### Making Changes

1. Create a branch from `main`
2. Make your changes in the appropriate package
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm test` to ensure tests pass
5. Open a pull request against `main`

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode (from packages/react)
cd packages/react && pnpm test -- --watch
```

### Storybook

```bash
# Launch Storybook for the React package
cd packages/react && pnpm storybook

# Build and serve the aggregated Storybook hub
pnpm storybook:hub
```

## Architecture Overview

### Component Factory

Most content components (Button, Heading, Paragraph, etc.) are created via `createItemComponent()` in `packages/react/src/utils/create-component.tsx`. This factory:

- Maps flat "semantic" props to the nested structure expected by `@unlayer/exporters`
- Attaches a render function used by `renderToJson()`
- Handles children-as-text shorthand

To add a new component, use the factory — don't create components from scratch.

### Rendering Pipeline

```
JSX props → mapSemanticProps() → nested values
  → ReactDOMServer.renderToString() → innerHTML
  → BodyExporter[mode]() → final HTML
```

Three modes: `email` (table-based), `web` (div + flexbox), `document` (print).

### Key Dependencies

| Package | Role |
|---------|------|
| `@unlayer/exporters` | Converts component values to HTML for each render mode |
| `@unlayer/types` | TypeScript types for all component value shapes |

These are pinned in `pnpm-workspace.yaml` via the catalog feature and updated automatically by the `update-deps` workflow.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Add tests for new components or behavior changes
- Ensure `pnpm build && pnpm test` passes
- The CI pipeline checks:
  - TypeScript compilation
  - Unit tests
  - Bundle size budget (ESM must be < 60KB)
  - Next.js integration test (Server Components)

### Versioning

Version bumps are automatic on merge to `main`. To control the bump type, add a label to your PR:

- `release:patch` (default) — bug fixes
- `release:minor` — new features
- `release:major` — breaking changes

## Code Style

- TypeScript strict mode
- Use the `createItemComponent` factory for new content components
- Follow existing naming conventions: `Component.tsx`, `Component.test.tsx`, `Component.stories.tsx`
- Keep the shared package framework-agnostic — no React imports

## Questions?

Open an issue or start a discussion on GitHub.
