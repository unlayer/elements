---
"title": "Video"
"group": "Blocks"
"order": 18
"summary": "A YouTube or Vimeo video: its player on a page; in an email (which can't play one), its thumbnail, linked to it."
---

A YouTube or Vimeo video: its player on a page; in an email (which can't play one), its thumbnail, linked to it.

Holds: nothing. Drawn in: email, page.

Props:
- `src`: *video* (required). The video's YouTube or Vimeo link.
- `thumbnail`: *asset*. The image an email shows, linked to the video. A YouTube video's own where there's none; a Vimeo video's can't be found without the network.
- `title`: text (default `"Video"`). The player's title on a page, the thumbnail's alternate text in an email.

`style`:
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `width`, `maxWidth`.
