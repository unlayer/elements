# @unlayer/react-elements

## 0.3.0

### ⚠️ Breaking: every 0.2 template has to migrate

The old syntax is removed, not deprecated, and there's no compatibility mode. A name that still exists doesn't mean
the code still works: `<Email>` is still there, but `<Email containerPadding={20}>` isn't, and neither is
`renderToHtml()`. **Stay on 0.2 until you've migrated.** A range like `^0.2.1` doesn't install 0.3.0; `>=0.2`, `0.x`
or `*` does.

**To upgrade:** run `npx @unlayer/migrate src/emails --from elements`. It lists what it would change; `--write`
replaces the templates (only those git can restore). It rewrites the imports and the JSX and keeps props, loops and
conditions; what it can't move is listed, and that file is left as it was to rewrite by hand.

| 0.2 | 0.3 |
|---|---|
| `renderToHtml(element)` | `const { html } = await render(element)` |
| `renderToPlainText(element)` | `const { text } = await render(element)` |
| `renderToJson(element)` | `const { design } = toDesign(element)`, from `@unlayer/react-elements/builder` |
| `<Row layout="TwoEqual">`, `ColumnLayouts` | A `Row` of `Column`s |
| Styles as props (`backgroundColor="#000"`, `containerPadding`) | `style={{ backgroundColor: "#000" }}`, on the component they belong to |
| `headingType`, `altText` | `level`, `alt` |
| `<Text>` | `<Paragraph>` |

Also gone: `Body`, `UnlayerProvider`, `renderToHtmlParts` and the `values` prop. Designs saved in the builder aren't
affected: `fromDesign()` reads them, the older text tool's blocks included.

### What's new

A template has one root (`Email`, `Page`, `Document` or `Canvas`), its styles go in `style={{ }}`, and
`await render(element)` writes its HTML and plain text.

- New: the components, each with typed props and styles: `Section`, `Row`, `Column`, `Grid`, `Heading`, `Paragraph`,
  `Span`, `Link`, `List`, `Button`, `Image`, `Divider`, `Menu`, `Social`, `Video`, `Table`, `Html`, page
  headers, footers and numbers for a `Document`, and shapes for a `Canvas`. `component()` and `prop()` make your own.
- New: `validate()` and `outline()` check a template without rendering it; `render()` returns its diagnostics.
- New: `Html`, markup written as it is (the builder's HTML block), given as `html` or as JSX in it.
- New: `@unlayer/react-elements/builder`, `toDesign()` and `fromDesign()`, a template to the Unlayer builder's design
  JSON and back. What a text block's tool has no field for is drawn in the style of its own paragraph, and what else
  a tool has no field for is kept in the design as a hidden property of it; what the builder can't arrange comes back
  with the same look, flatter. `fromDesign()` takes a `toSafeHtml` for a
  design's markup.
- PDF and images: `@unlayer/react-elements/pdf` and `@unlayer/react-elements/image` write a `Document` as a PDF and
  a `Canvas` as a PNG or SVG, on the server, without a browser. Their engines (`@react-pdf/renderer`; `satori` and
  `@resvg/resvg-js`) are optional peer dependencies: install the ones you use. The main entry loads none.
- The package has no dependencies of its own (React is a peer): `@unlayer/exporters` and `@unlayer/types` are gone.
- Types for the main entry and `/builder` resolve under `moduleResolution: "node"` too.
- Docs: the READMEs, guides, examples and Storybook show the new components.

## 0.1.0

- Initial release
- React components for building emails, pages, and documents
- Server-side rendering support (Node.js, Next.js Server Components)
- Dependencies: @unlayer/exporters, @unlayer/types
