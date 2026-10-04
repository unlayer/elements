import { Resend } from "resend";
import { deliveryMessage, requireEnv } from "../message";

const client = new Resend(requireEnv("RESEND_API_KEY"));
const { data, error } = await client.emails.send(deliveryMessage());
if (error) throw new Error(`Resend: ${error.message}`);
console.log("Resend accepted:", data?.id);
