---
title: "From older Elements"
description: "Move templates written with the older Elements components to the new ones with a codemod that keeps your props, loops and helpers."
---

Hyper Elements 0.3 doesn't include the older Elements components (`ColumnLayouts`, `html` props, `renderToHtml()`): templates written with them move before you upgrade, so stay on 0.2 until they have. A codemod rewrites them with the new components. It rewrites the imports and the JSX, and nothing else: your props, loops, conditions, helpers and constants stay as they are.

A template uses one set of components or the other, never both. Move a template whole.

## Run the codemod

```bash
npx @hyper-elements/migrate src/emails --from elements                  # lists what it would change
npx @hyper-elements/migrate src/emails/welcome.tsx --from elements > welcome.next.tsx   # prints one template
npx @hyper-elements/migrate src/emails --from elements --write          # replaces them (only files git can restore)
```

Run it before you upgrade the package: a template with nothing in it that only 0.2 has is migrated only while 0.2 is installed. Each migrated template starts with the line `// Migrated from Elements 0.2's components by @hyper-elements/migrate.`, so a second run changes nothing.

`--write` only replaces templates git can restore, so commit first. `--allow-dirty` skips that check. `--report notes.md` (or `.json`) writes what the codemod noted for each template.

JSX inside expressions (`items.map(...)`, `cond && ...`) is rewritten in place. A `.js`, `.jsx`, `.mjs` or `.cjs` template gets JavaScript, a `.ts` or `.tsx` one TypeScript.

### Which files it touches

Templates are the files that import the older components, directly or through your own modules that pass them on (an index with `export { Email } from ...` or `export *` from it, followed as your `tsconfig` resolves it). Other files, such as one that only calls `renderToHtml()` or that index itself, are left as they are and aren't listed.

A namespace re-export (`export * as E from ...`) isn't followed: a template that uses one fails, naming the file. A template whose root is chosen at run time (`const Root = web ? Page : Email`) stays as it was, with a note: write it with one root.

### From code

```ts
import { migrateElements } from "@hyper-elements/migrate/elements";

const { code, report } = await migrateElements(source, { installed: "0.2.1" });
```

`installed` is the version of `@hyper-elements/react` the project has, where it's known. A module that comes back as it was says why: `current` (it already uses the new components), `undecided` (nothing in it is only either's) or `refused` (it has both, with the reason).

## Before and after

```tsx
// Before
<Email>
  <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff">
    <Column>
      <Heading headingType="h1">Welcome, {name}</Heading>
      <Paragraph html="Your workspace is <b>ready</b>." />
    </Column>
    <Column>
      <Button href="https://example.com" text="Open it" />
    </Column>
  </Row>
</Email>
```

```tsx
// After
<Email width={500} style={{ color: "#000000", fontFamily: "arial,helvetica,sans-serif" }}>
  <Section style={{ backgroundColor: "#ffffff" }}>
    <Row>
      <Column style={{ width: "50%" }}>
        <Heading style={{ padding: 10, fontSize: 22, fontWeight: 400, lineHeight: "140%" }}>
          Welcome, {name}
        </Heading>
        <Text style={{ padding: 10, fontSize: 14, lineHeight: "140%" }}>
          {"Your workspace is "}
          <Span style={{ fontWeight: 700 }}>ready</Span>.
        </Text>
      </Column>
      <Column style={{ width: "50%" }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button href={{ href: "https://example.com", target: "_blank" }}>Open it</Button>
        </Column>
      </Column>
    </Row>
  </Section>
</Email>
```

The new template draws what the old one drew. The older components filled in defaults (a 500px email, Arial, 10px of padding on every block), and the new ones don't, so the codemod writes those values out. Delete the ones you don't want.

## What it writes

| Older components | New components |
|---|---|
| `Email`'s 500px, black text, Arial | `width={500}`, and the color and font in `style` |
| A block's 10px of padding (`containerPadding`) | `padding: 10` on the block, or on a `Column` around an `Image`, `Button`, `Social`, `Menu` or `Video` |
| `Heading`: 22px at 140%, not bold; `Paragraph`: 14px at 140% | Those values in `style` |
| `Paragraph` | `Text` |
| `headingType="h3"` | `level={3}` |
| `html="Hi <b>there</b>"` | Children: `Hi <Span style={{ fontWeight: 700 }}>there</Span>`. `<a>` becomes `Link` (its target and title kept), `<br>` `LineBreak`, `<s>`, `<sup>` and `<sub>` a `Span`. Entities are decoded. Each `<p>` is a blank line from the next, and another block starts a line of its own. |
| A text block's children, `text` and `html` | What the old one drew: a `Paragraph` its children, else its `text` (plain text), else its `html`; a `Heading` or a `Button` its `text` (as markup) over its children, never its `html` |
| `letterSpacing="0.05em"` | px, from the font size |
| A `Row` | A `Section` (its background across the window), with a `Row` of `Column`s for several columns, each its share of the layout as a `width` |
| A `Row`'s side padding | Dropped: the old one drew it outside the content, where it doesn't show |
| A line along the bottom (or top) of every `Column` of a `Row` | The `Row`'s border, and each `Column`'s on phones, where they stack |
| An `Image` 120px wide | The share of its column the old one drew it at (`width: "25%", maxWidth: 125` in a 500px email). Give it `width: 120` to draw it at 120px. |
| `html` with what a run of text can't hold (an image, a list, a table, a box in a line) | An `Html` block with that markup, in a `Column` with the text's styles |
| Markup a value decides or a list writes (`` `${note ? `<em>${note}</em>` : ""}` ``) | The same choice or list, of `Span`s and `Link`s |
| Lengths in rem, em, or following the window | px (rem and em at 16px; a width that follows the window at a phone's) |
| `Html` | `Html` in a `Column` with its padding |
| `Table`'s `headers` and `data`, or the `values` it can read | A `Table` of `TableRow`s and `TableCell`s |
| `Document`'s `documentSize`, `documentOrientation`, `documentMargin`; a `PageBreak` | `size`, `orientation`, `margin`; a `PageBreak` between `Section`s |
| `Button`'s `buttonColors` | Its `color` and `backgroundColor` in `style`. The hover colors are left out and noted: add them as `hover={{ … }}` |
| `mobile={{ ... }}`, `hideOnMobile`, `hideOnDesktop` | `mobile={{ ... }}` with the new names, `hidden={{ mobile: true }}` |
| `Social`'s `{ name, url }`; `Menu`'s `linkColor` and `textColor` | `{ name, href }`; `color` and `separatorColor` |

## What it notes

The codemod never drops anything quietly. It lists, with the line:

- a value it can't read from the source (an expression) where the old components drew something other than it says: an image's width, a `Row`'s padding, phone settings;
- `html` from an expression: it's written as text, so markup in it would show;
- markup the new components don't write, each named (an image with its `src` and `alt`, a list's bullets, a style declaration and the tag it was on, a tag they have no run for), with the text in it kept;
- a text block's source the old one didn't draw (a `Paragraph`'s `html` beside its children);
- a `Button`'s hover colors, which it leaves out;
- `Column`s whose borders or backgrounds the old components stretched to their `Row`'s height;
- a horizontal `Menu` of links written out, which becomes a wrapping `Row` of its links and separators so it draws the same (a `Menu` worked out at run time, or a vertical one, stays a `Menu`);
- custom tools, which it doesn't rewrite yet: a comment marks each one for you to rewrite;
- a `Table`'s or a text's values from code, written as text where the old ones drew them as HTML, so markup in them would show;
- old functions it leaves imported, such as `renderToHtml()`.

## What to check by hand

- **Rendering.** The new components render with `await render(element)`, which is async, in place of `renderToHtml()`. Update every caller.
- **Notes.** Read every line of the report. Each one names a place where the output may differ or where you have work to do.
- **Custom tools.** Rewrite each one marked with a comment, with the new components or `component()`.
- **Values from expressions.** Image widths, `Row` padding and phone settings from code weren't read. Check them.
- **Markup in values.** `html` and table values from code are now text. If they held markup, rewrite them as `Span`s and `Link`s.
- **Runtime roots.** A template with `const Root = web ? Page : Email` wasn't changed. Write it with one root.
- **Look at it.** The codemod's tests check what each old component becomes, and round-trip each migrated example through the builder and back. No test draws a migrated template next to the old one in a browser, so render yours and look at it before you send it.

> **Tip:** Run `npx @hyper-elements/migrate src/emails --from elements --report notes.md` first, without `--write`, and read `notes.md`. Then write.
