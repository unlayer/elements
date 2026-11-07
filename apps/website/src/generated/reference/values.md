---
"title": "Values"
"group": "Reference"
"order": 0
"summary": "What a property takes, where it says *kind*:"
---

What a property takes, where it says *kind*:

- *fontFaces*: a list of { family, src, format, weight, style }
- *color*: a color ("#0879a1", "rgb(…)", "rgba(…)" or a CSS name)
- *fontFamily*: a font stack, as CSS writes it ("Inter, Arial, sans-serif")
- *fontWeight*: 100 to 900 in hundreds, "normal" or "bold"
- *lineHeight*: a multiple of the font size (1.5), a percentage ("150%"), px ("24px") or "normal" (the font's own)
- *insets*: px for all sides, "8px 16px" (1 to 4 values), [v, h] or [t, r, b, l], or { top, right, bottom, left }
- *border*: "1px solid #ccc", { width, style, color } for all sides, or { top, right, bottom, left } with one of those each
- *radius*: px for every corner, [topLeft, topRight, bottomRight, bottomLeft], or { topLeft, topRight, bottomRight, bottomLeft }
- *flex*: a share of the free width (0 or more), or "none"
- *link*: a URL (http, https, mailto, tel, a path, or a merge tag) or { href, target }
- *attributes*: attributes by name, each a text value (no on… handlers, href or style)
- *asset*: an image URL (http, https or a data:image URI), or { src, width, height }
- *line*: "1px solid #ccc" or { width, style, color }
- *video*: a YouTube or Vimeo video's https link
