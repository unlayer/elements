# Open React Email templates in the Unlayer editor

Any React Email template can become an Unlayer design: `@unlayer/migrate` converts it, checks the result against the original, and writes design JSON that the editor opens with `loadDesign()`. This example does it for the two templates in [`emails/`](./emails) and opens them in Unlayer's hosted editor.

## Run it

From the repository root, with Node.js 20+ and pnpm 9:

```bash
pnpm install
pnpm build    # builds the packages, including the migrate command this example runs
pnpm --filter @unlayer/react-email-in-editor-example migrate
pnpm --filter @unlayer/react-email-in-editor-example preview
```

`pnpm build` comes before `migrate`: a fresh clone has no built `@unlayer/migrate` until then.

Open <http://127.0.0.1:3002/editor.html> and pick a template. Every block is editable, the phone preview follows the template's phone styles, and **Download edited design and HTML** exports your changes. The editor needs internet access.

`migrate` empties `output/`, then writes to it:

| File | What it is |
|------|------------|
| `welcome.design.json`, `order-receipt.design.json` | Unlayer designs, ready for `loadDesign()` |
| `welcome.tsx`, `order-receipt.tsx` | The same templates as Elements components |
| `report.json` | Each template's check result, differences and web fonts; `editor.html` lists the templates and registers their fonts from it |

## Your own templates

Copy React Email templates into `emails/` (with the files they import) and run `migrate` again: they appear in the editor's list. A template that fails the check isn't written, and the report says why.

In your own project, the same command is:

```bash
npx @unlayer/migrate ./emails --out ./unlayer --design --report ./unlayer/report.json
```

Then load a design in the editor, registering the templates' web fonts when you create it (the editor only loads and exports fonts it was created with):

```js
const report = await fetch("/unlayer/report.json").then((r) => r.json());
const customFonts = report.flatMap((result) => result.fonts ?? []);
const editor = unlayer.createEditor({ id: "editor", displayMode: "email", fonts: { showDefaultFonts: true, customFonts } });
editor.addEventListener("editor:ready", async () => {
  editor.loadDesign(await fetch("/unlayer/welcome.design.json").then((r) => r.json()));
});
```

With React, pass them to `react-email-editor` the same way: `<EmailEditor options={{ fonts: { showDefaultFonts: true, customFonts } }} onReady={(unlayer) => unlayer.loadDesign(design)} />`.

To convert on a server instead, use the library: `(await convertReactEmail(Welcome)).design()` from `@unlayer/migrate/react-email` returns the same design JSON, and `.editorFonts()` its fonts.

## What to expect

- Text the template shows from its props becomes merge tags (`{{name}}`, `{{orderId}}`) that your email service fills in. Pass `--no-merge-tags` to keep the sample values.
- Spacing between sections becomes row and column padding. Where the layout needs a column that only holds space (around a card, beside an image), it holds an invisible divider, so the editor shows the design as it looks instead of "No content here" placeholders. You can select and delete it like any block.
- What Elements can't express (column vertical centering, image corner radius, shadows) is listed in `report.json` with each template's differences.
- Editing the design doesn't change the React source. Keep the migrated `.tsx` for code, and the edited design for the editor.

See the [migration guide](../../packages/react/docs/migrate-from-react-email.md) for the check, the report and every option.
