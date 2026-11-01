# Migrating to the new components

The new components (`@unlayer/react-elements/primitives`, the main import from the next major version) render
without `@unlayer/exporters`, take typed `style` props, and come with the outputs and checks described in
[RFC 0001](rfcs/0001-primitives-and-exporters.md). Today's components stay, unchanged, at
`@unlayer/react-elements/legacy`, so a template can move when it's ready.

## Run the codemod

```bash
npx @unlayer/migrate src/emails --from elements          # lists what it would change
npx @unlayer/migrate src/emails/welcome.tsx --from elements > welcome.next.tsx   # prints one template
npx @unlayer/migrate src/emails --from elements --write  # replaces them (only files git can restore)
```

It rewrites the import and the JSX of today's components, and nothing else: props, loops, conditions,
helpers and constants stay as they are. A template's JSX inside expressions (`items.map(...)`, `cond && ...`)
is rewritten in place. `--report notes.md` (or `.json`) writes what it noted for each template.

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
| `html="Hi <b>there</b>"` | children: `Hi <Span style={{ fontWeight: 700 }}>there</Span>`; `<a>` becomes `Link`, `<br>` `LineBreak` |
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
- markup the new components don't write (`<ul>`, a `style` with `display`): its text is kept;
- `Column`s whose borders or backgrounds today's stretch to their `Row`'s height;
- a `Menu`: today's put a space between its links on top of their padding; the new one doesn't;
- components with no new one yet (`Html`, `Table`, custom tools): a comment where each was, for you to rewrite;
- today's functions it leaves imported (`renderToHtml`): render the new components with `render()`, which is
  async.

## Checked against main

main's example templates are migrated by the codemod in this repository (`packages/react/src/primitives/codemod`,
the codemod's output unedited), and Storybook's "Primitives/Codemod of main" shows each next to main's. The
comparison gate (`pnpm --filter @unlayer/react-elements test:compare`) renders both in Chromium, at desktop and
phone widths, and fails on any difference in where text sits, its styles, the images, or what's painted.
