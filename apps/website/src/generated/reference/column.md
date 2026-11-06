---
"title": "Column"
"group": "Sections and layout"
"order": 7
"summary": "Stacks its children vertically, with its own spacing and box."
---

Stacks its children vertically, with its own spacing and box.

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
- `height`: a length (a number of px)
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `overflow`: one of "visible", "hidden". Whether content past a set height is cut off.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.
- `justifyContent`: one of "start", "center", "end", "space-between". Where children sit along the layout's direction, as CSS justify-content.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `gap`.
