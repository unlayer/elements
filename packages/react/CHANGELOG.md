# @unlayer/react-elements

## 0.3.0

- Today's components render through Elements' own open-source writers instead of `@unlayer/exporters`.
  Templates and the render functions don't change, and neither does what a reader gets; the HTML does. What
  the new writers can't draw the same way yet keeps its 0.2 output.
- Fixed: an email whose rows have side padding no longer sits off centre and scrolls sideways in a window
  narrower than its content plus that padding.
- Fixed: a word too long for its column wraps inside it, on a page and in an email.
- New, as a preview of the next major version: `@unlayer/react-elements/primitives`, the new components, with
  `render()` and `validate()`. Today's API is also at `@unlayer/react-elements/legacy`.
- New in `/primitives`: `Html`, markup written as it is (the builder's HTML block); a PDF and an image draw its
  plain text.
- New, with `/primitives`: `@unlayer/react-elements/builder`, `toDesign()` and `fromDesign()`, a template to the
  Unlayer builder's design JSON and back. What a builder tool has no field for is kept in the design as a hidden
  property of that tool; what the builder can't arrange comes back with the same look, flatter.
- Types for `/primitives`, `/builder` and `/legacy` resolve under `moduleResolution: "node"` too.
- The main entry grows from about 31KB to about 96KB gzipped.

## 0.1.0

- Initial release
- React components for building emails, pages, and documents
- Server-side rendering support (Node.js, Next.js Server Components)
- Dependencies: @unlayer/exporters, @unlayer/types
