---
"title": "TableRow"
"group": "Parts"
"order": 32
"summary": "A row of a Table. A header row's cells are header cells, in bold."
---

A row of a Table. A header row's cells are header cells, in bold.

Holds: TableCell. Drawn in: email, page.

Props:
- `header`: true or false (default `false`). Its cells head the columns below them.
- `footer`: true or false (default `false`). It ends the table (printed, on each page the table runs to).

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
- `backgroundColor`: *color*
- `height`: a length (a number of px)

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`.
