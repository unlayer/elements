---
"title": "TableCell"
"group": "Parts"
"order": 33
"summary": "A cell of a TableRow: text, and images. Its width sets its column's."
---

A cell of a TableRow: text, and images. Its width sets its column's.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, Image. Drawn in: email, page.

Props:
- `colSpan`: an integer from 1 (default `1`). How many columns it spans.
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

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
- `textDecoration`: one of "none", "underline", "line-through"
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `width`: a length (a number of px, %). Its column's width (of a cell spanning one column).
- `verticalAlign`: one of "top", "middle", "bottom"

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `padding`, `border`.
