# Send React email with Resend, AWS SES, Postmark, SendGrid, or Nodemailer

Use these integrations to deliver HTML and plain text rendered by `@unlayer/react-elements`. Each provider receives the same [transactional invoice message](./transactional-email.md#create-the-provider-ready-message). Pass the rendered `html` string, including its head styles, to the provider; the provider does not need to render the React tree again.

## Shared setup

The snippets below are complete files in [src/providers](../../../examples/content-workflows/src/providers). They import [src/message.ts](../../../examples/content-workflows/src/message.ts) and [src/invoice.tsx](../../../examples/content-workflows/src/invoice.tsx). From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example render:email
```

Inspect the output before running a send command. Every `send:*` command sends one real email. Export a verified sender address and a recipient you control:

```bash
export EMAIL_FROM='receipts@your-verified-domain.com'
export EMAIL_TO='your-test-inbox@example.com'
```

Replace both addresses. Set the provider-specific variables below in the process environment or your deployment's secret manager. The scripts do not load `.env` files automatically. No credentials belong in browser code. For standalone use, install `@unlayer/react-elements react react-dom`, add `tsx` to dev dependencies, set `"type": "module"` and `"jsx": "react-jsx"`, and copy the shared files plus your chosen provider file. Then use `npx tsx src/providers/<provider>.ts`.

SDK errors are allowed to fail the process; Resend's returned `error` is explicitly thrown. A successful ID/status means the provider accepted the request, not that the recipient received it. Use provider events for delivery/bounce tracking and application-level deduplication for retries.

## Resend

Install in your own project: `npm install resend`. The workspace example already declares this dependency.

Set `RESEND_API_KEY`. Requires an API key and a verified sending domain. [Resend Node.js setup](https://resend.com/docs/send-with-nodejs).

```ts
import { Resend } from "resend";
import { deliveryMessage, requireEnv } from "../message";

const client = new Resend(requireEnv("RESEND_API_KEY"));
const { data, error } = await client.emails.send(deliveryMessage());
if (error) throw new Error(`Resend: ${error.message}`);
console.log("Resend accepted:", data?.id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:resend
```

Expected: `Resend accepted: <id>`.

## AWS SES v2

Install in your own project: `npm install @aws-sdk/client-sesv2`. The workspace example already declares this dependency.

Set `AWS_REGION`. Use the AWS SDK default credential chain (for example an IAM role or `AWS_PROFILE`) with permission to send via SES. Set `AWS_REGION` to the region containing your verified identity. In the SES sandbox, recipients also need verification. [SES SendEmail API](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html).

```ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { deliveryMessage, requireEnv } from "../message";

const client = new SESv2Client({ region: requireEnv("AWS_REGION") });
const { from, to, subject, html, text } = deliveryMessage();
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
  console.log("SES accepted:", result.MessageId);
} finally {
  client.destroy();
}
```

```bash
pnpm --filter @unlayer/content-workflows-example send:ses
```

Expected: `SES accepted: <MessageId>`.

## Postmark

Install in your own project: `npm install postmark`. The workspace example already declares this dependency.

Set `POSTMARK_SERVER_TOKEN`. Use a server token and a confirmed sender signature/domain. The `outbound` message stream is for transactional mail. [Postmark sending API](https://postmarkapp.com/developer/user-guide/send-email-with-api).

```ts
import { ServerClient } from "postmark";
import { deliveryMessage, requireEnv } from "../message";

const client = new ServerClient(requireEnv("POSTMARK_SERVER_TOKEN"));
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.sendEmail({
  From: from,
  To: to,
  Subject: subject,
  HtmlBody: html,
  TextBody: text,
  MessageStream: "outbound",
});
console.log("Postmark accepted:", result.MessageID);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:postmark
```

Expected: `Postmark accepted: <MessageID>`.

## SendGrid

Install in your own project: `npm install @sendgrid/mail`. The workspace example already declares this dependency.

Set `SENDGRID_API_KEY`. Use an API key with Mail Send permission and an authenticated sender. [SendGrid Node.js SDK](https://github.com/sendgrid/sendgrid-nodejs/tree/main/packages/mail).

```ts
import sendgrid from "@sendgrid/mail";
import { deliveryMessage, requireEnv } from "../message";

sendgrid.setApiKey(requireEnv("SENDGRID_API_KEY"));
const [response] = await sendgrid.send(deliveryMessage());
console.log("SendGrid accepted:", response.statusCode, response.headers["x-message-id"]);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:sendgrid
```

Expected: `SendGrid accepted: 202 <x-message-id>`.

## Nodemailer / SMTP

Install in your own project: `npm install nodemailer`. For TypeScript, also install `npm install --save-dev @types/nodemailer`. The workspace example already declares this dependency.

Set `SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD`. Use credentials issued by your SMTP service. Port 465 uses implicit TLS; submission ports such as 587 use required STARTTLS here. Keep certificate verification enabled. [Nodemailer SMTP options](https://nodemailer.com/smtp/).

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
  const result = await transport.sendMail(deliveryMessage());
  if (result.rejected.length) throw new Error("SMTP rejected the recipient");
  console.log("SMTP accepted:", result.messageId);
} finally {
  transport.close();
}
```

```bash
pnpm --filter @unlayer/content-workflows-example send:nodemailer
```

Expected: `SMTP accepted: <messageId>`.

For PDF attachments, first generate bytes with the [Playwright guide](./react-to-pdf.md), then follow your provider's attachment API and size limits. Design JSON is for the [visual editor](./visual-editing.md), not an email body.
