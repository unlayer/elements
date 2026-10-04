import sendgrid from "@sendgrid/mail";
import { deliveryMessage, requireEnv } from "../message";

sendgrid.setApiKey(requireEnv("SENDGRID_API_KEY"));
const [response] = await sendgrid.send(deliveryMessage());
console.log("SendGrid accepted:", response.statusCode, response.headers["x-message-id"]);
