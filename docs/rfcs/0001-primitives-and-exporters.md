# RFC 0001: Elements primitives and exporters

**Status:** in progress on `feat/primitives-core` ([#76](https://github.com/unlayer/elements/pull/76)), to be merged when
every step below is done. Built so far: the API, 20 components, the layout resolver, the email and
page writers, plain text, custom components, web fonts, validation, and support data for every output
(see [Status and order of work](#status-and-order-of-work)). It ships as an internal entry,
`@unlayer/react-elements/primitives`, until it becomes the package's main import in a new major
version.

## Summary

Elements gets a new engine with three parts, all open source and in this repo:

- **Components described by definitions.** One definition per component (`packages/core`) gives its
  props, styles, allowed children, the outputs it renders to, how each output shows each style and
  prop, and its editors. TypeScript types, validation and diagnostics all come from it.
- **A layout resolver.** A template is laid out once, before anything is written: every box gets a
  width in px and every text its styles. Each output's writer reads the same layout, so email (which
  needs px widths for Outlook) and the page agree.
- **Writers Elements owns** (`packages/exporters`): email HTML, page HTML and plain text today; print
  HTML, PDF and images later. They replace the closed `@unlayer/exporters`.

JSX is the only way to write a template, for developers and agents alike:

```tsx
import { Email, Heading, Paragraph, Row, Column, Text, Button, render, validate } from "@unlayer/react-elements/primitives";

const welcome = (
  <Email previewText="Welcome aboard" style={{ gap: 16 }}>
    <Heading>Welcome</Heading>
    <Paragraph>Thanks for signing up.</Paragraph>
    <Row style={{ gap: 20 }}>
      <Column><Text>Left</Text></Column>
      <Column><Text>Right</Text></Column>
    </Row>
    <Button href="https://example.com">Get started</Button>
  </Email>
);

const { html, text, diagnostics } = await render(welcome);
const { valid } = validate(welcome);
```

## Decisions

The decisions behind the design, with the date each was taken.

1. **Roots** (2026-10): `Email` (an email), `Page` (a web page), `Document` (a paginated document, its
   pages `Document.Page`), `Canvas` (an image of a fixed size, not an HTML canvas). `Image` stays an
   image inside content.
2. **Writers are open source, in this repo, and redesigned** (2026-10) around the engines that draw each
   output, not ported from `@unlayer/exporters`.
3. **Simple markup** (2026-10): `Row` and `Column` aren't required. A root stacks its children, so
   `<Email><Heading/><Paragraph/><Button/></Email>` is a whole email. There's no `Container` (the root's
   `width` centers the content); `Section` is a band whose background spans the window.
4. **JSX only; no public JSON** (2026-11-01): templates are written as JSX. There's no JSON input, no
   published schema and no document format to version. Agents learn the components from their types,
   a reference generated from the definitions, and `validate()`'s messages.
5. **An internal tree** (2026-11-01): rendering collects the JSX into plain data first, because layout
   needs the whole template before anything is written, and React context isn't available where
   Elements must run (see [Why rendering goes through a tree](#why-rendering-goes-through-a-tree)).
6. **The API** (2026-11-01): `render(element, options?)` (async; the output follows the root; returns
   plain text too), `validate(element)` (problems, without rendering or throwing), and `component()` for
   custom components.
7. **A new major version** (2026-11-01): the new API becomes the main import of `@unlayer/react-elements`;
   today's API stays, unchanged, at `@unlayer/react-elements/legacy`. A codemod in `@unlayer/migrate`
   and a migration guide come with it.
8. **CSS** (2026-11-01): rules the inline styles can't express go in a stylesheet under short classes
   named after their rule (`.e3k9fa`); HTML gets no generated ids, only the `id`s authors write.
9. **Parity with React Email first, the builder last** (2026-11-01): the API and the full component
   set come first, with React Email (`@react-email/components` 1.0.12) as the bar for what a template can
   say. Within that:
   - **Elements components only**: no raw HTML elements in templates (`<strong>`, `<ul>`, `<div>`) and
     no raw-HTML block; inline formatting is a styled `Span`, lists and tables are components.
   - **No Tailwind**: typed `style` props. `@unlayer/migrate` converts Tailwind templates.
   - **Later, not rejected**: dark-mode styles, background images, shadows, gradients, opacity,
     margins, code blocks and Markdown.
10. **CSS names for styles** (2026-11-01): `style` uses CSS's property names and values where the meaning
    is the same (`alignItems`, `justifyContent: "space-between"`); behavior that isn't CSS is a prop
    (`<Row stackOnMobile={false}>`). See [Styles](#styles).
11. **Support is data, for every output** (2026-11-01): each style and prop declares how each output
    shows it, a test keeps that true, and features are built for every root, current and future
    (see [Support for each output](#support-for-each-output)).
12. **The builder** (2026-10, for later): it covers Email, Page and Document, not Canvas. Builder JSON
    gets no Elements-specific data; blocks are matched by the builder's own ids, and what the builder
    can't hold yet comes back from the original JSX (see [Builder adapter](#builder-adapter)). A
    property without an editor in the builder is fine.
13. **Existing components move to the new engine** (2026-10). Their HTML may change; what a reader gets
    (content, links, images, styles, layout on desktop and phones) may not.

## The API

| Export | What it does |
|---|---|
| The components | `Email`, `Page`, `Section`, `Row`, `Column`, `Text`, `Paragraph`, `Heading`, `Span`, `Link`, `Button`, `Image`, `Divider`, `LineBreak`, `MergeTag`, `List`, `ListItem`, `Table`, `TableRow`, `TableCell` |
| `render(element, options?)` | Resolves to `{ html, text, head, body, bodyStyle, diagnostics }`. Rejects with an `ElementsError` listing the errors. Options: `mergeTag` (how a merge tag is written, `{{name}}` by default), `classPrefix` (the stylesheet's class prefix, `e` by default), `pretty` (indented HTML, for reading) |
| `validate(element)` | `{ valid, diagnostics }`: everything `render()` checks before writing. Warnings and notes leave a template valid |
| `component(spec)`, `prop.*` | Custom components (below) |
| `ElementsError`, `formatDiagnostics` | The error, and diagnostics as text |

Every component's props and styles are typed from its definition, so a wrong prop or value is a type
error and, at runtime, a diagnostic with a path (`root.children[2].style.justifyContent`) and what to
use instead.

### Packages

| Package | Published | Holds |
|---|---|---|
| `packages/core` (`@unlayer-internal/elements-core`) | no, bundled | Definitions, value kinds, validation, custom components, the layout resolver. No React |
| `packages/exporters` (`@unlayer-internal/elements-exporters`) | no, bundled | The writers (email, page), plain text, the support pass, `prepareTemplate`/`renderTemplate` |
| `@unlayer/react-elements/primitives` | yes (an entry of the existing package) | The new API, until it's the main import |
| `@unlayer/elements-pdf` | yes, later | PDF output, with `@react-pdf/renderer` as a peer dependency |
| `@unlayer/elements-image` | yes, later | PNG/SVG for `Canvas`, with Satori and resvg as peer dependencies |

PDF and image output stay out of the main package, its size budget and its Content-Security-Policy
gate (Satori runs WebAssembly, which a policy without `'wasm-unsafe-eval'` blocks).

Some names mean something else in today's API, which is why the new one has its own entry until the
major version: today's `Row` needs a `layout` and only takes `Column`s, its `Column` is a Row's cell,
its `Table` takes data in props, and its `style` styles a wrapper `<div>`.

### Why rendering goes through a tree

React Email renders with no tree in between: each component writes its own markup. We tried that for
Elements (components writing their markup per output, with the width a parent gives its children
passed down through React context), in this repo's Next.js 14, 15 and 16 test apps:

| Where | Next 14 (React 18) | Next 15 (React 19.1) | Next 16 (React 19.3, Cache Components) |
|---|---|---|---|
| Plain Node (tests) | works | works | works |
| Route handler | fails: no `createContext` | fails: no `createContext` | fails: no `createContext` |
| Server Component | fails: no `createContext` | fails: no `createContext` | fails: no `createContext` |
| Client Component (server render) | fails: context lost between React copies | fails: same | fails: same |

- React's server build, which route handlers and Server Components import, has no `createContext` or
  `useContext`. In a Client Component's server render, Next.js gives Elements another copy of React,
  and context set by one isn't read by the other.
- Props can't carry a width down either: a parent can only add props to its direct children, and a
  child that's the author's own component doesn't pass them on.
- React Email works there because its components need nothing from their parents (a Column is a `<td>`
  with whatever width the author writes). Elements works out widths (for Outlook's tables and stacking
  on phones), which needs every parent's and sibling's.

So rendering is one collecting React render (which works in all of those places), then the tree, laid
out once, then the output's writer. The tree lives inside one `render()` call and is never exposed.

## Components

| Component | What it is |
|---|---|
| `Email`, `Page` | Roots. Each stacks its children down its content width (600px and 1200px by default), centered in the window. Props: `width`, `title`, `lang`, `dir`, `fonts`; `previewText` (Email), `description` (Page) |
| `Section` | A band across the whole window, directly under a root: its background spans the window, its children are stacked at the content width |
| `Row` | Children side by side; each takes its `width` or a share of what's left (`flex`). Stacks on phones unless `stackOnMobile={false}` |
| `Column` | Children stacked, with its own box and spacing |
| `Text`, `Paragraph`, `Heading` | Blocks of text (`div`, `p`, `h1`–`h6` by `level`); `dir` for their own direction |
| `Span` | Styled text inside text; `verticalAlign: "super" \| "sub"` for superscript and subscript |
| `Link` | A link inside text, or around an `Image`; `title`, `aria-label` |
| `Button` | A link drawn as a button; `title`, `aria-label` |
| `Image` | An image in the content; `alt`, `title`. Without a width it takes its file's size, no wider than its parent |
| `Divider` | A horizontal line (`borderTop`) |
| `LineBreak`, `MergeTag` | A line break; a value the sending service fills in |
| `List`, `ListItem` | A bulleted or numbered list (`type`, `start`); items take text and nested `List`s |
| `Table`, `TableRow`, `TableCell` | A data table. A `header` row heads the columns; cells take text and images, `colSpan`, `dir` |

Later steps add `Grid` (children in columns), `Layer` (children over each other), `Document` with
`Document.Page`, `PageBreak`, `PageHeader`, `PageFooter` and `PageNumber`, and `Canvas` with `Svg` and
shapes, along with today's `Menu`, `Social` and `Video` on the new engine.

### Custom components

`component()` makes a named, reusable block with its own typed props and editors:

```tsx
export const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    name: prop.text({ label: "Name", required: true }),
    photo: prop.image({ label: "Photo", required: true }),
    href: prop.link({ label: "Link", required: true }),
    accent: prop.color({ label: "Accent", default: "#0879a1" }),
  },
  render: ({ name, photo, href, accent }) => (
    <Column style={{ gap: 8 }}>
      <Image src={photo} alt={name} />
      <Heading level={3}>{name}</Heading>
      <Button href={href} style={{ backgroundColor: accent }}>Buy</Button>
    </Column>
  ),
});
```

- Its definition works like a built-in component's: typed props, validation, editors. Every output
  renders it, because it's expanded into primitives before layout (once per render).
- `render` is a pure function of its props (defaults applied) and returns one component, which takes
  the custom component's place (its `flex` and visibility go onto it).
- Type names have a namespace (`acme.ProductCard`), so they can't clash with built-in components.
- Ids inside it are prefixed with the instance's `id`; without one, they're dropped (with a note), so
  two instances never share an id.
- `placement: "section"` puts it where a `Section` goes.
- A plain React function that returns components works too; it just isn't a named block.

## Styles

### Vocabulary

`style` uses CSS property names and values wherever the meaning is the same, so authors and agents
write what they already know. A familiar name doesn't promise support: each style declares how each
output shows it, and `validate()` reports what the template's output can't do. Numbers are px, as in
React's inline styles.

| Group | Styles | Inherited |
|---|---|---|
| Text | `color`, `fontFamily` (a CSS stack), `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `textAlign`, `textTransform`; `textDecoration` on text elements only | yes, from the root down |
| Box | `width`, `minWidth`, `maxWidth`, `height`, `padding` (a number, `"8px 12px"`, `[8, 12]` or `{ top, … }`), `backgroundColor`, `border`, `borderRadius`, `overflow` | no |
| Layout (root, Section, Row, Column) | `gap`, `alignItems` (`start`, `center`, `end`, `stretch`), `justifyContent` (`start`, `center`, `end`, `space-between`); `flexWrap` on a Row (page only) | no |
| Placement (a Row's child) | `width`, or `flex` (its share; `"none"` for its own size) | no |
| Specific | `verticalAlign` (Span: `super`, `sub`; TableCell: `top`, `middle`, `bottom`), `borderTop` (Divider), `indent` (List: its markers' column), `cellPadding` and `rowBorder` (Table: every cell's padding, a line between rows) | no |

Where Elements' names aren't CSS's, it's because CSS has no property that means the same:
`indent`, `cellPadding` and `rowBorder`; `stackOnMobile`, a prop because stacking on phones is a layout
decision rather than a style; and the root's `fonts`, because an inline style can't load a font.
Names Elements used before it adopted CSS's (`align`, `justify`, `wrap`, a Divider's `color`,
`thickness` and `lineStyle`) are errors whose message names the new one.

Beside `style`, a component takes `mobile` (styles for phones, in Email and Page), `hover` (on links
and buttons) and `hidden` (`{ mobile?, desktop? }`).

**Margins** aren't supported yet; `gap` (a parent's space between its children) and `padding` (space
inside a box) cover spacing, and a margin is an error that says so. This isn't permanent: in email
every block sits in a cell the writer owns, so a margin can become that cell's padding, and on the
page, stacks are flex containers where margins don't collapse. The policy is that an email limitation
is handled in the email writer, or reported for email, rather than becoming a rule for every output.

### Web fonts

The root's `fonts` declares the files a template loads, one face each, as React Email's `Font` does:

```tsx
<Email
  fonts={[
    { family: "Inter", src: "https://example.com/inter-400.woff2", weight: 400 },
    { family: "Inter", src: "https://example.com/inter-700.woff2", weight: "bold" },
    { family: "Inter", src: "https://example.com/inter-italic.woff2", style: "italic" },
  ]}
  style={{ fontFamily: "Inter, Arial, sans-serif" }}
>
```

A face is `{ family, src, format?, weight?, style? }`; a variable font's weight is a range (`"100 900"`),
and the format comes from the file's extension where it isn't given. Text names a family in its
`fontFamily` stack, before the fonts to show where it can't load, and the browser picks the face for
each weight and style. The page writes `@font-face` rules with `font-display: swap`. Email writes them
where classic Outlook doesn't read them, so Outlook draws the next font in the stack; email notes that
Gmail and classic Outlook don't load web fonts while Apple Mail and iOS Mail do, and warns where a
stack ends on a web font, since a client that can't load it then picks its own.

### Text direction

A root's `dir` and a text block's own `dir` (Text, Paragraph, Heading, ListItem, TableCell) set the
direction, and text starts on that side unless its author aligned it: a right-to-left email is
right-aligned by default, and an Arabic paragraph in an English email sits on the right.

### CSS classes and rule order

What inline styles can't express (phone styles, hiding, hover, a Row stacking on phones) is a rule in
the stylesheet, under a class named after the rule's content: an `e` and five characters (prefix set
by `classPrefix`). The same rule always gets the same class, so nodes share it and a template renders
the same every time. Where two rules set the same property on one element, CSS uses the later one, so
the stylesheet writes them in a set order whatever order they're made in: a layout's rules for its
children (a Row stacking on phones) first, then a node's own (its phone styles, hiding), then hover.
So an author's own phone width on a child beats its Row's stacking.

## Layout

The resolver (`packages/core/src/resolve.ts`) works out, before anything is written:

- **Text styles**: each node's own, its component's defaults, or its parent's.
- **Widths in px**, from the root's width down; `%` is of the parent's content box. A child of a stack
  (root, Section, Column) fills it, unless it takes its own size (a Button, an Image) or has a width.
  With `alignItems: "stretch"`, children that take their own size fill it too.
- **Rows as CSS flexbox resolves them** (css-flexbox-1, "Resolving Flexible Lengths"): each child
  starts from its base (its width, its own size, or, for a child sharing what's left, its padding and
  border); what's left is shared by `flex`; what's missing is taken back from children with a width,
  in proportion to their width inside their padding; a child that reaches its `minWidth` or `maxWidth`
  keeps it, and the rest is shared again. Widths that don't fit are narrowed as a browser narrows them
  (`layout/shrunk`); minimums that can't fit are reported (`layout/overflow`). A child shown only on
  phones takes no desktop width.
- **Lists**: items are as wide as the list less its markers' column (`indent`, 24px by default).
- **Tables**: columns take their cells' widths (the first cell spanning one column that has one), the
  rest share what's left; a cell spanning columns is as wide as they are; its padding is its own or the
  table's `cellPadding`, its bottom border its own or the table's `rowBorder` (but in the last row).
- **Phones**: Email and Page have two widths, desktop and phone (below the content width plus 20px in
  email, 480px on a page). Rows stack full-width on phones unless `stackOnMobile={false}`.

**Known limit:** the resolver doesn't measure text, so it can give a box less room than its content
needs (text in a few px, a label wider than its button). The page then overflows the box, while email
tables, like Outlook's, widen the cell to its longest word and its neighbours give way. Templates with
such boxes look different in email from the page, and no diagnostic says so yet.

## Support for each output

Every style and prop of every component declares, in its definition, how each output it renders to
shows it, for all values or some:

```ts
justifyContent: {
  kind: enumOf(["start", "center", "end", "space-between"]),
  label: "Justify content",
  support: {
    email: { level: "none", values: ["space-between"], shows: "children start at the left", source: "writer" },
    web: { level: "full", source: "css" },
  },
},
```

| Level | Means | Diagnostic |
|---|---|---|
| `full` | shown as asked | none |
| `outlook` | email: as asked, but classic Outlook shows something else (square corners, normal letter spacing, content past a set height) | `email/outlook-degraded` (note) |
| `partial` | not quite as asked anywhere the output is shown (a Row's children not stretched to one height; web fonts in Gmail) | `<output>/degraded` (note) |
| `none` | not in that output; `shows` says what it does instead | `<output>/unsupported` (warning) |

Each declaration names its evidence: `outlook-captures` (captures of real classic Outlook for
Windows), `caniemail` (caniemail.com's client tables), `writer` (the writer turns it into markup the
output shows, checked in Chromium and, for email, against a model of Outlook's layout built from those
captures), `css` (written as CSS, which browsers show as asked) or `assumed` (not checked yet).

One pass reads these declarations for the template's output, for the styles and props its author set
(not a component's own defaults); each output adds what no single style or prop says (email: an image
without a width, a Row child whose size isn't known, a hidden table cell, a font stack that ends on a
web font). `validate()` and `render()` both run it.

A test keeps the declarations true for every output with a writer: every style and prop declared;
each, at every value of an enum and a noticeable sample of others, either changes the output or gives
a diagnostic (nothing is dropped silently); and each value declared other than `full` is reported. An
output added later (print, PDF, image) joins with one line, and the test fails until each of its
components' styles and props says what that output does with it.

Chromium and an Outlook model aren't email clients: entries from caniemail, `assumed` ones and anything
only the model has checked are confirmed by capturing real clients.

## Outputs

```
JSX ──collect──▶ tree ──check──▶ expand custom components ──▶ output's checks ──▶ layout ──▶ support pass ──▶ writer ──▶ { html, text, … }
                                                                                                  │
                                                                                      validate() stops here
```

| Output | Root | Drawn by | Written as |
|---|---|---|---|
| email | `Email` | classic Outlook (Word), Outlook on the web, Gmail, Apple Mail and other WebKit clients | tables (below) |
| web | `Page` | browsers | one element per node, its styles inline, flexbox; semantic tags (`main`, `section`, `h1`–`h6`, `p`, `ul`/`ol`, `table`, `a`, `img`); a small stylesheet for phones and hover |
| print (later) | `Document` | Chromium's print | as web, plus `@page` size and margins and page breaks; one section per `Document.Page` |
| pdf (later) | `Document` | `@react-pdf/renderer` | react-pdf's views; headers and footers fixed, page numbers rendered per page |
| image (later) | `Canvas` | Satori, then resvg | Satori's flex elements; fonts and images passed as data |

Web, print, PDF and images are all drawn by flexbox engines, so `Row` and `Column` mean the same in
each; email is the one output that needs a different structure. For PDF and images, fonts must be
fetched and passed in, and neither reads WOFF2: validation will say so for those outputs.

Each writer is a folder with one file per component (`email/Button.tsx`, `page/Row.tsx`), written in a
small JSX runtime that writes HTML strings (`exporters/src/jsx.ts`, no React): text and attributes are
always escaped, styles are objects, `phone` and `hover` styles are props, and Outlook's conditional
comments are components. `packages/exporters/README.md` explains the layout and how to add a component.

### Email

**Rules.**

1. **Right without `<style>`.** Layout at desktop width, colors, fonts, sizes and spacing are inline;
   the stylesheet only adds phone styles, hiding, hover and client resets. Gmail drops `<style>` for
   some accounts.
2. **Widths are decided before writing.** Every table, cell and image gets a px width attribute from
   the resolver: Word sizes by attributes and ignores the sizes of `div`s.
3. **Tables for layout** (`role="presentation"`, no spacing or borders); spacing is cell padding.
4. **Outlook-only markup only inside `<!--[if mso]>`**, and nothing other clients need inside one.

**How components are written.**

| Component | Email markup |
|---|---|
| `Email` | the shell (doctype, Office settings, `x-apple-disable-message-reformatting`, `color-scheme`, the preview text), then a full-width table with the window's background and the content in a centered table (`width="100%"` with a px `max-width`, which Word takes as the width), a row per child, `gap` as cell padding. The language, direction and background are also on a `role="article"` wrapper, since Gmail drops `<html>` and `<body>` |
| `Section` | a full-width row with its background, its content at the content width inside it |
| `Row` | "fluid hybrid": each child an inline-block `div` as wide as its desktop width at most and 100% otherwise, so the children sit side by side where there's room and stack where there isn't, without media queries; Outlook gets a table of the same widths inside conditional comments. Gaps are spacers. With `stackOnMobile={false}`, a table row |
| `Column` and boxes | a one-cell table around the content (Word has no box on a `div` or `p`); its children as table rows |
| Text blocks | the semantic tag with `margin:0`, and every text style on it (Outlook doesn't pass styles down through tables); line heights in px with `mso-line-height-rule: exactly` |
| `Button` | a one-cell table: background, border and corners on the cell, the padding on the link (all of it clickable) and as the cell's `mso-padding-alt` (Outlook has no padding on links); hover changes the cell's background and the link's color. Not VML: captures of classic Outlook show Word drawing a VML button's label in its own font, wrapped inside the shape's fixed size |
| `Image` | `<img>` with a px `width` attribute, fluid elsewhere (`width:100%` up to its width), its height in proportion when the file's size is known |
| `Divider` | a table with a top border and an empty cell Word can't make taller |
| `List` | a table: an item a row, its marker right-aligned in a cell of the indent's width, with `role="list"` and `"listitem"` (Word's own lists indent differently by version) |
| `Table` | a data table with fixed layout: column widths in a `colgroup` and on each cell (px for Word, shares elsewhere); header rows in `thead` with `th` |
| `Span` | `<span>`, or `<sup>`/`<sub>` (raised or lowered) with no line height of their own, so a line keeps its height |

**Budgets.** A warning before Gmail clips a message (102 KB of HTML), and when the stylesheet is more
than Gmail reads (16 KB).

**How it's checked.** Unit tests of each component's markup; a hostile-input test (user text, links,
font URLs with markup in them add no element or attribute, including inside Outlook's comments);
Chromium tests that every box is as wide as the resolver says on desktop, with and without the
stylesheet, that Rows stack on phones either way, that hover, fonts and superscripts work, and that
Row widths match the page in every min/max/gap case. Over 786 generated templates, every page Row
child is the resolver's width, and every email one is too except where the known limit above applies.
Internally, templates are also checked against a model of classic Outlook's layout built from
captures of real Outlook, at 96 and 192 DPI. Not yet measured in real Outlook: button padding through
`mso-padding-alt`.

## Validation and diagnostics

`validate()` and `render()` share one preparation step (`prepareTemplate`): the template checked
(props, styles, children, ids), custom components expanded once, the output's checks, layout, and the
support pass. `validate()` stops there; only checks that need the written output (an email's size) are
`render()`'s alone. A diagnostic has a code, a severity (`error`, `warning`, `info`), a message saying
what to do instead, and a path (`root.children[1].style.padding`). Errors make `render()` reject and
`validate()` return `valid: false`; warnings and notes don't.

| Codes | Found by |
|---|---|
| `prop/required`, `prop/invalid`, `style/unknown`, `style/invalid`, `children/not-allowed`, `children/text-not-allowed`, `id/duplicate`, `id/dropped` | the check |
| `jsx/markup`, `jsx/root` | collecting the JSX (an HTML element, or a root that isn't Email or Page) |
| `custom/render`, `custom/depth` | expanding custom components |
| `custom/duplicate` | collecting the JSX: two different `component()` definitions with one type (each type is one `component()` call, at the top of a module) |
| `target/unsupported`, `output/unavailable` | the output's checks |
| `layout/overflow`, `layout/shrunk`, `style/ignored` | layout |
| `email/unsupported`, `email/degraded`, `email/outlook-degraded`, `email/width`, `email/image-width`, `email/font-fallback`, `web/unsupported`, `web/degraded` | the support pass |
| `email/size`, `email/style-size` | writing |

## Moving the existing components and the major version

Today's components (`@unlayer/react-elements`'s main entry) keep their props and behavior, and move to
the new engine one at a time: each lowers into the new components, renders through the new writers,
and is switched over when its output passes the existing suites (designs and plain text identical, HTML
equal in content and styles by convert-core's check at desktop and phone widths, the browser and
Storybook gates). Its markup may change; each switch is a changelog entry naming what changed.

The new major version then makes the new API the main import, keeps today's at `/legacy` (removed in
the major after), ships the codemod and the migration guide, and drops `@unlayer/exporters` and
`@unlayer/types`. `@unlayer/migrate`'s React Email converter moves to the new API.

## Builder adapter

Last, once the API and components are final. It converts templates to the Unlayer builder's design
JSON for Email, Page and Document, and edited designs back.

- **To the builder:** through the tree. A `Section` is a full-width row, a `Row` at the top or in a
  Section is a row with its `Column`s as columns, content directly under the root is a one-column row,
  and each component is the matching tool (`Heading` → heading, `Paragraph`/`Text`/`List` → text,
  `Button` → button, `Image` → image, `Divider` → divider, `Table` → table). What no tool can show
  (nested layouts, a `Layer`) is a locked block with its HTML: it can be moved, duplicated or deleted,
  not edited.
- **Back from the builder:** as JSX source (printed as `@unlayer/migrate` prints migrated templates), or
  rendered directly from the design JSON at runtime. The original JSX is the base for what the builder
  can't hold.
- **No Elements data in the JSON.** Blocks are matched by the builder's own ids, which it keeps when a
  design is loaded and saved, and gives anew to a duplicated block. A builder value the user changed
  wins; a prop the builder can't hold yet comes back from the original; a block that's gone was
  deleted; order and nesting come from the builder; a duplicated block comes in with its builder values.
- **Props without a builder field** are closed over time in the builder: first a hidden option it
  stores and renders, then an editor. Each step changes one mapping in a definition; the JSON format
  doesn't change. Every conversion reports what's in the builder, what isn't yet and what's locked.
- **Builder-only data** (display conditions and the like) goes back out unchanged.
- **Tested** with the real builder in a browser: load, edit text and a style, move, duplicate, delete,
  save, convert back and compare.

## Status and order of work

Each step ends with its tests in CI.

| Step | Status |
|---|---|
| 1. Core: definitions, value kinds, validation, custom components, layout | done |
| 2. Page writer, plain text, `component()` | done |
| 3. Email writer | done |
| 4. Lists and tables, in every output | done |
| 5. React Email parity: web fonts, superscript and subscript, `title`/`aria-label`, `dir` per block, `pretty` | done |
| 6. Support data for every output, and the styling vocabulary | done |
| 7. Today's components on the new engine (`Menu`, `Social`, `Video`, `PageBreak`, `Document`), `/legacy`, the codemod | next |
| 8. `Grid`, `Layer` and responsive page layouts | |
| 9. `Document.Page`, headers, footers and page numbers; print HTML; `@unlayer/elements-pdf` | |
| 10. `Canvas`, `Svg` and shapes; `@unlayer/elements-image` | |
| 11. Builder adapter | last |

## Open questions

- **Does the Unlayer editor adopt these writers?** Until it does, a design exported from the builder and
  the same design rendered by Elements have different markup (equal in what a reader gets).
- **Licence of the client-support data** behind `caniemail` entries.
- **Fonts for PDF and image output:** which faces ship as defaults, and whether Elements fetches font
  files itself.
- **Shared styles** (named styles a template reuses): not in v1.
