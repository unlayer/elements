---
title: "Sending email"
description: "Render a template once on your server, then hand its HTML and plain text to Resend, AWS SES, Postmark, SendGrid or Nodemailer."
---

Hyper Elements renders. Your email provider delivers. You render once on your server, get two strings, and pass them to any provider's SDK. The provider never sees React, and you never write a second plain-text template by hand.

## Render once

```tsx
import { Button, Column, Email, Heading, MergeTag, Text, render } from "@hyper-elements/react";

const Welcome = ({ plan }: { plan: string }) => (
  <Email width={600} previewText="Your workspace is ready" style={{ backgroundColor: "#f4f4f5", gap: 16 }}>
    <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16 }}>
      <Heading level={1} style={{ fontSize: 24 }}>
        Welcome, <MergeTag name="first_name" />
      </Heading>
      <Text>Your {plan} workspace is ready.</Text>
      <Button href="https://example.com/dashboard" style={{ backgroundColor: "#111827" }}>
        Open your dashboard
      </Button>
    </Column>
  </Email>
);

const { html, text, diagnostics } = await render(<Welcome plan="Pro" />);
```

- `html` is the complete document, from its doctype to `</html>`, with the email shell and its head styles. Send that string as the HTML body. Keep the head styles.
- `text` is the plain-text alternative. Send it as the text body.
- `diagnostics` holds warnings. A template with errors rejects with an `ElementsError` that lists them, so a broken template never reaches a send call.

`render()` is async, so everything that calls it awaits it. The `Email`'s `title` prop sets the HTML `<title>`. That's separate from the subject line, which you give the provider.

## A provider-ready message

Put rendering in one function and reuse it for every provider. This is the shape the examples below import as `../message`:

```ts
import { render } from "@hyper-elements/react";
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

`invoiceTemplate` is a plain synchronous function that returns the root element. Fetch your data before you call it: a component that is async or suspends is an error.

Every snippet below sends one real email. Set a verified sender and a recipient you control, and keep credentials on the server, never in browser code:

```bash
export EMAIL_FROM='receipts@your-verified-domain.com'
export EMAIL_TO='your-test-inbox@example.com'
```

## Resend

```bash
npm install resend
```

Set `RESEND_API_KEY`. Resend needs an API key and a verified sending domain.

```ts
import { Resend } from "resend";
import { deliveryMessage, requireEnv } from "../message";

const client = new Resend(requireEnv("RESEND_API_KEY"));
const { data, error } = await client.emails.send(await deliveryMessage());
if (error) throw new Error(`Resend: ${error.message}`);
console.info("Resend accepted:", data?.id);
```

## AWS SES

```bash
npm install @aws-sdk/client-sesv2
```

Set `AWS_REGION` to the region that holds your verified identity. Credentials come from the AWS SDK's default chain (an IAM role or `AWS_PROFILE`) with permission to send through SES. In the SES sandbox, recipients need verifying too.

```ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { deliveryMessage, requireEnv } from "../message";

const client = new SESv2Client({ region: requireEnv("AWS_REGION") });
const { from, to, subject, html, text } = await deliveryMessage();
try {
  const result = await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    },
  }));
  console.info("SES accepted:", result.MessageId);
} finally {
  client.destroy();
}
```

## Postmark

```bash
npm install postmark
```

Set `POSTMARK_SERVER_TOKEN`. Use a server token and a confirmed sender signature or domain. The `outbound` message stream is for transactional mail.

```ts
import { ServerClient } from "postmark";
import { deliveryMessage, requireEnv } from "../message";

const client = new ServerClient(requireEnv("POSTMARK_SERVER_TOKEN"));
const { from, to, subject, html, text } = await deliveryMessage();
const result = await client.sendEmail({
  From: from,
  To: to,
  Subject: subject,
  HtmlBody: html,
  TextBody: text,
  MessageStream: "outbound",
});
console.info("Postmark accepted:", result.MessageID);
```

## SendGrid

```bash
npm install @sendgrid/mail
```

Set `SENDGRID_API_KEY`. Use an API key with Mail Send permission and an authenticated sender.

```ts
import sendgrid from "@sendgrid/mail";
import { deliveryMessage, requireEnv } from "../message";

sendgrid.setApiKey(requireEnv("SENDGRID_API_KEY"));
const [response] = await sendgrid.send(await deliveryMessage());
console.info("SendGrid accepted:", response.statusCode, response.headers["x-message-id"]);
```

## Nodemailer (SMTP)

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASSWORD`, with credentials from your SMTP service. Port 465 uses implicit TLS. Submission ports such as 587 require STARTTLS here. Keep certificate verification on.

```ts
import nodemailer from "nodemailer";
import { deliveryMessage, requireEnv } from "../message";

const port = Number(requireEnv("SMTP_PORT"));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SMTP_PORT must be an integer between 1 and 65535");
}
const transport = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: { user: requireEnv("SMTP_USER"), pass: requireEnv("SMTP_PASSWORD") },
});
try {
  const result = await transport.sendMail(await deliveryMessage());
  if (result.rejected.length) throw new Error("SMTP rejected the recipient");
  console.info("SMTP accepted:", result.messageId);
} finally {
  transport.close();
}
```

## Merge tags

Some values are filled in by the sending service, not by you: a first name in a bulk send, an unsubscribe link. Write those with `MergeTag`:

```tsx
<Heading level={1}>
  Welcome, <MergeTag name="first_name" />
</Heading>
```

By default a merge tag is written as `{{name}}`, in the HTML and in the plain text:

```text
WELCOME, {{first_name}}
```

If your provider uses another syntax, pass `mergeTag` to `render()`. It takes the tag's name and returns what to write. For a service that writes `*|FIRST_NAME|*`:

```tsx
const { html, text } = await render(<Welcome plan="Pro" />, {
  mergeTag: (name) => `*|${name.toUpperCase()}|*`,
});
```

What the function returns goes into the HTML as it is, with the name in it escaped.

A link's target can be a merge tag too. Write it in your provider's syntax: `mergeTag` changes `MergeTag` components, not the `href` strings you write.

```tsx
<Link href="*|UNSUB|*">Unsubscribe</Link>
```

> **Tip:** Values you know at render time don't need merge tags. Pass them as props and children, as `plan` is above. Elements escapes text passed as children.

## Before you send

- Keep rendering and provider credentials on the server.
- Use absolute HTTPS URLs for links and for images, and give each `Image` its file's size: `src={{ src, width, height }}`.
- Keep customer data out of an `Html` block's `html` prop. It is written as it is, unescaped.
- Use a verified sender. Add deduplication to your jobs, so a retry doesn't send a second receipt.
- A provider's "accepted" response is not inbox delivery. Record the message ID and use the provider's delivery and bounce events for the final status.
- Check the result in the email clients you care about.

> **Note:** Design JSON from `toDesign()` is for the [visual editor](/docs/guides/visual-editor), not an email body. Send `html` and `text`.
