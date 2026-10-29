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
