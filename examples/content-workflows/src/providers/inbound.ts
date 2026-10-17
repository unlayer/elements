import Inbound from "inboundemail";
import { deliveryMessage, requireEnv } from "../message";

const client = new Inbound({ apiKey: requireEnv("INBOUND_API_KEY") });
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.emails.send({ from, to, subject, html, text });
console.info("Inbound accepted:", result.id);
