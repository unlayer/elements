---
"title": "List"
"group": "Blocks"
"order": 16
"summary": "A bulleted or numbered list of ListItems. Its markers sit in a column of their own (indent) before the items."
---

A bulleted or numbered list of ListItems. Its markers sit in a column of their own (indent) before the items.

Holds: ListItem. Drawn in: email, page.

Props:
- `type`: one of "bullet", "number" (default `"bullet"`)
- `start`: an integer from 0 (default `1`). The first item's number, in a numbered list.

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
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `gap`: a length (a number of px). Space between items.
- `indent`: a length (a number of px) (default `24`). The width of the markers' column, before the items.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `gap`.
