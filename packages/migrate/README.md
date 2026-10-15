# @unlayer/migrate

Migrate React Email templates to [Unlayer Elements](https://github.com/unlayer/elements). Your templates keep their props, loops and conditions; they become Elements components that render email-safe HTML, web pages and print documents, and open in the Unlayer visual editor. MJML and Beefree templates migrate the same way: see [MJML templates](#mjml-templates---from-mjml) and [Beefree templates](#beefree-templates---from-beefree).

```bash
npx @unlayer/migrate emails           # converts and checks your templates, and writes nothing
npx @unlayer/migrate emails --write   # then replaces them (committed in git first, so git can undo it)
```

Run it from your project folder, with Node.js 20.6 or later (an older one stops with exit code `1`, saying so). Each template is:

1. **Converted.** React Email components become Elements components (`Text` → `Paragraph`, `Section`/`Row`/`Column` → `Row`/`Column`, `Button` → `Button`, …). Tailwind classes become props. Components the template uses from the same file or from your other files (a shared `Layout`, a `Footer`, also through an `index.ts` that re-exports them) are inlined. Anything with no Elements equivalent is kept as an `Html` block that renders exactly as before.
2. **Checked.** The original and the migrated template are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared in two parts. The goal is an editable Unlayer template with the same content, not pixel parity: every template is written, with what differs listed.
   - **Content**, which must be the same: every word (including numeric separators, signs, currency symbols and percentages), link, image and image `alt` text the original renders, in the same order, with no new words; the same words, links and images on a phone (375px) and on wider screens a rule targets (Tailwind's `md:`, `lg:`); every block reaching the visual editor; content the original shows or hides by its props (`isGift && "hidden"`, `display: hide ? "none" : "block"`), which the migration can't keep; and words CSS adds or hides that the check doesn't read (`::before` content, an ellipsis, a line clamp, a clipping `overflow`). Anything the converter can't map is kept as HTML, so content that differs is a converter bug: the template is still written, flagged `✗`, and the run exits with `2`. Please report it.
   - **Look**, which is listed under "looks different", to fix in the editor: each word's text style at a desktop width (700px), meaning size, bold, italics, letter case, underline, color, the background behind it and a link's target; where each line of text sits across the page (a column stacked into one, a block moved to the other side); CSS the check doesn't model that can change how words show (`white-space`, letter spacing, a transform or filter, a text shadow, a list's markers, a box moved with `position`, right-to-left text, …), unless both sides have the same; phone styles the original applies up to another width than Elements' 480px (`max-width: 600px`, Tailwind's `max-sm:`), where the migration shows the other version between the two; layouts it doesn't place (a grid, columns of text, a box taken out of the flow, flex items that wrap or, in a column, aren't stretched), where their words sit depending on sizes it doesn't read; and what it can't read on one side (a selector, condition or value it doesn't evaluate), naming the rule. CSS that can't change the words (borders, rounded corners, outer shadows, heights, Outlook-only properties, rendering hints) isn't compared.

   With `--strict`, any difference fails a template, and it isn't written unless you pass `--force`. All of this holds for each flipped prop and for `compare` as well. The check is tested against Chromium: thousands of generated pairs, each with one side's look changed (or the same look written another way), must be found different whenever Chromium shows them differently. Not verified: vertical spacing, exact positions (under about 120px), where images sit and an image's `srcset`, fonts as drawn, borders, corners and outer shadows, styles in dark mode (what shows there is compared), hover, and how each email client renders. Code paths these props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified: extend `PreviewProps` to cover them.
3. **Reported.** How much is editable in the visual editor, what was kept as HTML, and every visual difference (a dropped hover style, a `mobile:` class, a radius). The summary counts the email templates; files that aren't one (shared components, helpers, a framework's routes) are listed after them as skipped, with why.

```text
✓ emails/welcome.tsx: 100% editable, 1 kind of difference (image border radius dropped)
✓ emails/comment.tsx: 100% editable
    looks different: couldn't verify: the look of "Alex", "can", "you" (`white-space: pre-wrap`, a style the check doesn't verify)
- emails/components/layout.tsx: skipped (no default-exported component)

2 templates: 2 migrated and checked (1 looks different: see above). 1 other file skipped (see above). 2 written.
```

## Options

| Option | |
|---|---|
| `--write` | Replace each template with its migrated version. Only templates git can restore: committed, with no changes since. |
| `--out <dir>` | Write migrated templates to `<dir>` instead, keeping the folder layout. Relative imports and resources loaded with `new URL(path, import.meta.url)` keep resolving from their original location. The rewritten source is checked in its destination folder. |
| `--design` | Also write `<name>.design.json` next to each migrated template: the design the Unlayer editor opens with `loadDesign()`. Text props the template shows as given become merge tags (`{{name}}`); props it changes first (a formatted date, an uppercased word, a padded number) or that an image shows (a QR code's data) keep their `PreviewProps` value, so the text beside an image says what the image shows. CSS, font URLs, backgrounds and image sources (including inline images in HTML) keep sample values. The design is built from the migrated template's `PreviewProps`, where JSX passed as a prop has styles instead of Tailwind classes. The JSON report lists each template's web fonts (`fonts`): register them when you create the editor (`fonts: { showDefaultFonts: true, customFonts }`), since it loads and exports only fonts it was created with. |
| `--no-merge-tags` | Keep the `PreviewProps` values in the design JSON instead of merge tags. |
| `--report <file>` | Write the migration report: JSON for a `.json` file, Markdown for any other (the run says so when the name isn't `.md`). |
| `--strict` | Fail a template with any difference, and don't write it: in its content, in how it looks, or one the migration lists (a style it couldn't keep, such as an image's corner radius). Without it, every template is written, with what looks different listed. |
| `--force` | With `--strict`, write templates the check fails anyway. |
| `--overwrite` | Replace files already at a destination that the run didn't produce: a template an earlier run wrote in an `--out` folder, as it wrote it, or files git can restore. A design JSON (which may have been made or edited in the editor) only when git can restore it or it's the same design the run writes: otherwise that template fails and neither file is written. With `--strict`, it never writes a template that failed the check. |
| `--allow-dirty` | Replace files git can't restore (uncommitted changes, not committed, or not in a repository): templates with `--write`, other files with `--overwrite`. |
| `--from <source>` | The source format: `react-email` (the default), `mjml` (see [MJML templates](#mjml-templates---from-mjml)) or `beefree` (see [Beefree templates](#beefree-templates---from-beefree)). |

Without `--write` or `--out`, nothing is written: the command converts and checks, and prints what it would do.

`--write` replaces templates in place, so before running anything it checks that git can give each one back: a template with uncommitted changes, one that isn't committed, or one outside a git repository stops the run (exit `1`), naming them. Commit first, and git can undo the migration. `--out <dir>` writes copies and doesn't need git; `--allow-dirty` replaces templates anyway.

Default exports wrapped in React `memo` or `forwardRef` are supported, including nested wrappers. Preview props are read from the outer wrapper first, then from its inner component.

All templates are converted and checked before any output is written. With `--write` (and in a dry run, which says what `--write` does), a template another scanned template renders (it uses its default export, directly or through other files) is left in place and reported as skipped, as are components that don't render `<Html>`, files that render an email inside other markup (an app page or a preview around a template), and layouts (components that render their `children` or take content in props typed to hold JSX, such as `content: ReactNode`); their markup is inlined into the converted templates that use them. Migrating a file rewrites only its default export, so a template that only takes a constant or a named component from another doesn't keep it in place, and a file that only lists or sends templates (an `index.ts`, a send helper) doesn't either. Importers that fail the check keep using the original shared components. When the templates that use one are written and no longer need it, it's migrated in the same run. A framework's route file (a Next.js `page.tsx` or layout under `app/`, a page under `pages/` beside a `next.config`, a Remix route under `app/routes/`) is the app's own code: it's never rewritten as an email, and the template it renders is migrated (the page then renders the migrated one). With `--write`, the project's files that still use a migrated template (a route or a helper that sends it with React Email's `render()` or a sender's `react:` option, a component that renders it, a test) are listed after the summary, from the nearest `package.json` above the folder given, not only in it (outside `node_modules` and build output, also through an `index.ts` that re-exports the template): render it there with `renderToHtml()` from `@unlayer/react-elements`, since React Email's `render()` gives a migrated template's markup without `<html>` and `<head>`. A module imported by a path worked out when it runs (`` import(`./${name}`) ``) stops a run that would write in place, since what it renders can't be told: use `--out`. `--out` also writes separate converted copies of those shared files.

`--out` requires a non-empty path. Before loading templates, the command checks all template, design and report destinations. It rejects collisions, destinations that would replace a source input (except that template's explicit `--write`), symlink output files, and symlinked directories within the output folder. These checks also apply with `--force` and `--overwrite`. A template or design file already at a destination, which the run didn't produce, stops it too unless you pass `--overwrite`, and `--overwrite` replaces only a template an earlier run wrote in an `--out` folder and nobody edited since, a design that's the same as the one the run writes, or what git can restore (`--allow-dirty` for anything else). Each migrated template records a hash of its content in its header (`// @unlayer/migrate hash …`), so an edit is told apart from what the run wrote; line endings and trailing whitespace don't count. A template written by 0.1.0, which recorded no hash, is treated as possibly edited: it's replaced only when git can restore it, or with `--allow-dirty`. A `--report` file is replaced when it's a report an earlier run wrote; any other file there needs `--overwrite`, even on a dry run. Pass the inputs' common parent folder to preserve its subfolders, or migrate each input root to a separate output folder.

Verification uses a temporary file in the destination folder. The command removes it after the check, also when the run is interrupted (Ctrl-C, a kill) or fails, and removes any empty folders it created for that check. A template whose destination folder can't be written fails with that reason. Every template is written, also one whose content differs (flagged): with `--write`, git restores the original, and `--out` leaves it where it was. With `--strict`, a failed check leaves the target template and design untouched unless `--force` was requested. Writes replace files atomically, preserving other files that happen to share a hard link with an output. A template edited while the run converts it isn't replaced: it fails, and the edit stays. The same holds for a file the run replaces at an `--out` destination, a design JSON or a report: one edited after the run decided it could replace it (while templates load) is kept, and its template fails.

Exit codes: `0` when every template converted with the same content (what looks different is listed), `1` for a usage error, when no templates were found, or when a template was left unchecked for a file that renders it and isn't migrated (a preview around it: migrate it with `--out`), `2` when a template failed to convert, its content differs (with `--strict`, anything differs), a file couldn't be read (a link to a file that's gone), or the run couldn't go on. A run never ends with `0` without checking what it was given, but for a Beefree template without its HTML export beside it, which is listed as unverified (`--strict` fails it). Use it in CI to keep migrated templates honest: templates already migrated (importing `@unlayer/react-elements`: an import, not a comment that names it) are skipped, so running it again after `--write` passes. A `.js` template with JSX can't be loaded: rename it to `.jsx`.

## MJML templates (`--from mjml`)

```bash
npx @unlayer/migrate emails --from mjml           # converts and checks your .mjml templates, and writes nothing
npx @unlayer/migrate emails --from mjml --write   # then writes emails/<name>.tsx beside each one
```

The same command, the same options, output and exit codes as for React Email, for MJML 4 and 5 templates. Each `.mjml` file is:

1. **Converted.** MJML's attribute cascade is resolved first, as MJML resolves it (`mj-attributes` with `mj-all` and per-tag defaults, `mj-class`, MJML's own defaults, inline attributes), and `mj-include`s are followed (relative to the file that includes them; a path outside the folder given is refused, and listed). Then each section becomes a `Row`, each column a `Column` as wide as MJML makes it, and each component a block: `mj-text` a `Paragraph` (a `Heading` when it holds one `<h1>`–`<h4>`), `mj-button` a `Button`, `mj-image` an `Image`, `mj-divider` a `Divider`. The head gives the preview text (`mj-preview`) and web fonts (`mj-font`), and the template's `mj-style` rules are written on the text they apply to. Merge tags (`{{name}}`, `*|FNAME|*`) stay as text. The result is the design JSON the Unlayer editor opens, written as Elements code with `designToElements()` from [`@unlayer/react-elements/codegen`](https://github.com/unlayer/elements/blob/main/packages/react/docs/codegen.md).
2. **Checked.** MJML compiles the original (the `mjml` version this package pins), the migrated code renders as a migrated React Email template does, and the same check compares the two: content (every word, link, image and `alt` text, on desktop and phones, every block reaching the editor) must be the same; how it looks is listed. A few content changes are the editor's own way of writing a block, and the converter **declares** them, each naming exactly what it replaces: an icon's `alt` text, which the Social block writes as "Facebook icon", on that icon's image; MJML's built-in icon, swapped for the editor's icon for the network. The check expects those (and only those) and lists each one as a difference, so they don't make a template ✗; any other change in the content still does, and `--strict` fails a template with declared differences as with any other.
3. **Reported**, as a React Email run reports: ✓ or ✗, how much is editable, what differs. Blocks kept as the HTML MJML compiles them to render as before by construction, so their number is said beside the check, as how much isn't editable: `✓ emails/promo.mjml: 92% editable, 2 blocks kept as HTML (mj-hero, mj-carousel)`. `--strict` fails a template with any of them.

```text
✓ emails/welcome.mjml: 100% editable, 1 kind of difference (columns stack on narrower screens)
✓ emails/promo.mjml: 92% editable, 2 blocks kept as HTML (mj-hero, mj-carousel), 3 kinds of difference (section background image approximated; column vertical alignment not kept; social icon alt text is “<network> icon”)
- emails/partials/footer.mjml: skipped: not an MJML document (no <mjml> root): a partial, converted where a template includes it

2 templates: 2 migrated and checked. 2 blocks kept as HTML (not editable as blocks). 1 other file skipped (see above). Nothing written: pass --write or --out <dir> to write the migrated templates.
```

The `.mjml` files stay as they are: `--write` writes `<name>.tsx` beside each one (and `<name>.design.json` with `--design`, the design that code renders), `--out <dir>` writes them in `<dir>` with the same folder layout. A file already at a destination is treated as in an `--out` folder: it's replaced only with `--overwrite`, and then only when an earlier run wrote it and nobody edited it since, or git can restore it (`--allow-dirty` for anything else). Files without an `<mjml>` root are partials: they're read where a template includes them, and never written. An MJML 3 template (everything in `<mj-container>`) fails, saying to upgrade it first with `npx mjml-migrate <input> <output>`.

What each MJML component becomes:

| MJML | Elements | |
|---|---|---|
| `mj-body`, `mj-preview`, `mj-font` | `<Email>`'s `contentWidth`, `backgroundColor`, `previewText`, `fontFamily` (with its web font) | The page MJML leaves without a background is white. `mj-title` goes in the file's header comment. |
| `mj-section`, `mj-column` | `Row` and `Column`s | Columns as wide as MJML makes them; the section's padding, border and background, and the space narrow columns leave, go into the outer columns' padding, so content sits where it does in MJML. On phones each column gets the padding MJML gives it there. Columns wider together than the section wrap onto rows of their own, as in MJML. |
| `mj-text`, `mj-button`, `mj-image`, `mj-divider` | `Paragraph`/`Heading`, `Button`, `Image`, `Divider` | Each with its padding, colors, fonts and alignment. A text's paragraphs keep MJML's margins. |
| `mj-raw` | `Html` | As it is; markup no reader sees (Outlook's conditional comments) is left out. |

Approximated, and listed as a difference:

- `mj-wrapper`: its sections are rows of their own, with its background (a full-width one across the page) and padding around them; its border, rounded corners and background image aren't kept.
- `mj-group`: a row whose columns stay side by side on phones.
- A section's `background-url`: the row's background image; its `border-radius` and `border`: on its outer columns.
- `mj-navbar`: a `Menu` (its links' letter case and underline aren't kept). One with a hamburger is kept as HTML: its icons show only on phones.
- `mj-social`: a `Social` block with MJML's links (a network's share URL included). An icon of the template's own (`src`) keeps its image; MJML's built-in icons are white glyphs MJML draws on a colored square, which a Social block can't draw, so each becomes the editor's icon for the network (a declared difference), and every icon's `alt` text is the editor's "<network> icon" (declared too). Icons with labels or without links, and MJML's icons for networks the editor has no icon for (`xing`, `google`, `web`), keep the block as HTML.
- `mj-spacer`: an empty `Divider` as tall as the space, which the editor shows and resizes.
- `mj-table`: a `Table` when it's a plain grid (text in each cell, no spans, no colors or borders of its own), else kept as HTML.
- Column `vertical-align` (email columns sit at the top), a section's `direction="rtl"`, an image's `border-radius`, `height` and `fluid-on-mobile`, a button's `height`, `mj-style` rules for other screens or states (`@media`, `:hover`), `mj-html-attributes`.
- Phones: MJML stacks columns below 480px (or `mj-breakpoint`), Elements below the content width plus 20px (620px for a 600px email); between the two, MJML shows columns side by side where Elements stacks them.

Kept as the HTML MJML compiles them to (with the CSS they need), and counted as blocks kept as HTML:

- `mj-hero`: content over a background image.
- `mj-carousel` and `mj-accordion`: interactive.
- `mj-raw` among columns or sections, components MJML puts somewhere a converter can't (an `mj-section` in a column), and tags it doesn't know.

## Beefree templates (`--from beefree`)

```bash
npx @unlayer/migrate templates --from beefree           # converts and checks your Beefree templates (their JSON), and writes nothing
npx @unlayer/migrate templates --from beefree --write   # then writes templates/<name>.tsx beside each one
```

As for MJML: the same options, output and exit codes, and the JSON files stay where they are (`--write` writes `<name>.tsx` beside each one, `--out <dir>` in `<dir>`, with the same rules for files already there). The `.json` files in the folders given are read; one that isn't a Beefree template (classic "full" JSON, versions 0.0.1 and 2.0.0, also as the Template Catalog API wraps it) is listed as skipped, with what it is. A template of another version fails, saying so. Each template becomes an Unlayer design, written as Elements code with `designToElements()`.

The check needs what the original renders, and a Beefree template renders in Beefree: put **Beefree's HTML export** of each template beside its JSON, with the same name (`welcome.json` and `welcome.html`), and the migration is checked against it, as React Email and MJML templates are. A template without one is converted and written, but **unverified**: neither ✓ nor ✗, said as such, and not counted as a failure (the run can end with `0`). With `--strict`, an unverified template fails, and isn't written unless you pass `--force`.

```text
✓ templates/welcome.json: 100% editable, 1 kind of difference (its columns are aligned to the middle in Beefree; Unlayer columns sit at the top)
? templates/promo.json: unverified (no exported HTML: put Beefree's HTML export of it beside it as promo.html to check it), 96% editable, 1 block kept as HTML (icons)

2 templates: 1 migrated and checked, 1 unverified (nothing to check against: see above). 1 block kept as HTML (not editable as blocks). Nothing written: pass --write or --out <dir> to write the migrated templates.
```

Modules with no Unlayer block (`icons`, `form`, `merge-content`, add-ons) are kept as HTML blocks and counted beside the check, as MJML's are. What's approximated is listed per template, where it is (`Row 5`, `Row 2, column 1, module 3 (image)`). Two content changes are the editor's own, and declared as for MJML (the check expects exactly these, lists them, and `--strict` fails them):

- Social icons: the Social block writes each icon's `alt` text as "Facebook icon" where Beefree's says "Facebook" (on that icon's image).
- Hamburger menus: Unlayer menus have no hamburger button, so its `☰`/`✕` glyphs (or, in Beefree's newer exports, the button) are left out, and the links show on phones, where Beefree folds them into the button.

Other known differences, listed per template:

- Background images aren't scaled to cover their row in email.
- Image corner radius and column vertical alignment aren't kept.

## Check a template you migrated yourself

```bash
npx @unlayer/migrate compare emails/welcome.tsx emails/welcome.elements.tsx
```

Renders both with the original's `PreviewProps`, then with each true/false prop flipped, and checks both the HTML and design JSON that every word, link, image and `alt` text is still there and that the visual editor gets every block. No new words may appear. What looks different is listed. Exit code `0` when the content is the same, `2` with missing or extra content (with `--strict`, with any difference).

## After migrating

```bash
npm install @unlayer/react-elements@^0.3.0
```

The migrated templates import `@unlayer/react-elements`: until it's installed, they don't compile. When a run writes them where it isn't installed, it ends with this command, for the project's package manager (by its lockfile: npm, pnpm, yarn or bun).

Migrations render with the `@unlayer/react-elements` installed where your templates are (in a monorepo, the app's), and where `--out` writes them, so it must be a version this package supports (its peer dependency range). One outside it (older, a newer line, or a prerelease the range doesn't name) would handle the settings the converter writes, such as phone layout, differently, so the command stops with exit code `1` before writing anything, with the install command to run.

```tsx
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import Welcome from "./emails/welcome";

const html = renderToHtml(<Welcome name="Alex" />); // send with any provider
const design = renderToJson(<Welcome name="Alex" />); // open in the visual editor
```

React Email (`react-email` or `@react-email/components`) can be removed once no file imports it. The shared components and helpers your templates used are written into the migrated templates, and their own files stay as they are: after `--write`, the run lists the files that still import React Email, so delete the ones nothing imports any more before you remove it. Templates with blocks kept as HTML still import React Email components for those blocks, from the same package the template used; the report lists them. React Email's own scripts (`email dev`, `email export`) render React Email templates: preview a migrated template with `renderToHtml()`.

A template that calls React hooks (`useMemo`, `useId`, …) migrates like any other: the check calls it in a render of its own, and Elements renders it with React.

## Programmatic use

Install `@unlayer/migrate` to use the React Email converter from an agent, a build step or a server. The subpath supports ESM and CommonJS.

```bash
npm install @unlayer/migrate
```

```ts
import { convertReactEmail } from "@unlayer/migrate/react-email";
import Welcome from "./emails/welcome";

const conversion = await convertReactEmail(Welcome);
const design = conversion.design(); // open in the visual editor with loadDesign()
const customFonts = conversion.editorFonts(); // register when creating the editor: fonts: { customFonts }
const html = conversion.html();
const tsx = await conversion.tsx();
```

## What changes

The report lists every difference for each template. The common ones:

- **Phones**: columns stay side by side, as React Email's tables do, unless the template stacks them (`mobile:!block`). Side by side, they keep their share of the row, so fixed widths and images scale down with it.
- **Phone styles** become phone settings for padding, margins, font size, line height, alignment and hiding. Others (a color, font weight, letter spacing) and hover styles have no Elements equivalent. Styles for screens wider than the desktop width (`md:`, `lg:`) have none either: the check compares those screens too, and lists what differs there.
- **Attributes** a block has no place for in Elements (`id`, `title`, `role`, `aria-*`).
- **Shadows, gradients, transforms**: a box's outer shadow is dropped, a gradient background becomes its first color, and column vertical alignment is lost (email columns sit at the top). A transform, a text shadow or an inset shadow changes how text shows: a template with one is listed as looking different.
- **A box that shrinks to fit its content** (`w-fit` around text) is as wide as its parent.
- Text without a font family uses Elements' default font rather than the browser's.

## How it works

The conversion runs in your project, with your project's React, React Email and TypeScript paths (`tsconfig` and `jsconfig` aliases work, imports TypeScript can't follow are resolved as Node does, and workspace packages are followed to their source). Templates are the files that import React Email, or that import your own components that do (a `ui` file that wraps or re-exports it). The automatic JSX runtime applies to templates and imported helpers in ESM and CommonJS projects, including helpers outside the input folder and workspace packages. React Email and Elements load from each template's own folder, as where it runs, and React is one copy, the project's: in a monorepo, an app's templates use the app's packages. Pass one app's templates per run; a run whose templates would load different copies stops and says which folder to migrate on its own. It reads your templates and executes them to check the result: a template's module code runs, and its component is rendered, as React Email's preview does. Only files whose default export is a component (a function or a React `Component` class, not async, returning JSX or with `PreviewProps`) are loaded; others, like a helper that sends an email, are reported as skipped and never run. A template wrapped in another function (`export default withTracking(Welcome)`) fails: export the component itself. A template that calls `process.exit` fails instead of ending the run; one that throws later, from a timer or a promise, makes the run exit with `2` after its summary. A template that isn't saved as UTF-8 fails instead of being written back with replaced characters; CRLF line endings are kept. Run it only on code you trust. It makes no network requests: rendering produces HTML, and nothing is fetched.

For the full `@unlayer/migrate/react-email` API, see the [React Email converter documentation](https://github.com/unlayer/elements/tree/main/packages/from-react-email#readme).
