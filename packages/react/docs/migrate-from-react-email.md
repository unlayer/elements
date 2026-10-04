# Migrate from React Email

Move React Email templates to Unlayer Elements to render the same templates as email, web pages and print documents, and to open them in the Unlayer visual editor. One command converts them and checks each one against the original.

```bash
npx @unlayer/migrate emails --write --report migration.md
npm install @unlayer/react-elements
```

Run it from your project folder (it uses your project's React, React Email and `tsconfig` paths). Each template keeps its props, loops and conditions. Components it uses from the same file or other files of yours (a shared `Layout`, a `Footer`) are inlined, so their markup converts too.

## What the check guarantees

Before a template is written, the original and the migrated version are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared:

- every word, numeric value (including separators, signs, currencies and percentages), link, image and image `alt` text the original renders must be in the migrated template, with the words in the same order;
- any block the visual editor can't represent (`renderToJson`) fails the check, including on each boolean variant.

A template that fails isn't written (unless `--force`), and the command exits with code `2`. Code paths these props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified: extend `PreviewProps` to cover them. Without `--write` or `--out <dir>`, nothing is written: run it first to see the report.

## Reading the report

For each template:

- **Editable**: the share of content that became Elements blocks you can edit in the visual editor. The rest is kept as `Html` blocks that render exactly as before.
- **Differences**: what Elements can't express and how it was approximated. Typical ones are responsive classes other than column stacking (`mobile:px-6`, `sm:`), hover styles, shadows, column vertical alignment (email columns sit at the top), and fixed widths that scale with the screen on phones.
- **What the migration did**: changes that don't affect the look (components inlined, a conditional `className` split into one element per class list).

## Afterwards

```ts
import { renderToHtml, renderToPlainText, renderToJson } from "@unlayer/react-elements";
import Welcome from "./emails/welcome";

const element = Welcome({ name: "Alex" });
renderToHtml(element); // send with any provider
renderToPlainText(element); // the text part
renderToJson(element); // open in the visual editor with loadDesign()
```

`--out` refuses symlinked destinations and directories inside the output folder, and cannot replace input templates. Use `--write` to replace originals.

`--design` also writes each template's design JSON next to it, ready for `loadDesign()`. Text props become merge tags (`{{name}}`) where the template shows them as given; `--no-merge-tags` keeps the `PreviewProps` values. CSS, font URLs, backgrounds and all image sources retain sample values even when merge tags are enabled.

## Agent rules

- To move React Email templates to Elements, run `npx @unlayer/migrate <folder> --report migration.md` first, read the report, then run it again with `--write`. Don't rewrite templates by hand when the command can do it: it keeps their logic and checks the result.
- Exit code `2` means a template failed to convert or lost content: report that to the user with the file and the reason from the report. Don't pass `--force` to hide it.
- Blocks marked `TODO(convert)` in a migrated template are kept as HTML. Converting one by hand: replace it with Elements components (`Row` > `Column` > content), then check it with `npx @unlayer/migrate compare <original> <migrated>`. Exit code `2` lists what's missing.
- After converting any template by hand, run the same `compare` before reporting it done.
- React Email → Elements, when writing by hand: `Text` → `Paragraph`; `Section`/`Row`/`Column` → `Row` > `Column`; `Container` width → `Email` `contentWidth`; `Img` → `Image`; `Hr` → `Divider`; `Preview` → `Email` `previewText`; Tailwind classes → props.

For programmatic conversion (from an agent, a build step or a server), see [`@unlayer/from-react-email`](../../from-react-email).
