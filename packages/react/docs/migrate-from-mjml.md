# Migrate from MJML

Move MJML templates to Unlayer Elements to write them as React components: data comes in as props, loops and conditions are JavaScript, shared parts are imports, and the same template renders as an email, a web page or a print document, and opens in the Unlayer visual editor. One command converts them and checks each one against the HTML MJML compiles it to.

```bash
npx @unlayer/migrate emails --from mjml           # converts and checks your .mjml templates, and writes nothing
npx @unlayer/migrate emails --from mjml --write   # then writes emails/<name>.tsx beside each one
npm install @unlayer/react-elements@^0.3.0
```

Run it from your project folder, with Node.js 20.6 or later. It reads MJML 4 and 5 templates. The `.mjml` files stay as they are: each migrated template is a new file beside its `.mjml` (or in `--out <dir>`), so you can compare the two before you delete the MJML. MJML and Beefree templates need `@unlayer/migrate` 0.2 or later, which renders with `@unlayer/react-elements` 0.3: an older Elements installed where the templates are stops the run before anything is written, with the command that installs a supported one.

## What a run prints

A folder with three templates and a partial they include:

```text
✓ emails/launch.mjml: 50% editable, 2 blocks kept as HTML (mj-hero, mj-carousel)
✗ emails/receipt.mjml: it's MJML 3 (it wraps its content in <mj-container>), which MJML 5 doesn't read: upgrade it first with npx mjml-migrate <input> <output>, then migrate the output
✓ emails/welcome.mjml: 100% editable
- emails/partials/brand.mjml: skipped: not an MJML document (no <mjml> root): a partial, converted where a template includes it

3 templates: 2 migrated and checked, 1 failed. 2 blocks kept as HTML (not editable as blocks). 1 other file skipped (see above). Nothing written: pass --write or --out <dir> to write the migrated templates.
```

- `✓`: converted, with the same content as MJML's HTML. The line says how much is editable, which blocks were kept as HTML, and the kinds of difference (`column vertical alignment not kept`, `columns stack on narrower screens`). What looks different is listed below it, under `looks different:`.
- `✗`: failed. The template couldn't be converted (MJML 3, no `<mj-body>`, a file that isn't UTF-8), an `mj-include` couldn't be read, its content differs from MJML's or clear text in it turned too faint to read, or, with `--strict`, it has any difference. Without `--strict`, a template whose content differs is still written and flagged: that's a converter bug, please report it.
- `-`: skipped. A file without an `<mjml>` root is a partial: it's read where a template includes it, and never written.
- `?` doesn't appear in an MJML run. It marks a template with nothing to check against, and MJML compiles every template. See [Beefree templates](./migrate-from-beefree.md), where it does.

Exit codes:

- `0`: every template converted with the same content. What looks different is listed, and doesn't fail the run.
- `1`: a usage error, no MJML templates found, a file already at a destination (see `--overwrite`), or an `@unlayer/react-elements` outside `^0.3.0` where the templates are.
- `2`: a template failed (with `--strict`, any difference fails it).

## Steps

1. **Check.** Run the command without `--write`. Nothing is written. Read what's kept as HTML and what differs, per template, in a report: `--report migration.md`.
2. **Write.** Add `--write` to write `<name>.tsx` beside each `.mjml` file, or `--out <dir>` to write them in another folder. Add `--design` for each template's design JSON, ready for the editor.
3. **Install Elements.** The migrated templates import `@unlayer/react-elements`. When it isn't installed where they're written, the run ends with the command to install it.
4. **Render where you compiled MJML.** Where your code called `mjml2html(source).html`, render the component:

   ```tsx
   import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
   import Welcome from "./emails/welcome";

   const html = renderToHtml(<Welcome />, { title: "Welcome to Acme" });
   const text = renderToPlainText(<Welcome />);
   ```

   `renderToHtml()` returns the complete document, and `renderToPlainText()` the text part MJML doesn't make. Send both with any [email provider](./email-providers.md). The `<mj-title>` is in the migrated file's header comment: pass it as the `title` option.
5. **Look at it.** A small script writes the HTML to a file you open in a browser, beside MJML's own output (`npx mjml emails/welcome.mjml -o welcome.mjml.html`). Run it with `npx tsx preview.ts`:

   ```ts
   import { writeFileSync } from "node:fs";
   import { createElement } from "react";
   import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
   import Welcome from "./emails/welcome";

   const email = createElement(Welcome);
   writeFileSync("welcome.html", renderToHtml(email, { title: "Welcome to Acme" }));
   writeFileSync("welcome.txt", renderToPlainText(email));
   ```

   Compare the two at a desktop width and at a phone width: that's where the differences the run listed show.
6. **Open it in the visual editor** (optional). `renderToJson()` gives the design the Unlayer editor loads, the same design `--design` writes:

   ```ts
   import { renderToJson } from "@unlayer/react-elements";

   unlayer.loadDesign(renderToJson(<Welcome />));
   ```

   See [visual editing](./visual-editing.md) for what round-trips. A web font's stylesheet URL is in the design, so the editor loads it; to offer it in the editor's font picker too, register it in the editor's `fonts.customFonts` (see [web fonts](./fonts.md)).
7. **Make it a template.** The migrated component takes no props: the sample data is written in, and merge tags (`{{name}}`, `*|FNAME|*`) stay as text, as MJML had them. If your email service fills them in, leave them. Otherwise replace them with props, as you would have with a template language: `{{name}}` becomes `{name}`, an `{{#each}}` loop becomes `items.map(...)`, and a condition becomes `&&` or `? :`. The converter writes text in Paragraph's `html` prop, which is markup: escape a value you put there yourself, or move plain text to the children, which are escaped for you. Give the component `PreviewProps` with sample data, for your own previews and tests:

   ```tsx
   Welcome.PreviewProps = { name: "Ada" };
   ```

## Options

| Option | |
|---|---|
| `--write` | Write `<name>.tsx` beside each `.mjml` file. |
| `--out <dir>` | Write them in `<dir>` instead, with the layout under the folder given (`emails/welcome.mjml` → `<dir>/welcome.tsx`). |
| `--design` | Also write `<name>.design.json`: the design the migrated code renders (`renderToJson()`), for the editor's `loadDesign()`. |
| `--report <file>` | Write the report: JSON for a `.json` file, Markdown for any other. For each template: what was kept as HTML, what the migration did (the includes it followed), and each difference with what it's about. |
| `--strict` | Fail a template with any difference, including a block kept as HTML and a [declared difference](#what-the-check-compares-against), and don't write it. |
| `--force` | With `--strict`, write the templates it fails anyway. The run still exits with `2`. |
| `--overwrite` | Replace a `.tsx` or design JSON an earlier run wrote, while nobody has edited it, or one git can restore. Without it, a file already at a destination stops the run. |

The same command migrates React Email templates (the default, without `--from`); see the [`@unlayer/migrate` README](../../migrate#options) for every option.

## What becomes editable blocks

The converter resolves MJML's attribute cascade as MJML does: `mj-attributes` with `mj-all` and per-tag defaults, `mj-class`, MJML's own defaults, then the attributes written on the tag. Each block gets the result as its props, so a shared color shows on every block that has it. Then:

| MJML | Elements |
|---|---|
| `mj-body`, `mj-preview`, `mj-font` | `<Email>`'s `contentWidth`, `backgroundColor`, `previewText` and `fontFamily`, with a `<Font>` for a web font. A page MJML leaves without a background is white. |
| `mj-section`, `mj-column` | A `Row` and its `Column`s, as wide as MJML makes them. The section's padding, border and background, and the space narrow columns leave, go on the Row and its outer Columns, so content sits where it does in MJML. |
| `mj-text` | `Paragraph`, or `Heading` when it holds one `<h1>`–`<h4>`, with its padding (`containerPadding`), colors, font and alignment. |
| `mj-button`, `mj-image`, `mj-divider` | `Button`, `Image`, `Divider`. |
| `mj-wrapper` | Its sections as Rows of their own, with its background and padding around them. Its border, rounded corners and background image aren't kept. |
| `mj-group` | A Row whose columns stay side by side on phones (`noStackMobile`). |
| `mj-social` | `Social`, with MJML's links. MJML's built-in icons become the editor's icons for the networks; an icon with its own `src` keeps its image. |
| `mj-navbar` | `Menu`. Its links' letter case and underline aren't kept. |
| `mj-spacer` | An empty `Divider` as tall as the space, which the editor shows and resizes. |
| `mj-table` | `Table`, when it's a plain grid (text in each cell, no spans, no colors or borders of its own). |

What doesn't carry over exactly is listed, per template, as a difference: column `vertical-align` (email columns sit at the top), a section's background image and rounded corners, a section's or `mj-group`'s `direction="rtl"` in a left-to-right email, an image's `border-radius`, `height` and `fluid-on-mobile`, a button's `height`, `mj-style` rules for other screens or states (`@media`, `:hover`), and `mj-html-attributes`. `mj-style` rules that apply at any width are written on the text they style.

On phones, MJML stacks columns below 480px (or its `mj-breakpoint`), and Elements below the content width plus 20px: 620px for a 600px email. Between the two, MJML shows the columns side by side, where Elements stacks them. The run lists it as `columns stack on narrower screens`.

Elements lays out every Row's columns in the email's direction: with `textDirection="rtl"`, right to left, the first on the right. MJML lays out each section's and group's columns by its own `direction`, left to right unless it says `rtl`, whatever `<mjml dir>` says. So `<mjml dir="rtl">` becomes a right-to-left email only when no section or group shows two or more columns left to right; otherwise the email stays left to right, with its columns where MJML shows them, and the run lists it as `mjml dir rtl not kept`. A section or group with `direction="rtl"` in a left-to-right email shows its columns in order. Phones stack columns in order in both.

## What stays MJML's HTML

Some components have no block the editor can edit. They're kept as the HTML MJML compiles them to, with the CSS they need, in an `Html` block: they render as they did in MJML, but the editor can't edit what's inside. The run counts them as not editable (`50% editable, 2 blocks kept as HTML (mj-hero, mj-carousel)`), and `--strict` fails a template with any:

- `mj-hero`: content over a background image.
- `mj-carousel` and `mj-accordion`: interactive.
- `mj-navbar` with a hamburger (its icons show only on phones), and `mj-social` with labels, without links, or with an icon for `xing`, `google` or `web` (networks the editor has no icon for).
- `mj-table` that isn't a plain grid.
- `mj-raw`, which is HTML already: an `Html` block with its markup as written. Markup no reader sees (Outlook's conditional comments) is left out.
- Components MJML puts where an editor block can't go (an `mj-section` in a column), and tags the converter doesn't know.

To make one editable, rebuild it with blocks: see [tuning by hand](#tuning-by-hand).

## `mj-include`

Includes are followed as MJML follows them: relative to the file that includes them, with `.mjml` added when the path has no extension and the file isn't there. A partial's head goes into the template's head and its body where the include is; a CSS file becomes an `mj-style`, and an HTML file an `mj-raw`. The report lists each include it followed.

An include outside the folder you gave, or one that doesn't exist, isn't read. Since the content it holds would be missing from both sides of the check, the template fails:

```text
✗ emails/welcome.mjml: check failed: couldn't read mj-include ../shared/brand.mjml (outside emails, not read), so its content isn't all there
```

Give the folder that holds both (`npx @unlayer/migrate . --from mjml`, or the templates' common parent) so the include is inside it.

## MJML 3

An MJML 3 template (everything inside `<mj-container>`) fails, since MJML 4 dropped that structure and MJML 5 doesn't read it. Upgrade it with MJML's migration tool, as the run says, then migrate the upgraded file:

```bash
npx mjml-migrate mjml3/receipt.mjml emails/receipt.mjml
npx @unlayer/migrate emails --from mjml
```

## What the check compares against

MJML's own compile. The converter compiles each original with the `mjml` version `@unlayer/migrate` pins (5.4.1, not the one in your project), with its includes resolved as above, renders the migrated code with Elements, and compares the two HTML documents as a React Email migration does. Nothing is fetched: the check reads the HTML, it doesn't load images or fonts.

- **Content** must be the same: every word, link, image and image `alt` text, in the same order, on desktop and on a phone, with no new words, and every block reaching the visual editor. Anything the converter can't map is kept as MJML's HTML, so a content difference is a bug in the converter.
- **How it looks** (a text style, where a line sits, a phone width other than Elements' 480px) is listed under `looks different:`, to fix in the editor or the code. One fails the template: text that reads clearly in MJML's HTML and is too faint to read in the migration. The words are there, but a reader can't make them out: the run says `text now hard to read`, with the colors (`"Read more" is #f7dd72 on #ffffff`).
- **Declared differences** are content changes that are the editor's own way of writing a block. The Social block writes each icon's `alt` text as "Facebook icon", and MJML's built-in icons (white glyphs MJML draws on a colored square) become the editor's icon for the network. The converter declares each one, naming the image it changes, and the check expects exactly those: they're listed as differences (`social icon alt text is “<network> icon”`), not as `✗`. Any other content change still fails the template, and `--strict` fails declared differences as it does any other.

## Tuning by hand

The converter writes each block with the props it resolved. To tidy a migrated template, or to rebuild a block that was kept as HTML, these are the props MJML's attributes correspond to:

| MJML | Elements | Notes |
|------|----------|-------|
| `<mjml lang dir>` | `Email` `lang`, `textDirection` | `dir="rtl"` becomes `textDirection="rtl"` only when no section or group shows two or more columns left to right, since `textDirection="rtl"` lays out every Row's columns right to left and MJML's `dir` doesn't. Otherwise the email stays left to right, and the run lists it (`mjml dir rtl not kept`). `textDirection="rtl"` also marks each text block right-to-left, and text blocks start on the right. |
| `<mj-section>` | `Row`, with a [column layout](../README.md#column-layouts) | `ColumnLayouts.TwoEqual`, or `cells={[3, 7]}` for `width="30%"` and `width="70%"` columns. |
| `<mj-column>` | `Column` | `padding`, `background-color`, `border-radius` → `padding`, `backgroundColor`, `borderRadius`; `border` → a `border` object with each side's width, style and color. |
| `<mj-text>` | `Paragraph` or `Heading` | `font-size`, `color`, `font-weight`, `font-family`, `align`, `line-height` → `fontSize`, `color`, `fontWeight`, `fontFamily`, `textAlign`, `lineHeight`; `padding` → `containerPadding`. |
| `<mj-button>` | `Button` | `inner-padding` → `padding`, `padding` → `containerPadding`, `align` → `textAlign`, `border` → a `border` object. |
| `<mj-image>` | `Image` | `alt` → `alt`, `href` → `action`, `align` → `textAlign`, `width` → `width`. |
| `<mj-divider>` | `Divider` | `border-width`, `border-style`, `border-color` → `borderTopWidth`, `borderTopStyle`, `borderTopColor`. |
| `<mj-social>` | `Social` | `icons={[{ name: "Facebook", url }]}`, `icon-size` → `iconSize`. |
| `<mj-navbar>` | `Menu` | `items={[{ text, href }]}`, link `color` → `linkColor`. |
| `<mj-hero>` | `Row` with `backgroundImage` | `backgroundImage={{ url, fullWidth: false, size: "cover", position: "center" }}`; the Column's padding sets the height. |
| `<mj-carousel>`, `<mj-accordion>` | `Image`; `Heading` and `Paragraph` | No interactive blocks: show the first slide as an `Image`, and accordion items expanded. |

A Row has two backgrounds. `backgroundColor` spans the full width of the email, like a `full-width` section's, and the Row's `padding` sits inside it. `columnsBackgroundColor` covers the content width, like a section's own `background-color`, and the Row's `padding` sits outside it. So for a boxed section with a background, put the inside spacing on the Columns:

```tsx
<Row layout={ColumnLayouts.OneColumn} columnsBackgroundColor="#ffffff">
  <Column padding="20px 15px">{/* blocks */}</Column>
</Row>
```

The converter writes the attributes `mj-attributes` and `mj-class` gave a block on that block. To share them again, spread an object, or make a small component:

```tsx
import { Paragraph, type ParagraphProps } from "@unlayer/react-elements";

// <mj-class name="muted" font-size="13px" color="#71717a" />
const muted = { fontSize: "13px", color: "#71717a" };
<Paragraph {...muted}>Acme Inc., 1 Example Street</Paragraph>;

// or a component, with your defaults and any prop overridden
export function Muted(props: ParagraphProps) {
  return <Paragraph fontSize="13px" color="#71717a" {...props} />;
}
```

For what the run lists as a difference:

| MJML | How to approximate it |
|------|-----------------------|
| `<mj-column vertical-align="middle">` | Email columns sit at the top. Even out the columns' content, or add `padding` to the shorter one. |
| `<mj-breakpoint>` | Phone settings apply at 480px and below. In emails, columns stack below the content width plus 20px; `noStackMobile` keeps a Row's columns side by side. |
| `<mj-image>` width on phones | A fixed `width` is a share of the column, so the image gets smaller on phones, where MJML keeps it. Add `mobile={{ width: "120px" }}` to keep it; for `fluid-on-mobile`, `mobile={{ autoWidth: true }}` fills the column, up to the image's own width. |
| `<mj-style>` media queries for phones | Phone settings: `mobile={{ fontSize: "26px", textAlign: "center" }}` on a block, `mobile={{ padding: "16px" }}` on a Column or Row (`containerPadding` on a block), and `hideOnMobile` or `hideOnDesktop` on a block or Row. |
| `<mj-wrapper>` border or rounded corners | A border or radius around several Rows doesn't carry over. With one Column, give the Column `backgroundColor` and `borderRadius`. |
| `<mj-section direction="rtl">`, `<mj-group direction="rtl">` | In a left-to-right email, columns render in source order, left to right: write them in the order you want. In a right-to-left email (`textDirection="rtl"` on the root), every Row's columns render right to left, the first on the right. Phones stack them in source order in both. |
| `<mj-navbar hamburger="hamburger">` | No collapsing menu. Use a `Menu` with `hideOnMobile` and a second one with `layout="vertical"` and `hideOnDesktop`. |
| `<mj-table>` cell styles, `colspan`, images in cells | `Table` applies one style to every header cell and one to every body cell. For a layout table (an order line with a thumbnail), use a Row with Columns. |
| Hover styles | Emails don't carry hover CSS. A Button's `hoverBackgroundColor` and `hoverColor` apply to web pages (`Page`). |
| `<mj-html-attributes>`, `css-class`, other CSS | Use `renderToHtmlParts()`, which returns the `head` and `body`, and add your own `<style>` or tags to the document you assemble. The visual editor doesn't see them. |

After editing a migrated template, open it beside MJML's output again (step 5), and check the design with `renderToJson()` for console warnings.

## Agent rules

- To move MJML templates to Elements, run `npx @unlayer/migrate <folder> --from mjml --report migration.md` first, read the report, then run it again with `--write`. Don't convert templates by hand when the command can: it resolves MJML's cascade and checks the result.
- Exit code `2` means a template failed: report the file and the reason from the output. A content difference is a converter bug; don't pass `--force` to hide it. An unread `mj-include` means the folder given doesn't hold it: run on the common parent folder.
- Blocks kept as HTML render as MJML did. Rebuild one with Elements blocks only when the user wants it editable, with the [table above](#tuning-by-hand), then compare the HTML with MJML's in a browser at desktop and phone widths.
- Replace written-in sample data with props, and escape any value put in an `html` prop. List the differences the report gives for the user.
