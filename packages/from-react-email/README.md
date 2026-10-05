Internal React Email converter, published as `@unlayer/migrate/react-email`.

# @unlayer/migrate/react-email

Convert React Email (`@react-email/components`) templates to [Unlayer Elements](https://github.com/unlayer/elements). The [`@unlayer/migrate`](../migrate) CLI is built on it; use the library directly from an agent, a build step or a server.

```bash
npm install @unlayer/migrate @unlayer/react-elements
```

## Two ways to convert

**Codemod: migrate the source.** Rewrites the template's import and JSX into Elements, including early returns and conditional roots. Props, `.map()` loops (with keys), conditions, helper functions, types and `PreviewProps` stay. Use it to move templates to Elements.

```ts
import { convertSource } from "@unlayer/migrate/react-email";

const { code, report } = await convertSource(source, { fileName: "emails/welcome.tsx" });
```

Module constants are evaluated only where their original binding is used; parameters, local variables and loop bindings that share a name stay dynamic. Literal object spreads preserve their values and override order. Opaque spread props and content props are kept as rendered HTML. Dynamic spreads on document components (`Html`, `Body`, `Head`, `Tailwind`, `Preview`, `Font`) fail conversion because their document settings cannot be preserved in an HTML content block.

**Runtime: convert what a template renders.** Renders the template with props (its `PreviewProps` by default) and converts the result. Loops and conditions become the content they produced. Use it to open a template in the visual editor.

```ts
import { convertReactEmail } from "@unlayer/migrate/react-email";
import Welcome from "./emails/welcome";

const conversion = await convertReactEmail(Welcome);
conversion.design(); // design JSON for the editor's loadDesign(), text props as merge tags ({{name}})
conversion.html(); // HTML (renderToHtml)
await conversion.tsx(); // Elements TSX
conversion.report.missingText; // [] when nothing was lost
conversion.report.addedText; // [] when no words were added
```

Text props the template shows as given become merge tags (`{{user.name}}`), which the editor keeps and email services fill in. Props the template changes or tests (a formatted date, `name.toUpperCase()`) keep their sample value, and `report.info` says which. CSS, font URLs, backgrounds and image sources (including images kept in HTML) keep sample values; text, image alt text and links can receive tags. Pass `{ mergeTags: false }` to keep every sample value. `mergeTagDesign(Migrated, props, design)` does the same for a migrated template's design JSON.

Both modes share one mapping and one layout engine, so they convert styles the same way.

## Check a conversion

```ts
import { verifyConversion } from "@unlayer/migrate/react-email";
import Original from "./emails/welcome";
import Migrated from "./emails/welcome.migrated";

const check = await verifyConversion(Original, Migrated); // renders both with PreviewProps
check.missing; // words the original shows and the migrated template doesn't
check.added; // words the migrated template shows and the original doesn't
check.missingAttributes; // links (href), images (src) and alt text it lost
check.variants; // problems with a boolean prop flipped (branches the preview doesn't take)
check.designWarnings; // blocks the visual editor wouldn't get
check.design; // the design JSON
```

`compareText(originalHtml, convertedHtml)` runs the same comparison on two HTML documents, preserving numeric separators, signs, currency symbols and percentages. No new words may appear. Words must also stay in order: values that changed places count as missing. It counts repeated links and images and keeps destinations associated with link labels and image alt text; Outlook-only duplicates are excluded. Boolean variants are checked through both the HTML and design exporters. Code paths the props don't reach (a loop over an empty preview array, a condition on a non-boolean prop) aren't verified: extend `PreviewProps` to cover them.

## The report

`report.nativeRatio` is the share of content that became editable Elements blocks. `report.fallbacks` lists what was kept as an `Html` block (it renders the same, but isn't editable), and why. `report.notes` lists every visual difference. `report.info` lists what the conversion did that doesn't change the look (a component inlined, a className split).

## Mapping

| React Email | Elements |
|---|---|
| `Html`, `Head`, `Body` | `Email`: Body background → `backgroundColor`, font → `fontFamily`, color → `textColor`; Html `dir` → `textDirection`, `lang` → `lang` |
| `Preview` | `Email` `previewText` |
| `Font`, a head `<style>` `@import` or `<link rel="stylesheet">` | `Email` `fonts`: a Google-hosted font file links its Google Fonts stylesheet; other files get an `@font-face` stylesheet of their own |
| `Container` | `Email` `contentWidth` (from its max-width; `37.5em` = 600px). Its background, padding, border and radius go on the rows inside it. |
| `Section` | Rows. A full-width background is the row's content box (`columnsBackgroundColor`). An inset, bordered or rounded box (a card) gets spacer columns for the space around it, with its background, border and radius on the column inside. Outside the Container, its background spans the full width (`backgroundColor`). |
| `Row` / `Column` | `Row` / `Column`. Widths → `layout` or `cells`. A narrower or centered row (`w-fit`, `width` + `margin: auto`) gets spacer columns. A Column holding one styled Section takes its look. |
| Phones | React Email's rows are tables and never stack, so columns stay side by side (`noStackMobile`), as do a card's spacer columns. Columns stack only where the template makes them full width on small screens (`mobile:!block`, `max-sm:w-full`). Rows that only a max-width or centered box narrows stack, so the content takes the phone's width. |
| Phone classes | Phone padding and margins → `mobile.padding` / `mobile.containerPadding` or spacer padding; text size, line height and alignment → `mobile`; full-width images → phone `autoWidth`; hidden rows and blocks → `hideOnMobile` (a hidden column hides its content: the editor can't hide a column). Supported settings are kept in TSX and design JSON. Every stacked column keeps the box's phone side padding. |
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
| Elements with `display: none` (including Tailwind `hidden`) | Original hidden HTML, reported. A hidden column keeps its whole row as HTML so its table structure survives. |

Components defined in the same file (or, with `loadModule`, in other files) are inlined where they're used when their body returns JSX. A `className` chosen by a condition becomes one element per class list. JSX kept in local constants goes where it's used.

Inlining relies on React's rule that rendering is pure: calls in a component's arguments, constants and body may run in a different order, but never more often, later, or only on some paths. A component stays as HTML when inlining it would repeat a call or move one into a branch or callback, or when it writes state or calls a hook. A template that breaks the rule anyway (one that counts calls in module state, say) fails the check against the original. A component with a defaulted prop stays as HTML when a supplied argument could evaluate to `undefined`, preserving its JavaScript defaults and evaluation. A literal `undefined` uses the default; `null` remains `null`.

## Not expressible in Elements

The report lists unsupported classes and dropped styles. Remaining model differences include:

- State variants (`hover:`, `last:`), larger-screen variants, unresolved utilities and unsupported phone declarations such as font weight and letter spacing. Partially supported classes keep a note for the remaining declarations.
- Source breakpoints: supported phone settings use the editor's 480px breakpoint, even when the original query uses 600px. Narrow-box decisions use a 375px phone width.
- On phones, columns side by side keep their share of the row, so fixed widths, images and gaps scale down with it (React Email keeps them in px). Text whose longest word wouldn't fit there gets a smaller phone size (estimated from Arial's widths, so a narrow font can shrink a little more than it needs to).
- Column vertical alignment: email columns sit at the top (a React Email `Column` is a `<td>`, centered by default).
- Shadows, opacity, transforms, filters, outlines, gradients and absolute positioning.
- Background images on inset boxes; borders on boxes outside the `Container` (full-width bands).
- Text backgrounds, borders and max-widths inside a column of several.
- Image border radius.
- Shrink-to-fit widths (`w-fit` around text).
