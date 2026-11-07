# Contributing to Hyper Elements

Thanks for your interest in contributing! This guide will help you get set up and understand how the project works.

## Prerequisites

- **Node.js** v20+ (CI runs Node 20; `.nvmrc` pins v22 for local dev)
- **pnpm** v9.7+

## Getting Started

```bash
# Clone the repo
git clone https://github.com/hyper-elements/hyper-elements.git
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
  react/       → Published package (@unlayer/react-elements), with a Document written as a PDF (/pdf) and a
                 Canvas as PNG or SVG (/image) as entries of their own
  core/        → Component definitions, validation, layout, and the writers (src/writers/: email, page and print
                 HTML, plain text; src/pdf/ and src/image/: the PDF and image writers, with their own entries);
                 bundled into react, not published
  migrate/     → The migration CLI (@unlayer/migrate), with the React Email converter (src/react-email/) and what
                 converters share (src/convert/)
examples/      → The demo application (demo/) and runnable examples
tests/
  nextjs-integration/  → Integration test with Next.js 15 + Server Components (next14-, next16-, jest-integration/: more consumers)
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

### Components

The components are made from their definitions in `packages/core/src/components.ts` (props, styles, children, support
per output, editors): `packages/react/src/primitives/components.tsx` turns each into a React component whose props'
types come from the same definition that validates them. To add a component, define it in core and give each output
a writer (`packages/core/src/writers/{email,page}/`); see `packages/core/README.md`.

### Rendering Pipeline

```
JSX → one React render collects the template (packages/react/src/primitives/collect.tsx)
  → packages/core checks it and lays it out (each block's width)
  → its writers (packages/core/src/writers) write the email, page or print HTML and the plain text
```

`render()` writes the output its root says (`<Email>`, `<Page>`, `<Document>`, `<Canvas>`); `toDesign()` and
`fromDesign()` (`@unlayer/react-elements/builder`) take a template to the Unlayer builder's design JSON and back.

### Key Dependencies

The published package has no dependencies of its own: React and react-dom are peers, and the private workspace
package (`packages/core`) is bundled into it. The HTML is written in this repository (`packages/core/src/writers`),
and each builder tool's default values are in `packages/react/src/builder/tool-defaults.ts`.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Add tests for new components or behavior changes
- Ensure `pnpm build && pnpm test` passes
- The CI pipeline checks:
  - TypeScript compilation
  - Unit tests
  - Bundle size budgets (set in `.github/workflows/test.yml`)
  - Next.js integration test (Server Components)

### Versioning

Version bumps are automatic on merge to `main`. To control the bump type, add a label to your PR:

- `release:patch` (default) — bug fixes
- `release:minor` — new features
- `release:major` — breaking changes

## Code Style

- TypeScript strict mode
- Follow existing naming conventions: `name.ts`, `name.test.ts`, stories in `*.stories.tsx`
- Keep `packages/core` framework-agnostic — no React imports (the writers' JSX writes strings)

## Questions?

Open an issue or start a discussion on GitHub.
