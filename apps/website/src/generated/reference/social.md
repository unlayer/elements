---
"title": "Social"
"group": "Blocks"
"order": 19
"summary": "Links to social profiles: a line of the networks' icons, each linked to its profile."
---

Links to social profiles: a line of the networks' icons, each linked to its profile.

Holds: nothing. Drawn in: email, page.

Props:
- `icons`: a list of icons, each { name, href } (required). Each network by name ("Instagram", "LinkedIn") and the link to its profile.
- `iconType`: one of "circle", "rounded", "squared" (default `"circle"`)
- `size`: an integer from 1 (default `32`). Each icon's width and height, in px.

`style`:
- `gap`: a length (a number of px) (default `5`). Space between children.
- `justifyContent`: one of "start", "center", "end" (default `"center"`). Where the icons sit across the line.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `gap`.
