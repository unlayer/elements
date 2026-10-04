# @unlayer/from-react-email

Convert React Email (`@react-email/components`) templates to [Unlayer Elements](https://github.com/unlayer/elements). The [`@unlayer/migrate`](../migrate) CLI is built on it; use the library directly from an agent, a build step or a server.

```bash
npm install @unlayer/from-react-email @unlayer/react-elements
```

## Two ways to convert

**Codemod: migrate the source.** Rewrites the template's import and JSX into Elements. Props, `.map()` loops (with keys), conditions, helper functions, types and `PreviewProps` stay. Use it to move templates to Elements.

```ts
import { convertSource } from "@unlayer/from-react-email";

const { code, report } = await convertSource(source, { fileName: "emails/welcome.tsx" });
```

**Runtime: convert what a template renders.** Renders the template with props (its `PreviewProps` by default) and converts the result. Loops and conditions become the content they produced. Use it to open a template in the visual editor.

```ts
import { convertReactEmail } from "@unlayer/from-react-email";
import Welcome from "./emails/welcome";

const conversion = await convertReactEmail(Welcome);
conversion.design(); // design JSON for the editor's loadDesign(), text props as merge tags ({{name}})
conversion.html(); // HTML (renderToHtml)
await conversion.tsx(); // Elements TSX
conversion.report.missingText; // [] when nothing was lost
```

Text props the template shows as given become merge tags (`{{user.name}}`), which the editor keeps and email services fill in. Props the template changes or tests (a formatted date, `name.toUpperCase()`) keep their sample value, and `report.info` says which. Pass `{ mergeTags: false }` to keep every sample value. `mergeTagDesign(Migrated, props, design)` does the same for a migrated template's design JSON.

Both modes share one mapping and one layout engine, so they convert styles the same way.

## Check a conversion

```ts
import { verifyConversion } from "@unlayer/from-react-email";
import Original from "./emails/welcome";
import Migrated from "./emails/welcome.migrated";

const check = await verifyConversion(Original, Migrated); // renders both with PreviewProps
check.missing; // words the original shows and the migrated template doesn't
check.missingAttributes; // links (href), images (src) and alt text it lost
check.variants; // problems with a boolean prop flipped (branches the preview doesn't take)
check.designWarnings; // blocks the visual editor wouldn't get
check.design; // the design JSON
```

`compareText(originalHtml, convertedHtml)` runs the same comparison on two HTML documents. Code paths the props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) aren't verified: extend `PreviewProps` to cover them.

## The report

`report.nativeRatio` is the share of content that became editable Elements blocks. `report.fallbacks` lists what was kept as an `Html` block (it renders the same, but isn't editable), and why. `report.notes` lists every visual difference. `report.info` lists what the conversion did that doesn't change the look (a component inlined, a className split).

## Mapping

| React Email | Elements |
|---|---|
| `Html`, `Head`, `Body` | `Email`: Body background → `backgroundColor`, font → `fontFamily`, color → `textColor` |
| `Preview` | `Email` `previewText` |
| `Font`, a head `<style>` `@import` or `<link rel="stylesheet">` | `Email` `fonts`: a Google-hosted font file links its Google Fonts stylesheet; other files get an `@font-face` stylesheet of their own |
| `Container` | `Email` `contentWidth` (from its max-width; `37.5em` = 600px). Its background, padding, border and radius go on the rows inside it. |
| `Section` | Rows. A full-width background is the row's content box (`columnsBackgroundColor`). An inset, bordered or rounded box (a card) gets spacer columns for the space around it, with its background, border and radius on the column inside. Outside the Container, its background spans the full width (`backgroundColor`). |
| `Row` / `Column` | `Row` / `Column`. Widths → `layout` or `cells`. A narrower or centered row (`w-fit`, `width` + `margin: auto`) gets spacer columns. A Column holding one styled Section takes its look. |
| Phones | React Email's rows are tables and never stack, so columns stay side by side (`noStackMobile`), as do a card's spacer columns. Columns stack only where the template makes them full width on small screens (`mobile:!block`, `max-sm:w-full`). Rows that only a max-width or centered box narrows stack, so the content takes the phone's width. |
| Content directly in a `Row` | Stacked above the row, as browsers render it |
| `Text` | `Paragraph`: plain text and `{expressions}` as children, inline markup (`Link`, `strong`, `br`) as `html`. A text with its own background, border or max-width gets a box of its own. |
| `Heading` (`as` h1–h6) | `Heading` with `headingType`, browser defaults made explicit |
| `Button`, `Link` styled as a button | `Button` (href, colors, padding, radius, every border side, a px or % width; a block link with no width fills the column) |
| `Img`, `Link` around an `Img` | `Image` (with `action` for the link). Images side by side inline (icon rows, rating stars) stay on one line in a `Paragraph`. An image with no width is kept as `Html`. |
| `Hr` | `Divider` |
| `ul` / `ol` | `Paragraph` with the list |
| `Markdown` | `Paragraph` with the rendered HTML |
| `Tailwind` | Classes resolved with React Email's own Tailwind and the template's config, then mapped like `style` |
| `CodeBlock`, unknown elements | `Html` block, reported |

Components defined in the same file (or, with `loadModule`, in other files) are inlined where they're used when their body returns JSX. A `className` chosen by a condition becomes one element per class list. JSX kept in local constants goes where it's used.

A component with a defaulted prop stays as HTML when a supplied argument could evaluate to `undefined`, preserving its JavaScript defaults and evaluation. A literal `undefined` uses the default; `null` remains `null`.

## Not expressible in Elements

Reported as notes, never silently dropped:

- Responsive and state classes (`mobile:px-6`, `sm:`, `hover:`) and `<style>` rules, except the ones that stack columns.
- On phones, columns side by side keep their share of the row, so fixed widths, images and gaps scale down with it (React Email keeps them in px).
- Columns that stack on phones keep their desktop padding: the box's side padding is only around the outer ones.
- Column vertical alignment: email columns sit at the top (a React Email `Column` is a `<td>`, centered by default).
- Shadows, opacity, transforms, filters, outlines, gradients and absolute positioning.
- Background images on inset boxes; borders on boxes outside the `Container` (full-width bands).
- Text backgrounds, borders and max-widths inside a column of several.
- Image border radius.
- Shrink-to-fit widths (`w-fit` around text).
