<p align="center">
  <img src="./apps/website/public/favicon.svg" alt="Hyper Elements" width="50" />
</p>

<h1 align="center">Hyper Elements</h1>

<p align="center">
  Write once in React. Render emails, web pages, and PDFs from the same component tree.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/v/@unlayer/react-elements.svg" alt="npm version" /></a>
  <a href="https://github.com/hyper-elements/hyper-elements/actions/workflows/test.yml"><img src="https://github.com/hyper-elements/hyper-elements/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/hyper-elements/hyper-elements"><img src="https://codecov.io/gh/hyper-elements/hyper-elements/branch/main/graph/badge.svg" alt="codecov" /></a>
  <a href="https://github.com/hyper-elements/hyper-elements/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@unlayer/react-elements.svg" alt="license" /></a>
  <a href="https://www.npmjs.com/package/@unlayer/react-elements"><img src="https://img.shields.io/npm/dm/@unlayer/react-elements.svg" alt="downloads" /></a>
</p>

---

Hyper Elements is an open-source React component library for transactional emails, email templates, landing pages, invoices, reports, documents, PDFs and images. Build content once and render it across three output modes:

- **Email** → Outlook, Gmail, Yahoo, Apple Mail
- **Web** → Responsive pages and embedded experiences
- **Document** → Print-ready HTML for PDF generation
- **Image** → PNG or SVG images

<p align="center">
  <img width="1672" height="941" alt="hyperelementsflow" src="https://github.com/user-attachments/assets/e3730f39-d183-401e-9bd8-72e197c1bd54" />
</p>

Hyper Elements is built and maintained by the team behind [Unlayer](https://unlayer.com), the content creation platform used by thousands of companies to power email, page, and document experiences inside their products.

## Why Hyper Elements?

| Tool          | Email | Web | PDF |
|---------------|:-----:|:---:|:---:|
| React Email   |  ✅   | ❌  | ❌  |
| MJML          |  ✅   | ❌  | ❌  |
| PDF libraries |  ❌   | ❌  | ✅  |
| **Hyper Elements**  |  ✅   | ✅  | ✅  |

Hyper Elements is designed for teams that need to generate email, web, and document experiences from a single React codebase.

## Quick Start

```bash
npm install @unlayer/react-elements
```

```tsx
import { Button, Column, Email, Heading, Text, render } from "@unlayer/react-elements";

function WelcomeEmail() {
  return (
    <Email width={600} style={{ backgroundColor: "#f0f0f0", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Column style={{ backgroundColor: "#ffffff", padding: 20, gap: 12 }}>
        <Heading level={1} style={{ fontSize: 24 }}>Welcome!</Heading>
        <Text style={{ fontSize: 14 }}>Thanks for signing up.</Text>
        <Button href="https://example.com" style={{ backgroundColor: "#0879A1", color: "#ffffff" }}>Get started</Button>
      </Column>
    </Email>
  );
}

// A complete HTML document (<!DOCTYPE ...> to </html>) and its plain text:
// email-client-safe shell included, no React hydration markers.
const { html, text } = await render(<WelcomeEmail />);
```

Upgrading from Unlayer Elements, whose components aren't in Hyper Elements? See [Moving from Unlayer Elements](./packages/react/README.md#moving-from-unlayer-elements).

## Email Client Compatibility Notes

### Targeted Clients

Email mode is designed for the major clients listed throughout this repo:

- Outlook
- Gmail
- Yahoo
- Apple Mail

### Why Email Mode Uses Table-Based HTML

Email clients do not share a modern browser CSS baseline. To keep layout behavior stable across major inboxes (especially Outlook's Word-based renderer), `<Email>` renders with table-oriented HTML and MSO-specific patterns instead of web-style div/flex layouts.

Repository evidence:

- `<Email>` is documented and tested as table-based output for email clients: [packages/react/README.md](./packages/react/README.md)
- The email document shell includes MSO conditionals and Office's namespace: [packages/core/src/writers/email/index.tsx](./packages/core/src/writers/email/index.tsx)
- Golden output asserts table markup and Outlook-specific conditionals (`[if mso]`): [packages/react/src/golden-template.test.tsx](./packages/react/src/golden-template.test.tsx)

### Known Compatibility Caveats (Current Repo Scope)

- Validation in this repo is renderer-focused and browser-based (snapshots + Chromium E2E). It is not a client-emulator matrix checked into this repository.
- The email output is checked in Chromium and against a model of Outlook's layout, not in real Outlook.
- Email responsive stacking depends on head CSS/media queries; this is explicitly exercised by the E2E gate in Chromium, not by an inbox simulator.

Validation references:

- Reviewed HTML snapshots of realistic examples: [packages/react/src/regression/previous-release.test.tsx](./packages/react/src/regression/previous-release.test.tsx)
- Reviewed HTML snapshots of the ways templates are put together: [packages/react/src/regression/patterns.test.tsx](./packages/react/src/regression/patterns.test.tsx)
- Golden end-to-end template coverage: [packages/react/src/golden-template.test.tsx](./packages/react/src/golden-template.test.tsx)
- Browser E2E gate and exact assertions: [packages/react/scripts/browser-e2e.mjs](./packages/react/scripts/browser-e2e.mjs)

### CSP Safety Validation

Hyper Elements includes a strict CSP gate that runs the built package under:

- `node --disallow-code-generation-from-strings`

The gate's purpose is to fail if import/render paths evaluate strings (`eval` / `new Function`).

- CSP probe implementation: [packages/react/scripts/csp-probe.mjs](./packages/react/scripts/csp-probe.mjs)
- Package script (`test:csp`): [packages/react/package.json](./packages/react/package.json)

Interpretation guidance:

- A passing `test:csp` run is evidence that the exercised import/render paths are compatible with CSP configurations that disallow `'unsafe-eval'`.
- This probe is not a universal guarantee for every browser/runtime configuration.
- If `test:csp` is failing in CI or your local environment, treat strict CSP compatibility as unresolved for that run and investigate the reported failure.

## Features

### One Component Tree

Build content once and render it as email, web, or document. Share components, styling, and content across all three output modes from the same React codebase.

### React Developer Workflow

Works with React, Next.js, Remix, and Server Components. Use familiar JSX patterns and existing frontend workflows without learning a new templating language.

### Production Output

Generates email-safe HTML, responsive web HTML, and print-ready HTML for PDF generation — optimized output for each destination without maintaining separate implementations.

### Visual Builder Compatible

`toDesign()` writes a template as Unlayer design JSON, to hand code-authored templates to the visual editor, and `fromDesign()` reads an edited design back as a template. See the [code-to-visual-editing workflow](./packages/react/docs/visual-editing.md).

### TypeScript First

Built with TypeScript from the ground up — full type definitions, autocomplete for components and props, and safer development with better IDE support.

### Clean HTML Output

`render()` generates a complete, production-ready HTML document with no React hydration markers, no framework artifacts, and no client-side JavaScript required, along with its plain text. Need to compose the document yourself? It also returns `head`, `body` and `bodyStyle`.

### No Client-Side JavaScript

Tree-shakeable, with zero client-side JavaScript required. Designed for server-side rendering environments.

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
| `<Email>` | Root: email-safe HTML (tables for Outlook/Gmail) |
| `<Page>` | Root: a responsive web page |
| `<Document>` | Root: print-ready HTML on pages of its size, and PDF with `@unlayer/react-elements/pdf` |
| `<Canvas>` | Root: an image of a fixed size, with `@unlayer/react-elements/image` |
| `<Section>` | A band whose background spans the window |
| `<Row>` | Its children side by side, stacked on phones |
| `<Column>` | Its children stacked; with a background, a card |
| `<Grid>` | Its children in columns of equal width, row after row |
| `<Layer>` | Its children over each other: an image with words on it |
| `<Heading>` | A heading, `level` 1 to 6 |
| `<Text>` | A block of text, with `<Span>`, `<Link>`, `<LineBreak>` and `<MergeTag>` inside it |
| `<Button>` | A link drawn as a button, with its colors on hover |
| `<Image>` | An image; `src` has the file's size, `style.width` the size shown |
| `<Divider>` | A horizontal line |
| `<List>` | A bulleted or numbered list of `<ListItem>`s |
| `<Table>` | A table of `<TableRow>`s and `<TableCell>`s, with document headers and footers |
| `<Video>` | A YouTube or Vimeo video |
| `<Social>` | Social media icon links |
| `<Menu>` | A line or column of links |
| `<Svg>` | Shapes drawn in a box of their own |
| `<Html>` | Markup written as it is, for what no component says |
| `<PageBreak>`, `<PageHeader>`, `<PageFooter>`, `<PageNumber>` | In a Document: where a page ends, what's on every page, and page numbers |

## Structure

```
<Email>            ← the root: Email, Page, Document or Canvas
  <Section>        ← a band whose background spans the window (optional)
    <Row>          ← its children side by side, stacked on phones
      <Column>     ← its children stacked
        <Heading />
        <Button />
      </Column>
    </Row>
  </Section>
</Email>
```

Styles go in `style={{ }}`. A root, a `Section` and a `Column` stack what they hold, and the space between blocks is their parent's `gap`.

## Column Layouts

```tsx
import { Column, Grid, Row } from "@unlayer/react-elements";

// Equal shares.
<Row style={{ gap: 16 }}>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// A set width, and what's left.
<Row style={{ gap: 16 }}>
  <Column style={{ width: 180 }}>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// Shares of two to one.
<Row style={{ gap: 16 }}>
  <Column style={{ flex: 2 }}>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// Rows of three, one under another on phones.
<Grid columns={3} style={{ gap: 16 }}>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Grid>
```

## Documentation

For the full API reference, component props, design patterns, and common mistakes, see the **[React package documentation](./packages/react/README.md)**.

## Packages

| Package | Description | Published |
|---------|-------------|-----------|
| [`@unlayer/react-elements`](./packages/react) | React components and renderers, and a `<Document>` as a PDF (`/pdf`) and a `<Canvas>` as PNG or SVG (`/image`), with no browser | [![npm](https://img.shields.io/npm/v/@unlayer/react-elements.svg)](https://www.npmjs.com/package/@unlayer/react-elements) |
| [`@unlayer/migrate`](./packages/migrate) | Migrate React Email templates to Hyper Elements, checked against the originals; the converter as a library at `@unlayer/migrate/react-email` | Not yet |
| [`@unlayer-internal/elements-core`](./packages/core) | Component definitions, validation, layout, and the writers: email, page and print HTML, plain text | Internal (bundled into `@unlayer/react-elements`) |

## Examples

Runnable projects you can clone and experiment with:

| Example | Description |
|---------|-------------|
| [`examples/demo`](./examples/demo) | The demo site (Vite + React): a component gallery and sample templates in each output |
| [`examples/content-workflows`](./examples/content-workflows) | One React invoice → email + web + real PDF, five email providers, and editable design JSON |
| [`examples/nextjs-app-router`](./examples/nextjs-app-router) | Next.js 15 App Router — renders an email with `render()` in a Server Component, previews it at `/email-preview`, and serves the raw HTML from a Route Handler |

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

## FAQ

### What makes Hyper Elements production ready?

Hyper Elements writes its HTML with its own open-source writers, in [this repository](./packages/core/src/writers). Their output is locked down by reviewed HTML snapshots, a golden-template test, and browser-level gates (see below), so a change to the HTML they write fails until it's reviewed. Releases follow semantic versioning and each one is published with [release notes](https://github.com/hyper-elements/hyper-elements/releases), so any change to the API or output is visible before you upgrade.

### How is the email output actually tested?

Every release must pass, in CI:

- **Golden template test:** a full, realistic email rendered through all render pipelines and checked by what it draws.
- **Snapshot tests:** realistic examples and the ways templates are put together, compared with reviewed HTML.
- **Previous-release tests:** the examples rendered with this build and with the last published release, whose designs, plain text, words, links and images must match.
- **Browser E2E gate:** complete documents rendered from the built package and verified in headless Chromium: responsive columns stack at the mobile breakpoint, paragraphs compute to true zero margins, RTL text direction propagates, button hover states apply, the preheader stays invisible, no horizontal overflow on mobile, and accessibility basics hold (image alt text, link names, `role="presentation"` on layout tables). The suite includes a negative control that must fail, proving the gate can catch regressions rather than just pass vacuously.
- **Visual-drift gate:** the computed styles of every Storybook story are fingerprinted at desktop and mobile widths and diffed against a committed baseline, so unintended style changes fail the build with property-level diffs.
- **Next.js integration test:** a real Next.js 15 app with Server Components builds against the published package artifact.

Email mode writes table-based HTML, with Outlook's markup in conditional comments. The output is checked in Chromium and against a model of Outlook's layout, not in real Outlook. For repository-scoped compatibility evidence and caveats, see [Email Client Compatibility Notes](#email-client-compatibility-notes).

### Is the PDF output a real PDF engine?

`<Document>` renders to print-ready HTML, and [`@unlayer/react-elements/pdf`](./packages/react/docs/render-pdf.md) writes it as a PDF with no browser. You can also use Unlayer's [PDF export service](https://docs.unlayer.com/builder/export-pdf) to get a finished PDF with a single API call, or pass the print-ready HTML to any HTML-to-PDF library: the [Playwright guide](./packages/react/docs/react-to-pdf.md) shows a complete local pipeline. A `<Document>` sets its pages with `size`, `margin`, `<PageBreak>`, `<PageHeader>` and `<PageFooter>`.

### Can I use Hyper Elements without the Unlayer platform?

Yes. The package is MIT-licensed, makes no network calls, requires no API key or account, and has no runtime dependency on Unlayer's platform. `render()` runs entirely in your own process, and the output is plain, static HTML that you own outright. The platform integration (design JSON through `toDesign()` and `fromDesign()`) is strictly opt-in: valuable if you also use the Unlayer builder, ignorable if you don't.

### Is there a visual editor for Hyper Elements?

Yes. Hyper Elements is fully compatible with the [Unlayer editor](https://unlayer.com), the drag-and-drop builder for emails, pages, and documents that you can embed in your own product. `toDesign()` writes your template as Unlayer design JSON that loads directly into the editor, so developers can build templates in code and hand them off to non-technical teammates for visual editing, and `fromDesign()` reads an edited design back as a template. See [the builder adapter](./packages/react/README.md#to-the-unlayer-builder-and-back) for what the builder can hold.

### Can I create custom components?

Yes. A function that returns components is a component of your own, and `component()` makes a named block with typed props and its own editors. See [Your own components](./packages/react/README.md#your-own-components) for a complete example.

## Task Guides

Start with [when to use Hyper Elements](./packages/react/docs/README.md), or go directly to a runnable workflow:

- [Build transactional emails in React](./packages/react/docs/transactional-email.md) — HTML and plain-text receipts, order confirmations, and password reset patterns.
- [Send with Resend, AWS SES, Postmark, SendGrid, or Nodemailer](./packages/react/docs/email-providers.md) — provider setup and complete server-side integrations.
- [One React invoice to email, web, and PDF](./packages/react/docs/one-template-email-web-pdf.md) — share content across all three output modes.
- [Generate a real PDF with Playwright](./packages/react/docs/react-to-pdf.md) — print document HTML with Chromium.
- [Make code and AI-generated templates visually editable](./packages/react/docs/visual-editing.md) — `toDesign()` → Unlayer `loadDesign()` → edited JSON and HTML.

The [content workflows example](./examples/content-workflows) contains the executable source behind these guides.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](./LICENSE) — Unlayer, Inc.
