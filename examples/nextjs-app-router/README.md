# Next.js App Router example

Renders an Unlayer Elements email to HTML inside a Next.js 15 App Router
**Server Component**, then previews it in the browser.

## Run it

```bash
cd examples/nextjs-app-router
pnpm install
pnpm dev
```

Then open:

- <http://localhost:3000/email-preview> — the email rendered in a preview frame
- <http://localhost:3000/email-preview/raw> — the exact HTML string, served as `text/html`

This example is self-contained: it installs `@unlayer/react-elements` from npm
like any other app, so nothing in the monorepo needs to be built first. Copy the
directory anywhere and it still runs.

## What it shows

| File | Shows |
|------|-------|
| `src/emails/welcome-email.tsx` | A realistic transactional email as a plain component tree, parameterised by props |
| `src/app/email-preview/page.tsx` | A Server Component calling `renderToHtml()` and `renderToPlainText()`, previewing the result in an iframe |
| `src/app/email-preview/raw/route.tsx` | A Route Handler returning the rendered HTML — the shape production code usually takes |

The key point is what is **absent**: no `"use client"`, no `useEffect`, no
client-side rendering library. `renderToHtml()` runs during the server render
and only the resulting string reaches the browser.

```tsx
// src/app/email-preview/page.tsx — Server Component
import { renderToHtml } from "@unlayer/react-elements";
import WelcomeEmail from "@/emails/welcome-email";

export default function EmailPreviewPage() {
  const html = renderToHtml(<WelcomeEmail name="Ada" plan="Pro" dashboardUrl="…" />, {
    title: "Welcome, Ada",
  });

  return <iframe srcDoc={html} />;
}
```

`renderToHtml()` returns a complete document — `<!DOCTYPE>` through `</html>`,
including the Outlook conditional comments. Hand that string straight to your
email provider:

```tsx
await resend.emails.send({
  to: user.email,
  subject: "Welcome to Acme",
  html: renderToHtml(<WelcomeEmail {...user} />),
  text: renderToPlainText(<WelcomeEmail {...user} />),
});
```

If your app already owns the document shell, use `renderToHtmlParts()` instead —
it returns `{ head, body }` chunks rather than a full document.

## Note on Server Components

`@unlayer/react-elements` renders HTML with `react-dom/server`, and Next's RSC
compiler refuses to bundle that import into the server graph. It never comes up
for a normal npm install, because Next leaves `node_modules` packages external
on the server — which is exactly how this example consumes it.

It *does* come up if you link the package from a local checkout (`pnpm link`, or
a `workspace:*` dependency inside this repo). pnpm resolves the symlink to a
path outside `node_modules`, so Next compiles it as first-party source and both
`react-dom/server` and the provider's `createContext` are rejected. Adding
`serverExternalPackages: ["@unlayer/react-elements"]` does **not** rescue it —
that list is matched against `node_modules` resolutions, which a symlinked
workspace package no longer is.

To develop against a local build, install it the way a consumer would rather
than linking it:

```bash
cd packages/react && pnpm build && pnpm pack --pack-destination /tmp
cd examples/nextjs-app-router && pnpm add /tmp/unlayer-react-elements-*.tgz
```

That is exactly what [`tests/nextjs-integration`](../../tests/nextjs-integration)
does in CI — pack the built package into a real `node_modules`, then run
`next build` against it.
