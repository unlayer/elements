# hyperelements.dev

The Hyper Elements website: an [Astro](https://astro.build) site, built to static files.

```bash
pnpm --filter @hyper-elements/website dev        # http://localhost:4321
pnpm --filter @hyper-elements/website build      # static site in dist/
pnpm --filter @hyper-elements/website generate   # re-render examples and the component reference
```

## Every preview is real output

Nothing on the site is a mockup. `scripts/generate.mjs` renders each template in `examples/templates/` and each component example in `examples/components/` with Hyper Elements itself, and writes to `src/generated/`:

| File | What |
|------|------|
| `examples.json` | Each example's source, HTML, plain text, outline and diagnostics |
| `reference/*.md` | One page per component, split from the package's own `REFERENCE.md` |
| `guide.md` | The package's `GUIDE.md` |
| `migrate/before.tsx`, `after.tsx` | A React Email template and what `@hyper-elements/migrate` wrote for it |

`src/generated/` is committed, so the site builds without the engine. Run `generate` after changing an example or the engine. An example that doesn't render fails the script with the engine's own error.

The examples import `@hyper-elements/react`. Until the packages are renamed, the script resolves that to the workspace's `@unlayer/react-elements`. To render with another build, point it at that checkout's built `packages/react`:

```bash
HYPER_ELEMENTS_PACKAGE=/path/to/checkout/packages/react pnpm --filter @hyper-elements/website generate
```

The home page's client views (`public/generated/clients/*.png`: classic Outlook at 100%, Outlook.com,
Gmail, Apple Mail light and dark) are the launch email (`examples/showcase/email.tsx`) as the email
renderer draws it in each client: unlayer/email-renderer's playground (`app/`), given the email's HTML
in HTML mode, each tab's frame captured at 820px. Capture them again when the launch email changes.

Images the examples use live in `public/img/` and are referenced as `https://hyperelements.dev/img/…`, so a copied example works anywhere. Previews load them from the site itself.

## Pages

| Route | Source |
|-------|--------|
| `/` | `src/pages/index.astro` |
| `/docs/…` | `src/content/docs/**/*.md`, in the order of `docsNav` in `src/lib/site.ts` |
| `/docs/components/…` | `src/generated/reference/*.md`, with the live example from `examples/components/` |
| `/components` | The component gallery |
| `/templates`, `/templates/<slug>` | `examples/templates/*.tsx` |
| `/ai`, `/migrate` | Landing pages |
| `/llms.txt`, `/llms-full.txt` | Every docs page and component, for AI agents |

Names and links (package names, GitHub, install commands) are in `src/lib/site.ts`. The docs pages repeat the package names in their text, so a rename also needs a search and replace in `src/content/docs/`.

## Writing docs

A page is Markdown with a quoted `title` and `description` in its frontmatter, no H1, and links as `/docs/<slug>`. Add it to `docsNav` in `src/lib/site.ts` to put it in the sidebar, llms.txt and the previous/next links. Every code sample should run against the engine: the pages here were checked that way.

## Deploying

`dist/` is a static site: Cloudflare Pages, Vercel, Netlify or GitHub Pages all serve it with `hyperelements.dev` as the custom domain. Build command `pnpm --filter @hyper-elements/website build`, output `apps/website/dist`.
