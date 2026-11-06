# @unlayer-internal/elements-core

Elements' engine, framework-neutral: the template tree, the components' definitions
(`src/components.ts`), validation, custom components and layout (`src/resolve.ts`), and Elements'
own writers (`src/writers/`): a laid-out template as HTML for each output, and as plain text.
Private, bundled into `@unlayer/react-elements` (`@unlayer/elements-pdf` and
`@unlayer/elements-image` bundle the helpers they use). The plan behind it is
`docs/rfcs/0001-primitives-and-exporters.md`.

## The writers

```
src/writers/
  index.ts         prepareTemplate(): checks a template, expands its custom components once, runs its
                   output's checks and layout; validateTemplate() stops there, renderTemplate() writes
  jsx.ts           the JSX the components are written in: it writes HTML strings (no React)
  plain-text.ts    the plain-text version (the same for every output)
  shared/          what every HTML output shares: escaping and CSS values (css.ts), the stylesheet's
                   short class names (classes.ts), @font-face rules (fonts.ts), link attributes
                   (link.ts), the support pass (support.ts), indented HTML for `pretty` (pretty.ts),
                   where gaps go between what shows on desktop and on phones (gaps.ts)
  email/           <Email>: tables, px widths, Outlook's markup in conditional comments
  page/            <Page>: one element per node, flexbox
```

In `email/` and `page/`, each component has its own file (`Button.tsx`, `Row.tsx`, `Heading.tsx`,
…), exporting the component under its own name: a function of one props object, like a React
component, that returns its markup in that output as JSX:

```tsx
export const Column: Component = ({ node, fill, rtl, render }) => (
  <Box node={node} fill={fill}>
    <Stack node={node} rtl={rtl} render={render} />
  </Box>
);
```

The props hold what every component needs, worked out once by the folder's `index.tsx`: the node, its
`style` and `mobile` styles, its `parent`, whether its text runs right to left (`rtl`), its text (`text()` in email, `children()` in page),
`render()` for its children (so components never import each other), and per output: in email
`fill` (its cell is exactly its width) and `phoneText` (its phone text styles, inherited ones
included, but a run inside text has only its own: CSS carries the text's to it); in page `placement` (what its parent's layout adds) and `classes()`.

What an output can't do as a template asks isn't in the components. Each style and prop declares,
for each output, how it's shown there (`support: { email, web }`: full, Outlook-only, partial or none,
with its source); `shared/support.ts` reports from that data in one pass for any output, and email adds
a few structural checks (`email/support.ts`: an image without a width). `test/writers/support.test.ts` keeps it
true for every output with a writer: everything declared, nothing dropped silently.

The JSX (`src/writers/jsx.ts`) writes strings, and:

- escapes every text and attribute value, so what users write can't add markup;
- takes `style` as an object, or a list of objects and `[property, value]` pairs merged in order,
  and writes each value by its property: numbers in px (unitless for `fontWeight`, `lineHeight`,
  `flex`), padding, borders and radii from the template's own objects, short colors. Empty values
  are left out, and `style` is always the last attribute;
- takes `phone={…}` and `hover={…}` styles on any element: each becomes a rule in the render's
  stylesheet, under a short class named after it (`class` takes a name or a list too);
- writes Outlook's conditional comments with `<Outlook>` and `<NotOutlook>`. `<Merged>` joins
  neighbouring comments of one kind, and `open()` and `close()` write a tag on its own, for Outlook's
  tables that open in one comment and close in another (`email/Row.tsx`).

Each `.tsx` file imports `h` (and `Fragment` for `<>…</>`) from `../jsx`; the tsconfig, tsup and
vitest configs set `jsxFactory: "h"`.

**Rule order.** Where two rules set the same property on one element with the same specificity,
CSS takes the later one. So the stylesheet (`shared/classes.ts`) writes rules by level, whatever
order they're made in: a layout's rules for its children first (`rule(…, "layout")`: a Row stacking
its children on phones), then a node's own (its `phone` styles, hiding), then hover. A child's own
phone width beats its Row's stacking (`test/browser/precedence.test.ts`).

The rest of each folder is what its components share:

| File | email/ | page/ |
|---|---|---|
| `index.tsx` | the document (head, preview text, size budgets), the components, each node's props | the document, the components, each node's props |
| `context.ts` | `Props` and `Component` | the same |
| `layout.tsx` | widths as Word reads them, `<Box>` (a box as a table), `<Stack>` (children as table rows), a Row's gaps and its children's shares on phones, what a Layer draws | flex placement in a stack or a Row, box styles |
| `styles.tsx` | full text styles on the text, phone text styles inherited, hiding | phone, hiding and hover classes |
| `markup.tsx` | `<Table>` (every layout table's attributes), colors as Word reads them | |
| `spacers.tsx` | what holds a gap: a row between the root's runs and Sections, an inline-block or a cell between a Row's children | |
| `lists.tsx` | a List's numbers where desktop and phones count apart, a nested List's hiding | |
| `support.ts` | what email can't do as asked, as diagnostics | |

The root (`Email.tsx`, `Page.tsx`) is written by the folder's `index.tsx`, not through the table.

Lists and tables are a family of components each: `List` writes its items' rows (email) or `<li>`s
(page) and `ListItem` an item's content; `Table` writes the table and its column widths, `TableRow`
and `TableCell` the rest. A table's `cellPadding` and `rowBorder` arrive already on each cell's own
style: the resolver puts them there, so a cell needs nothing from its table.

## Adding a component

1. Its definition in `src/components.ts` (props, styles, children, which outputs).
2. A component in each output folder it supports: `src/writers/email/Name.tsx` and `src/writers/page/Name.tsx`, exported as
   `Name` and added to the table in that folder's `index.tsx`; each of its styles and props declares
   its support for each output (`support` in its definition), which the support test checks against
   what the writers do.
3. Its plain text in `src/writers/plain-text.ts`, if it has any of its own.
4. Tests: markup in `test/writers/email.test.ts` and `test/writers/web.test.ts` (the JSX itself in `test/writers/jsx.test.tsx`); widths in Chromium in
   `test/browser/` when it has a box of its own.

## Tests

```bash
pnpm --filter @unlayer-internal/elements-core test           # the model, layout and the writers: markup, phone styles, hostile input
pnpm --filter @unlayer-internal/elements-core test:browser   # widths in Chromium, with and without <style>
```
