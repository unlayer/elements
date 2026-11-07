---
title: "Email"
description: "What the email writer produces from an Email root. Tables with px widths, Outlook's markup in conditional comments, phone styles, preview text and known limits."
---

An `<Email>` root renders to email-safe HTML: tables with px widths, inline styles, and Outlook's markup in conditional comments. You write the layout once in components, and the writer handles the client quirks.

```tsx
import { Column, Email, Text, Row, render } from "@hyper-elements/react";

const { html, text } = await render(
  <Email previewText="Two columns" title="Hi">
    <Row style={{ gap: 16 }}>
      <Column><Text>Left</Text></Column>
      <Column style={{ width: 180 }}><Text mobile={{ fontSize: 14 }}>Right</Text></Column>
    </Row>
  </Email>
);
```

## The rules it writes by

1. **Right without `<style>`.** Layout at desktop width, colors, fonts, sizes and spacing are inline. The stylesheet only adds phone styles, hiding, hover and client resets. Gmail drops `<style>` for some accounts, and the email still holds its desktop layout.
2. **Widths are decided before writing.** Every table, cell and image gets a px width attribute from the layout resolver. Outlook's Word engine sizes by attributes and ignores the sizes of `div`s.
3. **Tables for layout**, with `role="presentation"`, no spacing and no borders. Spacing is cell padding.
4. **Outlook-only markup only inside `<!--[if mso]>`**, and nothing other clients need inside one.

## What you get

The document is the Unlayer editor's email shell: an XHTML doctype, Office settings for Outlook, `x-apple-disable-message-reformatting`, `X-UA-Compatible`, `-webkit-text-size-adjust`, `color-scheme`, a `border-collapse` reset, and the preview text. The content sits in a full-width table with the window's background, inside a centered table of the content's width. The language, direction and background are also on a `role="article"` wrapper, since Gmail drops `<html>` and `<body>`.

How each component is written:

| Component | In the email |
|-----------|--------------|
| `Section` | A full-width row with its background, its content at the content width inside it |
| `Row` | Each child an inline-block `div`, with an Outlook-only table of the same widths in conditional comments. With `stackOnMobile={false}`, a table row |
| `Column` and other boxes | A one-cell table around the content (Word has no box on a `div` or `p`), its children as table rows |
| Text blocks | The semantic tag with `margin:0`, every text style on it (Outlook doesn't pass styles down through tables), and line heights in px with `mso-line-height-rule: exactly` |
| `Button` | A one-cell table: background, border and corners on the cell, the padding on the link so all of it is clickable, and as the cell's `mso-padding-alt` for Outlook |
| `Image` | An `<img>` with a px `width` attribute, fluid elsewhere (`width:100%` up to its width), its height in proportion when the file's size is known |
| `Divider` | A table with a top border and an empty cell Word can't make taller |
| `List` | A table: an item a row, its marker right-aligned in a cell of the indent's width, with `role="list"` and `"listitem"` |
| `Table` | A data table with fixed layout: column widths in a `colgroup` and on each cell, header rows in `thead` with `th` |
| `Span` | A `<span>`, or `<sup>` and `<sub>` with no line height of their own, so a line keeps its height |
| `Video` | Its thumbnail, linked to the video. An email can't play one |

The Button is a table, not VML: captures of classic Outlook show Word drawing a VML button's label in its own font, wrapped inside the shape's fixed size.

## Rows that stack without media queries

A Row is written "fluid hybrid": each child is an inline-block as wide as its desktop width at most, and 100% otherwise. The children sit side by side where there's room and stack where there isn't, without a media query, so they stack in clients that ignore `<style>` too. Outlook gets a table of the same widths inside conditional comments.

The stylesheet adds the rest for phones: a stacked child goes full width, and your `mobile` styles apply. In an email, phones are below the content width plus 20px, so a 600px email's phone rules apply at 620px and narrower.

## Preview text

`previewText` is shown after the subject in inbox lists, not in the email. It's written as a hidden block at the top of the body, and left out of the plain text.

## Merge tags

A `MergeTag` is written in your sending service's syntax, `{{name}}` by default, in the HTML and the plain text. A link's `href` can be a merge tag too. See [Rendering](/docs/rendering#merge-tags).

## Fonts

Web fonts in `fonts` are written as `@font-face` rules where classic Outlook doesn't read them, so Outlook draws the next font in the stack. Apple Mail and iOS Mail load web fonts. Gmail and classic Outlook don't. End every stack on a font the client has: `"Inter, Arial, sans-serif"`. See [Styles](/docs/styles#fonts).

## Size budgets

`render()` warns before Gmail clips a message (`email/size`, at about 100 KB of HTML) and when the stylesheet is more than Gmail reads, 16 KB (`email/style-size`).

## What email can't do

`validate()` tells you each of these for your template, with the path:

- **Svg.** Gmail and classic Outlook drop inline SVG, so an `Svg` in an email is an error. Use an `Image` of it, a PNG.
- **Layer.** An email draws one shape of it: an Image as wide as the Layer, with one child over it. The image is the cell's background, with VML for Outlook.
- **`justifyContent: "space-between"`.** The children start at the left.
- **Rounded corners and letter spacing in classic Outlook.** Corners are square, and letter spacing is normal. You get a note (`email/outlook-degraded`).
- **A Vimeo video's thumbnail.** It can't be found without the network, so give the `Video` a `thumbnail`.
- **An Image without its file's size.** Outlook shows it at the file's size, however wide that is. Give `src` its `width` and `height`.

There are no dark-mode styles yet. The head declares `color-scheme` as light.

## How it's checked

- Unit tests of each component's markup.
- A hostile-input test: user text, links and font URLs with markup in them add no element or attribute, including inside Outlook's comments.
- Chromium tests that every box is as wide as the layout says on desktop, with and without the stylesheet, that Rows stack on phones either way, that hover, fonts and superscripts work, and that Row widths match the page in every min, max and gap case.
- Checks against a model of classic Outlook's layout, built from captures of real Outlook, at 96 and 192 DPI.

> **Warning:** Chromium and a model of Outlook aren't email clients. The output hasn't been checked in real email clients yet, and button padding through `mso-padding-alt` hasn't been measured in real Outlook. Send tests to the clients your users have before you rely on a layout.

The layout doesn't measure text, either. A box with less room than its words needs looks different in email, where the table cell widens to its longest word, than on a page. See [Layout](/docs/layout#every-box-gets-a-px-width).
