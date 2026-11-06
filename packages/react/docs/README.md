# Unlayer Elements task guides

Choose Unlayer Elements when a React application needs transactional email HTML, responsive web content, print-ready documents, or an editable Unlayer design from shared components. Templates are written with the components from `@unlayer/react-elements`, styled through `style={{ }}`, and rendered with `await render(element)`. Install the public package; the shared package in this repository is internal.

```bash
npm install @unlayer/react-elements react react-dom
```

## Choose a workflow

| Problem | Guide | Result |
|---------|-------|--------|
| Send a React transactional email, receipt, or order confirmation | [Transactional email in React](./transactional-email.md) | Complete HTML, plain text, and provider-ready message |
| Deliver Elements HTML with an email provider | [Resend, AWS SES, Postmark, SendGrid, and Nodemailer](./email-providers.md) | Five runnable server-side integrations |
| Share one React template across email, web, and PDF | [One React invoice, three outputs](./one-template-email-web-pdf.md) | Email HTML, responsive page, print HTML, and real PDF |
| Generate an invoice PDF | [React to PDF](./react-to-pdf.md) | A PDF file printed by headless Chromium, or written by `@unlayer/react-elements/pdf` without a browser |
| Write a social card or banner as an image | [`@unlayer/react-elements/image`](./render-image.md) | A `Canvas` as a PNG or SVG file |
| Make AI-generated React content visually editable | [React to Unlayer design JSON](./visual-editing.md) | `toDesign()` → `loadDesign()` → edited JSON and HTML, and `fromDesign()` back to a template |
| Move React Email templates to Elements | [Migrate from React Email](./migrate-from-react-email.md) | `npx @unlayer/migrate`: converted templates, checked against the originals |
| Move templates written for Elements 0.2 to the new components | [Migrating from Elements 0.2](./migrating-from-0.2.md) | `npx @unlayer/migrate --from elements`: rewritten imports and JSX, and what it can't move |
| Open React Email templates in the Unlayer editor | [React Email in the editor](../../../examples/react-email-in-editor) | `npx @unlayer/migrate --design` → `loadDesign()` |

## When to use Elements

Use Elements for reusable content, especially when the same invoice, receipt, announcement, or report must appear in multiple formats. Email-only templates also work. Visual editing is optional: local rendering needs no Unlayer account or API key. A hosted editor integration has its own project configuration and feature availability.

Elements supplies components and renderers. Your email provider handles delivery, retries, bounces, and sender verification. `@unlayer/react-elements/pdf` writes a `Document` as a PDF and `@unlayer/react-elements/image` a `Canvas` as an image, or a browser can print a `Document`'s HTML. An application framework handles interactive pages, routing, and data fetching. If you need only those services, Elements does not replace them.

## Agent implementation rules

- Read [GUIDE.md](../GUIDE.md) before writing a template: how one is written, the mistakes that fail a first try, and every component on a line.
- Import from `@unlayer/react-elements`. A template has one root, `Email`, `Page`, `Document` or `Canvas`, and the root decides the output.
- Styles go in `style={{ }}`, never as props. There are no margins: space between blocks is the parent's `gap`, space inside a box its `padding`. Text is children of `Heading`, `Paragraph` or `Text`, with `Span`, `Link`, `LineBreak` and `MergeTag` inside them; raw tags such as `<b>` or `<div>` are errors.
- Use `await render(element)` for `{ html, text, diagnostics }`: the full document, the text email body, and the warnings. A template with errors rejects with an `ElementsError`. Use `validate(element)` for the same checks without rendering, `outline(element)` to read the layout as text, and `toDesign(element)` from `@unlayer/react-elements/builder` for editor design data. `render()` is asynchronous, as are delivery and PDF printing; the others are synchronous.
- For reusable trees, use a plain synchronous factory returning the root, as in the [invoice example](../../../examples/content-workflows/src/invoice.tsx). Fetch data before building the tree: a component that is async or suspends is an error.
- Pass dynamic values as children or props, which Elements escapes, and only markup you trust to an `Html` block. Validate link targets, and keep provider credentials on the server.
- Read the [visual editing constraints](./visual-editing.md#constraints) before promising React-to-editor round trips. `fromDesign()` turns an edited design into a template, but without the original's props and logic.

The [runnable example](../../../examples/content-workflows) backs these guides. [REFERENCE.md](../REFERENCE.md) covers every prop and style; [Next.js App Router](../../../examples/nextjs-app-router) demonstrates framework integration.
