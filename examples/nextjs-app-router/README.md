# Next.js App Router Example

Renders an Unlayer Elements email to HTML inside a Next.js 15 App Router **Server Component**, then previews it in the browser.

## Run it

From this directory:

```bash
pnpm install
pnpm dev
```

Then open:

- <http://localhost:3000/email-preview> — the email rendered in an interactive preview dashboard (Desktop/Mobile view toggles, Raw HTML / Plain Text view)
- <http://localhost:3000/email-preview/raw> — the raw HTML string, served as `text/html` from a Route Handler

## Architecture

| File | Purpose |
|------|---------|
| `src/emails/welcome-email.tsx` | A realistic transactional email as a plain component tree, parameterized by props |
| `src/app/email-preview/page.tsx` | A Server Component calling `renderToHtml()` and `renderToPlainText()`, passing the strings to the client-side layout |
| `src/app/email-preview/PreviewDashboard.tsx` | Client-side dashboard layout managing viewport resizing, copy to clipboard, and tab switching |
| `src/app/email-preview/raw/route.ts` | A Route Handler returning the rendered HTML — the shape production code usually takes |

### Note on Server Components

The template components and `renderToHtml()` function run completely on the server. The component tree is never shipped to the browser; only the resulting HTML/plain-text strings are.
