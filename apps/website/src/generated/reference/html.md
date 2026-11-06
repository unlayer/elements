---
"title": "Html"
"group": "Blocks"
"order": 21
"summary": "Markup written as it is, for what no component says (the builder's HTML block): in an email and on a page as given, nothing in it checked or escaped. A Document's PDF and a Canvas's image draw its plain text."
---

Markup written as it is, for what no component says (the builder's HTML block): in an email and on a page as given, nothing in it checked or escaped. A Document's PDF and a Canvas's image draw its plain text.

Holds: nothing. Drawn in: email, page.

Props:
- `html`: text (required). The markup, written as it is: only markup you trust. Or give it as JSX inside the block, which React writes.
- `text`: text. What it reads as in the plain-text version, and in a PDF or an image (its markup's words where there's none).
