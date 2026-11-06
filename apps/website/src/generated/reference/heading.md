---
"title": "Heading"
"group": "Blocks"
"order": 12
"summary": "A heading, from level 1 (the page's title) to 6."
---

A heading, from level 1 (the page's title) to 6.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag. Drawn in: email, page.

Props:
- `level`: one of 1, 2, 3, 4, 5, 6 (default `1`)
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

`style`:
- `color`: *color* (inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (inherited)
- `fontWeight`: *fontWeight* (default `700`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.25`, inherited)
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
