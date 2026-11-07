---
"title": "Svg"
"group": "Blocks"
"order": 10
"summary": "Shapes (Rect, Circle, Ellipse, Line, Polygon, Path) drawn in a box of its own: its width and height, and the coordinates its viewBox gives them."
---

Shapes (Rect, Circle, Ellipse, Line, Polygon, Path) drawn in a box of its own: its width and height, and the coordinates its viewBox gives them.

Holds: Rect, Circle, Ellipse, Line, Polygon, Path. Drawn in: page.

Props:
- `width`: a number from 0 (required)
- `height`: a number from 0 (required)
- `viewBox`: text. The shapes' coordinates in it, as "x y width height" (its width and height by default).
- `title`: text. What it shows, read out by screen readers.

`style`:
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `padding`, `border`.
