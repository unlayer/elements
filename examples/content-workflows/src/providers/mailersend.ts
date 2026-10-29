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
