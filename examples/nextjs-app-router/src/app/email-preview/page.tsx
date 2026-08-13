// Server Component — note the absence of "use client".
//
// renderToHtml() runs on the server during this render. The component tree is
// never shipped to the browser; only the resulting HTML string is. That is the
// whole integration: build a tree, call renderToHtml(), do something with the
// string (send it, store it, or — here — preview it).

import Link from "next/link";
import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
import WelcomeEmail from "@/emails/welcome-email";

export const metadata = { title: "Email preview" };

// In a real app these come from your database, a webhook payload, a CMS…
const recipient = {
  name: "Ada",
  plan: "Pro",
  dashboardUrl: "https://example.com/dashboard",
};

export default function EmailPreviewPage() {
  const email = <WelcomeEmail {...recipient} />;

  // The complete document — <!DOCTYPE> through </html>, Outlook conditionals
  // and all. This is the string you hand to your ESP.
  const html = renderToHtml(email, { title: `Welcome, ${recipient.name}` });

  // The text/plain MIME part. Send both; it matters for deliverability.
  const text = renderToPlainText(email);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ margin: "0 0 8px" }}>
        <Link href="/" style={{ color: "#71717a", fontSize: 13 }}>
          ← back
        </Link>
      </p>

      <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Welcome email</h1>
      <p style={{ color: "#52525b", margin: "0 0 4px", lineHeight: 1.6 }}>
        Rendered on the server with <code>renderToHtml()</code> —{" "}
        {html.length.toLocaleString()} bytes of email-safe HTML.
      </p>
      <p style={{ margin: "0 0 24px", fontSize: 13 }}>
        <Link href="/email-preview/raw">View the raw HTML →</Link>
      </p>

      {/* srcDoc isolates the email's own <style> and table layout from this page,
          the same way an inbox would. */}
      <iframe
        srcDoc={html}
        title="Email preview"
        style={{
          width: "100%",
          height: 720,
          border: "1px solid #e4e4e7",
          borderRadius: 12,
          background: "#ffffff",
        }}
      />

      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: "pointer", fontSize: 14, color: "#52525b" }}>
          Plain text version (<code>renderToPlainText()</code>)
        </summary>
        <pre
          style={{
            marginTop: 12,
            padding: 16,
            background: "#f4f4f5",
            border: "1px solid #e4e4e7",
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </pre>
      </details>
    </main>
  );
}
