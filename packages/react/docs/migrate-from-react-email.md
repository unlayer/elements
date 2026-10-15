# Migrate from React Email

Move React Email templates to Unlayer Elements to render the same templates as email, web pages and print documents, and to open them in the Unlayer visual editor. One command converts them and checks each one against the original.

```bash
npx @unlayer/migrate emails --write --report migration.md
npm install @unlayer/react-elements
```

Run it from your project folder (it uses your project's React, React Email and `tsconfig` paths). Each template keeps its props, loops and conditions. Components it uses from the same file or other files of yours (a shared `Layout`, a `Footer`) are inlined, so their markup converts too.

JavaScript templates keep JavaScript helpers. The document's `dir` and `lang` become `Email`'s `textDirection` and `lang` props. Content with `display: none` stays hidden in an HTML block and is listed in the report.

## What the check guarantees

The goal is an editable Unlayer template with the same content, not pixel parity. Every template is written; the original and the migrated version are rendered with the template's `PreviewProps`, then again with each boolean prop flipped, and compared.

**Content** must be the same, or the template is flagged `✗` and the command exits with code `2` (it's still written: content that differs is a converter bug, since anything it can't map is kept as HTML):

- every word, numeric value (including separators, signs, currencies and percentages), link, image and image `alt` text the original renders must be in the migrated template, with the words in the same order, on desktop and on phones;
- no new words, links or images may appear;
- whether they show must be the same, including content the original shows or hides by its props (`isGift && "hidden"`), which the migration can't keep, and words CSS adds or hides (`::before` content, an ellipsis);
- any block the visual editor can't represent (`renderToJson`) fails the check, including on each boolean variant.

**How it looks** (a style, where words sit, CSS the check doesn't read, a phone width other than Elements' 480px) is listed under "looks different", to fix in the editor; the command exits with `0`. With `--strict`, any difference fails a template and it isn't written (unless `--force`).

Code paths these props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) are converted but not verified: extend `PreviewProps` to cover them. Without `--write` or `--out <dir>`, nothing is written: run it first to see the report. `--write` only replaces templates git can restore (committed, unchanged since), so commit before running it; `--allow-dirty` skips that check. A run stopped with Ctrl-C cleans up after itself; one killed outright (`kill -9`) can leave a temporary copy next to a template (`.<name>.unlayer-migrate-<id>.tsx`), safe to delete.

## Reading the report

For each template:

- **Editable**: the share of content that became Elements blocks you can edit in the visual editor. The rest is kept as `Html` blocks that render exactly as before.
- **Differences**: what Elements can't express and how it was approximated. Typical ones are responsive classes other than column stacking and the phone settings (`mobile:` colors, `sm:`), hover styles, shadows, column vertical alignment (email columns sit at the top), and fixed widths that scale with the screen on phones.
- **What the migration did**: changes that don't affect the look (components inlined, a conditional `className` split into one element per class list).

## Afterwards

```tsx
import { renderToHtml, renderToPlainText, renderToJson } from "@unlayer/react-elements";
import Welcome from "./emails/welcome";

const element = <Welcome name="Alex" />;
renderToHtml(element); // send with any provider
renderToPlainText(element); // the text part
renderToJson(element); // open in the visual editor with loadDesign()
```

`--out` refuses symlinked destinations and directories inside the output folder, and cannot replace input templates. Use `--write` to replace originals. It doesn't replace files already in the output folder that the run didn't produce either, unless you pass `--overwrite` (with `--strict`, it still never writes a template that failed the check).

`--design` also writes each template's design JSON next to it, ready for `loadDesign()`. Text props become merge tags (`{{name}}`) where the template shows them as given; `--no-merge-tags` keeps the `PreviewProps` values. CSS, font URLs, backgrounds and all image sources retain sample values even when merge tags are enabled.

## Open React Email templates in the Unlayer editor

`--design` makes any React Email template editable in Unlayer's visual editor:

```bash
npx @unlayer/migrate emails --out unlayer --design --report unlayer/report.json
```

```js
editor.loadDesign(await fetch("/unlayer/welcome.design.json").then((r) => r.json()));
```

A template's Google Fonts are in the design JSON, as the stylesheet's URL on the fonts of their family, and the editor loads them from there; a font file of your own (`<Font webFont>` from another host) isn't. To load those in the editor, and to offer any of them in its font picker, register them when the editor is created. The report lists each template's fonts in that shape, so pass them on:

```js
const report = await fetch("/unlayer/report.json").then((r) => r.json());
const customFonts = report.flatMap((result) => result.fonts ?? []);
const editor = unlayer.createEditor({ id: "editor", displayMode: "email", fonts: { showDefaultFonts: true, customFonts } });
```

From the library, `verifyConversion(...).editorFonts` and `convertReactEmail(...).editorFonts()` return the same list.

The [react-email-in-editor example](../../../examples/react-email-in-editor) runs this end to end: it migrates two templates and opens them in the hosted editor, with a picker for every template it wrote. Spacing between sections becomes padding, and a column that only holds space (around a card, beside an image) holds an invisible divider, so the editor shows the design as it looks rather than empty-column placeholders.

For a right-to-left design, call `unlayer.setTextDirection("rtl")` when loading it. The design keeps `body.values.textDirection`; `lang` belongs to the rendered document and is not stored in the editor's design JSON.

## Agent rules

- To move React Email templates to Elements, run `npx @unlayer/migrate <folder> --report migration.md` first, read the report, then run it again with `--write`. Don't rewrite templates by hand when the command can do it: it keeps their logic and checks the result.
- Exit code `2` means a template failed to convert or lost content: report that to the user with the file and the reason from the report. Don't pass `--force` to hide it.
- Blocks marked `TODO(convert)` in a migrated template are kept as HTML. Converting one by hand: replace it with Elements components (`Row` > `Column` > content), then check it with `npx @unlayer/migrate compare <original> <migrated>`. Exit code `2` lists missing or extra content.
- After converting any template by hand, run the same `compare` before reporting it done.
- React Email → Elements, when writing by hand: `Text` → `Paragraph`; `Section`/`Row`/`Column` → `Row` > `Column`; `Container` width → `Email` `contentWidth`; `Img` → `Image`; `Hr` → `Divider`; `Preview` → `Email` `previewText`; Tailwind classes → props.

For programmatic conversion (from an agent, a build step or a server), see [`@unlayer/migrate/react-email`](../../migrate#programmatic-use).
