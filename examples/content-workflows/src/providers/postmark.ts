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
