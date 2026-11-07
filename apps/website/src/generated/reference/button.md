---
"title": "Button"
"group": "Blocks"
"order": 13
"summary": "A link drawn as a button."
---

A link drawn as a button.

Holds: text; Span, MergeTag, LineBreak. Drawn in: email, page.

Props:
- `href`: *link* (required)
- `title`: text. Shown as a tooltip by mail clients and browsers that show one.
- `aria-label`: text. What a screen reader says for it, where its text alone doesn't say enough ("Read more about pricing").
- `attrs`: *attributes*. More attributes for its link: a class, a `data-` attribute.

`style`:
- `color`: *color* (default `"#ffffff"`, inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (default `14`, inherited)
- `fontWeight`: *fontWeight* (inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.2`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"center"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `textDecoration`: one of "none", "underline", "line-through"
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `padding`: *insets* (default `{"top":10,"right":20,"bottom":10,"left":20}`)
- `backgroundColor`: *color* (default `"#0879a1"`)
- `border`: *border*
- `borderRadius`: *radius* (default `4`)
- `boxSizing`: one of "border-box", "content-box". Whether its width holds its padding and border (border-box), or they go on top of it (content-box).
- `alignSelf`: one of "start", "center", "end". Where it sits in its stack, whatever the stack's alignItems: on phones too, another place than on desktop.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`hover`: `color`, `backgroundColor`.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `alignSelf`.
