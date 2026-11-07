---
"title": "Menu"
"group": "Blocks"
"order": 20
"summary": "A line of links (a site's sections, a footer's), onto more lines where they don't fit, with a separator between them on desktop; or links down a column."
---

A line of links (a site's sections, a footer's), onto more lines where they don't fit, with a separator between them on desktop; or links down a column.

Holds: nothing. Drawn in: email, page.

Props:
- `items`: a list of items, each { text, href } (required). Each link's text and where it goes.
- `separator`: text (default `""`). Between the links of a horizontal menu ("|", "·"), on desktop: phones show none.
- `layout`: one of "horizontal", "vertical" (default `"horizontal"`)

`style`:
- `color`: *color* (default `"#0068A5"`, inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (default `14`, inherited)
- `fontWeight`: *fontWeight* (inherited)
- `lineHeight`: *lineHeight* (default `1.2`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `separatorColor`: *color* (default `"#444444"`)
- `padding`: *insets* (default `{"top":5,"right":15,"bottom":5,"left":15}`). Around each link: its sides are the space between them.
- `justifyContent`: one of "start", "center", "end" (default `"center"`). Where the links sit.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`.
