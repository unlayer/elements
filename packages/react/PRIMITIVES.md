# Writing templates with the new components (`@unlayer/react-elements/primitives`)

<!-- Written from the component definitions by src/primitives/reference.ts: don't edit by hand. Regenerate with UPDATE_REFERENCE=1 pnpm --filter @unlayer/react-elements test reference -->

Everything needed to write a template, in short. Every prop's and style's details: [PRIMITIVES-REFERENCE.md](./PRIMITIVES-REFERENCE.md).

## How a template is written

- Import from `@unlayer/react-elements/primitives`. A template has one root: `Email`, `Page`, `Document` or `Canvas`.
- Styles go in `style={{ … }}`, never as props: `<Heading style={{ fontSize: 24, color: "#111827" }}>`. A number is px; `padding` takes `16`, `[12, 24]` or `"12px 24px"`. A box's text styles are inherited by what it holds.
- There are no margins: space between blocks is their parent's `gap` (`<Column style={{ gap: 16 }}>`), space inside a box its `padding`.
- A root, a `Section` and a `Column` stack their children. A `Row` puts its children side by side (each `Column` at its `style.width`, or an equal share) and stacks them on phones. `Grid columns={3}` makes rows of three. A `Section` is a band whose background spans the window; a `Column` with a background is a card.
- Text is components, not HTML: `Heading level={1}`, `Paragraph` and `Text` hold text; inside them `Span` styles a run, `Link href` links one, `LineBreak` breaks the line and `MergeTag name` writes a merge tag. No raw HTML (`<b>`, `<br>`, `<div>`) and no `html` prop.
- `Image src={{ src, width, height }}` (the file's size in px) with `alt`; `style.width` sets the size shown.
- Lists: `<List type="number">` of `ListItem`s. Tables: a `Table` of `TableRow`s (`header` on the first) of `TableCell`s, with `cellPadding` and `rowBorder` in the Table's `style`.
- Phones: `mobile={{ fontSize: 20 }}` (the styles listed under "Phones"), `hidden={{ mobile: true }}`. Hover: `hover={{ backgroundColor: "#374151" }}` (those under "Hover").
- `await render(element)` gives `{ html, text, diagnostics }`; a template with errors throws an `ElementsError` whose `diagnostics` give each problem's `code`, `message` and `path`. `validate(element)` runs the same checks without rendering. `outline(element)` prints the laid-out template (each block, its width, its text), to check the layout without reading the HTML.

## Common mistakes

Each of these made an agent's first try fail:

- `<Email backgroundColor="#fff">` → `<Email style={{ backgroundColor: "#fff" }}>`. Styles never go as props.
- `<Email style={{ width: 600, padding: 24 }}>` → `<Email width={600}>`, with the padding on a `Column` (a card) or a `Section` (a band) inside it. A root's width is a prop, and a root has no padding.
- `items={[{ text: "Home", link: "/" }]}` → `items={[{ text: "Home", href: "/" }]}`. A `Menu`'s items are `{ text, href }`, a `Social`'s icons `{ name, href }`.
- `style={{ marginBottom: 16 }}` → `gap: 16` on the parent. There are no margins.
- `ColumnLayouts`, `layout`, `headingType`, `altText`, `html` are the main import's props, not these: a `Row` of `Column`s, `level`, `alt`, and text as children.
- `<Image src="https://example.com/logo.png">` → `src={{ src: "https://example.com/logo.png", width: 240, height: 80 }}`, the file's size. Without it Outlook shows the image at its file's size, and Elements warns.

## A whole template

```tsx
import { Button, Column, Email, Heading, Image, Link, List, ListItem, MergeTag, Paragraph, Row, Span, Table, TableCell, TableRow, Text } from "@unlayer/react-elements/primitives";

export default function Receipt() {
  return (
    <Email previewText="Your Acme receipt" style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, Arial, sans-serif", gap: 16 }}>
      <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
      <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16, borderRadius: 8 }}>
        <Heading level={1} style={{ fontSize: 24 }} mobile={{ fontSize: 20 }}>
          Thanks for your order, <MergeTag name="first_name" />
        </Heading>
        <Paragraph>
          Order <Span style={{ fontWeight: 700 }}>#10482</Span> ships tomorrow. <Link href="https://example.com/orders/10482">Track it</Link>.
        </Paragraph>
        <Table style={{ cellPadding: [8, 0], rowBorder: "1px solid #e4e4e7" }}>
          <TableRow header>
            <TableCell>Item</TableCell>
            <TableCell style={{ textAlign: "right" }}>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Linen shirt</TableCell>
            <TableCell style={{ textAlign: "right" }}>$48.00</TableCell>
          </TableRow>
        </Table>
        <Row style={{ gap: 16 }}>
          <Column>
            <Text style={{ fontWeight: 700 }}>Shipping to</Text>
            <Text>Ada Lovelace, London</Text>
          </Column>
          <Column>
            <Text style={{ fontWeight: 700 }}>Next steps</Text>
            <List type="number">
              <ListItem>We pack it</ListItem>
              <ListItem>You track it</ListItem>
            </List>
          </Column>
        </Row>
        <Button href="https://example.com/orders/10482" style={{ backgroundColor: "#111827", borderRadius: 6 }} hover={{ backgroundColor: "#374151" }}>
          View your order
        </Button>
      </Column>
      <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Text>
    </Email>
  );
}
```

## Components

\* required. *text* styles: color, fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing, textAlign, textTransform. *box* styles: width, maxWidth, padding, backgroundColor, border, borderRadius.

### Roots

- **Email**: An email. Its children are stacked down the content width, centered in the window. Holds sections, layout, blocks. Props: width (a length (a number of px)), previewText (text), title (text), lang (text), dir (ltr|rtl|auto), fonts (fontFaces). Style: text, backgroundColor, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, gap.
- **Page**: A web page. Its children are stacked down the content width, centered in the window. Holds sections, layout, blocks. Props: width (a length (a number of px)), description (text), title (text), lang (text), dir (ltr|rtl|auto), fonts (fontFaces). Style: text, backgroundColor, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, gap.
- **Document**: A printed document: its children on pages of its size (Document.Page, or split by PageBreaks), a PageHeader and a PageFooter on each. Renders to print HTML, and to PDF with @unlayer/elements-pdf. Holds sections, layout, blocks, Document.Page, PageBreak, PageHeader, PageFooter. Props: size (A3|A4|A5|Letter|Legal|Tabloid), orientation (portrait|landscape), margin (insets), title (text), lang (text), dir (ltr|rtl|auto), fonts (fontFaces). Style: text, backgroundColor, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, gap.
- **Canvas**: An image of a fixed size (a social card, a banner): its children laid out in it as on a page. Written as PNG or SVG with @unlayer/elements-image. Holds sections, layout, blocks. Props: width (a length (a number of px)), height (a length (a number of px)), title (text), lang (text), dir (ltr|rtl|auto), fonts (fontFaces). Style: text, backgroundColor, gap, alignItems (start|center|end|stretch), padding, justifyContent (start|center|end|space-between). Phones: fontSize, lineHeight, letterSpacing, textAlign, gap, padding.

### Sections and layout

- **Section**: A band across the whole window, directly in an Email or Page: its background spans the window, its children are stacked at the content width. Holds layout, blocks. Style: text, backgroundColor, padding, border, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, padding, border, gap.
- **Row**: Lays its children out side by side. A child takes its width, or a share of what's left (its flex, 1 by default). Holds layout, blocks. Props: stackOnMobile (true or false), dir (ltr|rtl|auto). Style: text, box, minWidth, height, overflow (visible|hidden), gap, alignItems (start|center|end|stretch), justifyContent (start|center|end|space-between), flexWrap (nowrap|wrap|words), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border, gap.
- **Column**: Stacks its children vertically, with its own spacing and box. Holds layout, blocks. Style: text, box, minWidth, height, overflow (visible|hidden), gap, alignItems (start|center|end|stretch), justifyContent (start|center|end|space-between), breakAfter (page), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border, gap.
- **Grid**: Its children in columns of equal width, row after row; on phones, one under another. Holds layout, blocks. Props: columns (an integer from 1 to 12), stackOnMobile (true or false). Style: text, box, minWidth, height, overflow (visible|hidden), gap, rowGap, alignItems (start|center|end|stretch), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border, gap, rowGap.
- **Layer**: Its children over each other, in one box as tall as the tallest: an image with words on it. In an email, an Image with one child over it. Holds layout, blocks. Style: text, width, minWidth, maxWidth, backgroundColor, border, borderRadius, height, alignItems (start|center|end|stretch), justifyItems (start|center|end|stretch), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, border.

### Blocks

- **Svg**: Shapes (Rect, Circle, Ellipse, Line, Polygon, Path) drawn in a box of its own: its width and height, and the coordinates its viewBox gives them. Holds shapes. Props: width* (a number from 0), height* (a number from 0), viewBox (text), title (text). Style: padding, backgroundColor, border, borderRadius, flex. Phones: padding, border.
- **Text**: A block of text with no meaning of its own (a div). Holds text, inline, Image. Props: dir (ltr|rtl|auto). Style: text, box, textDecoration (none|underline|line-through), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border.
- **Paragraph**: A paragraph of text. Holds text, inline. Props: dir (ltr|rtl|auto). Style: text, box, textDecoration (none|underline|line-through), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border.
- **Heading**: A heading, from level 1 (the page's title) to 6. Holds text, inline. Props: level (1|2|3|4|5|6), dir (ltr|rtl|auto). Style: text, box, textDecoration (none|underline|line-through), flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border.
- **Button**: A link drawn as a button. Holds text, Span, MergeTag, LineBreak. Props: href* (link), title (text), aria-label (text). Style: text, box, textDecoration (none|underline|line-through), flex. Hover: color, backgroundColor. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border.
- **Image**: An image in the content. Without a width it takes its own size, no wider than its parent. Props: src* (asset), alt (text), title (text). Style: width, maxWidth, height, border, borderRadius, flex, alignSelf (start|center|end), verticalAlign (top|middle). Phones: width, maxWidth, border, alignSelf.
- **Divider**: A horizontal line. Style: borderTop, width, padding. Phones: width, padding.
- **List**: A bulleted or numbered list of ListItems. Its markers sit in a column of their own (indent) before the items. Holds ListItem. Props: type (bullet|number), start (an integer from 0). Style: text, width, maxWidth, padding, backgroundColor, border, gap, indent, flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, padding, border, gap.
- **Table**: A table of data: TableRows of TableCells. Columns take their cells' widths; the rest share what's left. Holds TableRow. Style: text, width, maxWidth, backgroundColor, border, cellPadding, rowBorder, flex. Phones: fontSize, lineHeight, letterSpacing, textAlign, width, maxWidth, border.
- **Video**: A YouTube or Vimeo video: its player on a page; in an email (which can't play one), its thumbnail, linked to it. Props: src* (video), thumbnail (asset), title (text). Style: width, maxWidth, flex. Phones: width, maxWidth.
- **Social**: Links to social profiles: a line of the networks' icons, each linked to its profile. Props: icons* (a list of icons, each { name, href }), iconType (circle|rounded|squared), size (an integer from 1). Style: gap, justifyContent (start|center|end), flex. Phones: gap.
- **Menu**: A line of links (a site's sections, a footer's), onto more lines where they don't fit, with a separator between them on desktop; or links down a column. Props: items* (a list of items, each { text, href }), separator (text), layout (horizontal|vertical). Style: color, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform (none|uppercase|lowercase|capitalize), separatorColor, padding, justifyContent (start|center|end), flex. Phones: fontSize, lineHeight, letterSpacing.
- **Html**: Markup written as it is, for what no component says (the builder's HTML block): in an email and on a page as given, nothing in it checked or escaped. A Document's PDF and a Canvas's image draw its plain text. Props: html* (text), text (text).

### Inline

- **PageNumber**: In a Document's text: the number of the page it's on, or (total) how many pages there are. Props: total (true or false).
- **Span**: Styled text inside text; raised or lowered (superscript, subscript) with verticalAlign. Holds text, inline. Style: color, fontFamily, fontSize, fontWeight, fontStyle (normal|italic), letterSpacing, textTransform (none|uppercase|lowercase|capitalize), textDecoration (none|underline|line-through), backgroundColor, verticalAlign (baseline|super|sub). Phones: fontSize, letterSpacing.
- **Link**: A link: text inside text, or around an Image. Holds text, inline, Image. Props: href* (link), title (text), aria-label (text), attrs (attributes). Style: color, fontFamily, fontSize, fontWeight, fontStyle (normal|italic), letterSpacing, textTransform (none|uppercase|lowercase|capitalize), textDecoration (none|underline|line-through), backgroundColor, flex. Hover: color, textDecoration, backgroundColor. Phones: fontSize, letterSpacing.
- **LineBreak**: Starts a new line inside text.
- **MergeTag**: A value the sending service fills in (a name, a link), written in the service's own syntax. Props: name* (text).

### Parts

- **Document.Page**: One page of a Document (Document.Page in JSX): its children stacked down it, inside the Document's margins. Holds sections, layout, blocks. Style: text, backgroundColor, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, gap.
- **PageBreak**: In a Document, where a page ends: what follows starts the next page.
- **PageHeader**: In a Document: drawn at the top of every page, inside its margins. Holds layout, blocks. Style: text, padding, backgroundColor, border, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, padding, border, gap.
- **PageFooter**: In a Document: drawn at the bottom of every page, inside its margins. Holds layout, blocks. Style: text, padding, backgroundColor, border, gap, alignItems (start|center|end|stretch). Phones: fontSize, lineHeight, letterSpacing, textAlign, padding, border, gap.
- **ListItem**: An item of a List: text, and a List of its own to nest one. Holds text, inline, List. Props: dir (ltr|rtl|auto). Style: text, textDecoration (none|underline|line-through). Phones: fontSize, lineHeight, letterSpacing, textAlign.
- **TableRow**: A row of a Table. A header row's cells are header cells, in bold. Holds TableCell. Props: header (true or false). Style: text, backgroundColor. Phones: fontSize, lineHeight, letterSpacing, textAlign.
- **TableCell**: A cell of a TableRow: text, and images. Its width sets its column's. Holds text, inline, Image. Props: colSpan (an integer from 1), dir (ltr|rtl|auto). Style: text, textDecoration (none|underline|line-through), padding, backgroundColor, border, width, verticalAlign (top|middle|bottom). Phones: fontSize, lineHeight, letterSpacing, textAlign, padding, border.

### Shapes

- **Rect**: A rectangle at x, y in its Svg, rounded by rx. Props: x (a number), y (a number), width* (a number from 0), height* (a number from 0), rx (a number from 0). Style: fill, stroke, strokeWidth, opacity.
- **Circle**: A circle centered at cx, cy in its Svg. Props: cx (a number), cy (a number), r* (a number from 0). Style: fill, stroke, strokeWidth, opacity.
- **Ellipse**: An ellipse centered at cx, cy in its Svg. Props: cx (a number), cy (a number), rx* (a number from 0), ry* (a number from 0). Style: fill, stroke, strokeWidth, opacity.
- **Line**: A straight line from x1, y1 to x2, y2 in its Svg (drawn by its stroke). Props: x1 (a number), y1 (a number), x2 (a number), y2 (a number). Style: fill, stroke, strokeWidth, opacity.
- **Polygon**: A closed shape through its points ("0,0 40,0 20,30"), in its Svg. Props: points* (text). Style: fill, stroke, strokeWidth, opacity.
- **Path**: A shape drawn by an SVG path (d), in its Svg. Props: d* (text). Style: fill, stroke, strokeWidth, opacity.

## Values

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
