---
"title": "Section"
"group": "Sections and layout"
"order": 5
"summary": "A band across the whole window, directly in an Email or Page: its background spans the window, its children are stacked at the content width."
---

A band across the whole window, directly in an Email or Page: its background spans the window, its children are stacked at the content width.

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
- `backgroundColor`: *color*
- `padding`: *insets*
- `border`: *border*
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `padding`, `border`, `gap`.
