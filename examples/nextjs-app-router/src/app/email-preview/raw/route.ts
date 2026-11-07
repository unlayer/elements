import React from "react";
import { render } from "@hyper-elements/react";
import WelcomeEmail from "@/emails/welcome-email";

export async function GET() {
  const { html } = await render(
    React.createElement(WelcomeEmail, {
      name: "Ada",
      plan: "Pro",
      dashboardUrl: "https://example.com/dashboard",
    })
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
