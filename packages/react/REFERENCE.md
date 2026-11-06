# Components reference (`@unlayer/react-elements`)

<!-- Written from the component definitions by src/primitives/reference.ts: don't edit by hand. Regenerate with UPDATE_REFERENCE=1 pnpm --filter @unlayer/react-elements test reference -->

Every component, what it holds, and every prop and style it takes, with its default and what it does. [GUIDE.md](./GUIDE.md) shows how a template is written; `validate()` checks one against what's here.

Every component also takes:

- `style={{ … }}`: the styles listed under it. A number is px (`padding: 16` is `16px`).
- `mobile={{ … }}`: style overrides on phones, in an `Email` or a `Page`, for the styles listed under "`mobile`".
- `hover={{ … }}`: styles on hover, for the ones listed under "`hover`".
- `hidden={{ mobile: true }}` or `hidden={{ desktop: true }}`: shown on one only.
- `id`: an id of your own, written into the HTML.

## Values

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

## Roots

A template is one of these, and the root decides the output: `render()` writes an Email's HTML, a Page's HTML, and a Document's print HTML. `renderPdf()` (`@unlayer/react-elements/pdf`) writes a Document's PDF, and `renderImage()` (`@unlayer/react-elements/image`) a Canvas's PNG or SVG (`render()` writes a Canvas's HTML, to look at).

### Email

An email. Its children are stacked down the content width, centered in the window.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: email.

Props:
- `width`: a length (a number of px) (default `600`)
- `previewText`: text. Shown after the subject in inbox lists, not in the email.
- `title`: text. The document's title (shown in a browser tab, and by some email clients).
- `lang`: text. Its language, as a BCP 47 tag ("en", "ar").
- `dir`: one of "ltr", "rtl", "auto"
- `fonts`: *fontFaces*. The font files the template loads: a family's file for each weight and style it uses. Text names a family in its fontFamily stack, before the fonts to show where it can't load.

`style`:
- `color`: *color* (default `"#000000"`, inherited)
- `fontFamily`: *fontFamily* (default `"Arial, Helvetica, sans-serif"`, inherited)
- `fontSize`: a length (a number of px) (default `16`, inherited)
- `fontWeight`: *fontWeight* (default `400`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.5`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"left"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `backgroundColor`: *color*. The window's background, behind the content.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`.

### Page

A web page. Its children are stacked down the content width, centered in the window.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

Props:
- `width`: a length (a number of px) (default `1200`). The widest the content gets.
- `description`: text. The page's meta description.
- `title`: text. The document's title (shown in a browser tab, and by some email clients).
- `lang`: text. Its language, as a BCP 47 tag ("en", "ar").
- `dir`: one of "ltr", "rtl", "auto"
- `fonts`: *fontFaces*. The font files the template loads: a family's file for each weight and style it uses. Text names a family in its fontFamily stack, before the fonts to show where it can't load.

`style`:
- `color`: *color* (default `"#000000"`, inherited)
- `fontFamily`: *fontFamily* (default `"Arial, Helvetica, sans-serif"`, inherited)
- `fontSize`: a length (a number of px) (default `16`, inherited)
- `fontWeight`: *fontWeight* (default `400`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.5`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"left"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `backgroundColor`: *color*. The window's background, behind the content.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`.

### Document

A printed document: its children on pages of its size (Document.Page, or split by PageBreaks), a PageHeader and a PageFooter on each. Renders to print HTML, and to PDF with @unlayer/react-elements/pdf.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html, Document.Page, PageBreak, PageHeader, PageFooter. Drawn in: page.

Props:
- `size`: one of "A3", "A4", "A5", "Letter", "Legal", "Tabloid" (default `"A4"`)
- `orientation`: one of "portrait", "landscape" (default `"portrait"`)
- `margin`: *insets* (default `{"top":48,"right":48,"bottom":48,"left":48}`). Around each page's content (its header and footer too), in px: 96 to the inch.
- `title`: text. The document's title (shown in a browser tab, and by some email clients).
- `lang`: text. Its language, as a BCP 47 tag ("en", "ar").
- `dir`: one of "ltr", "rtl", "auto"
- `fonts`: *fontFaces*. The font files the template loads: a family's file for each weight and style it uses. Text names a family in its fontFamily stack, before the fonts to show where it can't load.

`style`:
- `color`: *color* (default `"#000000"`, inherited)
- `fontFamily`: *fontFamily* (default `"Arial, Helvetica, sans-serif"`, inherited)
- `fontSize`: a length (a number of px) (default `16`, inherited)
- `fontWeight`: *fontWeight* (default `400`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.5`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"left"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `backgroundColor`: *color*. Each page's background, out to its edges.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`.

### Canvas

An image of a fixed size (a social card, a banner): its children laid out in it as on a page. Written as PNG or SVG with @unlayer/react-elements/image.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

Props:
- `width`: a length (a number of px) (default `1200`). The image's width, in px.
- `height`: a length (a number of px) (default `630`). The image's height, in px: what's past it is cut.
- `title`: text. The document's title (shown in a browser tab, and by some email clients).
- `lang`: text. Its language, as a BCP 47 tag ("en", "ar").
- `dir`: one of "ltr", "rtl", "auto"
- `fonts`: *fontFaces*. The font files the template loads: a family's file for each weight and style it uses. Text names a family in its fontFamily stack, before the fonts to show where it can't load.

`style`:
- `color`: *color* (default `"#000000"`, inherited)
- `fontFamily`: *fontFamily* (default `"Arial, Helvetica, sans-serif"`, inherited)
- `fontSize`: a length (a number of px) (default `16`, inherited)
- `fontWeight`: *fontWeight* (default `400`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.5`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (default `"left"`, inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `backgroundColor`: *color*. The window's background, behind the content.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.
- `padding`: *insets*
- `justifyContent`: one of "start", "center", "end", "space-between". Where children sit along the layout's direction, as CSS justify-content.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`, `padding`.

## Sections and layout

Bands and boxes that arrange blocks. None is required: a root stacks its children.

### Section

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

### Row

Lays its children out side by side. A child takes its width, or a share of what's left (its flex, 1 by default).

Holds: Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: email, page.

Props:
- `stackOnMobile`: true or false (default `true`). Its children stack full-width on phones (in an Email or a Page).
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

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
- `flexWrap`: one of "nowrap", "wrap", "words". "wrap": children that don't fit wrap onto another line, as CSS flex-wrap (in an email, in a Row kept side by side on phones, with no gap between the lines). "words": in an email, also a space of the text's font apart, on lines at least as tall as its, as words are.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `gap`.

### Column

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

### Grid

Its children in columns of equal width, row after row; on phones, one under another.

Holds: Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: email, page.

Props:
- `columns`: an integer from 1 to 12 (default `2`). How many children to a row.
- `stackOnMobile`: true or false (default `true`). Its children one under another on phones (in an Email or a Page).

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
- `gap`: a length (a number of px). Space between its children, across and down (unless rowGap is set).
- `rowGap`: a length (a number of px). Space between its rows (gap by default); on phones, where the children stack, gap is between them.
- `alignItems`: one of "start", "center", "end", "stretch". Where each child sits in its row's height, as CSS align-items.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `gap`, `rowGap`.

### Layer

Its children over each other, in one box as tall as the tallest: an image with words on it. In an email, an Image with one child over it.

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
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `height`: a length (a number of px). Its height: the image under its children covers it, cut at its sides or its top and bottom.
- `alignItems`: one of "start", "center", "end", "stretch" (default `"start"`). Where its children sit in its height, as CSS align-items.
- `justifyItems`: one of "start", "center", "end", "stretch" (default `"stretch"`). Where its children sit across its width, as CSS justify-items: stretched to it by default.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `border`.

## Blocks

Content, stacked down whatever holds it.

### Svg

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

### Text

A paragraph of text.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, Image. Drawn in: email, page.

Props:
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

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
- `textDecoration`: one of "none", "underline", "line-through"
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`.

### Heading

A heading, from level 1 (the page's title) to 6.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag. Drawn in: email, page.

Props:
- `level`: one of 1, 2, 3, 4, 5, 6 (default `1`)
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

`style`:
- `color`: *color* (inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (inherited)
- `fontWeight`: *fontWeight* (default `700`, inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `lineHeight`: *lineHeight* (default `1.25`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textAlign`: one of "left", "center", "right", "justify" (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `textDecoration`: one of "none", "underline", "line-through"
- `width`: a length (a number of px, %)
- `maxWidth`: a length (a number of px, %)
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `borderRadius`: *radius*
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`.

### Button

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

### Image

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

### Divider

A horizontal line.

Holds: nothing. Drawn in: email, page.

`style`:
- `borderTop`: *line* (default `{"width":1,"style":"solid","color":"#bbbbbb"}`). The line, as CSS border-top: "1px solid #bbbbbb".
- `width`: a length (a number of px, %) (default `"100%"`)
- `padding`: *insets*

`mobile` (on phones): `width`, `padding`.

### List

A bulleted or numbered list of ListItems. Its markers sit in a column of their own (indent) before the items.

Holds: ListItem. Drawn in: email, page.

Props:
- `type`: one of "bullet", "number" (default `"bullet"`)
- `start`: an integer from 0 (default `1`). The first item's number, in a numbered list.

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
- `maxWidth`: a length (a number of px, %)
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `gap`: a length (a number of px). Space between items.
- `indent`: a length (a number of px) (default `24`). The width of the markers' column, before the items.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `padding`, `border`, `gap`.

### Table

A table of data: TableRows of TableCells. Columns take their cells' widths; the rest share what's left.

Holds: TableRow. Drawn in: email, page.

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
- `maxWidth`: a length (a number of px, %)
- `backgroundColor`: *color*
- `border`: *border*
- `cellPadding`: *insets*. Every cell's padding, where the cell doesn't set its own.
- `rowBorder`: *line*
- `borderCollapse`: one of "separate", "collapse". Whether cells side by side draw a border each (separate) or share one (collapse).
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `width`, `maxWidth`, `border`.

### Video

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

### Social

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

### Menu

A line of links (a site's sections, a footer's), onto more lines where they don't fit, with a separator between them on desktop; or links down a column.

Holds: nothing. Drawn in: email, page.

Props:
- `items`: a list of items, each { text, href } (required). Each link's text and where it goes.
- `separator`: text (default `""`). Between the links of a horizontal menu ("|", "·"), on desktop: phones show none.
- `layout`: one of "horizontal", "vertical" (default `"horizontal"`)

`style`:
- `color`: *color* (default `"#0068A5"`, inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (default `14`, inherited)
- `fontWeight`: *fontWeight* (inherited)
- `lineHeight`: *lineHeight* (default `1.2`, inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `separatorColor`: *color* (default `"#444444"`)
- `padding`: *insets* (default `{"top":5,"right":15,"bottom":5,"left":15}`). Around each link: its sides are the space between them.
- `justifyContent`: one of "start", "center", "end" (default `"center"`). Where the links sit.
- `flex`: *flex*. In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`.

### Html

Markup written as it is, for what no component says (the builder's HTML block): in an email and on a page as given, nothing in it checked or escaped. A Document's PDF and a Canvas's image draw its plain text.

Holds: nothing. Drawn in: email, page.

Props:
- `html`: text (required). The markup, written as it is: only markup you trust. Or give it as JSX inside the block, which React writes.
- `text`: text. What it reads as in the plain-text version, and in a PDF or an image (its markup's words where there's none).

## Inline

Inside text: a styled run, a link, a line break, a merge tag.

### PageNumber

In a Document's text: the number of the page it's on, or (total) how many pages there are.

Holds: nothing. Drawn in: page.

Props:
- `total`: true or false (default `false`). How many pages the Document has, instead of this page's number.

### Span

Styled text inside text; raised or lowered (superscript, subscript) with verticalAlign.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag. Drawn in: email, page.

`style`:
- `color`: *color* (inherited)
- `fontFamily`: *fontFamily* (inherited)
- `fontSize`: a length (a number of px) (inherited)
- `fontWeight`: *fontWeight* (inherited)
- `fontStyle`: one of "normal", "italic" (inherited)
- `letterSpacing`: a length (a number of px) (inherited)
- `textTransform`: one of "none", "uppercase", "lowercase", "capitalize" (inherited)
- `textDecoration`: one of "none", "underline", "line-through"
- `backgroundColor`: *color*
- `verticalAlign`: one of "baseline", "super", "sub". "super": superscript (®, a footnote mark); "sub": subscript; as CSS vertical-align.

`mobile` (on phones): `fontSize`, `letterSpacing`.

### Link

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

### LineBreak

Starts a new line inside text.

Holds: nothing. Drawn in: email, page.

### MergeTag

A value the sending service fills in (a name, a link), written in the service's own syntax.

Holds: nothing. Drawn in: email, page.

Props:
- `name`: text (required)

## Parts

Only inside the component named: a list's items, a table's rows and cells, a document's pages, header and footer.

### Document.Page

One page of a Document (Document.Page in JSX): its children stacked down it, inside the Document's margins.

Holds: Section, Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

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
- `backgroundColor`: *color*. The page's background, out to its edges.
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `gap`.

### PageBreak

In a Document, where a page ends: what follows starts the next page.

Holds: nothing. Drawn in: page.

### PageHeader

In a Document: drawn at the top of every page, inside its margins.

Holds: Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

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
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `padding`, `border`, `gap`.

### PageFooter

In a Document: drawn at the bottom of every page, inside its margins.

Holds: Row, Column, Grid, Layer, Svg, Text, Heading, Link, Button, Image, Divider, List, Table, Video, Social, Menu, Html. Drawn in: page.

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
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `gap`: a length (a number of px). Space between children.
- `alignItems`: one of "start", "center", "end", "stretch". Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items. Across a Column it places what has its own size (a Button, an Image, an Svg, a box with a width); a block of text fills the width, so its words move with its textAlign.

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `padding`, `border`, `gap`.

### ListItem

An item of a List: text, and a List of its own to nest one.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, List. Drawn in: email, page.

Props:
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

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
- `textDecoration`: one of "none", "underline", "line-through"

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`.

### TableRow

A row of a Table. A header row's cells are header cells, in bold.

Holds: TableCell. Drawn in: email, page.

Props:
- `header`: true or false (default `false`). Its cells head the columns below them.
- `footer`: true or false (default `false`). It ends the table (printed, on each page the table runs to).

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
- `height`: a length (a number of px)

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`.

### TableCell

A cell of a TableRow: text, and images. Its width sets its column's.

Holds: text; PageNumber, Span, Link, LineBreak, MergeTag, Image. Drawn in: email, page.

Props:
- `colSpan`: an integer from 1 (default `1`). How many columns it spans.
- `dir`: one of "ltr", "rtl", "auto". Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise.

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
- `textDecoration`: one of "none", "underline", "line-through"
- `padding`: *insets*
- `backgroundColor`: *color*
- `border`: *border*
- `width`: a length (a number of px, %). Its column's width (of a cell spanning one column).
- `verticalAlign`: one of "top", "middle", "bottom"

`mobile` (on phones): `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `padding`, `border`.

## Shapes

Only inside an Svg, in its viewBox's units.

### Rect

A rectangle at x, y in its Svg, rounded by rx.

Holds: nothing. Drawn in: page.

Props:
- `x`: a number (default `0`)
- `y`: a number (default `0`)
- `width`: a number from 0 (required)
- `height`: a number from 0 (required)
- `rx`: a number from 0

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1

### Circle

A circle centered at cx, cy in its Svg.

Holds: nothing. Drawn in: page.

Props:
- `cx`: a number (default `0`)
- `cy`: a number (default `0`)
- `r`: a number from 0 (required)

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1

### Ellipse

An ellipse centered at cx, cy in its Svg.

Holds: nothing. Drawn in: page.

Props:
- `cx`: a number (default `0`)
- `cy`: a number (default `0`)
- `rx`: a number from 0 (required)
- `ry`: a number from 0 (required)

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1

### Line

A straight line from x1, y1 to x2, y2 in its Svg (drawn by its stroke).

Holds: nothing. Drawn in: page.

Props:
- `x1`: a number (default `0`)
- `y1`: a number (default `0`)
- `x2`: a number (default `0`)
- `y2`: a number (default `0`)

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1

### Polygon

A closed shape through its points ("0,0 40,0 20,30"), in its Svg.

Holds: nothing. Drawn in: page.

Props:
- `points`: text (required)

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1

### Path

A shape drawn by an SVG path (d), in its Svg.

Holds: nothing. Drawn in: page.

Props:
- `d`: text (required). SVG path data ("M0 0 L40 0 L20 30 Z").

`style`:
- `fill`: *color* (default `"#000000"`). Its inside ("transparent" for none).
- `stroke`: *color*. Its outline's color.
- `strokeWidth`: a number from 0
- `opacity`: a number from 0 to 1
