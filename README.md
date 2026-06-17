<p align="center">
  <img src="https://unlayer.com/logo_square.png" alt="Unlayer Elements" width="50" />
</p>

<h1 align="center">Unlayer Elements</h1>

<p align="center">
  Write once in React. Render emails, web pages, and PDFs from the same component tree.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/v/@unlayer/react-elements.svg" alt="npm version" /></a>
  <a href="https://github.com/unlayer/elements/actions/workflows/test.yml"><img src="https://github.com/unlayer/elements/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/unlayer/elements/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@unlayer/react-elements.svg" alt="license" /></a>
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/dm/@unlayer/react-elements.svg" alt="downloads" /></a>
</p>

---

<p align="center">
  <img src="./assets/elements-demo.gif" alt="Unlayer Elements: the same JSX rendered as email, web, and document output" width="800" />
</p>

Unlayer Elements is an open-source React component library that lets you build content once and render it across three output modes:

- **Email** → Outlook, Gmail, Yahoo, Apple Mail
- **Web** → Responsive pages and embedded experiences
- **Document** → Print-ready HTML for PDF generation

<p align="center">
  <img src="https://unlayer.com/images/unlayer-elements-dark.png" alt="Unlayer Elements: Architecture" width="1200" />
</p>

Elements is built and maintained by the team behind [Unlayer](https://unlayer.com), the content creation platform used by thousands of companies to power email, page, and document experiences inside their products.

## Why Elements?

| Tool          | Email | Web | PDF |
|---------------|:-----:|:---:|:---:|
| React Email   |  ✅   | ❌  | ❌  |
| MJML          |  ✅   | ❌  | ❌  |
| PDF libraries |  ❌   | ❌  | ✅  |
| **Elements**  |  ✅   | ✅  | ✅  |

Elements is designed for teams that need to generate email, web, and document experiences from a single React codebase.

## Quick Start

```bash
npm install @unlayer/react-elements
```

```tsx
import {
  Email, Row, Column, ColumnLayouts,
  Heading, Paragraph, Button, renderToHtml
} from '@unlayer/react-elements';

function WelcomeEmail() {
  return (
    <Email backgroundColor="#f0f0f0" contentWidth="600px">
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="20px">
        <Column>
          <Heading
            fontSize="24px"
            fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }}
          >
            Welcome!
          </Heading>
          <Paragraph html="Thanks for signing up." fontSize="14px" />
          <Button
            href="https://example.com"
            backgroundColor="#0879A1"
            color="#ffffff"
          >
            Get Started
          </Button>
        </Column>
      </Row>
    </Email>
  );
}

// Render to a clean HTML string — no React hydration markers
const html = renderToHtml(<WelcomeEmail />);
```

## Features

### One Component Tree

Build content once and render it as email, web, or document. Share components, styling, and content across all three output modes from the same React codebase.

### React Developer Workflow

Works with React, Next.js, Remix, and Server Components. Use familiar JSX patterns and existing frontend workflows without learning a new templating language.

### Production Output

Generates email-safe HTML, responsive web HTML, and print-ready HTML for PDF generation — optimized output for each destination without maintaining separate implementations.

### Visual Builder Compatible

Export Unlayer-compatible design JSON with `renderToJson()` for round-tripping between code and the visual editor. Ideal for teams that want the flexibility of code alongside visual editing workflows.

### TypeScript First

Built with TypeScript from the ground up — full type definitions, autocomplete for components and props, and safer development with better IDE support.

### Clean HTML Output

`renderToHtml()` generates production-ready HTML with no React hydration markers, no framework artifacts, and no client-side JavaScript required.

### Lightweight & Tree-Shakeable

~12KB gzipped (under 60KB ESM), tree-shakeable, with zero client-side JavaScript required. Designed for performance-sensitive applications and server-side rendering environments.

## Real-World Use Cases

### Transactional Emails

Build and maintain order confirmations, password resets, and receipts from the same React codebase that powers your application.

### PDF Generation

Generate invoices, contracts, and reports server-side without maintaining a separate PDF system.

### CMS-Driven Content

Render content from a CMS, API, or database into emails, web pages, and documents using a shared component model.

### Email + Web Parity

Publish the same content as an email campaign, a web archive, and a public landing page from a single source of truth.

## Components

| Component | Description |
|-----------|-------------|
| `<Email>` | Root wrapper — email-safe HTML (tables for Outlook/Gmail) |
| `<Page>` | Root wrapper — responsive web (div + flexbox) |
| `<Document>` | Root wrapper — print/PDF optimized |
| `<Row>` | Layout container with column layout support |
| `<Column>` | Column inside a Row |
| `<Button>` | CTA button with hover states and links |
| `<Heading>` | Heading (h1–h4) |
| `<Paragraph>` | Rich text with plain text or HTML content |
| `<Image>` | Responsive image with alt text |
| `<Divider>` | Horizontal separator |
| `<Social>` | Social media icon links |
| `<Menu>` | Navigation menu |
| `<Table>` | Data table |
| `<Video>` | YouTube/Vimeo embed |
| `<Html>` | Custom HTML passthrough |

## Structure

Components follow a strict hierarchy:

```
<Email>              ← sets render mode
  <Row layout={…}>   ← layout container
    <Column>         ← must match layout column count
      <Button />     ← content components
      <Paragraph />
    </Column>
  </Row>
</Email>
```

## Column Layouts

```tsx
import { Row, Column, ColumnLayouts } from '@unlayer/react-elements';

// Each Row must contain the matching number of <Column> children.
<Row layout={ColumnLayouts.OneColumn}>                {/* [1]         → 100% */}
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoEqual}>                 {/* [1,1]       → 50% + 50% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoWideNarrow}>            {/* [2,1]       → 67% + 33% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.ThreeEqual}>               {/* [1,1,1]     → 33% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.FourEqual}>                {/* [1,1,1,1]   → 25% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row cells={[3, 1]}>                                  {/* custom ratio */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
```

## Documentation

For the full API reference, component props, design patterns, and common mistakes, see the **[React package documentation](./packages/react/README.md)**.

## Packages

| Package | Description | Published |
|---------|-------------|-----------|
| [`@unlayer/react-elements`](./packages/react) | React components and renderers | [![npm](https://img.shields.io/npm/v/@unlayer/react-elements.svg)](https://www.npmjs.com/package/@unlayer/react-elements) |
| [`@unlayer-internal/shared-elements`](./packages/shared) | Framework-agnostic shared logic | Internal |
| [`@unlayer/elements-demo`](./packages/demo) | Demo application | — |

## Development

```bash
# Prerequisites: Node.js (see .nvmrc), pnpm 9+

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Launch Storybook
pnpm storybook:hub
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](./LICENSE) — Unlayer, Inc.
