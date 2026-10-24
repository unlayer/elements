import { Lettermint } from "lettermint";
import { deliveryMessage, requireEnv } from "../message";

const client = new Lettermint({ sendingToken: requireEnv("LETTERMINT_PROJECT_TOKEN") });
const { from, to, subject, html, text } = deliveryMessage();
const result = await client.emails.send({ from, to: [to], subject, html, text });
console.info("Lettermint accepted:", result.message_id);
