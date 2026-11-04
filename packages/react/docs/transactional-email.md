# Build and send transactional email in React

Use `@unlayer/react-elements` for React receipts, order confirmations, welcome emails, and password reset emails. Write the template with the components from `@unlayer/react-elements/primitives`, `await render()` it into HTML and plain text in your server or job worker, then pass both strings to an email provider. Elements does not deliver messages.

## Install and choose a template

```bash
npm install @unlayer/react-elements react react-dom
npm install --save-dev tsx typescript @types/node @types/react @types/react-dom
```

The runnable [invoice template](./one-template-email-web-pdf.md#define-the-shared-react-template) contains all imports, typed data, an email preheader, a validated receipt link, and customer fields passed as text, which Elements escapes. Its source is [src/invoice.tsx](../../../examples/content-workflows/src/invoice.tsx). For a password reset, replace its copy and receipt link with your application's expiring, single-use reset URL; token generation and verification belong to your application.

## Create the provider-ready message

[src/message.ts](../../../examples/content-workflows/src/message.ts):

```ts
import { render } from "@unlayer/react-elements/primitives";
import { invoiceTemplate, sampleInvoice, type InvoiceData } from "./invoice";

export async function renderInvoiceEmail(data: InvoiceData = sampleInvoice) {
  const { html, text } = await render(invoiceTemplate(data, "email"));
  return {
    subject: `Receipt for invoice ${data.number}`,
    html,
    text,
  };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Set ${name} before sending email`);
  return value;
}

export async function deliveryMessage() {
  return {
    ...(await renderInvoiceEmail()),
    from: requireEnv("EMAIL_FROM"),
    to: requireEnv("EMAIL_TO"),
  };
}
```

`render()` resolves to `{ html, text, diagnostics, … }`. `html` is a complete HTML document, including the email shell and styles: send that string as the provider's HTML body. `text` is the alternative text body. The `Email`'s `title` prop sets the HTML `<title>`, which is separate from the provider's email subject. `diagnostics` holds warnings; a template with errors rejects with an `ElementsError` listing them. `render()` is async, so everything that calls it awaits it.

## Render HTML, plain text, and design JSON

[src/render-email.ts](../../../examples/content-workflows/src/render-email.ts):

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { toDesign } from "@unlayer/react-elements/builder";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { renderInvoiceEmail } from "./message";

await mkdir("output", { recursive: true });
const { html, text } = await renderInvoiceEmail();
const { design } = toDesign(invoiceTemplate(sampleInvoice, "email"));
await writeFile("output/invoice.email.html", html);
await writeFile("output/invoice.txt", text);
await writeFile("output/invoice.design.json", JSON.stringify(design, null, 2));
console.info("Wrote output/invoice.email.html, invoice.txt and invoice.design.json");
```

`toDesign()` from `@unlayer/react-elements/builder` writes the design JSON for the [visual editor](./visual-editing.md), and it is synchronous.

Run the checked-in example from the repository root:

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example render:email
```

Expected: `examples/content-workflows/output/invoice.email.html`, `invoice.txt`, and `invoice.design.json`, containing invoice INV-1001, Ada Lovelace, and $49.00. No credentials or Chromium are needed for this step. See [Resend, AWS SES, Postmark, SendGrid, and Nodemailer](./email-providers.md) for the delivery step. For Next.js server routes and preview UI, use the [App Router example](../../../examples/nextjs-app-router).

## Constraints before delivery

- Keep rendering and provider credentials on the server. Fetch data before calling the synchronous template factory.
- Use absolute HTTPS URLs for receipt/reset links and publicly accessible images, and give an `Image` its file's size (`src={{ src, width, height }}`). Text passed as children is escaped. An `Html` block's `html` prop is written as it is: keep customer data out of it.
- Use a verified sender and a provider configured for transactional messages. Add application-level deduplication/retries so retrying a job does not send duplicate receipts.
- Retain the HTML head styles. Verify the result in your target email clients; [repository compatibility checks](../../../README.md#email-client-compatibility-notes) have defined limits.
- A provider acceptance response is not inbox delivery. Record its message ID and use the provider's delivery/bounce events for the final status.

Need the same receipt on the web or as a PDF? Continue with [one template, three outputs](./one-template-email-web-pdf.md). Need visual changes after code generation? Use [design JSON](./visual-editing.md).
