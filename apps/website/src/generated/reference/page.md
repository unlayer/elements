---
"title": "Page"
"group": "Roots"
"order": 2
"summary": "A web page. Its children are stacked down the content width, centered in the window."
---

A web page. Its children are stacked down the content width, centered in the window.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

Props:
- `width`: a length (a number of px) (default `1200`). The widest the content gets.
- `description`: text. The page's meta description.
- `title`: text. The document's title (shown in a browser tab, and by some email clients).
- `lang`: text. Its language, as a BCP 47 tag ("en", "ar").
- `dir`: one of "ltr", "rtl", "auto"
- `fonts`: *fontFaces*. The font files the template loads: a family's file for each weight and style it uses. Text names a family in its fontFamily stack, before the fonts to show where it can't load.

`style`:
- `color`: *color* (default `"#000000"`, inherited)
- `fontFamily`: *fontFamily* (default `"Arial, Helvetica, sans-serif"`, inherited)
- `fontSize`: a length (a number of px) (default `16`, inherited)
- `fontWeight`: *fontWeight* (default `400`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.5`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"left"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `backgroundColor`: *color*. The window's background, behind the content.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`.
