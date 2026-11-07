---
"title": "ListItem"
"group": "Parts"
"order": 31
"summary": "An item of a List: text, and a List of its own to nest one."
---

An item of a List: text, and a List of its own to nest one.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, List. Drawn in: email, page.

Props:
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

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`.
