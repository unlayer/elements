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
| Turn a template made in the Unlayer editor into React code | [Unlayer designs as Elements code](./codegen.md) | `designToElements(design)` → a `.tsx` component that renders back to the same design |
| Style components with Tailwind classes | [Tailwind CSS in Elements](./tailwind.md) | `className="bg-gray-100 p-6"` as props, in HTML and editable design JSON |
| Render Markdown as editable blocks | [Markdown in Elements](./markdown.md) | Headings, paragraphs, lists, images, tables and code as Elements blocks |
| Show syntax-highlighted code in email | [Code in emails, pages and documents](./code.md) | `CodeBlock` and `CodeInline` with inline styles and an Outlook fallback |
| Use a web font | [Web fonts in Elements](./fonts.md) | `<Font>` in the head, the template's font, Outlook's fallback |
| Render templates that load data (async components, Suspense) | [Async templates and readable HTML](./async.md) | `await renderToHtml()` from `@unlayer/react-elements/async`, with `pretty` |
| Move React Email templates to Elements | [Migrate from React Email](./migrate-from-react-email.md) | `npx @unlayer/migrate`: converted templates, checked against the originals |
| Open React Email templates in the Unlayer editor | [React Email in the editor](../../../examples/react-email-in-editor) | `npx @unlayer/migrate --design` → `loadDesign()` |
| Try Elements or preview a snippet without installing | [Elements Playground](https://examples.unlayer.com/examples/elements-playground/) | Live email, page, or document preview, HTML and design JSON export, and the Unlayer builder |

## When to use Elements

Use Elements for reusable content, especially when the same invoice, receipt, announcement, or report must appear in multiple formats. Email-only templates also work. Visual editing is optional: local rendering needs no Unlayer account or API key. A hosted editor integration has its own project configuration and feature availability.

Elements supplies components and renderers. Your email provider handles delivery, retries, bounces, and sender verification. A PDF engine turns document HTML into PDF bytes. An application framework handles interactive pages, routing, and data fetching. If you need only those services, Elements does not replace them.

## Agent implementation rules

- Import from `@unlayer/react-elements`. Use `Email`, `Page`, or `Document` as the root passed to renderers.
- Keep the structure `root > Row > Column > content`. Match a row's layout to its column count; there is no `Text` component, so use `Paragraph` or `Heading`.
- Use `renderToHtml()` for a full document, `renderToPlainText()` for the text email body, and `renderToJson()` for editor design data. These functions are synchronous; delivery and PDF printing are asynchronous. For templates with async components or Suspense, use the same renderers from `@unlayer/react-elements/async` and `await` them ([guide](./async.md)).
- For Tailwind classes, wrap the root in `<Tailwind>` and follow [Tailwind CSS in Elements](./tailwind.md): `<Tailwind config>` renders with the async renderers from `@unlayer/react-elements/tailwind`, or with `tw` from `await loadTailwind(config)`.
- Markdown, code, web fonts and head tags come from their own entries: `Markdown` from `@unlayer/react-elements/markdown` ([guide](./markdown.md)), `CodeBlock`/`CodeInline` from `@unlayer/react-elements/code` ([guide](./code.md)), `Font` from `@unlayer/react-elements/font` ([guide](./fonts.md)), `Head` from `@unlayer/react-elements/head` ([reference](../README.md#head)).
- `style` and `className` on any component are inlined on (and added to) the element it renders, in the HTML only: the design for the visual editor can't hold them, and `renderToJson()` says so. Prefer props for what the editor should edit.
- For reusable trees, use a plain synchronous factory returning the actual root, as in the [invoice example](../../../examples/content-workflows/src/invoice.tsx). Fetch data before building the tree.
- Escape dynamic values placed into `html` props, validate link targets, and keep provider credentials on the server.
- Read the [visual editing constraints](./visual-editing.md#constraints) before promising React-to-editor round trips. Edited JSON doesn't change the JSX it came from: convert it to new Elements code with `designToElements()` from `@unlayer/react-elements/codegen` ([guide](./codegen.md)).
- To preview code without installing, open the [Elements Playground](https://examples.unlayer.com/examples/elements-playground/) with the source in the URL hash: `#code=<base64url of the code>`, optionally with `&mode=email|page|document`. The playground takes plain JSX with no imports. In browsers with WebMCP, call its `render_elements` tool to get the HTML.

The [runnable example](../../../examples/content-workflows) backs these guides. The [React API reference](../README.md) covers component props; [Next.js App Router](../../../examples/nextjs-app-router) demonstrates framework integration.
