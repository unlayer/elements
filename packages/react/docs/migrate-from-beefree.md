# Migrate from Beefree

Move Beefree templates to Unlayer Elements to keep them as React components in your code, render them as email HTML, and open them in the Unlayer visual editor. One command converts each template's JSON and, with Beefree's HTML export beside it, checks the result against that export.

```bash
npx @unlayer/migrate templates --from beefree           # converts and checks your Beefree templates (their JSON), and writes nothing
npx @unlayer/migrate templates --from beefree --write   # then writes templates/<name>.tsx beside each one
npm install @unlayer/react-elements@^0.3.0
```

It works as an [MJML migration](./migrate-from-mjml.md) does: the same options (`--write`, `--out`, `--design`, `--report`, `--strict`), output and exit codes, with Node.js 20.6 or later. The JSON files stay where they are, and each migrated template is a new `<name>.tsx` beside its JSON (or in `--out <dir>`).

## The JSON it reads

Beefree's classic "full" JSON, the one its editor saves, in versions `0.0.1` and `2.0.0` (`page.template.version`). The template can be saved as Beefree gives it (`{ "page": … }`), as the Template Catalog API returns it (`{ "json_data": { "page": … } }`, also with `json_data` as a JSON string), or as Beefree's `ITemplateJson` (`{ "data": { "json": { "page": … } } }`).

Every `.json` file in the folders given is read. One that isn't a Beefree template is skipped, with what it is: a rows collection, a single row, a popup's layout configuration, or a file with no `page` at all (a `tsconfig.json`). Beefree's Simple Schema (`template.rows`) is skipped too: convert it to full JSON first, with Beefree's Content Services API, or open and save it in Beefree.

A template of another version fails, and says so, rather than being read as well as possible:

```text
✗ templates/old.json: Unknown Beefree template version "3.0.0": only 0.0.1 and 2.0.0 are supported. Open and save it in Beefree, or report it with the file
```

## Put the HTML export beside it

A Beefree template renders in Beefree, so the check needs Beefree's own HTML for it. Export each template's HTML from Beefree and save it beside the JSON, with the same name: `welcome.json` and `welcome.html`. The migration is then checked against it, as MJML templates are checked against MJML's compile: every word, link, image and `alt` text must be the same, on desktop and on a phone, with no clear text turned too faint to read (`text now hard to read`), and how it looks is listed.

A template without its export is converted and written, but **unverified**: neither `✓` nor `✗`, but `?`, and not counted as a failure, so the run can end with `0`. With `--strict`, an unverified template fails, and isn't written unless you pass `--force`.

```text
✗ templates/old.json: Unknown Beefree template version "3.0.0": only 0.0.1 and 2.0.0 are supported. Open and save it in Beefree, or report it with the file
? templates/promo.json: unverified (no exported HTML: put Beefree's HTML export of it beside it as promo.html to check it), 100% editable, 1 kind of difference (social icon alt text is “<network> icon”)
✓ templates/sale.json: 100% editable, 6 kinds of difference (Beefree folds this menu into a hamburger button on phones; Unlayer menus have none, so phones show its items; its columns are aligned to the middle in Beefree; Unlayer columns sit at the top; Beefree stacks its columns in reverse order on phones; Unlayer stacks them in order; social icon alt text is “<network> icon”; menu toggle glyph left out; menu links shown on phones, where Beefree folds them into a hamburger button)
    looks different: the original's phone styles apply up to 660px, Elements' up to 480px: between 481px and 660px the migration shows the desktop version, with what shows only on desktop
- templates/rows.json: skipped: not a Beefree template: it's a list (a rows collection, such as a custom rows file), not a template with a `page`

3 templates: 1 migrated and checked (1 looks different: see above), 1 unverified (nothing to check against: see above), 1 failed. 1 other file skipped (see above). Nothing written: pass --write or --out <dir> to write the migrated templates.
```

## Declared differences

Two content changes are the editor's own way of writing a block. The converter declares each one, naming exactly what it changes, and the check expects those and nothing else. They're listed as differences, not as `✗`; any other change in the content still fails the template, and `--strict` fails declared differences as it does any other.

- **Social icons' `alt` text.** The Social block writes each icon's `alt` as "Facebook icon", where Beefree's says "Facebook". The report lists each one: `social icon alt text is “<network> icon” (the editor's Social block writes it this way) (×6): alt "Facebook" → "Facebook icon", …`.
- **Phone hamburger menus.** On phones, Beefree can fold a menu into a hamburger button. Unlayer menus have no such button, so its `☰` and `✕` glyphs (in Beefree's newer exports, the button) are left out, and the menu's links show on phones. The report lists `menu toggle glyph left out (Unlayer menus have no hamburger button on phones)` and `menu links shown on phones, where Beefree folds them into a hamburger button (Unlayer menus have none)`.

## What maps to what

| Beefree | Elements |
|---|---|
| The body | `<Email>`: the message width (500px when the template sets none) as `contentWidth`, the background, text and link colors, the font, the preheader as `previewText`, and right-to-left text. |
| A row and its columns | A `Row` with its columns' shares of Beefree's 12-column grid as `cells`, and its backgrounds and padding. Columns that don't stack on phones keep `noStackMobile`. |
| `text`, `paragraph`, `list` | `Paragraph`, with its HTML. |
| `heading` | `Heading`. |
| `image`, `button` | `Image`, `Button`. |
| `divider` | `Divider`. A divider Beefree doesn't draw (a transparent or 0px line, used as space) is an invisible one. |
| `spacer` | An invisible `Divider` as tall as the space, or, with a background color, a `Divider` that thick in that color. |
| `social` | `Social`, each icon keeping Beefree's image and link. |
| `menu` | `Menu`. |
| `html` | An `Html` block, as it was. |
| `video` | `Video`: a YouTube or Vimeo thumbnail linking to it. |
| `icons` | `Image` when it's one picture without text; otherwise kept as HTML. |
| `addon` | `Image` when it holds an image; otherwise kept as HTML. |
| `merge-content`, `form`, `table`, `carousel`, and modules the converter doesn't know | Kept as HTML. |

Modules kept as HTML render as their HTML, but the editor can't edit what's inside. The run counts them beside the check (`96% editable, 1 block kept as HTML (icons)`), and `--strict` fails a template with any.

What's approximated is listed per template, with where it is (`Row 5`, `Row 2, column 1, module 3 (image)`): column vertical alignment (Unlayer columns sit at the top), columns stacked in reverse order on phones, the space between columns with backgrounds, a row's border and rounded corners, an image's rounded corners, a row narrower than the message, a background image sized to cover its row (email HTML shows it at its own size), and phone styles with no Unlayer setting.

## After migrating

The migrated templates import `@unlayer/react-elements`. Render them, send them with any [email provider](./email-providers.md), or open them in the editor:

```tsx
import { renderToHtml, renderToJson, renderToPlainText } from "@unlayer/react-elements";
import Welcome from "./templates/welcome";

const html = renderToHtml(<Welcome />);
const text = renderToPlainText(<Welcome />);
unlayer.loadDesign(renderToJson(<Welcome />)); // the design --design writes
```

The migrated component takes no props: the template's sample content is written in, and merge tags stay as text. Replace them with props as described in [Migrate from MJML](./migrate-from-mjml.md#steps) (step 7).

## Agent rules

- Run `npx @unlayer/migrate <folder> --from beefree --report migration.md` first. For each template the run marks `?`, ask the user for Beefree's HTML export and save it beside the JSON as `<name>.html`, then run again. Don't report an unverified template as checked.
- Exit code `2` means a template failed: report the file and the reason. An unknown version means the JSON isn't one this converter reads; don't edit its version number to get past it.
- List the differences the report gives for the user, including the declared ones.
