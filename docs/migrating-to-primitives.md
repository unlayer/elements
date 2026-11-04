# Migrating to the new components

The new components (`@unlayer/react-elements/primitives`, the main import from the next major version) render
without `@unlayer/exporters`, take typed `style` props, and come with the outputs and checks described in
[RFC 0001](rfcs/0001-primitives-and-exporters.md). Today's components stay at
`@unlayer/react-elements/legacy` with their API unchanged (since 0.3.0 they render through the new engine too),
so a template can move when it's ready.

## Run the codemod

```bash
npx @unlayer/migrate src/emails --from elements          # lists what it would change
npx @unlayer/migrate src/emails/welcome.tsx --from elements > welcome.next.tsx   # prints one template
npx @unlayer/migrate src/emails --from elements --write  # replaces them (only files git can restore)
```

It rewrites the import and the JSX of today's components, and nothing else: props, loops, conditions,
helpers and constants stay as they are. A template's JSX inside expressions (`items.map(...)`, `cond && ...`)
is rewritten in place. It finds templates by what they import, through the project's own index files that
re-export today's components too; a file that imports none of them comes back as it was, and isn't listed.
A namespace re-export (`export * as E from "@unlayer/react-elements"`) isn't followed: a template using one
fails, naming the file. A `.js`, `.jsx`, `.mjs` or `.cjs` template gets JavaScript, a `.ts` or `.tsx` one
TypeScript. `--report notes.md` (or `.json`) writes what it noted for each template.

From code, `migrateElements(source)` (from `@unlayer/migrate/elements`) returns `{ code, report }`.

## What it writes

The new template draws what today's drew. Where today's components fill in a value the new ones don't
share, the codemod writes it out:

| Today's | The new template |
|---|---|
| `Email`'s 500px, black text, Arial | `width={500}` and the color and font in `style` |
| A block's 10px of padding (`containerPadding`) | `padding: 10` on the block, or on a `Column` around an `Image`, `Button`, `Social`, `Menu` or `Video` |
| `Heading`: 22px at 140%, not bold; `Paragraph`: 14px at 140% | those values in `style` |
| `headingType="h3"` | `level={3}` |
| `html="Hi <b>there</b>"` | children: `Hi <Span style={{ fontWeight: 700 }}>there</Span>`; `<a>` becomes `Link` (its target and title kept), `<br>` `LineBreak`, `<s>`, `<sup>` and `<sub>` a `Span`; entities are decoded; each paragraph (`<p>`) is a blank line from the next (today's 1em margins, about), and another block starts a line of its own |
| A text block's children, `text` and `html` | what today's draws: a `Paragraph` its children, else its `text` (plain text), else its `html`; a `Heading` or a `Button` its `text` (as markup) over its children, never its `html` |
| `letterSpacing="0.05em"` | px, from the font size |
| A `Row` | a `Section` (its background across the window), with a `Row` of `Column`s for several columns, each its share of the layout as a `width` |
| A `Row`'s side padding | dropped: today's draw it outside the content, where it doesn't show |
| A line along the bottom (or top) of every `Column` of a `Row` | the `Row`'s border, and each `Column`'s on phones, where they stack: today's stretch `Column`s to their `Row`'s height |
| An `Image` 120px wide | the share of its column today's draw it at (`width: "24%", maxWidth: 124.8`): give it `width: 120` to draw it at 120px |
| `mobile={{ ... }}`, `hideOnMobile`, `hideOnDesktop` | `mobile={{ ... }}` with the new names, `hidden={{ mobile: true }}` |
| `Social`'s `{ name, url }`, `Menu`'s `linkColor` and `textColor` | `{ name, href }`, `color` and `separatorColor` |

## What it notes

The codemod never drops anything quietly. It lists, with the line:

- a value it can't read from the source (an expression) where today's draw something other than it says: an
  image's width, a `Row`'s padding, phone settings;
- `html` from an expression: it's written as text, so markup in it would show;
- markup the new components don't write, each named: an image (its `src` and `alt`), a list's bullets, a style
  declaration and the tag it was on, a tag they have no run for; the text in it is kept;
- a text block's source today's doesn't draw (a `Paragraph`'s `html` beside its children);
- `Column`s whose borders or backgrounds today's stretch to their `Row`'s height;
- a horizontal `Menu` of links written out: it's written as a wrapping `Row` of its links and separators, with
  the spaces today's puts between them, so it draws as today's does (a `Menu` of links worked out at run
  time, or a vertical one, stays a `Menu`);
- components with no new one yet (`Html`, `Table`, custom tools): a comment where each was, for you to rewrite;
- today's functions it leaves imported (`renderToHtml`): render the new components with `render()`, which is
  async.

## Checked against main

main's example templates are migrated by the codemod in this repository (`packages/react/src/primitives/codemod`,
the codemod's output unedited, which a test checks), and the round-trip tests take each migrated template to the
builder and back. The comparison gate (`pnpm --filter @unlayer/react-elements test:compare`) renders main's templates
as today's components do next to the new engine's render of them, and each migrated template as the builder draws it
next to what comes back from the builder, in Chromium, at desktop and phone widths, and fails on any difference in
where text sits, its styles, the images, or what's painted.
