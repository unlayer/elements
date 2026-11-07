---
"title": "Layer"
"group": "Sections and layout"
"order": 9
"summary": "Its children over each other, in one box as tall as the tallest: an image with words on it. In an email, an Image with one child over it."
---

Its children over each other, in one box as tall as the tallest: an image with words on it. In an email, an Image with one child over it.

Holds: Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: email, page.

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
- `minWidth`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `height`: a length (a number of px). Its height: the image under its children covers it, cut at its sides or its top and bottom.
- `alignItems`: one of "start", "center", "end", "stretch" (default `"start"`). Where its children sit in its height, as CSS align-items.
- `justifyItems`: one of "start", "center", "end", "stretch" (default `"stretch"`). Where its children sit across its width, as CSS justify-items: stretched to it by default.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `border`.
