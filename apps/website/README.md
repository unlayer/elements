# hyperelements.dev

The Hyper Elements website: an [Astro](https://astro.build) site, built to static files. It needs Node.js 22.23.4 or later (Astro 7's minimum; `.nvmrc` has it).

```bash
pnpm --filter @hyper-elements/website dev        # http://localhost:4321
pnpm --filter @hyper-elements/website build      # static site in dist/
pnpm --filter @hyper-elements/website generate   # re-render the examples and the component reference
```

## Every preview is real output

Nothing on the site is a mockup. `scripts/generate.mjs` renders every example in `examples/` with Hyper Elements itself: the templates (`templates/`), one example per component (`components/`), and the home page's own examples (`showcase/`). It writes:

| Output | What |
|--------|------|
| `src/generated/examples.json` | Each example's source, HTML, plain text, outline and diagnostics |
| `src/generated/reference/*.md` | One page per component, split from the package's own `REFERENCE.md` |
| `public/generated/templates/` | Each Document template as a real PDF and each Canvas template as a real PNG |

`src/generated/migrate/before.tsx` and `after.tsx` aren't written by `generate`: they're a React Email template and what `@hyper-elements/migrate` wrote for it, committed by hand. Run the migrate CLI on `before.tsx` and replace `after.tsx` when the converter changes.

Everything generated is committed, so the site builds without the engine. Run `generate` after changing an example or the engine:

1. Build the engine first, from the repo root: `pnpm build`. The script renders with `packages/react`'s built `dist/`.
2. Run `pnpm --filter @hyper-elements/website generate`. The PDFs and PNGs need the templates' fonts as TTF files, so the first run fetches them from Google Fonts into `node_modules/.cache`; later runs use the cache.

An example that doesn't render fails the script with the engine's own error.

The examples import `@hyper-elements/react`. Until the packages are renamed, the script resolves that to the workspace's `@unlayer/react-elements`. To render with another build, point it at that checkout's built `packages/react`:

```bash
HYPER_ELEMENTS_PACKAGE=/path/to/checkout/packages/react pnpm --filter @hyper-elements/website generate
```

The home page's client views (`public/generated/clients/*.png`: classic Outlook, Gmail, Apple Mail light
and dark) are images of the launch email (`examples/showcase/email.tsx`) in each client, committed as they
are. Replace them when the launch email changes.

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

`dist/` is a static site: Cloudflare Pages, Vercel, Netlify or GitHub Pages all serve it with `hyperelements.dev` as the custom domain. Build command `pnpm --filter @hyper-elements/website build`, output `apps/website/dist`, on Node.js 22.23.4 or later (set the host's Node version to match).
