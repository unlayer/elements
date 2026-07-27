import React from "react";
import WelcomeEmail from "@/emails/welcome-email";
import { renderEmailToHtml } from "@/utils/render-server";

export function GET() {
  const html = renderEmailToHtml(
    React.createElement(WelcomeEmail, {
      name: "Ada",
      plan: "Pro",
      dashboardUrl: "https://example.com/dashboard",
    }),
    { title: "Welcome, Ada" }
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
