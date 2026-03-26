<p align="center">
  <img src="https://unlayer.com/logo.svg" alt="Unlayer Elements" width="200" />
</p>

<h1 align="center">Unlayer Elements</h1>

<p align="center">
  React components for building emails, pages, and documents in code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/v/@unlayer/react-elements.svg" alt="npm version" /></a>
  <a href="https://github.com/unlayer/elements/actions/workflows/test.yml"><img src="https://github.com/unlayer/elements/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/unlayer/elements/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@unlayer/react-elements.svg" alt="license" /></a>
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/dm/@unlayer/react-elements.svg" alt="downloads" /></a>
</p>

---

Write email templates, landing pages, and printable documents using familiar React components. Unlayer Elements renders to **three distinct outputs** from the same component tree:

- **Email** — table-based HTML safe for Outlook, Gmail, Yahoo, and all major email clients
- **Web** — responsive div + flexbox HTML for web pages
- **Document** — print-optimized HTML for PDF generation

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

- **15 components** — Button, Heading, Paragraph, Image, Divider, Social, Menu, Table, Video, Html, and layout primitives (Email, Page, Document, Row, Column)
- **3 render modes** — Email (tables), Web (flexbox), Document (print) from the same JSX
- **Server Components** — works with Next.js App Router, Remix, and any SSR framework
- **Clean HTML output** — `renderToHtml()` produces production-ready HTML with no framework artifacts
- **Design JSON** — `renderToJson()` exports Unlayer-compatible design JSON for round-tripping with the visual editor
- **TypeScript-first** — full type definitions with autocomplete for every prop
- **Tiny bundle** — under 50KB ESM, tree-shakeable, zero client-side JS required

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
