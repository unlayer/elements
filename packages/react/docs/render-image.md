# Image output: `@unlayer/react-elements/image`

Image output for [Unlayer Elements](https://github.com/unlayer/elements): a `<Canvas>` from `@unlayer/react-elements` written as PNG or SVG on the server, with Satori and resvg, without a browser or the network. A social card, a banner, an Open Graph image: laid out as the Canvas's HTML is, at the same widths.

## Installation

```bash
npm install @unlayer/react-elements satori @resvg/resvg-js react
```

`/image` is an entry of `@unlayer/react-elements`. Its engines are optional peer dependencies, so a project that doesn't import `/image` installs nothing for them, and the main entry never loads them:

| Package | Version | Why |
|---------|---------|-----|
| `@unlayer/react-elements` | `^0.3.0` | The components, and this entry |
| `satori` | `^0.33.5` | Lays out the Canvas and draws its text as paths, as SVG (optional: only for `/image`) |
| `@resvg/resvg-js` | `^2.6.2` | Draws that SVG as a PNG (optional: only for `/image`) |
| `react` | `>=18` | |

The tree `prepare()` lays out says its format (its layout version), and `renderImage` reads the one it's built with. Where the `@unlayer/react-elements` it loads writes another (a second install beside it), it throws an `ElementsError` (`image/version`) rather than drawing the template wrong.

Node.js only: it writes the image on the server.

## Quick Start

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Canvas, Heading, Text } from "@unlayer/react-elements";
import { renderImage } from "@unlayer/react-elements/image";

const SocialCard = () => (
  <Canvas width={1200} height={630} style={{ backgroundColor: "#0f172a", padding: 64, gap: 24, color: "#ffffff", fontFamily: "Inter, sans-serif" }}>
    <Heading level={1} style={{ fontSize: 64 }}>
      Launch week
    </Heading>
    <Text style={{ fontSize: 28, color: "#cbd5e1" }}>Five days of new things, one a day.</Text>
  </Canvas>
);

const { image, width, height, diagnostics } = await renderImage(<SocialCard />, {
  fonts: [
    { family: "Inter", src: await readFile("fonts/Inter-Regular.ttf") },
    { family: "Inter", src: await readFile("fonts/Inter-Bold.ttf"), weight: 700 },
  ],
});
await writeFile("card.png", image);
```

`renderImage(element, options)` returns `{ image, width, height, diagnostics }`: the file's bytes, its size in pixels, and the warnings and notes. Errors reject with an `ElementsError` listing them. The same template writes the same bytes.

| Option | |
|--------|---|
| `fonts` | Font files, by family (below) |
| `images` | Image files, by URL (below) |
| `format` | `"png"` (the default) or `"svg"`. An SVG's text is drawn as paths, so it shows without the fonts |
| `scale` | Pixels per px of a PNG: 2 for a phone's screen |

## Fonts and images are given as bytes

Nothing is fetched. Give each file the template needs:

- **Fonts** in `fonts`: `{ family, src, weight?, style? }`, one entry per file, `src` a TTF, OTF or WOFF file's bytes. `family` is the name the template's `fontFamily` stacks use. A Canvas's own `fonts` given as `data:` URIs are drawn too; ones given by URL aren't loaded. An image needs at least one font: text whose `fontFamily` has no file given is drawn in the first font given.
- **Images** in `images`, by the URL the template gives them (`{ "https://…/photo.png": bytes }`), or as `data:` URIs in the template: PNG, JPEG, GIF or SVG.

## Diagnostics

| Code | Severity | When |
|------|----------|------|
| `image/root` | error | The template isn't a Canvas |
| `image/version` | error | The `@unlayer/react-elements` loaded lays the template out in another layout version than `/image` reads |
| `image/font` | error | The Canvas has text and no font is given |
| `image/font` | warning | A font in the Canvas's `fonts` isn't given, or a file given is WOFF2 |
| `image/font-weight` | warning | Text in a weight or style of a family that isn't given: it's drawn in the nearest file given |
| `image/image` | error | An image isn't given, or its file isn't a PNG, JPEG, GIF or SVG |
| `image/unsupported` | warning | What an image can't show that the HTML can: a hover, a Video's player |
| `canvas/overflow` | warning | The content looks taller than the Canvas (an estimate: text isn't measured yet) |

`validate()` from `@unlayer/react-elements` reports `image/unsupported` and `canvas/overflow` without rendering. The font and image checks need the files, so only `renderImage` makes them.

## Known limits

- **WOFF2 isn't drawn**: Satori reads TTF, OTF and WOFF. Give one of those.
- **Text is drawn only in the fonts given**: a character none of them has comes out as an empty box. Give a font that has it.
- **What doesn't fit is cut off** at the Canvas's edges.
- **No hover, no video**: a Button shows its own colors, a Video its title.

## License

MIT
