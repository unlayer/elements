# PDF output: `@unlayer/react-elements/pdf`

PDF output for [Hyper Elements](https://github.com/hyper-elements/hyper-elements): a `<Document>` from `@unlayer/react-elements` written as a PDF on the server, with react-pdf, without a browser or the network. Its pages, header, footer and page numbers are the print HTML's, laid out at the same widths.

## Installation

```bash
npm install @unlayer/react-elements @react-pdf/renderer react
```

`/pdf` is an entry of `@unlayer/react-elements`. Its engine is an optional peer dependency, so a project that doesn't import `/pdf` installs nothing for it, and the main entry never loads it:

| Package | Version | Why |
|---------|---------|-----|
| `@unlayer/react-elements` | `^0.3.0` | The components, and this entry |
| `@react-pdf/renderer` | `^4.9.0` | Draws the pages (optional: only for `/pdf`) |
| `react` | `>=18` | |

The tree `prepare()` lays out says its format (its layout version), and `renderPdf` reads the one it's built with. Where the `@unlayer/react-elements` it loads writes another (a second install beside it), it throws an `ElementsError` (`pdf/version`) rather than drawing the template wrong.

Node.js only: it writes the PDF on the server.

## Quick Start

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Document, Heading, Image, PageFooter, PageNumber, Text } from "@unlayer/react-elements";
import { renderPdf } from "@unlayer/react-elements/pdf";

const Invoice = () => (
  <Document size="A4" margin={48} title="Invoice 2705" style={{ fontFamily: "Inter, sans-serif" }}>
    <Image src={{ src: "https://cdn.acme.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
    <Heading level={1}>Invoice 2705</Heading>
    <Text>Thank you for your order.</Text>
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
await writeFile("invoice.pdf", pdf);
```

`renderPdf(element, options)` returns `{ pdf, diagnostics }`: the file's bytes, and the warnings and notes. Errors reject with an `ElementsError` listing them. The same template writes the same bytes (`date`, a fixed date by default, is when the PDF says it was made).

## Fonts and images are given as bytes

Nothing is fetched. Give each file the template needs:

- **Fonts** in `fonts`: `{ family, src, weight?, style? }`, one entry per file, `src` a TTF, OTF or WOFF file's bytes. `family` is the name the template's `fontFamily` stacks use. The files in a Document's `fonts` prop are its HTML's: `renderPdf` doesn't load them, `data:` URIs included.
- **Images** in `images`, by the URL the template gives them (`{ "https://…/logo.png": bytes }`), or as `data:` URIs in the template. A PDF draws PNG and JPEG. A Video shows its thumbnail where its file is given (its own, or a YouTube video's by the URL `img.youtube.com/vi/<id>/0.jpg`), else its title, linked to the video.

Text whose `fontFamily` has no file given is drawn in a standard PDF font: Helvetica, Times or Courier, whichever is closest.

## Diagnostics

| Code | Severity | When |
|------|----------|------|
| `pdf/root` | error | The template isn't a Document |
| `pdf/version` | error | The `@unlayer/react-elements` loaded lays the template out in another layout version than `/pdf` reads |
| `pdf/image` | error | An image isn't given, or its file isn't a PNG or JPEG |
| `pdf/image` | warning | An image is SVG: its alt text is shown in its box |
| `pdf/font` | warning | A font in the Document's `fonts` isn't given; a file given is WOFF2; or text in a standard PDF font has characters it can't draw (it draws Western European ones only) |
| `pdf/font-weight` | warning | Text in a weight or style of a family that isn't given: it's drawn in the nearest file given |
| `pdf/unsupported` | warning | What a PDF can't show that the HTML can: a hover, a Video's player |
| `document/overflow` | warning | A page's content looks taller than the page (an estimate: text isn't measured yet) |

`validate()` from `@unlayer/react-elements` reports `pdf/unsupported` and `document/overflow` without rendering. The font and image checks need the files, so only `renderPdf` makes them.

## Known limits

- **WOFF2 isn't drawn**: react-pdf would embed its letters blank. Give TTF, OTF or WOFF.
- **SVG images aren't drawn**: give a PNG or JPEG. An `Svg` (the component) is drawn as vectors.
- **The standard PDF fonts draw Western European characters only.** For any other script, give a font file that has it. Whether a file given has every character isn't checked.
- **Nothing flows from one page to the next**: content taller than its page is cut off. Split it with a `PageBreak` or into `Document.Page`s.
- **No hover, no video player**: a Button shows its own colors, a Video its thumbnail or title.

## License

MIT
