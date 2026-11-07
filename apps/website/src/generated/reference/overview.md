---
title: "Components"
group: "Overview"
order: -1
summary: "Every component, what it holds, and every prop and style it takes."
---

Every component, what it holds, and every prop and style it takes, with its default and what it does. [Templates and roots](/docs/templates) shows how a template is written; `validate()` checks one against what's here.

Every component also takes:

- `style={{ … }}`: the styles listed under it. A number is px (`padding: 16` is `16px`).
- `mobile={{ … }}`: style overrides on phones, in an `Email` or a `Page`, for the styles listed under "`mobile`".
- `hover={{ … }}`: styles on hover, for the ones listed under "`hover`".
- `hidden={{ mobile: true }}` or `hidden={{ desktop: true }}`: shown on one only.
- `id`: an id of your own, written into the HTML.


A template is one of these, and the root decides the output: `render()` writes an Email's HTML, a Page's HTML, and a Document's print HTML. `renderPdf()` (`@hyper-elements/react/pdf`) writes a Document's PDF, and `renderImage()` (`@hyper-elements/react/image`) a Canvas's PNG or SVG (`render()` writes a Canvas's HTML, to look at).


Bands and boxes that arrange blocks. None is required: a root stacks its children.


Content, stacked down whatever holds it.


Inside text: a styled run, a link, a line break, a merge tag.


Only inside the component named: a list's items, a table's rows and cells, a document's pages, header and footer.


Only inside an Svg, in its viewBox's units.
