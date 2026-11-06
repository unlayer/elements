# @unlayer/react-elements

## 0.3.0

**Breaking: the package is the new components.** `@unlayer/react-elements` exports the components that were a preview:
a template has one root (`Email`, `Page`, `Document` or `Canvas`), its styles go in `style={{ }}`, and
`await render(element)` writes its HTML and plain text. Elements 0.2's components and functions are gone: `Body`,
`ColumnLayouts`, `UnlayerProvider`, `renderToHtml`, `renderToHtmlParts`, `renderToJson`, `renderToPlainText`, and
the `values`, `layout` and style props they took.

**To upgrade a 0.2 project:** run `npx @unlayer/migrate src/emails --from elements`. It lists what it would change;
`--write` replaces the templates (only those git can restore). It rewrites the imports and the JSX and keeps props,
loops and conditions; what it can't move is listed, and that file is left as it was to rewrite by hand. A range like
`^0.2.1` doesn't install 0.3.0; `>=0.2`, `0.x` or `*` does.

- New: the components, each with typed props and styles: `Section`, `Row`, `Column`, `Grid`, `Heading`, `Paragraph`,
  `Span`, `Link`, `List`, `Button`, `Image`, `Divider`, `Menu`, `Social`, `Video`, `Table`, `Html`, page
  headers, footers and numbers for a `Document`, and shapes for a `Canvas`. `component()` and `prop()` make your own.
- New: `validate()` and `outline()` check a template without rendering it; `render()` returns its diagnostics.
- New: `Html`, markup written as it is (the builder's HTML block), given as `html` or as JSX in it.
- New: `@unlayer/react-elements/builder`, `toDesign()` and `fromDesign()`, a template to the Unlayer builder's design
  JSON and back. What a builder tool has no field for is kept in the design as a hidden property of that tool; what
  the builder can't arrange comes back with the same look, flatter. `fromDesign()` takes a `toSafeHtml` for a
  design's markup.
- PDF and images: `@unlayer/elements-pdf` and `@unlayer/elements-image` write a `Document` as a PDF and a `Canvas` as
  a PNG.
- The package has no dependencies of its own (React is a peer): `@unlayer/exporters` and `@unlayer/types` are gone.
- Types for the main entry and `/builder` resolve under `moduleResolution: "node"` too.
- Docs: the READMEs, guides, examples and Storybook show the new components.

## 0.1.0

- Initial release
- React components for building emails, pages, and documents
- Server-side rendering support (Node.js, Next.js Server Components)
- Dependencies: @unlayer/exporters, @unlayer/types
