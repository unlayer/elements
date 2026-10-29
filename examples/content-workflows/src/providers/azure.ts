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
