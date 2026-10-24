# Web fonts in Elements

Use a web font (Google Fonts, or a font file of your own) in an email, page or document. `<Font>` declares it once for the template: the document's head loads it, and with `default` it's the template's font, in the HTML and in the design the visual editor opens.

```tsx
import { Email, Row, Column, Heading, Paragraph } from "@unlayer/react-elements";
import { Font } from "@unlayer/react-elements/font";

<Email>
  <Font
    family="Inter"
    url="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
    fallback="Arial, Helvetica, sans-serif"
    default
  />
  <Row>
    <Column>
      <Heading>Welcome aboard</Heading>
      <Paragraph>Inter where the client loads web fonts, Arial where it doesn't.</Paragraph>
    </Column>
  </Row>
</Email>
```

Place `<Font>` in the `Email`, `Page` or `Document` (beside the rows, or in a component of yours there). It renders nothing itself. It comes from its own entry, `@unlayer/react-elements/font`, so the main entry stays small.

## Props

| Prop | | |
|------|--|--|
| `family` | required | The family name your styles use. |
| `url` | | A stylesheet that declares the font (a Google Fonts CSS URL): the head links it. Or the font file (`.woff2`, `.woff`, `.ttf`, `.otf`): the head declares it with `@font-face`. |
| `format` | | The file's format (`woff2`, `woff`, `truetype`, `opentype`), when the URL doesn't end with it: the URL is then the file. |
| `weight`, `style` | `400`, `normal` | What a font file is. Declare one `<Font>` per file (regular, bold, italic). |
| `fallback` | `sans-serif` | The families shown where the web font doesn't load. |
| `default` | | The template's font: the root's `fontFamily` (`'Inter', Arial, Helvetica, sans-serif`), unless the root sets its own. |

## How it renders

- **The head.** `renderToHtml()` writes the `<link>` or the `@font-face` in the document's head. `renderToHtmlParts()` gives them in `tags` (and in `head`).
- **Outlook.** Outlook's desktop apps don't load web fonts, and a declared one can make them fall back to Times New Roman. In email, the font's tags are inside `<!--[if !mso]>` comments, so Outlook doesn't see them and shows the `fallback` fonts.
- **The design.** With `default`, `renderToJson()` writes the family as the body's `fontFamily`, with the stylesheet's URL. For a family it doesn't know, the editor loads the font from that URL. For a Google font it already knows (Montserrat, Lato, …), the editor links its own stylesheet instead (`Montserrat:400,700`), so a weight that stylesheet doesn't have may show as another weight in the editor. To offer the font in the editor's font picker too, register it in the editor's `fonts.customFonts`.
- **Text that sets its own font** (`<Paragraph fontFamily="'Inter', Arial, sans-serif">`) uses the declared font as well: `<Font>` without `default` loads it. In the design, `renderToJson()` writes a stylesheet's URL on each `fontFamily` of its family that has none (the body's and each block's, matched by the first family in the stack, as the editor matches fonts): that's where the editor keeps a web font, so the editor loads it too and exports its `<link>`. A font file's URL isn't written (the editor has no place for an `@font-face`).

The family name and the URL can't end the tags or CSS they're written into: characters that could are left out of the name and percent-encoded in the URL.

## A root's `fonts` prop

A root's `fonts` (`<Email fonts={[{ url }]}>`) are stylesheets the document's head links. `renderToJson()` puts each one in the design as a `<Font>`'s: on the design's fonts of the families its URL names (`family=Inter` in a Google Fonts URL), so the editor loads it too. A URL that names no family a font in the design has (another service's stylesheet, or a family no `fontFamily` uses) stays in the HTML only, and `renderToJson()` says so once per render. `<Font family url>` names the family for any stylesheet.

```tsx
<Email
  fonts={[{ url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" }]}
  fontFamily={{ label: "Inter", value: "Inter, 'Helvetica Neue', Arial, sans-serif" }}
>
```

## Agent rules

- Import `Font` from `@unlayer/react-elements/font` and place it in the root, beside the rows.
- Always give `fallback` with a web-safe font (Arial, Helvetica, Georgia, Verdana), which Outlook shows.
- One `<Font default>` per template. Set other blocks' fonts with their `fontFamily` prop.
