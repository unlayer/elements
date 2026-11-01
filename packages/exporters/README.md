# @unlayer-internal/elements-exporters

Elements' own writers: a laid-out template (from `@unlayer-internal/elements-core`'s resolver) as
HTML for each output, and as plain text. Private, bundled into `@unlayer/react-elements`. The plan
behind it is `docs/rfcs/0001-primitives-and-exporters.md`.

```
src/
  index.ts         renderTemplate(): checks and lays out a template, then picks the writer from its root
  jsx.ts           the JSX the writers are written in: it writes HTML strings (no React)
  plain-text.ts    the plain-text version (the same for every output)
  shared/          escaping and CSS values (css.ts), the stylesheet's short class names (classes.ts), fonts
  email/           <Email>: tables, px widths, Outlook's markup in conditional comments
  page/            <Page>: one element per node, flexbox
```

In `email/` and `page/`, each component has its own file (`Button.tsx`, `Row.tsx`, `Heading.tsx`,
…), exporting one writer with the same signature as the others. A writer works out what it needs
first (widths, classes, diagnostics), then returns its markup as JSX. It writes its own node and
asks `context.render()` for its children, so components never import each other.

```tsx
export const writeColumn: Writer = (node, place, context) =>
  boxed(node, context, place.fill, (id) => {
    const stack = stackRows(node, context, mobileTextOf(node, place.mobile));
    return <Table id={id} class={stack.className} width="100%">{stack.rows}</Table>;
  });
```

The JSX (`src/jsx.ts`) writes strings, and:

- escapes every text and attribute value, so what users write can't add markup;
- takes `style` as an object, or a list of objects and `[property, value]` pairs merged in order,
  and writes each value by its property: numbers in px (unitless for `fontWeight`, `lineHeight`,
  `flex`), padding, borders and radii from the template's own objects, short colors. Empty values
  are left out, and `style` is always the last attribute;
- writes Outlook's conditional comments with `<Outlook>` and `<NotOutlook>`. `<Merged>` joins
  neighbouring comments of one kind, and `open()` and `close()` write a tag on its own, for Outlook's
  tables that open in one comment and close in another (`email/Row.tsx`).

Each `.tsx` file imports `h` (and `Fragment` for `<>…</>`) from `../jsx`; the tsconfig, tsup and
vitest configs set `jsxFactory: "h"`.

The rest of each folder is what its components share:

| File | email/ | page/ |
|---|---|---|
| `index.ts` | the document (head, preview text, size budgets) and the table of writers | the document and the table of writers |
| `context.ts` | the render's state, where a node is written (`Place`), the `Writer` type | the same |
| `layout.tsx` | widths as Word reads them, a box as a table, a stack as table rows | flex placement in a stack or a Row, box styles |
| `styles.tsx` | full text styles on the text, phone, hiding and hover classes, the text in a node | phone, hiding and hover classes, the text in a node |
| `markup.tsx` | `<Table>` (every layout table's attributes), colors as Word reads them | |

The root (`Email.tsx`, `Page.tsx`) is written by the folder's `index.ts`, not through the table.

## Adding a component

1. Its definition in `packages/core/src/components.ts` (props, styles, children, which outputs).
2. A writer in each output folder it supports: `email/Name.tsx` and `page/Name.tsx`, added to the
   table in that folder's `index.ts`.
3. Its plain text in `plain-text.ts`, if it has any of its own.
4. Tests: markup in `test/email.test.ts` and `test/web.test.ts` (the JSX itself in `test/jsx.test.tsx`); widths in Chromium in
   `test/browser/` when it has a box of its own.

## Tests

```bash
pnpm --filter @unlayer-internal/elements-exporters test           # markup, phone styles, hostile input
pnpm --filter @unlayer-internal/elements-exporters test:browser   # widths in Chromium, with and without <style>
```
