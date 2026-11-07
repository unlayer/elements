---
title: "Layout"
description: "Arrange blocks with Section, Row, Column, Grid and Layer. Space with gap and padding, size with widths and flex shares, and stack on phones."
---

Five components arrange blocks: `Section`, `Row`, `Column`, `Grid` and `Layer`. None is required, since a root stacks its children. Reach for them when you want bands, columns, cards or words over an image.

```tsx
import { Column, Email, Text, Row } from "@hyper-elements/react";

const template = (
  <Email width={600}>
    <Row style={{ gap: 16 }}>
      <Column style={{ width: 180 }}><Text>Fixed</Text></Column>
      <Column style={{ flex: 2 }}><Text>Two shares</Text></Column>
      <Column><Text>One share</Text></Column>
    </Row>
  </Email>
);
```

`outline(template)` shows the widths the layout worked out:

```text
Email 600px
  Row 600px: 3 side by side, stacked on phones
    Column 180px
      Text 180px "Fixed"
    Column 259px
      Text 259px "Two shares"
    Column 129px
      Text 129px "One share"
```

The fixed column takes 180px, the two gaps take 32px, and the other two share the 388px left, two to one.

## Gap and padding, no margins

There are no margins. Space between blocks is their parent's `gap`. Space inside a box is its `padding`.

```tsx
<Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16 }}>
  <Heading level={2}>Your order</Heading>
  <Text>Ships tomorrow.</Text>
</Column>
```

`marginBottom` and the other margins are errors that tell you to use the parent's `gap` or `padding`. In an email, every block sits in a cell the writer owns, so spacing is cell padding and holds up in Outlook.

`padding` takes `16` (every side), `[12, 24]` (vertical, horizontal), `[8, 16, 8, 16]` (top, right, bottom, left), `"12px 24px"` or `{ top, right, bottom, left }`.

## Section

A [`Section`](/docs/components/section) is a band across the whole window. It goes directly in a root, never inside a Column, Row or another Section. Its background spans the window, and its children are stacked at the content width.

```tsx
<Email width={600}>
  <Section style={{ backgroundColor: "#111827", padding: [24, 40], color: "#ffffff" }}>
    <Heading level={2}>Acme weekly</Heading>
  </Section>
  <Section style={{ padding: [32, 40], gap: 16 }}>
    <Text>This week's news.</Text>
  </Section>
</Email>
```

The heading is 520px wide: the 600px content less 40px of padding on each side.

## Row

A [`Row`](/docs/components/row) puts its children side by side. Each child takes its `width`, or a share of what's left: its `flex`, 1 by default.

```tsx
// Equal shares.
<Row style={{ gap: 16 }}>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// A set width, and what's left.
<Row style={{ gap: 16 }}>
  <Column style={{ width: 180 }}>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// Shares of two to one.
<Row style={{ gap: 16 }}>
  <Column style={{ flex: 2 }}>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
```

`width` takes px or a percentage of the parent's content box. `flex: "none"` makes a child take its own size. `minWidth` and `maxWidth` hold a child's width where the shares would go past them.

### Stacking on phones

In an Email or a Page, a Row stacks its children full-width on phones. To keep them side by side, set `stackOnMobile={false}`:

```tsx
<Row stackOnMobile={false} style={{ gap: 12 }}>
  <Column><Text>Subtotal</Text></Column>
  <Column><Text style={{ textAlign: "right" }}>$48.00</Text></Column>
</Row>
```

Phones are at or below the content width plus 20px in an email (620px for a 600px email), and at or below 480px on a page. In an email, a stacking Row is written so its children sit side by side where there's room and stack where there isn't, with no media query needed. See [Email](/docs/outputs/email#rows-that-stack-without-media-queries).

`flexWrap: "wrap"` lets children that don't fit wrap onto another line. In an email it applies to a Row kept side by side on phones.

## Column

A [`Column`](/docs/components/column) stacks its children, with its own `gap`, `padding` and box. With a background, it's a card.

```tsx
<Column style={{ backgroundColor: "#ffffff", padding: 24, gap: 12, border: "1px solid #e4e4e7", borderRadius: 8 }}>
  <Heading level={3}>Pro plan</Heading>
  <Text>$12 a month</Text>
</Column>
```

A child of a stack (a root, a Section, a Column) fills its width, unless it takes its own size (a Button, an Image) or has a width.

## Grid

A [`Grid`](/docs/components/grid) puts its children in columns of equal width, row after row. On phones, they go one under another unless `stackOnMobile={false}`.

```tsx
<Grid columns={3} style={{ gap: 16, rowGap: 24 }}>
  <Column><Text>One</Text></Column>
  <Column><Text>Two</Text></Column>
  <Column><Text>Three</Text></Column>
  <Column><Text>Four</Text></Column>
</Grid>
```

`columns` is 1 to 12, 2 by default. `gap` is the space across and down, and `rowGap` the space between rows where it differs. A Grid is laid out as the Rows of Columns it is, so every output draws it.

## Layer

A [`Layer`](/docs/components/layer) puts its children over each other, in one box as tall as the tallest. Use it for words on an image.

```tsx
<Layer style={{ height: 280, alignItems: "end" }}>
  <Image src={{ src: "https://example.com/hero.jpg", width: 1200, height: 560 }} alt="" />
  <Column style={{ padding: 32 }}>
    <Heading level={2} style={{ color: "#ffffff" }}>Spring collection</Heading>
  </Column>
</Layer>
```

`height` makes the image under its children cover the Layer, cut at its sides or its top and bottom. `alignItems` places the children down the box (`"start"` by default), and `justifyItems` across it (`"stretch"` by default).

> **Note:** An email draws one shape of Layer: an Image as wide as the Layer (100%) with one child over it. Any other shape is an error for email (`email/layer`).

## Alignment

`alignItems` places children across the layout's direction: vertically in a Row, horizontally in a Column. `justifyContent` places them along it. The values are CSS's: `"start"`, `"center"`, `"end"`, plus `"stretch"` for `alignItems` and `"space-between"` for `justifyContent`.

```tsx
<Row style={{ gap: 16, alignItems: "center" }}>
  <Column style={{ width: 64 }}>
    <Image src={{ src: "https://example.com/avatar.png", width: 128, height: 128 }} alt="" style={{ width: 64, borderRadius: 32 }} />
  </Column>
  <Column>
    <Text style={{ fontWeight: 700 }}>Ada Lovelace</Text>
    <Text>Commented on your design</Text>
  </Column>
</Row>

<Column style={{ alignItems: "center", gap: 12 }}>
  <Heading level={2}>Centered</Heading>
  <Button href="https://example.com">Also centered</Button>
</Column>
```

A Button can place itself with `alignSelf` (`"start"`, `"center"` or `"end"`), whatever its stack's `alignItems`, and somewhere else on phones with `mobile={{ alignSelf }}`.

> **Note:** `justifyContent: "space-between"` isn't possible in a Row in an email. Its children start at the left, and `validate()` warns (`email/unsupported`).

## Every box gets a px width

Before anything is written, the layout resolver works out every box's width in px, from the root's width down, and every text's styles. Each output's writer reads the same layout, so the email (which needs px widths for Outlook's tables) and the page agree.

Rows are resolved the way CSS flexbox resolves them: each child starts from its width or its own size, what's left is shared by `flex`, and a child that reaches its `minWidth` or `maxWidth` keeps it. When widths don't fit, they're narrowed as a browser narrows them, with a warning (`layout/shrunk`). Minimums that can't fit are reported too (`layout/overflow`).

`outline()` prints these widths. See [Rendering](/docs/rendering#outline).

> **Warning:** The resolver doesn't measure text. It can give a box less room than its content needs: text in a few px, a label wider than its button. A page then overflows the box, while email tables, like Outlook's, widen the cell to its longest word and its neighbours give way. No diagnostic says so yet, so give boxes room for their words.
