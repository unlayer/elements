# Conversion fidelity

How closely converted templates match their React Email originals, measured on 106 real templates. Rerun with `pnpm --filter @unlayer/from-react-email bench`; `tsx bench/summary.ts` prints the tables below. CI runs a smoke version on the fixture templates in `test/fixtures` (`pnpm --filter @unlayer/from-react-email test:fidelity`): content, desktop text sizes, and words moved against `bench/smoke-baseline.json`.

## Results

| Mode | Templates | Convert | Type-check | Lose content | Flipped-prop problems | Editor skips | Native (avg) | Fully native | Words moved, desktop (median / mean / >25%) | Words moved, phone (median / >25%) |
|---|---|---|---|---|---|---|---|---|---|---|
| Codemod | 106 | 106 | 106 | 0 | 0 | 0 | 98.4% | 96 | 0% / 0.9% / 1 | 0% / 8 of 85 |
| Runtime | 106 | 106 | 106 | 0 | 0 | 0 | 98.4% | 97 | 0% / 1.1% / 2 | 0% / 9 of 85 |

- **Lose content**: a word, link (`href`), image (`src`) or image `alt` the original renders and the conversion doesn't.
- **Flipped-prop problems**: the same check with each boolean prop flipped (branches `PreviewProps` doesn't take).
- **Editor skips**: blocks `renderToJson` can't represent (they wouldn't open in the visual editor).
- **Native**: the share of content that became editable Elements blocks; the rest is kept as `Html` blocks that render as before.
- **Words moved**: the share of the original's words more than 48px off sideways in the conversion, after removing a uniform shift. Reading order breaks (the text running back up the page) are counted separately: 4 on desktop across the corpus, in two templates, from columns that the original centers vertically and Elements tops. On phones, the 21 originals wider than the screen (fixed 600–660px tables that scroll sideways) are left out: there's nothing comparable to match.

Desktop is the faithful view: in 105 of 106 templates, at most a quarter of the words sit somewhere else, and the median is none. The one outlier sets no font, so the browser shows serif while Elements uses its sans-serif default.

Phone medians improved from 16.5% to 0% (codemod) and from 13.9% to 0% (runtime). No template has a higher phone moved-word score than the saved baseline, including the originals that overflow. Every word in all 212 desktop conversions has the same coordinates as before.

Phone padding, margins, text size, line height, alignment, full-width images and hiding now become device overrides, using only settings the editor supports: rows and content can be hidden on phones, columns can't, so a column hidden on phones hides its content instead. Every stacked column keeps its box's phone side padding. A narrow box that takes the phone's full width keeps the space around it as padding on its column, with a phone value, instead of spacer columns. The report still lists unsupported classes and dropped styles.

### In the visual editor

Five converted designs (a receipt with a bordered card, a newsletter with stacking columns, inline rating stars, a fixed-width button, a card with columns that stay side by side on phones) were loaded into the Unlayer editor, saved and exported. Every row, column setting, border and button width came back unchanged, and the editor's export has every word, link and image of the original.

Two more converted designs (90 elements with phone settings) were loaded into the editor, saved and exported: every phone setting came back unchanged from `saveDesign`, and the editor's export applied them (59 phone CSS rules, 33 rows kept side by side). The device CSS also matches four small editor exports in email, web and document modes (12 fixture comparisons).

Visibility follows the editor: rows and content can be hidden per device, columns can't. The CSS fixtures were generated with a local editor build (1.477.0); the in-scope CSS functions were also checked against the current source.

## Known differences

Codemod report counts and remaining model differences.

| Difference | Templates | Why |
|---|---|---|
| Column vertical alignment | 58 | A React Email `Column` is a `<td>`, centered vertically by default; Elements email columns sit at the top. Only visible next to a taller column. |
| Unsupported classes and phone declarations | 24 | State variants, unresolved utilities, phone font weight/letter spacing, and full-width text declarations can remain unconverted. Supported phone properties are mapped even when another declaration in the same class is unsupported. |
| Image border radius | 18 | Elements images have no radius. |
| Small max-width boxes inside cards, on phones | Case dependent | A box narrower than the phone keeps spacer columns, so its width stays proportional. Wider boxes take the phone's width through their column's phone padding. |
| Shadows, gradients, transforms, opacity | 13 | No Elements equivalent. |
| Max-width text in a column of several | 7 | A block can't be narrower than its column. |
| Box outline around stacking columns, on phones | 4 | Each stacked column takes a piece of the border. Desktop is exact. |
| Kept as `Html` | 10 | Unknown elements (`div` with layout, raw `table`), Rows nested in a column of several, images with no width. They render as before. |

Phone device settings use the editor's 480px breakpoint. A source query such as `max-width: 600px` therefore differs between 481px and 600px; arbitrary breakpoints, phone font weight and letter spacing, and other unsupported declarations are not carried over. Narrow-box decisions use the benchmark's 375px phone width.

On phones, fixed-width images and narrow text boxes keep their px width when it fits there (a phone image width; column padding with a phone value), as React Email's do. Columns side by side keep their share of the row, and a narrow box holding columns side by side keeps its spacers, so icon gaps still scale with the screen. A React Email cell widens to fit its longest word; an Elements column can't, and the editor's CSS breaks the word instead. So text whose longest word wouldn't fit its column on a phone (a total, a stat label) gets a smaller phone size, and the same block in the other columns gets the same size. Words inside `Html` blocks can still break.

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
