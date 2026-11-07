# Next.js App Router Example

Renders a Hyper Elements email to HTML inside a Next.js 15 App Router **Server Component**, then previews it in the browser.

## Run it

From this directory:

```bash
pnpm install
pnpm dev
```

It needs `@unlayer/react-elements` 0.3.0 or later, the first version with `/primitives`.

Then open:

- <http://localhost:3000/email-preview> — the email rendered in an interactive preview dashboard (Desktop/Mobile view toggles, Raw HTML / Plain Text view)
- <http://localhost:3000/email-preview/raw> — the raw HTML string, served as `text/html` from a Route Handler

## Architecture

| File | Purpose |
|------|---------|
| `src/emails/welcome-email.tsx` | A realistic transactional email as a plain component tree, parameterized by props |
| `src/app/email-preview/page.tsx` | An async Server Component awaiting `render()`, passing its `html` and `text` strings to the client-side layout |
| `src/app/email-preview/PreviewDashboard.tsx` | Client-side dashboard layout managing viewport resizing, copy to clipboard, and tab switching |
| `src/app/email-preview/raw/route.ts` | A Route Handler returning the rendered HTML — the shape production code usually takes |

### Note on Server Components

The template components and the `render()` function run completely on the server. `render()` is async, so the page and the Route Handler are async functions that await it. The component tree is never shipped to the browser; only the resulting HTML/plain-text strings are.

Elements needs no entry in `next.config.ts`: Next.js bundles it into the server code like any other package.
