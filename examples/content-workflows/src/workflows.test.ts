import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import nock from "nock";
import { chromium } from "playwright";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { renderInvoiceEmail } from "./message";
import { htmlToPdf } from "./pdf";

test("the same invoice survives HTML, plain text and editable JSON rendering", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const mode of ["email", "web", "document"] as const) {
      const html = renderToHtml(invoiceTemplate(sampleInvoice, mode));
      await page.setContent(html);
      assert.equal(await page.locator("body").count(), 1);
      assert.equal(await page.getByRole("heading", { name: "Payment receipt" }).count(), 1);
      assert.match(await page.locator("body").innerText(), /INV-1001/);
      assert.match(await page.locator("body").innerText(), /\$49\.00/);
      assert.equal(await page.getByRole("link", { name: "View invoice" }).getAttribute("href"), sampleInvoice.receiptUrl);
      if (mode === "email") assert.match(html, /\[if mso\]/);
      if (mode === "web") assert.match(html, /display:\s*flex/);
    }
    const { text } = renderInvoiceEmail();
    assert.match(text, /INV-1001/);
    assert.match(text, /Ada Lovelace/);
    const design = JSON.parse(JSON.stringify(renderToJson(invoiceTemplate(sampleInvoice, "email"))));
    assert.equal(design.body.rows.length, 1);
    assert.equal(design.body.rows[0].columns[0].contents.length, 5);
    assert.equal(design.body.values.preheaderText, "Your payment receipt is ready.");
    assert.match(JSON.stringify(design), /INV-1001/);
  } finally {
    await browser.close();
  }
});

test("customer data cannot introduce markup or unsafe receipt links", async () => {
  const customer = '<img src=x onerror="alert(1)"> & Co';
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(renderInvoiceEmail({ ...sampleInvoice, customer }).html);
    assert.equal(await page.locator("img").count(), 0);
    assert.ok((await page.locator("body").innerText()).includes(customer));
    assert.throws(() => invoiceTemplate({ ...sampleInvoice, receiptUrl: "javascript:alert(1)" }, "email"), /HTTPS/);
  } finally {
    await browser.close();
  }
});

test("document HTML produces a real PDF", async () => {
  const html = renderToHtml(invoiceTemplate(sampleInvoice, "document"));
  const pdf = await htmlToPdf(html);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 1000);
});

// The provider scripts run as written; nock answers their HTTP requests, so nothing is sent.
type SentRequest = { headers: Record<string, string>; body: nock.Body };
type SentMessage = { from?: string; to?: string; subject?: string; html?: string; text?: string };

function record(interceptor: nock.Interceptor, status: number, response: nock.ReplyBody, headers = {}) {
  const sent: SentRequest[] = [];
  interceptor.reply(function (_uri, body) {
    sent.push({ headers: this.req.headers, body });
    return [status, response, { "content-type": "application/json", ...headers }];
  });
  return sent;
}

function json(body: nock.Body): Record<string, any> {
  return typeof body === "string" ? JSON.parse(body) : body;
}

// multipart/form-data sends line breaks in field values as CRLF.
function multipartFields(body: nock.Body): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [, name, value] of String(body).matchAll(/name="([^"]+)"\r\n(?:[^\r\n]+\r\n)*\r\n([\s\S]*?)\r\n--/g)) {
    fields[name] = value.replace(/\r\n/g, "\n");
  }
  return fields;
}

const sender = "receipts@example.com";
const recipient = "ada@example.com";
const azureOrigin = "https://example-resource.communication.azure.com";

const providers: {
  script: string;
  env: Record<string, string>;
  mock: () => SentRequest[];
  authorized: (headers: Record<string, string>) => boolean;
  message: (body: nock.Body) => SentMessage;
  printed: string;
}[] = [
  {
    script: "mailgun",
    env: { MAILGUN_API_KEY: "test-key", MAILGUN_DOMAIN: "mg.example.com" },
    mock: () => record(nock("https://api.mailgun.net").post("/v3/mg.example.com/messages"), 200, { id: "<mailgun-1@mg.example.com>", message: "Queued. Thank you." }),
    authorized: (headers) => headers.authorization === `Basic ${Buffer.from("api:test-key").toString("base64")}`,
    message: (body) => {
      const { from, to, subject, html, text } = multipartFields(body);
      return { from, to, subject, html, text };
    },
    printed: "Mailgun accepted: <mailgun-1@mg.example.com>",
  },
  {
    script: "azure",
    env: { AZURE_COMMUNICATION_CONNECTION_STRING: `endpoint=${azureOrigin}/;accesskey=${Buffer.from("test-key").toString("base64")}` },
    mock: () => {
      nock(azureOrigin).get("/emails/operations/azure-1").query(true).reply(200, { id: "azure-1", status: "Succeeded" });
      return record(nock(azureOrigin).post("/emails:send").query(true), 202, { id: "azure-1", status: "Running" }, {
        "operation-location": `${azureOrigin}/emails/operations/azure-1?api-version=2025-09-01`,
      });
    },
    authorized: (headers) => headers.authorization.startsWith("HMAC-SHA256 "),
    message: (body) => {
      const { senderAddress, recipients, content } = json(body);
      return { from: senderAddress, to: recipients.to[0].address, subject: content.subject, html: content.html, text: content.plainText };
    },
    printed: "Azure accepted: azure-1",
  },
  {
    script: "mailersend",
    env: { MAILERSEND_API_KEY: "test-key" },
    mock: () => record(nock("https://api.mailersend.com").post("/v1/email"), 202, "", { "x-message-id": "mailersend-1" }),
    authorized: (headers) => headers.authorization === "Bearer test-key",
    message: (body) => {
      const { from, to, subject, html, text } = json(body);
      return { from: from.email, to: to[0].email, subject, html, text };
    },
    printed: "MailerSend accepted: 202 mailersend-1",
  },
  {
    script: "scaleway",
    env: {
      SCW_ACCESS_KEY: "SCWXXXXXXXXXXXXXXXXX",
      SCW_SECRET_KEY: "11111111-1111-1111-1111-111111111111",
      SCW_DEFAULT_PROJECT_ID: "22222222-2222-2222-2222-222222222222",
    },
    mock: () => record(nock("https://api.scaleway.com").post("/transactional-email/v1alpha1/regions/fr-par/emails"), 200, {
      emails: [{ id: "scaleway-1", message_id: "message-1", project_id: "22222222-2222-2222-2222-222222222222", mail_from: sender, mail_rcpt: recipient, rcpt_type: "to", subject: "Receipt", status: "new", try_count: 0, flags: [], last_tries: [] }],
    }),
    authorized: (headers) => headers["x-auth-token"] === "11111111-1111-1111-1111-111111111111",
    message: (body) => {
      const { from, to, subject, html, text, project_id } = json(body);
      assert.equal(project_id, "22222222-2222-2222-2222-222222222222");
      return { from: from.email, to: to[0].email, subject, html, text };
    },
    printed: "Scaleway accepted: scaleway-1",
  },
  {
    script: "plunk",
    env: { PLUNK_SECRET_KEY: "sk_test" },
    mock: () => record(nock("https://next-api.useplunk.com").post("/v1/send"), 200, {
      success: true,
      data: { emails: [{ contact: { id: "contact-1", email: recipient }, email: "plunk-1" }], timestamp: "2026-01-01T00:00:00.000Z" },
    }),
    authorized: (headers) => headers.authorization === "Bearer sk_test",
    // Plunk takes no plain-text part: it derives one from the HTML.
    message: (body) => {
      const { from, to, subject, body: html } = json(body);
      return { from, to, subject, html };
    },
    printed: "Plunk accepted: plunk-1",
  },
  {
    script: "lettermint",
    env: { LETTERMINT_PROJECT_TOKEN: "lm_test" },
    mock: () => record(nock("https://api.lettermint.co").post("/v1/send"), 202, { message_id: "lettermint-1", status: "pending" }),
    authorized: (headers) => headers["x-lettermint-token"] === "lm_test",
    message: (body) => {
      const { from, to, subject, html, text } = json(body);
      return { from, to: to[0], subject, html, text };
    },
    printed: "Lettermint accepted: lettermint-1",
  },
  {
    script: "brevo",
    env: { BREVO_API_KEY: "test-key" },
    mock: () => record(nock("https://api.brevo.com").post("/v3/smtp/email"), 201, { messageId: "<brevo-1@smtp-relay.mailin.fr>" }),
    authorized: (headers) => headers["api-key"] === "test-key",
    message: (body) => {
      const { sender: from, to, subject, htmlContent, textContent } = json(body);
      return { from: from.email, to: to[0].email, subject, html: htmlContent, text: textContent };
    },
    printed: "Brevo accepted: <brevo-1@smtp-relay.mailin.fr>",
  },
  {
    script: "inbound",
    env: { INBOUND_API_KEY: "test-key" },
    mock: () => record(nock("https://inbound.new").post("/api/e2/emails"), 200, { id: "inbound-1" }),
    authorized: (headers) => headers.authorization === "Bearer test-key",
    message: (body) => {
      const { from, to, subject, html, text } = json(body);
      return { from, to, subject, html, text };
    },
    printed: "Inbound accepted: inbound-1",
  },
  {
    script: "eusend",
    env: { EUSEND_API_KEY: "eu_test_key" },
    mock: () => record(nock("https://api.eusend.dev").post("/emails"), 200, { id: "eusend-1" }),
    authorized: (headers) => headers.authorization === "Bearer eu_test_key",
    message: (body) => {
      const { from, to, subject, html, text } = json(body);
      return { from, to, subject, html, text };
    },
    printed: "eusend accepted: eusend-1",
  },
];

test("each provider script sends the rendered HTML and plain text", async (t) => {
  const { subject, html, text } = renderInvoiceEmail();
  nock.disableNetConnect();
  try {
    for (const provider of providers) {
      await t.test(provider.script, async (st) => {
        Object.assign(process.env, { EMAIL_FROM: sender, EMAIL_TO: recipient }, provider.env);
        const sent = provider.mock();
        const info = st.mock.method(console, "info", () => {});
        await import(`./providers/${provider.script}`);
        assert.deepEqual(nock.pendingMocks(), []);
        assert.equal(sent.length, 1);
        assert.ok(provider.authorized(sent[0].headers), "the request carries the credential");
        const message = provider.message(sent[0].body);
        const expected: SentMessage = { from: sender, to: recipient, subject, html, text };
        if (!("text" in message)) delete expected.text;
        assert.deepEqual(message, expected);
        assert.equal(info.mock.calls.map((call) => call.arguments.join(" ")).join("\n"), provider.printed);
      });
    }
  } finally {
    nock.cleanAll();
    nock.enableNetConnect();
  }
});
