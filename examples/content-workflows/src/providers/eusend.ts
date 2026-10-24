import { Eusend } from "@eusend_dev/sdk";
import { deliveryMessage, requireEnv } from "../message";

const client = new Eusend(requireEnv("EUSEND_API_KEY"));
const { data, error } = await client.emails.send(deliveryMessage());
if (error) throw new Error(`eusend: ${error.name} ${error.message}`);
console.info("eusend accepted:", data.id);
