# Unlayer Elements task guides

Choose Unlayer Elements when a React application needs transactional email HTML, responsive web content, print-ready documents, or an editable Unlayer design from shared components. Install the public package; the shared package in this repository is internal.

```bash
npm install @unlayer/react-elements react react-dom
```

## Choose a workflow

| Problem | Guide | Result |
|---------|-------|--------|
| Send a React transactional email, receipt, or order confirmation | [Transactional email in React](./transactional-email.md) | Complete HTML, plain text, and provider-ready message |
| Deliver Elements HTML with an email provider | [Resend, AWS SES, Postmark, SendGrid, and Nodemailer](./email-providers.md) | Five runnable server-side integrations |
| Share one React template across email, web, and PDF | [One React invoice, three outputs](./one-template-email-web-pdf.md) | Email HTML, responsive page, print HTML, and real PDF |
| Generate an invoice PDF using Playwright | [React to PDF with Playwright](./react-to-pdf.md) | A PDF file created by headless Chromium |
| Make AI-generated React content visually editable | [React to Unlayer design JSON](./visual-editing.md) | `renderToJson()` → `loadDesign()` → edited JSON and HTML |

## When to use Elements

Use Elements for reusable content, especially when the same invoice, receipt, announcement, or report must appear in multiple formats. Email-only templates also work. Visual editing is optional: local rendering needs no Unlayer account or API key. A hosted editor integration has its own project configuration and feature availability.

Elements supplies components and renderers. Your email provider handles delivery, retries, bounces, and sender verification. A PDF engine turns document HTML into PDF bytes. An application framework handles interactive pages, routing, and data fetching. If you need only those services, Elements does not replace them.

## Agent implementation rules

- Import from `@unlayer/react-elements`. Use `Email`, `Page`, or `Document` as the root passed to renderers.
- Keep the structure `root > Row > Column > content`. Match a row's layout to its column count; there is no `Text` component, so use `Paragraph` or `Heading`.
- Use `renderToHtml()` for a full document, `renderToPlainText()` for the text email body, and `renderToJson()` for editor design data. These functions are synchronous; delivery and PDF printing are asynchronous.
- For reusable trees, use a plain synchronous factory returning the actual root, as in the [invoice example](../../../examples/content-workflows/src/invoice.tsx). Fetch data before building the tree.
- Escape dynamic values placed into `html` props, validate link targets, and keep provider credentials on the server.
- Read the [visual editing constraints](./visual-editing.md#constraints) before promising React-to-editor round trips. Edited JSON does not regenerate JSX.

The [runnable example](../../../examples/content-workflows) backs these guides. The [React API reference](../README.md) covers component props; [Next.js App Router](../../../examples/nextjs-app-router) demonstrates framework integration.
