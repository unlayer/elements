import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Elements + Next.js App Router</h1>
      <p style={{ color: "#52525b", lineHeight: 1.7, margin: "0 0 28px" }}>
        A Server Component builds an Unlayer Elements tree and calls{" "}
        <code>renderToHtml()</code> on the server. No client JavaScript, no{" "}
        <code>&quot;use client&quot;</code> — the HTML is produced during the
        render and sent down with the page.
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
        <li>
          <Link href="/email-preview">/email-preview</Link> — the email rendered
          in a preview frame
        </li>
        <li>
          <Link href="/email-preview/raw">/email-preview/raw</Link> — the exact
          HTML string, served as <code>text/html</code>
        </li>
      </ul>
    </main>
  );
}
