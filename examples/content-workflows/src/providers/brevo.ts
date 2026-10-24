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
