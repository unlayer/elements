# @unlayer/migrate

Migrate React Email templates to [Unlayer Elements](https://github.com/unlayer/elements). Your templates keep their props, loops and conditions; they become Elements components that render email-safe HTML, web pages and print documents, and open in the Unlayer visual editor.

```bash
npx @unlayer/migrate emails --write
```

Run it from your project folder. Each template is:

1. **Converted.** React Email components become Elements components (`Text` → `Paragraph`, `Section`/`Row`/`Column` → `Row`/`Column`, `Button` → `Button`, …). Tailwind classes become props. Components the template uses from the same file or from your other files (a shared `Layout`, a `Footer`, also through an `index.ts` that re-exports them) are inlined. Anything with no Elements equivalent is kept as an `Html` block that renders exactly as before.
2. **Checked.** The original and the migrated template are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared. Every word (including numeric separators, signs, currency symbols and percentages), link, image and image `alt` text the original renders must be in the migrated output, words in the same order, no new words may appear, and any block the visual editor can't represent fails the check. A template that fails isn't written unless you pass `--force`. Code paths these props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified: extend `PreviewProps` to cover them.
3. **Reported.** How much is editable in the visual editor, what was kept as HTML, and every visual difference (a dropped hover style, a `mobile:` class, a radius).

```text
✓ emails/welcome.tsx: 100% editable, 1 kind of difference
✓ emails/receipt.tsx: 96% editable, 2 kinds of difference
- emails/components/layout.tsx: skipped (no default-exported component)

2 templates: 2 migrated and checked. 2 written.
```

## Options

| Option | |
|---|---|
| `--write` | Replace each template with its migrated version. |
| `--out <dir>` | Write migrated templates to `<dir>` instead, keeping the folder layout. Relative imports and resources loaded with `new URL(path, import.meta.url)` keep resolving from their original location. The rewritten source is checked in its destination folder. |
| `--design` | Also write `<name>.design.json` next to each migrated template: the design the Unlayer editor opens with `loadDesign()`. Text props the template shows as given become merge tags (`{{name}}`); props it changes first (a formatted date, an uppercased word) keep their `PreviewProps` value. CSS, font URLs, backgrounds and image sources (including inline images in HTML) keep sample values. The design is built from the migrated template's `PreviewProps`, where JSX passed as a prop has styles instead of Tailwind classes. The JSON report lists each template's web fonts (`fonts`): register them when you create the editor (`fonts: { showDefaultFonts: true, customFonts }`), since it loads and exports only fonts it was created with. |
| `--no-merge-tags` | Keep the `PreviewProps` values in the design JSON instead of merge tags. |
| `--report <file>` | Write the migration report as Markdown (`.md`) or JSON (`.json`). |
| `--force` | Write templates even when the check finds a problem. |
| `--from react-email` | The source format (the only one today). |

Without `--write` or `--out`, nothing is written: the command converts and checks, and prints what it would do.

Default exports wrapped in React `memo` or `forwardRef` are supported, including nested wrappers. Preview props are read from the outer wrapper first, then from its inner component.

All templates are converted and checked before any output is written. With `--write`, files imported by another scanned file, and components that don't render `<Html>`, are left in place and reported as skipped; their markup is inlined into the converted templates that use them. Importers that fail the check can keep using the original shared components. `--out` also writes separate converted copies of those shared files.

`--out` requires a non-empty path. Before loading templates, the command checks all template, design and report destinations. It rejects collisions, destinations that would replace a source input (except that template's explicit `--write`), symlink output files, and symlinked directories within the output folder. These checks also apply with `--force`. Pass the inputs' common parent folder to preserve its subfolders, or migrate each input root to a separate output folder.

Verification uses a temporary file in the destination folder. The command removes it after the check and removes any empty folders it created for that check. A failed check leaves the target template and design untouched unless `--force` was requested. Writes replace files atomically, preserving other files that happen to share a hard link with an output.

Exit codes: `0` when every template converted and passed the check, `1` for a usage error or when no templates were found, `2` when a template failed to convert or the check found a problem. Use it in CI to keep migrated templates honest: templates already migrated (importing `@unlayer/react-elements`) are skipped, so running it again after `--write` passes. A `.js` template with JSX can't be loaded: rename it to `.jsx`.

## Check a template you migrated yourself

```bash
npx @unlayer/migrate compare emails/welcome.tsx emails/welcome.elements.tsx
```

Renders both with the original's `PreviewProps`, then with each true/false prop flipped, and checks both the HTML and design JSON that every word, link, image and `alt` text is still there and that the visual editor gets every block. No new words may appear. Exit code `0` when it passes, `2` with missing or extra content when it doesn't.

## After migrating

```bash
npm install @unlayer/react-elements
```

Migrations render with the `@unlayer/react-elements` installed where your templates are (in a monorepo, the app's), so it must be a version this package supports (its peer dependency range). An older one would ignore settings the converter writes, such as phone layout, so the command stops with exit code `1` and the install command to run.

```tsx
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import Welcome from "./emails/welcome";

const html = renderToHtml(<Welcome name="Alex" />); // send with any provider
const design = renderToJson(<Welcome name="Alex" />); // open in the visual editor
```

React Email (`react-email` or `@react-email/components`) can be removed once no template imports it. Templates with blocks kept as HTML still import React Email components for those blocks, from the same package the template used; the report lists them.

A migrated template can't call React hooks: Elements calls it to read its root's settings (fonts, language, direction, phone styles). The command reports such a template instead of migrating it.

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
- **Responsive classes** other than stacking (`mobile:px-6`, `sm:`) and hover styles have no Elements equivalent.
- **Attributes** a block has no place for in Elements (`id`, `title`, `role`, `aria-*`).
- **Shadows, gradients, transforms** and column vertical alignment (email columns sit at the top).
- **A box that shrinks to fit its content** (`w-fit` around text) is as wide as its parent.
- Text without a font family uses Elements' default font rather than the browser's.

## How it works

The conversion runs in your project, with your project's React, React Email and TypeScript paths (`tsconfig` aliases work). The automatic JSX runtime applies to templates and imported helpers in ESM and CommonJS projects, including helpers outside the input folder. It reads your templates and executes them to check the result. Run it only on code you trust. It makes no network requests: rendering produces HTML, and nothing is fetched.

For the full `@unlayer/migrate/react-email` API, see the [React Email converter documentation](../from-react-email).
