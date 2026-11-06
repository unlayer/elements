import { Resend } from "resend";
import { deliveryMessage, requireEnv } from "../message";

const client = new Resend(requireEnv("RESEND_API_KEY"));
const { data, error } = await client.emails.send(await deliveryMessage());
if (error) throw new Error(`Resend: ${error.message}`);
console.info("Resend accepted:", data?.id);
