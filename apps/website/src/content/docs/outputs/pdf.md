---
title: "PDF"
description: "Render a Document root to print-ready HTML, or to a PDF file with @hyper-elements/react/pdf on the server, with no browser and no network."
---

A `<Document>` root lays its content out on pages of a fixed size, with a header and a footer on each. `render()` writes it as print-ready HTML, and `renderPdf()` from `@hyper-elements/react/pdf` writes it as a PDF, on your server, with no headless Chrome.

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Document, Heading, Image, PageBreak, PageFooter, PageHeader, PageNumber, Text, Table, TableCell, TableRow } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";

const Invoice = () => (
  <Document size="A4" margin={48} title="Invoice 2705" style={{ fontFamily: "Inter, sans-serif", gap: 16 }}>
    <PageHeader style={{ padding: [0, 0, 16, 0] }}>
      <Image src={{ src: "https://cdn.acme.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
    </PageHeader>
    <Heading level={1}>Invoice 2705</Heading>
    <Text>Thank you for your order.</Text>
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
    <PageBreak />
    <Heading level={2}>Terms</Heading>
    <Text>Payment is due in 30 days.</Text>
    <PageFooter>
      <Text style={{ fontSize: 10, textAlign: "right" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

const { pdf, diagnostics } = await renderPdf(<Invoice />, {
  fonts: [
    { family: "Inter", src: await readFile("fonts/Inter-Regular.ttf") },
    { family: "Inter", src: await readFile("fonts/Inter-Bold.ttf"), weight: 700 },
  ],
  images: { "https://cdn.acme.com/logo.png": await readFile("images/logo.png") },
});
for (const { code, message } of diagnostics) console.warn(code, message);
await writeFile("invoice.pdf", pdf);
```

## Install

```bash
npm install @hyper-elements/react @react-pdf/renderer react react-dom
```

| Peer dependency | Version | Why |
|-----------------|---------|-----|
| `@react-pdf/renderer` | `^4.9.0` (optional: only for `/pdf`) | Draws the pages |
| `react`, `react-dom` | `>=18` | |

`/pdf` is an entry of `@hyper-elements/react`. Its engine is an optional peer dependency, so a project that doesn't import `/pdf` installs nothing for it, and the main entry never loads it.

It runs in Node.js only. If it loads a second copy of `@hyper-elements/react` that lays templates out in another version, `renderPdf()` throws an `ElementsError` (`pdf/version`) rather than drawing the template wrong.

## The Document

| Prop | Takes | Default |
|------|-------|---------|
| `size` | `"A3"`, `"A4"`, `"A5"`, `"Letter"`, `"Legal"`, `"Tabloid"` | `"A4"` |
| `orientation` | `"portrait"`, `"landscape"` | `"portrait"` |
| `margin` | Insets around each page's content, its header and footer too, in px at 96 to the inch | 48 on every side |
| `title`, `lang`, `dir`, `fonts` | As on every root | |

A Document's width comes from its size and margin: an A4 page with 48px margins has 698px of content. It has no phone layout, so `mobile` styles are an error in one.

### Pages

The content goes on pages in one of two ways:

- **Runs split by [`PageBreak`](/docs/components/pagebreak).** What follows a `PageBreak` starts the next page.
- **[`Document.Page`](/docs/components/document-page)s.** Each one is a page, its children stacked inside the Document's margins.

```tsx
<Document size="Letter" orientation="landscape">
  <Document.Page style={{ gap: 16 }}>
    <Heading>Q3 report</Heading>
    <Text>Revenue grew 12%.</Text>
  </Document.Page>
  <Document.Page style={{ gap: 16 }}>
    <Heading level={2}>Details</Heading>
  </Document.Page>
</Document>
```

### Header, footer and page numbers

One [`PageHeader`](/docs/components/pageheader) and one [`PageFooter`](/docs/components/pagefooter) are drawn on every page, inside its margins. A second of either is an error. A [`PageNumber`](/docs/components/pagenumber) in their text, or anywhere in the Document's text, is the number of the page it's on, and `<PageNumber total />` is how many pages there are.

A table row with `footer` ends the table.

## Print HTML

`render()` writes a Document as print HTML: a box of the paper's size for each page, with the header and footer in each, and a CSS `@page` rule for the paper's size and orientation, with no page margin.

```tsx
import { render } from "@hyper-elements/react";

const { html } = await render(<Invoice />);
```

Open it in a browser to look at the pages, or print it. If you print it to PDF with Playwright, pass `preferCSSPageSize: true` and `printBackground: true` to `page.pdf()`, and set the margin on the Document: a `margin` passed to `page.pdf()` changes nothing, since each page draws its own.

## renderPdf()

`renderPdf(element, options)` returns `{ pdf, diagnostics }`: the file's bytes, and the warnings and notes. Errors reject with an `ElementsError` listing them. Its pages, header, footer and page numbers are the print HTML's, laid out at the same widths.

The same template writes the same bytes. The `date` option is when the PDF says it was made: a fixed date by default, which is what keeps the bytes the same. Pass `new Date()` if you want the real one.

| Option | What it takes |
|--------|---------------|
| `fonts` | Font files, by family (below) |
| `images` | Image files, by URL (below) |
| `date` | When the PDF says it was made, a fixed date by default |

### Fonts and images

Nothing is fetched. Give each file the template needs, as bytes:

- **Fonts** in `fonts`: `{ family, src, weight?, style? }`, one entry per file. `src` is a TTF, OTF or WOFF file's bytes. `family` is the name your `fontFamily` stacks use. The files in a Document's `fonts` prop are for its HTML: `renderPdf()` doesn't load them, `data:` URIs included.
- **Images** in `images`, by the URL the template gives them (`{ "https://…/logo.png": bytes }`), or as `data:` URIs in the template. A PDF draws PNG and JPEG.

Text whose `fontFamily` has no file given is drawn in a standard PDF font: Helvetica, Times or Courier, whichever is closest. Those draw Western European characters only. For any other script, give a font file that has it.

A `Video` shows its thumbnail where its file is given (its own, or a YouTube video's by the URL `img.youtube.com/vi/<id>/0.jpg`), and otherwise its title, linked to the video.

### Diagnostics

| Code | Severity | When |
|------|----------|------|
| `pdf/root` | error | The template isn't a Document |
| `pdf/version` | error | A second copy of `@hyper-elements/react` lays the template out in another version |
| `pdf/image` | error | An image isn't given, or its file isn't a PNG or JPEG |
| `pdf/image` | warning | An image is SVG: its alt text is shown in its box |
| `pdf/font` | warning | A font in the Document's `fonts` isn't given, a file given is WOFF2, or text in a standard PDF font has characters it can't draw |
| `pdf/font-weight` | warning | Text in a weight or style of a family that isn't given. It's drawn in the nearest file given |
| `pdf/unsupported` | warning | What a PDF can't show that the HTML can: a hover, a Video's player, an `Html` block's markup (its plain text is drawn), a line too wide to wrap (it goes past the edge) |
| `document/overflow` | warning | A page's content looks taller than the page. An estimate: text isn't measured yet |

`validate()` from `@hyper-elements/react` reports `pdf/unsupported` and `document/overflow` without rendering. The font and image checks need the files, so only `renderPdf()` makes them.

## Limits

- **Nothing flows from one page to the next.** Content taller than its page is cut off, and you get `document/overflow`. Split it with a `PageBreak` or into `Document.Page`s, and test with your longest real data.
- **WOFF2 isn't drawn.** react-pdf would embed its letters blank. Give TTF, OTF or WOFF.
- **SVG images aren't drawn.** Give a PNG or JPEG. An `Svg` component is drawn as vectors.
- **The standard PDF fonts draw Western European characters only.** Whether a font file you give has every character isn't checked.
- **No hover and no video player.** A Button shows its own colors, a Video its thumbnail or title.
