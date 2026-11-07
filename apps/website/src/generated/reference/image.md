---
"title": "Image"
"group": "Blocks"
"order": 14
"summary": "An image in the content. Without a width it takes its own size, no wider than its parent."
---

An image in the content. Without a width it takes its own size, no wider than its parent.

Holds: nothing. Drawn in: email, page.

Props:
- `src`: *asset* (required)
- `alt`: text (default `""`). Read out by screen readers, and shown where images don't load.
- `title`: text. Shown as a tooltip by mail clients and browsers that show one.

`style`:
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `height`: a length (a number of px)
- `border`: *border*
- `borderRadius`: *radius*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.
- `alignSelf`: one of "start", "center", "end". Where it sits in its stack on phones, where that's another place than on desktop.
- `verticalAlign`: one of "top", "middle". Where it sits in a line of text it's in.

`mobile` (on phones): `width`, `maxWidth`, `border`, `alignSelf`.
