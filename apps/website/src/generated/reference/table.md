---
"title": "Table"
"group": "Blocks"
"order": 17
"summary": "A table of data: TableRows of TableCells. Columns take their cells' widths; the rest share what's left."
---

A table of data: TableRows of TableCells. Columns take their cells' widths; the rest share what's left.

Holds: TableRow. Drawn in: email, page.

`style`:
- `color`: *color* (inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (inherited)
- `fontWeight`: *fontWeight* (inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `backgroundColor`: *color*
- `border`: *border*
- `cellPadding`: *insets*. Every cell's padding, where the cell doesn't set its own.
- `rowBorder`: *line*
- `borderCollapse`: one of "separate", "collapse". Whether cells side by side draw a border each (separate) or share one (collapse).
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `border`.
