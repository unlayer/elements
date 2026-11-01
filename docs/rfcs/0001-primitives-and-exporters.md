# RFC 0001: Elements primitives, a document model, and exporters Elements owns

Status: draft, for review. Steps 1, 2 and 3, lists and tables (step 5), and the API polish (see Amendments: JSX only, async `render()`, `validate()`, short rule-named classes, ids only from authors) are implemented in `packages/core`, `packages/exporters` and `@unlayer/react-elements/primitives`.

## Summary

Elements gets an internal **template tree** (plain data, never public), a **primitive vocabulary**
(`Row`, `Column`, `Grid`, `Layer`, `Text`, `Table`, `Svg`, …) described by **component definitions**,
and **exporters that live in this repo as readable, open source code**: email HTML, web HTML, print
HTML, PDF and images. JSX is the only way to write a template, for developers and agents alike; one
React render turns it into the tree, which is laid out once and written for each target. An **adapter**
converts templates to and from the Unlayer builder's design JSON for Email, Page and Document.

The existing components keep their API and move onto the new exporters one at a time. Their HTML may
change; what a reader gets (content, links, images, styles, layout on desktop and phones) may not.
`@unlayer/exporters` is removed when the last one has moved.

## Decisions

Settled before this RFC:

1. **Roots.** `Email` (email), `Page` (web page), `Document` (paginated document, pages given by
   `Document.Page`), `Canvas` (an image of fixed size; not an HTML canvas). `Image` stays an image in
   the content. A `Presentation` root with `Presentation.Slide` may come later; not here.
2. **The builder covers Email, Page and Document only.** A `Canvas` can't go to the builder.
3. **The builder may lack an editor for something Elements supports.** That property isn't editable
   there, comes back from the original document, and is reported (see [Builder adapter](#builder-adapter)).
4. **The exporters are open source, in this repo, and redesigned.** They don't follow the structure of
   `@unlayer/exporters`; they're designed around the engines that draw each output.
5. **Existing components move to the new exporters.** Their HTML may change if content and styles
   still match (see [Moving the existing components](#moving-the-existing-components)).
6. **`renderToJson()` keeps returning builder JSON.** The document model has its own API.
7. **Simple markup.** `Row` and `Column` aren't required: a root stacks its children, so
   `<Email><Heading/><Paragraph/><Button/></Email>` is a whole email, and each element carries its own
   styles without a wrapper per block.
8. **No `Container`; a `Section` for full-width bands.** The root's `width` is what React Email's
   `Container` does, and a box with a max width is a `Column`. `Section` is a band whose background
   spans the window while its content stays at the content width (see [Layout primitives](#layout-primitives)).
9. **No Elements data in builder JSON.** The adapter writes only builder data, matches blocks by the
   builder's own ids, and takes what the builder can't hold yet from the original document. Gaps are
   closed over time by adding the property to the builder (see [Builder adapter](#builder-adapter)).

Proposed here, for review: everything below.

## Amendments (2026-11-01)

These were decided after the sections below were written, and take precedence over them. The sections
still say "document", `toDocument()`, `renderDocument()` and JSON input where they were written before.

1. **JSX is the only authoring format, for developers and agents.** There is no public Elements JSON:
   no `toDocument()`/`toTree()`, no JSON input to `render()` or `validate()`, no published JSON Schema,
   no document versioning promise. Agents learn the React markup (from the TypeScript types, a
   reference generated from the component definitions, and `validate()`'s messages).
2. **The tree stays, internally.** Calculated layout needs the whole template before anything is written
   (an Image's px width for Outlook comes from every parent above it), and React context, the only other
   way down, isn't available in Next.js route handlers and Server Components (see "Why rendering goes
   through a tree"). The tree lives inside one `render()` call and is plain data, so nothing stops it
   being serialized later if a need appears; none is planned.
3. **The API:** `render(element, options?)`, async, picks the output from the root (`Email` → email HTML,
   `Page` → web HTML, `Document` → print HTML or PDF, `Canvas` → image) and returns the plain-text
   version too; `validate(element)` returns the problems without throwing; `component()` for custom
   components. Both go through one preparation (`prepareTemplate` in the exporters): the template
   checked, custom components expanded once, the output's checks, layout, and what the output can't do
   as asked. `validate()` stops there; only what needs the written output (an email's size against
   Gmail's limits) is `render()`'s alone. Warnings leave a template valid.
4. **Backward compatibility:** a new major version of `@unlayer/react-elements` with the new API at the
   main import; today's API, unchanged, at `@unlayer/react-elements/legacy` (on the new engine after step
   5, removed in the major after); a codemod in `@unlayer/migrate` that checks each migrated template by
   rendering it both ways; a migration guide listing every breaking change.
5. **CSS selectors:** short classes named by their rule's content (a one-letter prefix and a 5-character
   hash, e.g. `.ek3f9a`), shared by every node with the same rule; no generated ids in the HTML. `id`
   is only what an author writes, and goes into the HTML as is.
6. **Builder round trip (step 4), without Elements JSON:** templates go to builder JSON through the tree;
   edited designs come back as JSX source (printed as convert-core's TSX printer prints migrated
   templates) for code, or are rendered directly from the builder JSON at runtime. `base` is the original
   JSX.
7. **Order of work, and React Email parity (2026-11-01).** The API and the full component set come
   first, with feature parity with React Email (`@react-email/components` 1.0.12) as the bar; the
   builder adapter comes last, once the API is final. All of it stays on one branch and one PR until
   every step is ready. Parity is in what a template can say, within these choices:
   - **Elements components only.** No raw HTML elements in templates (`<strong>`, `<ul>`, `<div>`):
     inline formatting is a `Span` with a style, and lists and tables are components. No raw-HTML block.
   - **No Tailwind.** Typed `style` props only; `@unlayer/migrate` converts Tailwind templates.
   - **Not yet:** dark-mode overrides, background images, shadows, gradients, opacity, margins,
     `CodeBlock`, `CodeInline` and `Markdown`. Each can be added later without changing the API.

## Packages and the API boundary

| Package / entry | Published | Holds |
|---|---|---|
| `packages/core` (`@unlayer-internal/elements-core`) | No, bundled | Document model, component definitions, validation, JSON Schema, style and layout resolution, diagnostics, builder adapter. No React. |
| `packages/exporters` (`@unlayer-internal/elements-exporters`) | No, bundled | Email, web and print HTML from the resolved document; the document shells and the head. |
| `@unlayer/react-elements` | Yes | Unchanged API. Existing components, `renderToHtml`, `renderToJson`, … |
| `@unlayer/react-elements/primitives` | Yes (new entry) | The primitive vocabulary, `toDocument()`, `renderDocument()`, `toBuilderJson()`, `fromBuilderJson()`, `validateDocument()`. |
| `@unlayer/elements-pdf` | Yes (new) | PDF from the resolved document, with `@react-pdf/renderer` as a peer dependency. |
| `@unlayer/elements-image` | Yes (new) | PNG/SVG for `Canvas`, with `satori` and `@resvg/resvg-js` (or `@resvg/resvg-wasm`) as peer dependencies. |

The new vocabulary needs its own entry because some names mean something else today:

| Name | `@unlayer/react-elements` | `@unlayer/react-elements/primitives` |
|---|---|---|
| `Row` | needs `layout`/`cells`, only `Column` children | lays children out horizontally; takes content directly |
| `Column` | a cell of a Row | lays children out vertically, anywhere |
| `Table` | data in props (`headers`, `rows`) | built from `TableRow` (a `header` row heads the columns) and `TableCell` |
| `style` | a wrapper `<div>`'s style | the element's own typed appearance |

`Email`, `Page`, `Document`, `Heading`, `Paragraph`, `Image`, `Button`, `Divider` and `PageBreak` exist in
both. In `/primitives` they take semantic props plus `style`; the existing flat props (`fontSize`,
`backgroundColor`, …) stay on the root entry. `Document.Page` is additive to today's `Document`.

The root entry keeps requiring `Row` and `Column` (that's its API today); `/primitives` doesn't.

PDF and image packages stay out of the base bundle, the 118 KB size gate and the CSP gate (Satori runs
Yoga as WebAssembly, which a CSP without `'wasm-unsafe-eval'` blocks). `/primitives` gets its own size
limit.

## The document model

```ts
interface ElementsDocument {
  version: 1;
  root: Node;                       // type: "Email" | "Page" | "Document" | "Canvas"
}

interface Node {
  /** Stable. Given by the author (`id` prop), else assigned in document order per type ("button_3"),
   *  never random (Next.js 16 prerendering fails on random values). Unique in a document. */
  id: string;
  type: string;                     // a defined component: "Row", "Heading", "Document.Page", …
  props?: Record<string, Json>;     // meaning: href, src, alt, level, size
  style?: Style;                    // appearance, typed (below)
  mobile?: Partial<Style>;          // phone overrides, for Email and Page (see Responsive)
  hidden?: { mobile?: boolean; desktop?: boolean };
  children?: Child[];
  /** Data from another format that Elements doesn't render, kept so it goes back out unchanged
   *  (a builder block's display conditions; see Builder adapter). */
  compat?: Record<string, Json>;
}

type Child = Node | string;         // a string is text, where the parent takes inline content
```

- **Root metadata** is the root's props: `title`, `previewText` (Email), `lang`, `dir`, `fonts`,
  `width` (Email/Page content width, Canvas width), `height` (Canvas), `size` and `orientation`
  (`Document.Page`).
- **Rich text** is nodes, not HTML: text-taking components hold strings, `Span` (styled run), `Link`,
  `LineBreak` and `MergeTag` (`{ type: "MergeTag", props: { name: "first_name" } }`). Merge tags are
  nodes so no output escapes or splits them.
- **No functions or React elements.** JSX is evaluated into the model by the existing collector
  (`utils/normalize.tsx`): user components, hooks, Context and Fragments run as today, and the result
  is plain data.
- **Validation** comes from the component definitions and is the same for JSX and JSON input:
  unknown types and props, wrong value kinds, wrong nesting, a primitive the target can't render.
- **Versioning.** `version` is the model version. A change that existing documents can't be read with
  bumps it and ships an upgrade function; old versions are upgraded on input, never rejected silently.
- convert-core's `ElementNode` (`packages/convert-core/src/tree.ts`, also the MCP `render_elements`
  input) is the unversioned ancestor of this. The converters move to the model once it lands.

The existing components map into the same model: `<Button fontSize="16px">` from the root entry
becomes a `Button` node with `style.fontSize = 16`, through each component's existing prop mapper.
A legacy prop with no primitive equivalent (a Menu's layout, Social icons, Video) becomes a defined
prop of a legacy-only type (`Menu`, `Social`, `Video`, `Html`), so the model never holds builder
`values` as an opaque blob.

## Component definitions

One definition per component is the source of everything about it.

```ts
const Button = defineComponent({
  type: "Button",
  label: "Button",
  props: {
    href: link({ required: true, label: "Link" }),
  },
  style: pick(textStyle, "color", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing")
    .with(boxStyle, "backgroundColor", "padding", "border", "borderRadius", "width"),
  states: { hover: ["color", "backgroundColor"] },
  children: inline,                                   // strings, Span, MergeTag
  targets: {
    email: { borderRadius: "vml" },                   // recipe used (see Email)
    pdf: { note: "a styled link" },
    canvas: false,
  },
  builder: {
    tool: "button",
    values: {                                         // where each prop lives in the builder's values
      href: "href",
      "style.backgroundColor": "buttonColors.backgroundColor",
      "style.padding": "padding",
      "style.letterSpacing": null,                    // the builder can't hold it yet
    },
  },
  editor: {
    groups: [
      { title: "Button", props: ["href", "style.width"] },
      { title: "Colors", composite: "buttonColors" },
      { title: "Spacing", props: ["style.padding"] },
    ],
  },
});
```

From the definitions we derive, without separate hand-written lists:

- **TypeScript types** for JSX props and JSON nodes (inferred from the value kinds).
- **Runtime validation** (a small validator of our own; no zod, for the bundle gate).
- **JSON Schema** for documents, published for tools and agents.
- **Property discovery** (`describeComponent("Button")`): props, kinds, defaults, editors, targets.

### Value kinds

| Kind | Accepts | Normalized to | Editor kind |
|---|---|---|---|
| `color` | CSS hex, `rgb()`, `rgba()`, named | `#rrggbb` or `rgba()` | `color` |
| `length(units)` | number (px), `"12px"`, `"50%"`; `pt`/`mm`/`in` only where the definition allows (Document, PDF) | `{ value, unit }` | `length` |
| `insets` | number, `"8px 16px"`, `[v, h]`, `[t, r, b, l]`, `{ top, right, bottom, left }` | `{ top, right, bottom, left }` in px | `insets` |
| `border` | `{ width, style, color }` per side or all sides | per side | `border` |
| `radius` | number or per corner | per corner, px | `radius` |
| `enum(values)` | one of the values | itself | `choice` (segmented when ≤ 4) |
| `fontFamily` | a stack string, or `{ name, src }` | `{ stack, faces }` | `fontFamily` |
| `fontWeight` | 100–900 | number | `fontWeight` |
| `lineHeight` | multiplier (number) or length | resolved to px per target where needed | `lineHeight` |
| `asset` | URL or data URI, with optional `width`/`height` | `{ src, width?, height? }` | `image` |
| `link` | URL, `mailto:`, `tel:`, or `{ href, target }` | `{ href, target }` | `link` |
| `text`, `number(min, max)`, `boolean` | | | `text`, `number`, `toggle` |

### Editor metadata

`editor` describes conceptual editors and grouping, never UI components. Each editable prop has a
label, optional description, a group, and optional `visibleWhen` (a prop path and the values for which
it shows). A **composite** editor reads and writes several props at once and is defined with the
props it covers and a `write(value) → patch` function (`buttonColors` covers `style.color`,
`style.backgroundColor`, `hover.color`, `hover.backgroundColor`). The builder adapter maps editor kinds
to the builder's widgets; other editors can map them to theirs.

## Custom components

Two ways, for two needs.

**A function returning primitives** is a React component like any other: `toDocument()` renders it
(hooks, Context and data included) and the document holds the primitives it returned. Nothing marks
where it was, so the builder sees those primitives.

**`component()`** makes a named, reusable block that stays one node in the document, with its own
props and editors. It replaces the main entry's `registerTool` (which takes the builder's tool config
and an HTML string for each output) for new code; `registerTool` stays as it is.

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

- **Its definition is a component definition**, with the same value kinds: prop types, validation,
  the JSON Schema and editors come from it as for the built-in components.
- **In the document it's one node**, `{ "type": "acme.ProductCard", "props": { … } }`, expanded into
  primitives when it's resolved. Every target renders it, since it's primitives by then; nobody writes
  HTML for it.
- **`render` is a pure function of its props** (props normalized, defaults applied): no hooks, no
  data, so it can be expanded anywhere (a server, the builder, from JSON). It returns one component,
  which takes the custom node's place: the node's `flex` and `hidden` go onto it, and the ids inside
  it are the node's id followed by their own (`product_card_1-heading_1`), so two cards never share an
  id.
- **Type names have a namespace** (`acme.ProductCard`: a lowercase name, a dot, a capitalized name),
  so they never clash with a built-in component, now or later.
- **Placement.** It goes where a block goes; with `placement: "section"`, where a `Section` goes (and
  then renders a `Section`).
- **JSON input names its custom components** (`toDocument(json, { components: [ProductCard] })`);
  JSX registers the ones it uses. An unknown namespaced type is an error naming the option.
- **Builder.** A custom tool whose panel comes from the definition; its props map to builder values
  like the built-in components' (step 4).
- No children in v1: props only. A slot for children can come later.

## Styles and layout

### Style groups

| Group | Properties | Inherited |
|---|---|---|
| Text | `color`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `textAlign`, `textDecoration`, `textTransform` | yes, from the root down through layouts |
| Box | `width`, `minWidth`, `maxWidth`, `height`, `padding`, `backgroundColor`, `backgroundImage`, `border`, `borderRadius`, `overflow` (`visible`, `hidden`) | no |
| Layout (on `Row`, `Column`, `Grid`) | `gap`, `alignItems` (`start`, `center`, `end`, `stretch`), `justifyContent` (`start`, `center`, `end`, `space-between`); on a `Row`, `flexWrap` (web only) and the `stackOnMobile` prop | no |
| Placement (on a child) | in a `Row`: `width` or `flex` (grow factor); in a `Layer`: `top`, `right`, `bottom`, `left` | no |

No margins: space between siblings is the parent's `gap`; space inside a box is `padding`. Every
target can do both reliably, which isn't true of margins in email.

### Styling vocabulary (from the PR review; decided and done 2026-11-01)

**Policy.** `style` uses CSS property names and CSS values wherever the meaning is the same, so
authors and agents write what they already know, and the names that differ say why. A familiar
name doesn't promise support: each style's definition says which targets take it, and `validate()`
reports what the template's output can't do (`email/unsupported`, `email/outlook-degraded`).
Numbers are px, as in React's inline styles.

**What changed, and what stays.** Done in one pass before anything was published (definitions,
types, diagnostics, writers, docs, tests). The old names are errors whose message names the new
one (`"align" isn't a style this component takes: it's alignItems now`).

| Was | Now | Why |
|---|---|---|
| `align: "start" \| "center" \| "end" \| "stretch"` (root, Section, Row, Column) | `alignItems`, same values | the same meaning as `align-items` in a flex container; CSS takes `start`, `center`, `end`, `stretch` |
| `justify: "start" \| "center" \| "end" \| "between"` (Row, Column) | `justifyContent: "start" \| "center" \| "end" \| "space-between"` | CSS's name and value |
| `wrap: "stack" \| "none" \| "wrap"` (Row style) | a prop, `<Row stackOnMobile={false}>` (true by default in Email and Page), and `flexWrap: "wrap"` in `style` (web and print only) | stacking on phones is a layout decision, not a CSS value; `wrap` as CSS's own is a separate thing |
| Divider `color`, `thickness`, `lineStyle` | `borderTop: "1px solid #bbbbbb"` | the line is a top border, as an `<hr>`'s is in CSS; a Divider's `color` meaning its line, not text, is a trap |
| `flex: 2`, `flex: "none"` | keep | both are valid CSS `flex` values with the same meaning |
| `padding` (a number, `"8px 12px"`, `[8, 12]` or `{ top, … }`), `verticalAlign` (TableCell), `gap`, `width`, `minWidth`, `maxWidth`, `height`, `border`, `borderRadius`, `backgroundColor`, the text styles | keep | already CSS |
| `indent` (List) | keep | no CSS property means "the markers' column"; in email the markers are a cell of that width |
| `cellPadding`, `rowBorder` (Table) | keep | a table-wide default for every cell (HTML's own `cellpadding`), and a line between rows: neither is a CSS property |
| `fontFamily: { name, src, fallback }` | a CSS stack only; web fonts are the root's `fonts` (2026-11-01) | as React Email's `Font` and CSS's `@font-face`: faces declared once, with a weight and style each, named in stacks |
| `mobile`, `hover` | keep as their own props | no inline-CSS form exists |
| `textDecoration` on a container (Email, Page, Section, Row, Column, List, Table) | removed: only text elements take it | CSS doesn't pass it down as an inherited style, and no writer wrote it on a container: it was dropped |
| `flex` on a Divider | removed | a Divider always has a width (100% by default), so its share never applied |

**Margins: not a permanent ban.** `gap` (the parent's space between its children), `padding` (space
inside a box) and `margin` (one element's space outside it) are different things. The reason for
leaving margins out was email, where Word handles them badly. But the email writer owns the cell
around every child of a stack and of a Row, so a block's margin can become that cell's padding,
never relying on Word's margins. And on the web, stacks are flex containers, where margins don't
collapse, so the two agree. Proposal: `margin` and its sides on blocks (not on text inside text),
added in a later step with that email lowering; `auto` side margins as alignment; negative margins a
diagnostic. Until then, a margin is a `style/unknown` error that points to `gap` and `padding`, as
now. The policy is: an email limitation is handled in the email writer, or reported for email, and
doesn't become a rule for every target.

### Layout primitives

- **The root** (`Email`, `Page`, `Document.Page`, `Canvas`) stacks its children vertically, like a
  `Column`, with `gap` and `alignItems`. Content can go straight in it:

  ```tsx
  <Email>
    <Heading>Welcome</Heading>
    <Paragraph>Thanks for signing up.</Paragraph>
    <Button href="https://example.com">Get started</Button>
  </Email>
  ```

  `Row` is only needed to put things side by side, and `Column` only for a vertical group with its
  own style or spacing.
- **`Section`** is a full-width band, directly under an `Email` or `Page` root: its background spans
  the window, and its children are laid out at the content width, stacked as in a `Column` (content
  directly, or Rows). `Document` and `Canvas` have no window wider than their content, so a `Section`
  there is a diagnostic.

  ```tsx
  <Email>
    <Section style={{ backgroundColor: "#111", padding: 24 }}>
      <Image src={logo} style={{ width: 120 }} />
    </Section>
    <Heading>Welcome</Heading>
  </Email>
  ```

  Unlike React Email's `Section` (a table used for any grouping), it means only this; grouping is
  `Column`. There's no `Container`: the root's `width` centers the content, and a box with a maximum
  width elsewhere is a `Column` with `style.maxWidth`.
- **`Row`** lays children out horizontally. A child takes its `width` (px or %) or a share of what's
  left by its `flex` (default `1`): children without a width share the row equally, in every target.
  `minWidth` and `maxWidth` hold, and what one child can't take goes to the others, as CSS flexbox
  resolves it (the resolver follows css-flexbox-1, so email gets the browser's widths); children with
  a width that don't fit are narrowed as a browser narrows them (`layout/shrunk`), and minimums that
  can't fit are reported (`layout/overflow`).
  Content-sized children (`flex: "none"`) are allowed in web, PDF and Canvas; in email only for
  children whose width is known (a Button or Image with a width), else a diagnostic. In Email and
  Page its children stack full-width on phones unless its `stackOnMobile` prop is false (then they stay
  side by side); `flexWrap: "wrap"` wraps them onto more lines (web, PDF and Canvas only).
- **`Column`** stacks children vertically, with `gap` between them and `alignItems` across. With
  `alignItems: "stretch"`, children that take their own size (a Button, an Image) fill its width.
- **`Grid`** places children in `columns` (a count or a list of widths), filling rows in order, with
  `gap`. CSS grid on the web; lowered to Rows elsewhere.
- **`Layer`** stacks its children on top of each other in order (the last on top), each placed by
  `top`/`right`/`bottom`/`left` inside the Layer's box. The Layer's size is its own `width`/`height`,
  else its first child's.
- Layouts nest anywhere a target supports it, and take content directly.

### Units and sizes

Lengths are px unless written otherwise; `%` is of the parent's content box. The resolver gives every
box a concrete width from the root's width down (proposed defaults: Email 600px, Page 1200px max
width; the root entry's components keep their 500px; `Document.Page` from its size and margins,
Canvas from its `width`). Heights are content heights unless
set; a set height with content taller than it shows it (`overflow: visible`) or cuts it off
(`hidden`, not in classic Outlook).

### Responsive

Email and Page have two widths: desktop, and phone (below the content width + 20px in Email, below
480px in Page, as today). `mobile` overrides a subset of styles (text sizes, line heights, alignment,
padding, widths, borders) and `hidden` hides a node on one of them. Document and Canvas have one
fixed size and no `mobile`.

## Pipeline

```
JSX ──collect──┐
               ├─▶ ElementsDocument ─▶ validate ─▶ resolve ─▶ lower (per target) ─▶ serialize
JSON ──parse───┘                          │          │           │
                                          ▼          ▼           ▼
                                      diagnostics (one list, with node ids and paths)
```

- **resolve** (shared by every target): definition defaults, inherited text styles, value kinds
  normalized, every box's width in px, image sizes, fonts and the faces each text run uses.
- **lower** takes the resolved tree and a **target profile** (what its engine can do). Anything the
  engine can't do becomes a known fallback (a recipe) or a diagnostic; nothing is dropped silently,
  and nothing editable is turned into an image unless the author asks for it.
- **serialize** writes the output and the document shell (the shells in `utils/document-layouts.ts`
  move here).

### Why rendering goes through a tree (spike, 2026-11-01)

React Email renders with no tree in between: each component writes its own markup and React renders
them. We tried the same for Elements: components that write their markup per target, with the width a
parent gives its children passed down through React context (Row, Column, Text, Button, Image; packed
and installed in this repo's Next.js 14, 15 and 16 test apps).

| Where | Next 14 (React 18) | Next 15 (React 19.1) | Next 16 (React 19.3, Cache Components) |
|---|---|---|---|
| Plain Node (tests) | works | works | works |
| Route handler | fails: no `createContext` | fails: no `createContext` | fails: no `createContext` |
| Server Component | fails: no `createContext` | fails: no `createContext` | fails: no `createContext` |
| Client Component (server render) | fails: context lost between React copies | fails: same | fails: same |
| Today's Elements (control) | works | works | works |

- **React Server Components' React has no `createContext` or `useContext`** (React 19's server build
  exports neither), and route handlers and Server Components import Elements with it. So a parent can't
  pass anything down to its children except through props.
- **In a Client Component's server render, Next.js gives Elements another copy of React** than the one
  rendering, and context set by one isn't read by the other. Today's Elements already works around this
  (`utils/server-renderer.ts`) because it doesn't rely on context.
- **Props can't carry it either:** a parent can only add props to its direct children, and a child that's
  the user's own component (`<Card />`) doesn't pass them on.
- **React Email works there because its components need nothing from their parents:** a Column is a
  `<td>` with the width the author writes. Elements works out widths (for Outlook's tables, stacking on
  phones), which needs the parent's width and every sibling, so it needs the template as data first.

So rendering stays: one collecting render (which works in all of those places), then the tree, laid out
once, then each target's writer. What the spike did confirm: the layout it computed matched the
resolver's exactly, and a Row's sizing read from its direct children covers the realistic examples
(273 of 281 children placed in Rows are Columns), so that rule wasn't the problem.

### Targets

| Target | Root | Drawn by | Lowering |
|---|---|---|---|
| `email` | `Email` | classic Outlook (Word), Outlook on the web, Gmail, Apple Mail and other WebKit clients | tables (below) |
| `web` | `Page` | browsers | flex for the root, Row and Column, CSS grid for Grid, absolute positioning for Layer; one element per node with its styles inline, no wrappers; semantic tags (`main`, `section`, `h1`–`h6`, `p`, `ul`/`ol`, `table`, `a`, `img`); a small stylesheet for phones and `:hover` |
| `print` | `Document` | Chromium's print (Unlayer's PDF services) | web, plus `@page` size and margins, `break-before`/`break-after`/`break-inside`; one section per `Document.Page` |
| `pdf` | `Document` | `@react-pdf/renderer` (Yoga) | the resolved tree as react-pdf `View`/`Text`/`Image`/`Link`/`Svg`; `PageHeader`/`PageFooter` as `fixed`; `PageNumber` by `render`; tables as rows of Views, header rows repeated on each page |
| `image` | `Canvas` | Satori (Yoga), then resvg | the resolved tree as Satori's flex elements; Layer as absolute positioning; fonts passed as buffers (TTF/OTF/WOFF); images inlined as data |

Web, print, PDF and Canvas are all flexbox engines, so Row and Column mean the same thing in each.
Email is the one target that needs a different structure.

The email above, on the web:

```html
<main style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
  <h1 style="margin:0;font-size:32px">Welcome</h1>
  <p style="margin:0">Thanks for signing up.</p>
  <a href="https://example.com" style="align-self:flex-start;display:inline-block;padding:12px 24px;background:#0879a1;color:#fff">Get started</a>
</main>
```

A `Section` on the web is one element, its content kept to the content width by its padding:
`<section style="background:#111;padding-block:24px;padding-inline:max(24px, calc((100% - 600px) / 2))">`.

## Email

### Rules

1. **Right without `<style>`.** Layout at desktop width, colors, fonts, sizes and spacing are inline.
   The `<style>` block only adds: stacking and overrides on phones, `:hover`, dark mode, client
   resets. Gmail drops `<style>` for some accounts; a test renders every case with it removed.
2. **Widths are decided before writing.** Every table, cell and image gets a px `width` attribute (and
   style) from the resolver. Word sizes by attributes and ignores the sizes of `div`s (the Outlook
   captures in unlayer/email-renderer showed today's `min-width` column divs are dropped).
3. **Tables for layout, nothing else.** `role="presentation"`, `cellpadding="0" cellspacing="0"
   border="0"` on every layout table; spacing as cell padding, never margins.
4. **Outlook-only markup only inside `<!--[if mso]>`**, and nothing a non-Outlook client needs inside
   one.

### Layout lowering

| Primitive | Email markup |
|---|---|
| `Email` | the shell: doctype, `OfficeDocumentSettings` (`PixelsPerInch` 96), `x-apple-disable-message-reformatting`, `color-scheme`, the preheader; one centered table of the content width (`width="100%"` with a px `max-width`, which Word takes as the width), one table row per child, `gap` as the cells' bottom padding; the language, direction and background also on a `role="article"` wrapper, as Gmail drops `<html>` and `<body>` |
| `Section` | a full-width table with the background, holding a centered table of the content width (an MSO ghost table for Outlook's width) |
| `Row` | "fluid hybrid": an MSO ghost table (`<table><tr><td width=…>`) for Outlook, and `display:inline-block` columns with `max-width` = their desktop width and `width:100%`, so they stack where the row is narrower, even without media queries; `gap` as spacers (a cell for Outlook, an inline-block for the rest, as tall as the gap on phones); `stackOnMobile={false}` keeps a table row (an empty cell taking room the children leave). A child hidden on desktop takes no desktop width (the resolver leaves it out) and isn't in Outlook's table |
| `Column` | a single-cell table per child, `gap` as padding between |
| `Grid` | lowered to Rows of `columns` children |
| `Layer` | not supported (diagnostic), except an image under content: CSS `background-image` with a VML `v:rect` fill for Outlook |
| `Table` | a real `<table>` |

The email above, with no Row or Column:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
  <table role="presentation" width="600" style="width:100%;max-width:600px" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding-bottom:16px"><h1 style="margin:0;font-size:32px;line-height:40px;mso-line-height-rule:exactly">Welcome</h1></td></tr>
    <tr><td style="padding-bottom:16px"><p style="margin:0">Thanks for signing up.</p></td></tr>
    <tr><td><a href="https://example.com" style="display:inline-block;padding:12px 24px;background:#0879a1;color:#fff">Get started</a></td></tr>
  </table>
</td></tr></table>
```

### Element recipes

Each is a small module with its own tests and Outlook captures.

| Element | Recipe |
|---|---|
| Text, Heading, Paragraph | the semantic tag with `margin:0` inline; line height in px with `mso-line-height-rule:exactly` (Word drops the unitless line heights written today) |
| Button | a one-cell table: background, border and corners on the cell; the padding on the `<a>` (`display:inline-block`, all of it clickable) and as the cell's `mso-padding-alt` for Outlook, which has no padding on links. Not VML: the Outlook captures show Word drawing a VML button's label in its own font (Aptos), wrapped inside the shape's fixed size; a table keeps the template's font and sizes to its label. Square corners in classic Outlook |
| Image | `<img>` with `width` attribute and style, `display:block`, `height:auto`, `border:0`, alt text styled |
| Divider | a table cell with `border-top`, not `<hr>` |
| List | a table: an item a row, its marker right-aligned in a cell of the indent's width, `role="list"`/`"listitem"` for screen readers. Word's own lists indent and space differently by version; a table lays out the same everywhere |
| Table | a data table (no `role="presentation"`) with fixed layout: column widths from the resolver in a `colgroup` and on each cell (px for Word, shares elsewhere); header rows as `thead` with `th`; `cellPadding` and `rowBorder` written on each cell |
| Link | `<a>` with color and decoration inline |
| Svg, shapes | not supported (diagnostic); an author may rasterize explicitly with `@unlayer/elements-image` and use an Image |

### How the email writer is checked

- **Unit tests** (`packages/exporters/test/email.test.ts`): the markup of each recipe, phone styles,
  hiding, diagnostics, and hostile input parsed back with nothing added, inside Outlook's
  conditional comments included.
- **Chromium** (`test/browser/email-layout.test.ts`, in CI): every box as wide as the resolver says
  on desktop, with the stylesheet and with it removed; Rows stacked on phones, by the stylesheet
  and, without it, by the fluid-hybrid columns alone.
- **Row widths against the browser** (2026-11-01, after the PR review): in Chromium, each case of
  `test/browser/row-widths.test.ts` (minimums, maximums, padding, gaps, widths that don't fit, room
  left over, a % Divider) measures the resolver's widths in the Page, the Email and the Email without
  its `<style>`. Over 786 generated templates (1,332 Row children), every Page child is the resolver's
  width; every Email child is too, but where the resolver gives a box less room than its content
  needs (text in a few px, a label wider than its button), with its neighbours. A table cell, like
  Word's, is never narrower than its longest word, while a flex item with `min-width: 0` is; the
  resolver doesn't measure text, so it can't see this. Known limit: such a template looks different
  in email from the page, and no diagnostic says so yet.
- **The Outlook-like renderer** (unlayer/email-renderer, run locally, 2026-11-01): two templates
  (a realistic welcome email, and one with nested Rows, a Row kept side by side, hidden columns,
  percentages and boxes with a maximum width) give every box the resolver's width and the same
  words as Chrome, at 96 and 192 DPI. It found the desktop width taken by phone-only columns
  (fixed in the resolver). The renderer has no rule for `mso-padding-alt` yet, so the button
  padding in Outlook is the documented behaviour, not a measured one: the next capture run
  should include buttons.

### Email support as data

Implemented 2026-11-01. Every style of every component that renders to email declares, in its
definition (`email` on the style: `packages/core/src/styles.ts`, `components.ts`), how email shows it,
for all values or some (`values`, `when`):

| Level | Means | Diagnostic |
|---|---|---|
| `full` | shown as asked | none |
| `outlook` | as asked, but classic Outlook shows something else (`shows`: square corners, normal letter spacing, content past a set height) | `email/outlook-degraded` (note) |
| `partial` | not quite as asked in any client (`shows`: a Row's children not stretched to one height) | `email/degraded` (note) |
| `none` | not in email (`shows` what it does instead: `justifyContent: "space-between"` on a Row, `flexWrap: "wrap"`) | `email/unsupported` (warning) |

Each declaration names its source: `outlook-captures` (unlayer/email-renderer's oracle),
`caniemail`, `writer` (the email writer lowers it to markup every client shows: checked in Chromium,
with and without `<style>`, and in the Outlook-like renderer), or `assumed` (not checked yet:
`textTransform`). One pass (`emailSupport`, run by `validate()` and `render()`) reads them, for the
styles an author set (not a component's own defaults); what no single style says (a Row child whose
size isn't known, an image without a width, a hidden table cell) stays a structural check there.

What keeps it true (`packages/exporters/test/email-support.test.ts`): every style of every email
component has a declaration; every style, at each enum value and a noticeable sample of others,
either changes the email or gives a diagnostic for it (none is dropped silently); and every value
declared `outlook`, `partial` or `none` is reported. Writing that test found four silent drops, now
fixed: `textDecoration` on containers, `height` on an email Row, `maxWidth` on a Button without a
width, `flex` on a Divider; and that `alignItems: "stretch"` didn't widen a stack's Buttons and
Images (now in the resolver, so every target does). A new style can't be added for email without
saying what email does with it.

Chromium and the Outlook-like renderer aren't email clients: `caniemail` and `assumed` entries, and
anything only the renderer has checked, are confirmed by capturing real clients.

### Web fonts

The root's `fonts` declares the files a template loads, a face each (`{ family, src, format, weight,
style }`; a variable font's weight a range, `"100 900"`; the format from the file's extension where
not given), as React Email's `Font` does. Text names a family in its `fontFamily` stack, before the
fonts to show where it can't load; the browser picks the face for each weight and style (Chromium
fetches only the faces the text uses: `test/browser/fonts.test.ts`). In email the `@font-face` rules
are in a `<style>` classic Outlook doesn't read: it draws the next font in the stack (Outlook
captures; a face it read and couldn't load could leave it a default). Gmail and classic Outlook don't
load web fonts, Apple Mail and iOS Mail do: a note says so for each family (`email/degraded`), and a
stack that ends on a web font is a warning (`email/font-fallback`), as the client would pick its own.

### Budgets

Warn before Gmail clips a message (102 KB of HTML), and when the `<style>` block is larger than Gmail
reads.

## Support matrix (v1 target)

✓ supported and tested · L lowered (behaves the same, built differently) · P partial (noted) · ✗
diagnostic

| | email | web | print | pdf | image | builder |
|---|---|---|---|---|---|---|
| `Email` / `Page` / `Document` roots | ✓ / – / – | – / ✓ / – | – / – / ✓ | – / – / ✓ | – | ✓ |
| `Canvas` | – | – | – | – | ✓ | ✗ |
| Content directly in a root | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (one-column rows) |
| `Section` | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ (a row) |
| `Row`, `Column` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (a Row at the top or in a Section, Columns in it); nested: locked |
| `Grid` | L | ✓ | ✓ | L | L | L when it fills whole Rows, else locked |
| `Layer` | P (image under content) | ✓ | ✓ | ✓ | ✓ | locked |
| `Text`, `Heading`, `Paragraph`, `Span` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Link`, `Button`, `Image`, `Divider` | ✓ | ✓ | ✓ | ✓ | ✓ (links don't navigate) | ✓ |
| `List`, `ListItem` | ✓ | ✓ | ✓ | ✓ | ✓ | P (text-only items, in a text block) |
| `Table` family | ✓ | ✓ | ✓ | ✓ (rows split across pages) | ✓ | P (text-only cells), else locked |
| `Document.Page`, `PageBreak` | – | – | ✓ | ✓ | – | P (`PageBreak` only) |
| `PageHeader`, `PageFooter`, `PageNumber` | – | – | P (no running header in Chromium print) | ✓ | – | ✗ (kept) |
| `Svg`, `Rect`, `Ellipse`, `Line`, `Path` | ✗ | ✓ | ✓ | ✓ | ✓ | locked |
| `MergeTag` | ✓ | ✓ | ✓ | ✓ (needs values) | ✓ (needs values) | ✓ |

Every ✓, L and P cell has an exporter and tests before it's marked so; the matrix lives in the
definitions, and a test checks it against the exporters.

## Builder adapter

`toBuilderJson(document)` and `fromBuilderJson(json, { base? })` convert between the model and the
builder's design JSON (schema version 27, as in `@unlayer/exporters` 1.497.0 and the editor's current
source). The builder JSON holds builder data only: no Elements keys or markers, and its ids are the builder's own.

### Structure

| Model | Builder |
|---|---|
| root (`Email`, `Page`, `Document`) | `body` with its display mode and values |
| `Section` | a row: the Section's background is the row's (full width), its content the row's columns |
| `Row` directly under the root | a row; `cells` from the children's widths |
| `Column` in such a Row | a column |
| content in such a Column | a content of the matching tool |
| content directly under the root | a one-column row with no styles of its own, one per run of consecutive blocks |
| anything else (nested layouts, Grid that doesn't fill whole Rows, Layer, Svg) | a locked node |

Tools: `Heading` → heading, `Paragraph`/`Text`/`List` → text, `Button` → button, `Image` (and an `Image`
in a `Link`) → image, `Divider` → divider, `Table` → table, `PageBreak` → page break, and the legacy-only
types to their tools.

Coming back, the shape says what a row was, without markers: a row with a full-width background is a
`Section`; a one-column row with no styles of its own is blocks directly under the root; any other row
is a `Row`.

### Where each prop lives in the builder

Each definition's `builder.values` says where each prop is stored in its builder tool's values, or
`null` where the builder can't hold it yet. That gives every prop one of three states:

| State | When | In the builder | Coming back |
|---|---|---|---|
| In the builder | the tool's values have a field for it (with or without an editor) | stored as a normal builder value; edited where there's an editor | the builder's value |
| Not in the builder yet | `builder.values` maps it to `null` | not there | from `base`, if given (below) |
| Locked node | no builder tool can show it | an Html block with the node's HTML from the `web`/`email` exporter; can be moved, duplicated or deleted, not edited | the subtree from `base`; without `base`, or if its HTML was edited, an `Html` node with a diagnostic |

A missing editor is not a missing value. Builder options can be `hidden`, so a gap is closed in two
steps in the editor repo: add the field to the tool's schema as a hidden option and render it in the
builder's exporter (the builder now stores and keeps the value), then give it an editor later. Each
step moves a prop from "not in the builder yet" to "in the builder" by changing its definition's
mapping; nothing in the JSON format changes.

### Matching blocks and merging with `base`

Blocks are matched by the builder's own `id`s, which the adapter writes in the builder's format
(`u_row_1`, `u_content_button_3`). The builder's load step
(`libs/schemas/src/migration/design/finally.ts`) keeps existing ids and gives a new one only to a
block with no id or a repeated one, so a duplicated block arrives with a new id.

`base` is the document the builder JSON was made from: the JSX source or the stored Elements
document. With it, `fromBuilderJson` rebuilds the JSON it exported from `base` (ids are deterministic,
so it's the same JSON) and compares each block, by id:

1. **A builder value the user changed** takes the builder's value.
2. **A prop not in the builder yet** comes from `base`. Where it overlaps a builder value the user
   changed (overlaps are declared in the definitions: `paddingInline` overlaps the builder's
   `padding`), the builder's edit wins and the prop is dropped, with a diagnostic.
3. **A block missing from the builder JSON** was deleted, and stays deleted.
4. **Order and nesting** come from the builder.
5. **A block with an id `base` didn't export** (added or duplicated in the builder) comes in from its
   builder values only. For a duplicate, a diagnostic lists the props it didn't get.
6. **Locked nodes** get their subtree from `base`.

Without `base`, the document comes from the builder values only, and a diagnostic lists what that
loses. A team that keeps only the builder JSON loses what the builder can't hold yet; `toBuilderJson`
lists it when exporting, so it's never a surprise.

### Builder-only data

What the builder stores that Elements doesn't render (`_meta`, display conditions, …) goes to the
node's `compat.builder` and back out to the builder unchanged.

### Reported, not hidden

Every conversion returns `{ json | document, diagnostics, coverage }`: how many props and nodes are in
the builder, not in it yet, and locked, and why. The coverage across real designs is the list of
builder fields and editors worth adding first. A `Canvas` returns the diagnostic
`builder/unsupported-root` and no JSON.

## Moving the existing components

The root entry's components keep their props, defaults and behavior; their output moves to the new
exporters one component at a time:

1. Each component lowers into the model (its prop mapper produces a node) and renders through the new
   pipeline behind `engine: "next"` in `UnlayerConfig`.
2. It's switched to the new engine by default when it passes, against the 1.497.0 exporters as the
   reference (kept as a devDependency, not shipped), on the examples, the 600 generated templates and
   the template patterns:
   - designs (`renderToJson`) and plain text: identical, as today's previous-release test requires;
   - HTML: content and styles equal by convert-core's check at desktop and phone widths (words,
     links, images, text styles, where words sit), not bytes; HTML snapshots updated and reviewed;
   - the browser E2E gate, the Storybook visual gate (baselines updated only with review) and the
     hostile-input and render-isolation tests;
   - email: the Outlook renderer's score in unlayer/email-renderer no worse on the same cases.
3. When every component is on the new engine, the `engine` option and `@unlayer/exporters` go, and
   the CSP gate holds for the whole package without exceptions.

Each switch is a changelog entry naming the markup that changed.

## Versions recorded

- Reference exporters: `@unlayer/exporters` 1.497.0 (the catalog pin), built from the editor repo at
  tag `1.497.0`.
- Builder design schema: version 27 at that tag; the editor's current source (1.511.0) is also 27.
- Only that tag is used as reference; differences from later editor releases aren't part of this work.

## Testing

| What | How |
|---|---|
| Existing API and output | the current suites, unchanged, plus the switch criteria above |
| Definitions | type tests (`test-d`) for inferred props, validation tests per value kind, a JSON Schema snapshot, property discovery and composite writes |
| JSX and JSON give the same output | each generated template rendered from JSX and from its `toDocument()` JSON: identical output in every target |
| Each supported matrix cell | a render test per primitive and target, generated from the matrix |
| Diagnostics | each unsupported cell gives its diagnostic with the node id |
| Builder round trip | the real builder in Playwright: load `toBuilderJson` output, edit text, a style, move, duplicate, delete, save; `fromBuilderJson` with and without `base`, render, and compare with the expected document; the saved JSON committed as fixtures so the package's own tests don't need the private repo. It also proves what the merge relies on: ids survive load, edit and save; a duplicated block gets a new id; a saved design holds no data the adapter didn't write |
| Builder and Elements agree | the builder's HTML export and Elements' render of the same design compared with convert-core's check (content; styles listed) |
| Email | strip-`<style>` render, the Outlook renderer and real Outlook captures (unlayer/email-renderer), browser E2E; optionally a client-matrix service before releases |
| PDF | text extracted per page: multipage text, a table split across pages with its header repeated, headers, footers and page numbers |
| Image | PNG compared per pixel with fixed fonts: overlapping layers, fonts, embedded images, cropping |
| Packaging | the packed packages installed in the Next.js 14/15/16 and Jest integrations, with no access to the Unlayer repo |

## Order of work

Each step ends with its tests in CI.

1. **Core.** Model, definitions and value kinds, validation, JSON Schema, resolver, diagnostics,
   `toDocument()` from JSX and JSON. Definitions for the slice's components.
2. **Web exporter for the slice** (`Page`, `Section`, `Row`, `Column`, `Text`, `Heading`, `Paragraph`,
   `Span`, `Link`, `Button`, `Image`, `Divider`, `LineBreak`, `MergeTag`), and `component()` for custom
   components. The quickest check of the model and layout rules.
3. **Email exporter for the slice** (`Email` and the same components), built against the Outlook
   renderer and the reference exporters.
4. **Existing components onto the new engine**, one at a time (can run alongside 5–7).
5. Lists and tables, in every target.
6. `Grid`, `Layer` and responsive `Page` layouts.
7. `Document.Page`, `PageHeader`, `PageFooter`, `PageNumber`; print HTML; `@unlayer/elements-pdf`.
8. `Canvas`, `Svg` and shapes; `@unlayer/elements-image`.
9. **Builder adapter**, last (Amendment 7): both ways, with the prop mappings, the merge with `base` and
   the real-builder round trip, for the final API and components.

The release notes of each step list the matrix cells still unsupported.

## Open questions

- **Does the editor adopt these exporters?** Until it does, a design exported from the builder and the
  same design rendered by Elements have different markup (the content check keeps them equal in what
  a reader gets).
- **Builder fields and editors to add**, so props move into the builder: the coverage reports show
  which matter. Each is a change in the editor repo (a hidden option and its rendering first, an
  editor later).
- **React Email's `Section`** in the converters: a `Section` here when its background spans the
  window, a `Column` otherwise.
- **Shared styles** (named styles or tokens a document reuses): not in v1.
- **Licence of the client-support data** used to seed email support.
- **Fonts for PDF and image output**: which faces ship as defaults, and how `fonts` URLs are fetched
  where there's no network.
