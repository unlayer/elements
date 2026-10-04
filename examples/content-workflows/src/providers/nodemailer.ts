import nodemailer from "nodemailer";
import { deliveryMessage, requireEnv } from "../message";

const port = Number(requireEnv("SMTP_PORT"));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SMTP_PORT must be an integer between 1 and 65535");
}
const transport = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: { user: requireEnv("SMTP_USER"), pass: requireEnv("SMTP_PASSWORD") },
});
try {
  const result = await transport.sendMail(deliveryMessage());
  if (result.rejected.length) throw new Error("SMTP rejected the recipient");
  console.log("SMTP accepted:", result.messageId);
} finally {
  transport.close();
}
