# @unlayer/react-elements

## 0.3.0

- Today's components render entirely through Elements' own open-source writers. `@unlayer/exporters` is no longer
  a dependency, and nothing falls back to it. Templates and the render functions don't change. Content, links
  and images are preserved, and they draw as the editor's export does; the HTML may change; input that can't be drawn gets a diagnostic (a console
  warning), never silent loss. A few small differences from 0.2.1 are listed here, each with its reason. It was
  checked against the published 0.2.1 in Chromium. The new output is checked in Chromium and against a model of
  Outlook, not in real Outlook.
- New errors: `renderToHtml`, `renderToHtmlParts` and `renderToPlainText` throw, saying what to do, where 0.2.1
  wrote something anyway:
  - a `<div>` as the root, or a component returning plain markup (put it in an `<Html>` block);
  - a root inside markup, or two roots;
  - more than 20 wrappers around the root;
  - a root from a copy older than 0.3 (a duplicate install, which `npm ls @unlayer/react-elements` shows).
- Fixed: an email whose rows have side padding no longer sits off centre and scrolls sideways in a window
  narrower than its content plus that padding.
- Fixed: a word too long for its column wraps inside it, where 0.2.1's page let it run out of the column.
- Fixed: a Row placed in a Column stays in its box and its blocks' phone settings apply; 0.2.1 lost those
  settings, and in an email ran it 20px past its box. A bare Column among an email's rows stacks to the window on
  a phone, where 0.2.1's was 500px wide and scrolled sideways.
- Changed: a page and a printed document are drawn as the editor's: no 8px margin around them, text at its 14px where
  0.2.1's was 16px, every box's padding inside its width (so a Button of 300px is 300px, where 0.2.1's was 340px), and
  paragraphs in your own markup with no margins. A printed document has its `documentMargin` on a screen, not in print.
  In `renderToHtmlParts`, these stay inside the template's own markup, and leave the page around it as it is.
- New: a font the editor knows by name (Montserrat, Lato, Open Sans, Source Sans Pro and others) is loaded from Google
  Fonts, as the editor's export loads it, where 0.2.1's fell back to the next font in the stack.
- Changed: a font weight that isn't a hundred (650) draws at the nearest hundred, with a warning: the new writers'
  weights are in hundreds.
- Changed: an image whose phone width can't be read keeps its place, with a warning. 0.2.1 let it run past the
  window, which scrolled sideways.
- Changed: plain text keeps an email service's tag, so the service still fills it in: `Hi <%= name %>, you have
  items`, where 0.2.1 wrote `Hi , you have items`. A heading's keeps a tag as written, where 0.2.1 uppercased it
  with the words.
- Fixed: a Button or Menu link holding a service tag no longer leaks markup into an email's plain text.
- Changed: `onClick` on a link isn't written (a warning says so).
- Changed: a `javascript:` link on an image or a Button becomes a link to nothing, with a warning.
- Changed: an image is as wide as its place leaves it, less its block's padding, as in the editor. 0.2.1's was up to
  20px wider and ran into that padding, which also made its email or page taller (a column of 600 with 10px of padding
  has an image of 580, where 0.2.1 wrote 600). A video's thumbnail too.
- Changed: an image whose file is large enough to fill a column on its own fills its place on phones, as in the
  editor. A smaller file isn't stretched, and a width set for phones stays.
- Fixed: a template's link color and underline apply to every link that doesn't set its own, as in the editor. 0.2.1
  drew them all in the browser's blue.
- Changed: an email has the editor's document: its XHTML doctype, the VML namespace, `X-UA-Compatible`,
  `-webkit-text-size-adjust`, and a table of the content's width for classic Outlook.
- Changed: tables in an email collapse their borders, as the editor's stylesheet has them, so a table in your own
  markup (an `Html` block, a custom tool) loses its `cellspacing` or default 2px spacing. To keep it, write
  `border-collapse: separate` on that table.
- Changed: the ids and classes 0.2.1 generated for its own markup (`#u_row_1`, `#u_content_button_1`, `.u-row`,
  `.v-color`, `.v-button`) aren't written, so CSS that selects them no longer matches. Ids and classes you set in
  a block's or row's `_meta`, and a custom tool's `u_content_custom_<slug>_<n>` id and class, are kept.
- New, as a preview of the next major version: `@unlayer/react-elements/primitives`, the new components, with
  `render()` and `validate()`. Today's API is also at `@unlayer/react-elements/legacy`.
- New in `/primitives`: `Html`, markup written as it is (the builder's HTML block); a PDF and an image draw its
  plain text.
- New, with `/primitives`: `@unlayer/react-elements/builder`, `toDesign()` and `fromDesign()`, a template to the
  Unlayer builder's design JSON and back. What a builder tool has no field for is kept in the design as a hidden
  property of that tool; what the builder can't arrange comes back with the same look, flatter. `fromDesign()`
  takes a `toSafeHtml` for a design's markup, as today's components do.
- Types for `/primitives`, `/builder` and `/legacy` resolve under `moduleResolution: "node"` too.

## 0.1.0

- Initial release
- React components for building emails, pages, and documents
- Server-side rendering support (Node.js, Next.js Server Components)
- Dependencies: @unlayer/exporters, @unlayer/types
