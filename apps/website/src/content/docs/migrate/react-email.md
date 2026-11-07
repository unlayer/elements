---
title: "From React Email"
description: "Move React Email templates to Hyper Elements with one command that converts each template and checks it against the original."
---

You don't rewrite your React Email templates by hand. One command converts them, keeps their props, loops and conditions, and then checks each migrated template against its original, so you know what changed before you ship it.

```bash
npx @hyper-elements/migrate emails           # converts and checks your templates, and writes nothing
npx @hyper-elements/migrate emails --write   # then replaces them (committed in git first, so git can undo it)
```

Run it from your project folder, with Node.js 20.6 or later. It uses your project's React, React Email and `tsconfig` paths.

## What it converts

Each template becomes the components from `@hyper-elements/react`, with its styles in `style={{ }}`:

| React Email | Hyper Elements |
|---|---|
| `Text` | `Text` |
| `Section`, `Row`, `Column` | `Section`, `Row`, `Column` |
| `Button` | `Button` |
| `Container` width | `Email` `width` |
| `Img` | `Image`, with its file's size in `src={{ src, width, height }}` |
| `Hr` | `Divider` |
| `Preview` | `Email` `previewText` |
| Margins | Padding on the blocks |
| Tailwind classes and inline styles | `style={{ }}` |

- **Tailwind** classes are resolved with React Email's own Tailwind and your template's config, then become styles.
- **Your own components** that a template uses, from the same file or your other files (a shared `Layout`, a `Footer`, also through an `index.ts` that re-exports them), are inlined, so their markup converts too.
- **Anything with no equivalent** is kept as an `Html` block that renders exactly as before. The block is marked `TODO(convert)` in the migrated template.
- **Default exports** wrapped in `memo` or `forwardRef` work, nested wrappers included. A template that calls hooks (`useMemo`, `useId`) migrates like any other.
- **Language and direction:** the document's `lang` and `dir` become `Email`'s `lang` and `dir` props.

JavaScript templates keep JavaScript. A `.js` file with JSX can't be loaded: rename it to `.jsx`.

## How it checks the result

The goal is an editable template with the same content, not pixel parity. The original and the migrated template are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared in two parts.

### Content must match

- every word the original renders, including numbers with their separators, signs, currency symbols and percentages, in the same order;
- every link, image and image `alt` text;
- no new words, links or images;
- the same on a phone (375px), and on wider screens where a rule targets them (Tailwind's `md:`, `lg:`);
- the same in dark mode, where either side has a `prefers-color-scheme: dark` rule (a logo or text swapped for dark mode);
- whether content shows, including content the original shows or hides by its props (`isGift && "hidden"`), and words CSS adds or hides (`::before` content, an ellipsis, a line clamp, a clipping `overflow`);
- every block reaching the visual editor.

Anything the converter can't map is kept as HTML, so content that differs is a converter bug. The template is still written, flagged `✗`, and the run exits with `2`. Please report it.

### How it looks is listed

At a desktop width (700px), each word's size, bold, italics, letter case, underline, color, the background behind it and a link's target; where each line of text sits across the page (a column stacked into one, a block moved to the other side); and CSS the check doesn't model that can change how words show (`white-space`, letter spacing, a transform, a text shadow, right-to-left text), unless both sides have the same. A difference here is listed under "looks different", for you to fix in the editor. The run still exits `0`.

The check fails closed: when it can't read something on one side (a selector, a condition, a value), it says so, naming the rule, instead of passing it.

### What isn't verified

Vertical spacing, exact positions (under about 120px), where images sit and an image's `srcset`, fonts as drawn, borders, corners and outer shadows, styles in dark mode (what shows there is compared), hover, and how each email client renders.

Code paths your `PreviewProps` don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified. Extend `PreviewProps` to cover them.

## The report

```text
✓ emails/welcome.tsx: 100% editable, 1 kind of difference (image border radius dropped)
✓ emails/comment.tsx: 100% editable
    looks different: couldn't verify: the look of "Alex", "can", "you" (`white-space: pre-wrap`, a style the check doesn't verify)
- emails/components/layout.tsx: skipped (no default-exported component)

2 templates: 2 migrated and checked (1 looks different: see above). 1 other file skipped (see above). 2 written.
```

For each template:

- **Editable**: the share of content that became blocks you can edit in the visual editor. The rest is kept as HTML blocks that render exactly as before.
- **Differences**: what Hyper Elements can't express, and how it was approximated.
- **What the migration did**: changes that don't affect the look (a component inlined, a conditional `className` split into one element per class list).

Files that aren't templates (shared components, helpers, a framework's routes) are listed after the templates as skipped, with why. Write the report to a file with `--report`.

## Options

| Option | What it does |
|---|---|
| `--write` | Replace each template with its migrated version. Only templates git can restore: committed, with no changes since. |
| `--out <dir>` | Write migrated templates to `<dir>` instead, keeping the folder layout. Relative imports still resolve. |
| `--design` | Also write `<name>.design.json` next to each template, for the visual editor's `loadDesign()`. Text props shown as given become merge tags (`{{name}}`). |
| `--no-merge-tags` | Keep the `PreviewProps` values in the design JSON instead of merge tags. |
| `--report <file>` | Write the migration report: JSON for a `.json` file, Markdown for any other. |
| `--strict` | Fail a template with any difference, in its content, its look, or a style the migration couldn't keep, and don't write it. |
| `--force` | With `--strict`, write templates the check fails anyway. |
| `--overwrite` | Replace files already at a destination that this run didn't produce: what an earlier run wrote in an `--out` folder (not once it's edited), or files git can restore. |
| `--allow-dirty` | Replace files git can't restore (changed since the last commit, not committed, or not in a repository), with `--write` or `--overwrite`. |
| `--from <source>` | `react-email` (the default), or `elements` to [move older Elements templates](/docs/migrate/elements). |
| `-h`, `--help` | Show the help. |
| `-v`, `--version` | Show the version. |

Without `--write` or `--out`, nothing is written. Run it once to read the report, then again with `--write`.

### Safe writes

`--write` replaces templates in place, so before running anything it checks that git can give each one back. A template with uncommitted changes, one that isn't committed, or one outside a git repository stops the run with exit `1`, naming them. Commit first, and git can undo the migration. `--out <dir>` writes copies and doesn't need git. `--allow-dirty` replaces templates anyway.

All templates are converted and checked before any output is written. A template edited while the run converts it isn't replaced: it fails, and your edit stays. A run stopped with Ctrl-C cleans up after itself. One killed outright (`kill -9`) can leave a temporary copy next to a template, a dot-file named after it, safe to delete.

## Exit codes

| Code | When |
|---|---|
| `0` | Every template converted with the same content. What looks different is listed. |
| `1` | A usage error, no templates found, a template left unchecked because a file that renders it isn't migrated (a preview around it: migrate it with `--out`), a Node.js older than 20.6, an installed `@hyper-elements/react` this version doesn't support, or a `--write` blocked by files git can't restore. |
| `2` | A template failed to convert, its content differs (with `--strict`, anything differs), a file couldn't be read, or the run couldn't go on. |

A run never ends with `0` without checking what it was given. That makes it safe in CI: templates already migrated are skipped, so running it again after `--write` passes.

## Check a template you migrated yourself

```bash
npx @hyper-elements/migrate compare emails/welcome.tsx emails/welcome.elements.tsx
```

`compare` renders both with the original's `PreviewProps`, then with each true/false prop flipped, and checks the HTML and the design JSON: every word, link, image and `alt` text is still there, no new words appear, and the visual editor gets every block. What looks different is listed. Exit `0` when the content is the same, `2` with missing or extra content (with `--strict`, with any difference).

Use it after you convert a `TODO(convert)` block by hand: replace it with the new components, then run `compare` against the original (from git, if `--write` replaced it).

## How well it works

Measured on 106 real templates: 71 of React Email's own demo and example emails, 25 community templates from MIT repositories, and 10 written by agents. The codemod migrates your source; the runtime mode converts what a template renders, as `convertReactEmail()` does.

| | Codemod | Runtime |
|---|---|---|
| Converted | 106 of 106 | 106 of 106 |
| Type-check | 106 of 106 | 106 of 106 |
| Lose content | 0 | 0 |
| Problems with a boolean prop flipped | 0 | 0 |
| Blocks the editor skips | 0 | 0 |
| Editable, on average | 98.4% | 98.4% |
| Fully editable | 96 | 97 |
| Words moved on desktop (median) | 0% | 0% |

On desktop, in 105 of 106 templates at most a quarter of the words sit somewhere else, and the median is none. The one outlier sets no font, so the browser shows serif where Hyper Elements uses its sans-serif default. No conversion has a style difference on desktop. Three have one on phones: text the converter makes smaller so its words fit.

## What changes

The report lists every difference for each template. The common ones:

- **Phones.** React Email's rows are tables and never stack, so columns stay side by side, unless the template stacks them (`mobile:!block`). Side by side, they keep their share of the row, so fixed widths and images scale down with it.
- **Phone styles** become phone settings for padding, margins, font size, line height, alignment and hiding. Others (a color, font weight, letter spacing) and hover styles have no equivalent. Phone settings use a 480px breakpoint, so a source query such as `max-width: 600px` differs between 481px and 600px.
- **Column vertical alignment.** A React Email `Column` is a `<td>`, centered vertically by default. Email columns here sit at the top. It shows only next to a taller column.
- **Shadows, gradients, transforms.** A box's outer shadow is dropped and a gradient background becomes its first color. A transform, a text shadow or an inset shadow changes how text shows, so a template with one is listed as looking different.
- **Image border radius** is dropped.
- **Attributes** a block has no place for (`id`, `title`, `role`, `aria-*`).
- **A box that shrinks to fit its content** (`w-fit` around text) is as wide as its parent.
- **Text without a font family** uses the default font rather than the browser's.

## A template that can't be converted

A template that can't be written in the components at all fails: nothing is written for it, the report says why, and the run exits `2`. Rewrite that part by hand, then check it against the React Email original with `npx @hyper-elements/migrate compare <original> <migrated>`.

## After migrating

Install the package, since the migrated templates import it:

```bash
npm install @hyper-elements/react@^0.3.0
```

When a run writes templates where it isn't installed, it ends with the install command for your package manager (npm, pnpm, yarn or bun, by your lockfile).

```tsx
import { render } from "@hyper-elements/react";
import { toDesign } from "@hyper-elements/react/builder";
import Welcome from "./emails/welcome";

const element = <Welcome name="Alex" />;
const { html, text } = await render(element); // send html with any provider, with text as the text part
const { design } = toDesign(element);         // open in the visual editor with loadDesign()
```

You can remove React Email once no file imports it. After `--write`, the run lists the files that still import it, and the project files that still use a migrated template with React Email's `render()`: render those with `render()` from `@hyper-elements/react` instead. Templates with blocks kept as HTML still import React Email components for those blocks; the report lists them.

## Open React Email templates in Unlayer's builder

`--design` makes any React Email template editable in Unlayer's visual builder, without changing your source:

```bash
npx @hyper-elements/migrate emails --out unlayer --design --report unlayer/report.json
```

```js
editor.loadDesign(await fetch("/unlayer/welcome.design.json").then((r) => r.json()));
```

Web fonts aren't part of the design JSON: the editor loads and exports a web font only when it's registered when the editor is created. The JSON report lists each template's fonts in that shape:

```js
const report = await fetch("/unlayer/report.json").then((r) => r.json());
const customFonts = report.flatMap((result) => result.fonts ?? []);
const editor = unlayer.createEditor({ id: "editor", displayMode: "email", fonts: { showDefaultFonts: true, customFonts } });
```

## From code

Use the converter from an agent, a build step or a server:

```bash
npm install @hyper-elements/migrate
```

```ts
import { convertReactEmail, NewComponentsError } from "@hyper-elements/migrate/react-email";
import Welcome from "./emails/welcome";

const conversion = await convertReactEmail(Welcome); // rendered with its PreviewProps, and checked against it
const tsx = conversion.code;                  // the template in the components
const html = await conversion.html();
const design = conversion.design();           // open in the visual editor with loadDesign()
const customFonts = conversion.editorFonts(); // register when creating the editor: fonts: { customFonts }
conversion.report.missingText;                // [] when nothing was lost
```

`convertReactEmail()` converts what a template renders: loops and conditions become the content they produced (the CLI keeps them). Where that can't be written in the components, it throws a `NewComponentsError`, whose `reason` says why.

> **Warning:** The command runs your templates to check them: a template's module code runs, and its component renders, as React Email's preview does. Run it only on code you trust. It makes no network requests.
