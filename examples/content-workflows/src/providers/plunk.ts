import { deliveryMessage, requireEnv } from "../message";

// The Plunk npm package is deprecated, so this calls Plunk's REST API directly.
// Plunk derives the plain-text part from `body`; the API has no text field.
type PlunkResponse =
  | { success: true; data: { emails: { email: string }[] } }
  | { success: false; error: { code: string; message: string } };

const { from, to, subject, html } = deliveryMessage();
const response = await fetch("https://next-api.useplunk.com/v1/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${requireEnv("PLUNK_SECRET_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ from, to, subject, body: html }),
});
const result = (await response.json()) as PlunkResponse;
if (!result.success) throw new Error(`Plunk ${response.status}: ${result.error.message}`);
console.info("Plunk accepted:", result.data.emails[0].email);
