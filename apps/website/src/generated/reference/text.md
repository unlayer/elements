---
"title": "Text"
"group": "Blocks"
"order": 11
"summary": "A paragraph of text."
---

A paragraph of text.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, Image. Drawn in: email, page.

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
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`.
