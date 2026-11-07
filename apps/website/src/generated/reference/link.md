---
"title": "Link"
"group": "Inline"
"order": 24
"summary": "A link: text inside text, or around an Image."
---

A link: text inside text, or around an Image.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, Image. Drawn in: email, page.

Props:
- `href`: *link* (required)
- `title`: text. Shown as a tooltip by mail clients and browsers that show one.
- `aria-label`: text. What a screen reader says for it, where its text alone doesn't say enough ("Read more about pricing").
- `attrs`: *attributes*. More attributes for it: a class, a `data-` attribute.

`style`:
- `color`: *color* (default `"#0000ee"`, inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (inherited)
- `fontWeight`: *fontWeight* (inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `textDecoration`: one of "none", "underline", "line-through" (default `"underline"`)
- `backgroundColor`: *color*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`hover`: `color`, `textDecoration`, `backgroundColor`.

`mobile` (on phones): `fontSize`, `letterSpacing`.
