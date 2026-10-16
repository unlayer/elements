# Send React email with Resend, AWS SES, Postmark, SendGrid, Nodemailer, Mailgun, Brevo, and more

Use these integrations to deliver HTML and plain text rendered by `@unlayer/react-elements`. Each of the fourteen providers below receives the same [transactional invoice message](./transactional-email.md#create-the-provider-ready-message). Pass the rendered `html` string, including its head styles, to the provider; the provider does not need to render the React tree again.

## Providers

| Provider | Install | Credentials | Command |
|----------|---------|-------------|---------|
| [Resend](#resend) | `npm install resend` | `RESEND_API_KEY` | `send:resend` |
| [AWS SES v2](#aws-ses-v2) | `npm install @aws-sdk/client-sesv2` | `AWS_REGION` and the AWS credential chain | `send:ses` |
| [Postmark](#postmark) | `npm install postmark` | `POSTMARK_SERVER_TOKEN` | `send:postmark` |
| [SendGrid](#sendgrid) | `npm install @sendgrid/mail` | `SENDGRID_API_KEY` | `send:sendgrid` |
| [Nodemailer / SMTP](#nodemailer--smtp) | `npm install nodemailer` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | `send:nodemailer` |
| [Mailgun](#mailgun) | `npm install mailgun.js` | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, optional `MAILGUN_URL` | `send:mailgun` |
| [Azure Communication Services Email](#azure-communication-services-email) | `npm install @azure/communication-email` | `AZURE_COMMUNICATION_CONNECTION_STRING` | `send:azure` |
| [MailerSend](#mailersend) | `npm install mailersend` | `MAILERSEND_API_KEY` | `send:mailersend` |
| [Scaleway Transactional Email](#scaleway-transactional-email) | `npm install @scaleway/sdk-tem @scaleway/sdk-client` | `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_DEFAULT_PROJECT_ID` | `send:scaleway` |
| [Plunk](#plunk) | none (REST API with `fetch`) | `PLUNK_SECRET_KEY` | `send:plunk` |
| [Lettermint](#lettermint) | `npm install lettermint` | `LETTERMINT_PROJECT_TOKEN` | `send:lettermint` |
| [Brevo](#brevo) | `npm install @getbrevo/brevo` | `BREVO_API_KEY` | `send:brevo` |
| [Inbound](#inbound) | `npm install inboundemail` | `INBOUND_API_KEY` | `send:inbound` |
| [eusend](#eusend) | `npm install @eusend_dev/sdk` | `EUSEND_API_KEY` | `send:eusend` |

Every provider gets the HTML document and its plain-text alternative, except Plunk, whose API takes HTML only and derives the text part itself. The example pins each SDK it added to an exact version (see [package.json](../../../examples/content-workflows/package.json)); the snippets were checked against those versions' type definitions.

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

SDK errors are allowed to fail the process. Where a provider reports a failure as a return value instead (Resend's and eusend's `error`, a failed Azure send, Plunk's error response), the script throws it. A successful ID/status means the provider accepted the request, not that the recipient received it. Use provider events for delivery/bounce tracking and application-level deduplication for retries.

The example's tests run the Mailgun, Azure, MailerSend, Scaleway, Plunk, Lettermint, Brevo, Inbound, and eusend scripts as they are, with [nock](https://github.com/nock/nock) answering their HTTP requests: no network and no credentials. Each test checks that the request carries the credential, the sender, the recipient, the subject, the rendered HTML and the plain text (where the API takes one), and that the script prints the ID the provider returns:

```bash
pnpm --filter @unlayer/content-workflows-example test
```

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

## Mailgun

Install in your own project: `npm install mailgun.js`. The workspace example already declares this dependency.

Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (your verified sending domain, for example `mg.example.com`). For a domain in Mailgun's EU region, also set `MAILGUN_URL=https://api.eu.mailgun.net`. The client uses the `FormData` built into Node.js 18 and later. [Mailgun Node.js SDK](https://documentation.mailgun.com/docs/mailgun/sdk/nodejs_sdk/).

```ts
import Mailgun from "mailgun.js";
import { deliveryMessage, requireEnv } from "../message";

// mailgun.js builds a multipart request with the FormData that Node.js 18+ provides.
const client = new Mailgun(FormData).client({
  username: "api",
  key: requireEnv("MAILGUN_API_KEY"),
  // Domains in Mailgun's EU region use https://api.eu.mailgun.net.
  url: process.env.MAILGUN_URL ?? "https://api.mailgun.net",
});
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.messages.create(requireEnv("MAILGUN_DOMAIN"), {
  from,
  to: [to],
  subject,
  html,
  text,
});
console.info("Mailgun accepted:", result.id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:mailgun
```

Expected: `Mailgun accepted: <id@your-domain>`.

## Azure Communication Services Email

Install in your own project: `npm install @azure/communication-email`. The workspace example already declares this dependency.

Set `AZURE_COMMUNICATION_CONNECTION_STRING` to the connection string of a Communication Services resource with an email domain connected to it, and use a sender address from that domain (for example `DoNotReply@<your-domain>`) as `EMAIL_FROM`. To use Microsoft Entra ID instead of the access key, pass the endpoint and a credential from `@azure/identity`: `new EmailClient(endpoint, new DefaultAzureCredential())`. `beginSend()` queues the message; `pollUntilDone()` waits until Azure reports the send operation's final status. [Azure email quickstart](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email?pivots=programming-language-javascript).

```ts
import { EmailClient } from "@azure/communication-email";
import { deliveryMessage, requireEnv } from "../message";

const client = new EmailClient(requireEnv("AZURE_COMMUNICATION_CONNECTION_STRING"));
const { from, to, subject, html, text } = deliveryMessage();
// beginSend queues the message and returns a poller for the send operation.
const poller = await client.beginSend({
  senderAddress: from,
  recipients: { to: [{ address: to }] },
  content: { subject, html, plainText: text },
});
const result = await poller.pollUntilDone();
if (result.status !== "Succeeded") {
  throw new Error(`Azure Communication Services: ${result.error?.message ?? result.status}`);
}
console.info("Azure accepted:", result.id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:azure
```

Expected: `Azure accepted: <operation id>`.

## MailerSend

Install in your own project: `npm install mailersend`. The workspace example already declares this dependency.

Set `MAILERSEND_API_KEY` to an API token with email access, and send from a verified domain. MailerSend answers `202 Accepted` with the message ID in the `x-message-id` header. On an HTTP error the SDK rejects with an object holding `statusCode`, `headers`, and `body`, not with an `Error`. [MailerSend Node.js SDK](https://github.com/mailersend/mailersend-nodejs).

```ts
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { deliveryMessage, requireEnv } from "../message";

const client = new MailerSend({ apiKey: requireEnv("MAILERSEND_API_KEY") });
const { from, to, subject, html, text } = deliveryMessage();
const params = new EmailParams()
  .setFrom(new Sender(from))
  .setTo([new Recipient(to)])
  .setSubject(subject)
  .setHtml(html)
  .setText(text);
const response = await client.email.send(params);
console.info("MailerSend accepted:", response.statusCode, response.headers["x-message-id"]);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:mailersend
```

Expected: `MailerSend accepted: 202 <x-message-id>`.

## Scaleway Transactional Email

Install in your own project: `npm install @scaleway/sdk-tem @scaleway/sdk-client`. The workspace example already declares these dependencies.

Set `SCW_ACCESS_KEY`, `SCW_SECRET_KEY` (an IAM API key allowed to send email), and `SCW_DEFAULT_PROJECT_ID` (the Project that owns your checked domain). Transactional Email runs in the `fr-par` region. The package exports the API as `Temv1alpha1`; the response lists the emails it created. [Scaleway Transactional Email](https://www.scaleway.com/en/docs/transactional-email/), [API reference](https://www.scaleway.com/en/developers/api/transactional-email/).

```ts
import { createClient } from "@scaleway/sdk-client";
import { Temv1alpha1 } from "@scaleway/sdk-tem";
import { deliveryMessage, requireEnv } from "../message";

const client = createClient({
  accessKey: requireEnv("SCW_ACCESS_KEY"),
  secretKey: requireEnv("SCW_SECRET_KEY"),
  defaultProjectId: requireEnv("SCW_DEFAULT_PROJECT_ID"),
  // Transactional Email runs in the fr-par region.
  defaultRegion: "fr-par",
});
const tem = new Temv1alpha1.API(client);
const { from, to, subject, html, text } = deliveryMessage();
const { emails } = await tem.createEmail({
  from: { email: from },
  to: [{ email: to }],
  subject,
  html,
  text,
});
console.info("Scaleway accepted:", emails.map((email) => email.id).join(", "));
```

```bash
pnpm --filter @unlayer/content-workflows-example send:scaleway
```

Expected: `Scaleway accepted: <email id>`.

## Plunk

No package to install: the `@plunk/node` package on npm is deprecated, so this script calls Plunk's REST API with the `fetch` built into Node.js 18 and later.

Set `PLUNK_SECRET_KEY` to your project's secret key (`sk_...`; the public `pk_` key can't send) and send from a verified domain. The API takes the HTML as `body` and has no plain-text field: Plunk generates the text part from the HTML. Each send also creates or updates a contact for the recipient. [Plunk send API](https://docs.useplunk.com/api-reference/public-api/sendEmail).

```ts
import { deliveryMessage, requireEnv } from "../message";

// The Plunk npm package is deprecated, so this calls Plunk's REST API directly.
// Plunk derives the plain-text part from `body`; the API has no text field.
type PlunkResponse =
  | { success: true; data: { emails: { email: string }[] } }
  | { success: false; error: { code: string; message: string } };

const { from, to, subject, html } = deliveryMessage();
const response = await fetch("https://next-api.useplunk.com/v1/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${requireEnv("PLUNK_SECRET_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ from, to, subject, body: html }),
});
const result = (await response.json()) as PlunkResponse;
if (!result.success) throw new Error(`Plunk ${response.status}: ${result.error.message}`);
console.info("Plunk accepted:", result.data.emails[0].email);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:plunk
```

Expected: `Plunk accepted: <email id>`.

## Lettermint

Install in your own project: `npm install lettermint`. The workspace example already declares this dependency.

Set `LETTERMINT_PROJECT_TOKEN` to a project sending token (`lm_...`); a team token (`lm_team_...`) can't send. Send from a domain verified in Lettermint. [Lettermint Node.js SDK](https://github.com/lettermint/lettermint-node).

```ts
import { Lettermint } from "lettermint";
import { deliveryMessage, requireEnv } from "../message";

const client = new Lettermint({ sendingToken: requireEnv("LETTERMINT_PROJECT_TOKEN") });
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.emails.send({ from, to: [to], subject, html, text });
console.info("Lettermint accepted:", result.message_id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:lettermint
```

Expected: `Lettermint accepted: <message_id>`.

## Brevo

Install in your own project: `npm install @getbrevo/brevo`. The workspace example already declares this dependency. The snippet uses the `BrevoClient` API that `@getbrevo/brevo` has had since version 4; version 3 and earlier used `TransactionalEmailsApi` instead.

Set `BREVO_API_KEY` to a Brevo API key and send from a verified sender or domain. [Brevo Node.js SDK](https://github.com/getbrevo/brevo-node), [transactional email guide](https://developers.brevo.com/docs/send-a-transactional-email).

```ts
import { BrevoClient } from "@getbrevo/brevo";
import { deliveryMessage, requireEnv } from "../message";

const client = new BrevoClient({ apiKey: requireEnv("BREVO_API_KEY") });
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.transactionalEmails.sendTransacEmail({
  sender: { email: from },
  to: [{ email: to }],
  subject,
  htmlContent: html,
  textContent: text,
});
console.info("Brevo accepted:", result.messageId);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:brevo
```

Expected: `Brevo accepted: <messageId>`.

## Inbound

Install in your own project: `npm install inboundemail`. The workspace example already declares this dependency. The older `@inboundemail/sdk` package is deprecated.

Set `INBOUND_API_KEY` and send from a domain verified in Inbound. The SDK's `react` option renders React Email components, not Elements; pass the Elements output as `html` and `text`. [Inbound TypeScript SDK](https://github.com/inboundemail/inbound-typescript-sdk), [API docs](https://inbound.new/docs).

```ts
import Inbound from "inboundemail";
import { deliveryMessage, requireEnv } from "../message";

const client = new Inbound({ apiKey: requireEnv("INBOUND_API_KEY") });
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.emails.send({ from, to, subject, html, text });
console.info("Inbound accepted:", result.id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:inbound
```

Expected: `Inbound accepted: <id>`.

## eusend

Install in your own project: `npm install @eusend_dev/sdk`. The workspace example already declares this dependency.

Set `EUSEND_API_KEY`. Keys starting with `eu_test_` exercise the API without delivering; use an `eu_live_` key and a verified domain to deliver. Like Resend, the SDK returns `{ data, error }` instead of throwing. Its `react` option renders React Email components, not Elements; pass the Elements output as `html` and `text`. [eusend Node.js SDK](https://eusend.dev/docs/sdks/nodejs).

```ts
import { Eusend } from "@eusend_dev/sdk";
import { deliveryMessage, requireEnv } from "../message";

const client = new Eusend(requireEnv("EUSEND_API_KEY"));
const { data, error } = await client.emails.send(deliveryMessage());
if (error) throw new Error(`eusend: ${error.name} ${error.message}`);
console.info("eusend accepted:", data.id);
```

```bash
pnpm --filter @unlayer/content-workflows-example send:eusend
```

Expected: `eusend accepted: <id>`.

For PDF attachments, first generate bytes with the [Playwright guide](./react-to-pdf.md), then follow your provider's attachment API and size limits. Design JSON is for the [visual editor](./visual-editing.md), not an email body.
