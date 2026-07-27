// Route Handler — the same render, served as a plain HTML response.
//
// This is the shape most production code takes: a server endpoint (or a
// background job, or a webhook handler) turns a component tree into a string
// and hands it to an email provider. Swap the Response for
// `resend.emails.send({ html })` and you are done.

import { renderToHtml } from "@unlayer/react-elements";
import WelcomeEmail from "@/emails/welcome-email";

export function GET() {
  const html = renderToHtml(
    <WelcomeEmail name="Ada" plan="Pro" dashboardUrl="https://example.com/dashboard" />,
    { title: "Welcome, Ada" }
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
