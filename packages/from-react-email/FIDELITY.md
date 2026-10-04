# Conversion fidelity

How closely converted templates match their React Email originals, measured on 106 real templates. Rerun with `pnpm --filter @unlayer/from-react-email bench`; `tsx bench/summary.ts` prints the tables below.

## Results

| Mode | Templates | Convert | Type-check | Lose content | Flipped-prop problems | Editor skips | Native (avg) | Fully native | Words moved, desktop (median / mean / >25%) | Words moved, phone (median / >25%) |
|---|---|---|---|---|---|---|---|---|---|---|
| Codemod | 106 | 106 | 106 | 0 | 0 | 0 | 98.4% | 96 | 0% / 0.9% / 1 | 16.5% / 27 of 85 |
| Runtime | 106 | 106 | 106 | 0 | 0 | 0 | 98.4% | 97 | 0% / 1.1% / 2 | 13.9% / 27 of 85 |

- **Lose content**: a word, link (`href`), image (`src`) or image `alt` the original renders and the conversion doesn't.
- **Flipped-prop problems**: the same check with each boolean prop flipped (branches `PreviewProps` doesn't take).
- **Editor skips**: blocks `renderToJson` can't represent (they wouldn't open in the visual editor).
- **Native**: the share of content that became editable Elements blocks; the rest is kept as `Html` blocks that render as before.
- **Words moved**: the share of the original's words more than 48px off sideways in the conversion, after removing a uniform shift. Reading order breaks (the text running back up the page) are counted separately: 4 on desktop across the corpus, in two templates, from columns that the original centers vertically and Elements tops. On phones, the 21 originals wider than the screen (fixed 600–660px tables that scroll sideways) are left out: there's nothing comparable to match.

Desktop is the faithful view: in 105 of 106 templates, at most a quarter of the words sit somewhere else, and the median is none. The one outlier sets no font, so the browser shows serif while Elements uses its sans-serif default.

Phones differ more, for reasons the Elements model sets (below). Every one of them is in the report.

### In the visual editor

Five converted designs (a receipt with a bordered card, a newsletter with stacking columns, inline rating stars, a fixed-width button, a card with columns that stay side by side on phones) were loaded into the Unlayer editor, saved and exported. Every row, column setting, border and button width came back unchanged, and the editor's export has every word, link and image of the original.

## Known differences

Ranked by templates affected (codemod mode).

| Difference | Templates | Why |
|---|---|---|
| Column vertical alignment | 58 | A React Email `Column` is a `<td>`, centered vertically by default; Elements email columns sit at the top. Only visible next to a taller column. |
| Responsive and hover classes (`mobile:px-6`, `hover:`) | 45 | No per-device styles in Elements. Classes that stack columns on phones are carried out. |
| Image border radius | 18 | Elements images have no radius. |
| Max-width text inside a card, on phones | 17 | Columns side by side keep their share of the row on phones (`noStackMobile`), so the text wraps more than the original, where max-width stops mattering. |
| Shadows, gradients, transforms, opacity | 13 | No Elements equivalent. |
| Max-width text in a column of several | 7 | A block can't be narrower than its column. |
| Side padding of stacked columns, on phones | 7 | Columns that stack keep their desktop padding: only the outer ones have the box's side padding. |
| Box outline around stacking columns, on phones | 4 | Each stacked column takes a piece of the border. Desktop is exact. |
| Kept as `Html` | 10 | Unknown elements (`div` with layout, raw `table`), Rows nested in a column of several, images with no width. They render as before. |

On phones, fixed widths (images, icon gaps) scale with the screen: side by side, Elements columns keep their share of the row, and image widths are a share of their column. React Email keeps them in px.

## Corpus

106 templates, used as local test inputs only and never committed (`.corpus/` is git-ignored):

- **71 official**: React Email's demo and example emails (MIT, `resend/react-email@b0b4668`, `apps/demo/emails`). That's five themed sets of 8 (Barebone, Arcane, Matte, Protocol, Studio), 22 brand demos, the `create-email` starters and the benchmark pair. Their local theme, font and Tailwind config imports were inlined so each file stands alone.
- **25 community**: templates from MIT repositories:
  - `inboundemail/inbound` (6), `slowfound/react-email-tailwind-templates` (5), `langfuse/langfuse` (4), `Kondasamy/nextjs-saas-template` (3), `moinulmoin/chadnext` (2);
  - one each from `better-auth`, `BearStudio/start-ui-web`, `hyperlink-academy/leaflet`, `ryanharman/invoice-gen` and `projectplannerai/nextjs-clerk-convex-stripe-resend-template`.

  Local imports were inlined.
- **10 written by agents**: welcome, password reset, magic link, receipt, weekly digest, invoice due, team invite, shipping update, trial ending, product launch. Half use Tailwind, half inline styles.

88 of the 96 non-agent templates use `<Tailwind>`.

## Method

For each template, in both modes:

1. Convert it, and type-check the output with `tsc --strict`. It passes when it has no more errors than the original (some originals already fail strict mode, and the codemod keeps their code).
2. Render the original with React Email's `render()` and the conversion with `renderToHtml()`, both with the template's `PreviewProps`. Compare their words, links and images. For the codemod, repeat with each boolean prop flipped.
3. Render the design JSON with `renderToJson` and count the blocks it skips.
4. Open both in Chromium at 700px (desktop; Elements stacks email columns below the content width + 20px) and at 375px, and find where each word lands.

Fonts: templates load web fonts with `<Font>`, and the conversion links the same families through Google Fonts. Those files can differ from the template's own: other versions, and in React Email's demo templates a 404 for Inter 400, where the original falls back to Arial. Layout is what's measured, so the conversion is rendered with the original's `@font-face` and `@import` rules. Assets are fetched once and served from a local cache, so every render sees the same ones.

`.bench-out/<template>/review.png` puts original, codemod and runtime side by side for a look.
