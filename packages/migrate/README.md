# @unlayer/migrate

Migrate React Email templates to [Unlayer Elements](https://github.com/unlayer/elements). Your templates keep their props, loops and conditions; they become Elements components that render email-safe HTML, web pages and print documents, and open in the Unlayer visual editor.

```bash
npx @unlayer/migrate emails --write
```

Run it from your project folder. Each template is:

1. **Converted.** React Email components become Elements components (`Text` → `Paragraph`, `Section`/`Row`/`Column` → `Row`/`Column`, `Button` → `Button`, …). Tailwind classes become props. Components the template uses from the same file or from your other files (a shared `Layout`, a `Footer`, also through an `index.ts` that re-exports them) are inlined. Anything with no Elements equivalent is kept as an `Html` block that renders exactly as before.
2. **Checked.** The original and the migrated template are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared in two parts. The goal is an editable Unlayer template with the same content, not pixel parity: every template is written, with what differs listed.
   - **Content**, which must be the same: every word (including numeric separators, signs, currency symbols and percentages), link, image and image `alt` text the original renders, in the same order, with no new words; the same words, links and images on a phone (375px) and on wider screens a rule targets (Tailwind's `md:`, `lg:`); every block reaching the visual editor; content the original shows or hides by its props (`isGift && "hidden"`, `display: hide ? "none" : "block"`), which the migration can't keep; and words CSS adds or hides that the check doesn't read (`::before` content, an ellipsis, a line clamp, a clipping `overflow`). Anything the converter can't map is kept as HTML, so content that differs is a converter bug: the template is still written, flagged `✗`, and the run exits with `2`. Please report it.
   - **Look**, which is listed under "looks different", to fix in the editor: each word's text style at a desktop width (700px), meaning size, bold, italics, letter case, underline, color, the background behind it and a link's target; where each line of text sits across the page (a column stacked into one, a block moved to the other side); CSS the check doesn't model that can change how words show (`white-space`, letter spacing, a transform or filter, a text shadow, a list's markers, a box moved with `position`, right-to-left text, …), unless both sides have the same; phone styles the original applies up to another width than Elements' 480px (`max-width: 600px`, Tailwind's `max-sm:`), where the migration shows the other version between the two; layouts it doesn't place (a grid, columns of text, a box taken out of the flow, flex items that wrap or, in a column, aren't stretched), where their words sit depending on sizes it doesn't read; and what it can't read on one side (a selector, condition or value it doesn't evaluate), naming the rule. CSS that can't change the words (borders, rounded corners, outer shadows, heights, Outlook-only properties, rendering hints) isn't compared.

   With `--strict`, any difference fails a template, and it isn't written unless you pass `--force`. All of this holds for each flipped prop and for `compare` as well. The check is tested against Chromium: thousands of generated pairs, each with one side's look changed (or the same look written another way), must be found different whenever Chromium shows them differently. Not verified: vertical spacing, exact positions (under about 120px), where images sit and an image's `srcset`, fonts as drawn, borders, corners and outer shadows, styles in dark mode (what shows there is compared), hover, and how each email client renders. Code paths these props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified: extend `PreviewProps` to cover them.
3. **Reported.** How much is editable in the visual editor, what was kept as HTML, and every visual difference (a dropped hover style, a `mobile:` class, a radius).

```text
✓ emails/welcome.tsx: 100% editable, 1 kind of difference
✓ emails/comment.tsx: 100% editable
    looks different: couldn't verify: the look of "Alex", "can", "you" (`white-space: pre-wrap`, a style the check doesn't verify)
- emails/components/layout.tsx: skipped (no default-exported component)

2 templates: 2 migrated and checked (1 looks different: see above). 2 written.
```

## Options

| Option | |
|---|---|
| `--write` | Replace each template with its migrated version. Only templates git can restore: committed, with no changes since. |
| `--out <dir>` | Write migrated templates to `<dir>` instead, keeping the folder layout. Relative imports and resources loaded with `new URL(path, import.meta.url)` keep resolving from their original location. The rewritten source is checked in its destination folder. |
| `--design` | Also write `<name>.design.json` next to each migrated template: the design the Unlayer editor opens with `loadDesign()`. Text props the template shows as given become merge tags (`{{name}}`); props it changes first (a formatted date, an uppercased word, a padded number) or that an image shows (a QR code's data) keep their `PreviewProps` value, so the text beside an image says what the image shows. CSS, font URLs, backgrounds and image sources (including inline images in HTML) keep sample values. The design is built from the migrated template's `PreviewProps`, where JSX passed as a prop has styles instead of Tailwind classes. The JSON report lists each template's web fonts (`fonts`): register them when you create the editor (`fonts: { showDefaultFonts: true, customFonts }`), since it loads and exports only fonts it was created with. |
| `--no-merge-tags` | Keep the `PreviewProps` values in the design JSON instead of merge tags. |
| `--report <file>` | Write the migration report as Markdown (`.md`) or JSON (`.json`). |
| `--strict` | Fail a template the check finds any difference in, also in how it looks, and don't write it. Without it, every template is written, with what looks different listed. |
| `--force` | With `--strict`, write templates the check fails anyway. |
| `--overwrite` | Replace files already at a destination that the run didn't produce: what an earlier run wrote in an `--out` folder, or files git can restore (a design next to a template, which may have been edited in the editor since, only then). With `--strict`, it never writes a template that failed the check. |
| `--allow-dirty` | Replace files git can't restore (uncommitted changes, not committed, or not in a repository): templates with `--write`, other files with `--overwrite`. |
| `--from react-email` | The source format (the only one today). |

Without `--write` or `--out`, nothing is written: the command converts and checks, and prints what it would do.

`--write` replaces templates in place, so before running anything it checks that git can give each one back: a template with uncommitted changes, one that isn't committed, or one outside a git repository stops the run (exit `1`), naming them. Commit first, and git can undo the migration. `--out <dir>` writes copies and doesn't need git; `--allow-dirty` replaces templates anyway.

Default exports wrapped in React `memo` or `forwardRef` are supported, including nested wrappers. Preview props are read from the outer wrapper first, then from its inner component.

All templates are converted and checked before any output is written. With `--write` (and in a dry run, which says what `--write` does), a template another scanned template renders (it uses its default export, directly or through other files) is left in place and reported as skipped, as are components that don't render `<Html>`, files that render an email inside other markup (an app page or a preview around a template), and layouts (components that render their `children` or take content in props typed to hold JSX, such as `content: ReactNode`); their markup is inlined into the converted templates that use them. Migrating a file rewrites only its default export, so a template that only takes a constant or a named component from another doesn't keep it in place, and a file that only lists or sends templates (an `index.ts`, a send helper) doesn't either. Importers that fail the check keep using the original shared components. When the templates that use one are written and no longer need it, it's migrated in the same run. Files the run leaves that still use a migrated template (a helper that sends it with React Email's `render`) are listed after the summary. A module imported by a path worked out when it runs (`` import(`./${name}`) ``) stops a run that would write in place, since what it renders can't be told: use `--out`. `--out` also writes separate converted copies of those shared files.

`--out` requires a non-empty path. Before loading templates, the command checks all template, design and report destinations. It rejects collisions, destinations that would replace a source input (except that template's explicit `--write`), symlink output files, and symlinked directories within the output folder. These checks also apply with `--force` and `--overwrite`. A template or design file already at a destination, which the run didn't produce, stops it too unless you pass `--overwrite`, and `--overwrite` replaces only what an earlier run wrote in an `--out` folder or what git can restore (`--allow-dirty` for anything else). A `--report` file is replaced when it's a report an earlier run wrote; any other file there needs `--overwrite`, even on a dry run. Pass the inputs' common parent folder to preserve its subfolders, or migrate each input root to a separate output folder.

Verification uses a temporary file in the destination folder. The command removes it after the check, also when the run is interrupted (Ctrl-C, a kill) or fails, and removes any empty folders it created for that check. A template whose destination folder can't be written fails with that reason. Every template is written, also one whose content differs (flagged): with `--write`, git restores the original, and `--out` leaves it where it was. With `--strict`, a failed check leaves the target template and design untouched unless `--force` was requested. Writes replace files atomically, preserving other files that happen to share a hard link with an output. A template edited while the run converts it isn't replaced: it fails, and the edit stays.

Exit codes: `0` when every template converted with the same content (what looks different is listed), `1` for a usage error or when no templates were found, `2` when a template failed to convert, its content differs (with `--strict`, anything differs), a file couldn't be read (a link to a file that's gone), or the run couldn't go on. A run never ends with `0` without checking what it was given. Use it in CI to keep migrated templates honest: templates already migrated (importing `@unlayer/react-elements`: an import, not a comment that names it) are skipped, so running it again after `--write` passes. A `.js` template with JSX can't be loaded: rename it to `.jsx`.

## Check a template you migrated yourself

```bash
npx @unlayer/migrate compare emails/welcome.tsx emails/welcome.elements.tsx
```

Renders both with the original's `PreviewProps`, then with each true/false prop flipped, and checks both the HTML and design JSON that every word, link, image and `alt` text is still there and that the visual editor gets every block. No new words may appear. What looks different is listed. Exit code `0` when the content is the same, `2` with missing or extra content (with `--strict`, with any difference).

## After migrating

```bash
npm install @unlayer/react-elements
```

Migrations render with the `@unlayer/react-elements` installed where your templates are (in a monorepo, the app's), so it must be a version this package supports (its peer dependency range). One outside it (older, a newer line, or a prerelease the range doesn't name) would handle the settings the converter writes, such as phone layout, differently, so the command stops with exit code `1` and the install command to run.

```tsx
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import Welcome from "./emails/welcome";

const html = renderToHtml(<Welcome name="Alex" />); // send with any provider
const design = renderToJson(<Welcome name="Alex" />); // open in the visual editor
```

React Email (`react-email` or `@react-email/components`) can be removed once no template imports it. Templates with blocks kept as HTML still import React Email components for those blocks, from the same package the template used; the report lists them.

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

For the full `@unlayer/migrate/react-email` API, see the [React Email converter documentation](../from-react-email).
