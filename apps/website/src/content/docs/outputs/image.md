---
title: "Image"
description: "Render a Canvas root to a PNG or SVG with @hyper-elements/react/image: social cards, Open Graph images and banners, on the server with no browser."
---

A `<Canvas>` root is an image of a fixed size. `renderImage()` from `@hyper-elements/react/image` writes it as a PNG or an SVG, on your server, with Satori and resvg. No browser, no screenshot service, no network.

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Canvas, Circle, Heading, Image, Text, Row, Svg } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";

function PostCard({ title, author }: { title: string; author: string }) {
  return (
    <Canvas width={1200} height={630} style={{ backgroundColor: "#0f172a", padding: 64, gap: 24, color: "#ffffff", fontFamily: "Inter, sans-serif", justifyContent: "space-between" }}>
      <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
      <Heading level={1} style={{ fontSize: 64 }}>{title}</Heading>
      <Row style={{ gap: 16, alignItems: "center" }}>
        <Svg width={40} height={40} style={{ flex: "none" }}>
          <Circle cx={20} cy={20} r={20} style={{ fill: "#38bdf8" }} />
        </Svg>
        <Text style={{ fontSize: 28, color: "#cbd5e1" }}>{author}</Text>
      </Row>
    </Canvas>
  );
}

const { image, width, height, diagnostics } = await renderImage(<PostCard title="Launch week" author="Ada Lovelace" />, {
  fonts: [
    { family: "Inter", src: await readFile("fonts/Inter-Regular.ttf") },
    { family: "Inter", src: await readFile("fonts/Inter-Bold.ttf"), weight: 700 },
  ],
  images: { "https://example.com/logo.png": await readFile("images/logo.png") },
});
await writeFile("card.png", image);
```

Use it for social cards, Open Graph images, banners, or any image you'd otherwise build in a design tool and export by hand. Pass a different `title` and you have a card per blog post.

## Install

```bash
npm install @hyper-elements/react satori @resvg/resvg-js react react-dom
```

| Peer dependency | Version | Why |
|-----------------|---------|-----|
| `satori` | `^0.33.5` (optional: only for `/image`) | Lays out the Canvas and draws its text as paths, as SVG |
| `@resvg/resvg-js` | `^2.6.2` (optional: only for `/image`) | Draws that SVG as a PNG |
| `react`, `react-dom` | `>=18` | |

`/image` is an entry of `@hyper-elements/react`. Its engines are optional peer dependencies, so a project that doesn't import `/image` installs nothing for them, and the main entry never loads them.

It runs in Node.js only. If it loads a second copy of `@hyper-elements/react` that lays templates out in another version, `renderImage()` throws an `ElementsError` (`image/version`) rather than drawing the template wrong.

> **Note:** Satori runs WebAssembly, which a Content-Security-Policy without `'wasm-unsafe-eval'` blocks. That's one reason image output is its own entry, `@hyper-elements/react/image`, which the main entry never loads.

## The Canvas

| Prop | What it does | Default |
|------|--------------|---------|
| `width` | The image's width in px | 1200 |
| `height` | The image's height in px. What's past it is cut | 630 |
| `title`, `lang`, `dir`, `fonts` | As on every root | |

Its content is laid out as on a page, with no phone layout. Beside the text styles, `backgroundColor`, `gap` and `alignItems`, a Canvas's `style` takes `padding` and `justifyContent`, so you can push content to the bottom or spread it out (`"space-between"`).

`render()` writes a Canvas as HTML too, to look at in a browser while you design it.

## renderImage()

`renderImage(element, options)` returns `{ image, width, height, diagnostics }`: the file's bytes, its size in pixels, and the warnings and notes. Errors reject with an `ElementsError` listing them. The same template writes the same bytes.

| Option | What it takes |
|--------|---------------|
| `fonts` | Font files, by family (below) |
| `images` | Image files, by URL (below) |
| `format` | `"png"` (the default) or `"svg"`. An SVG's text is drawn as paths, so it shows without the fonts |
| `scale` | Pixels per px of a PNG: 2 for a phone's screen. At 2, a 1200 by 630 Canvas is 2400 by 1260 |

```tsx
const { image } = await renderImage(<PostCard title="Launch week" author="Ada Lovelace" />, { fonts, images, format: "svg" });
await writeFile("card.svg", image);
```

### Fonts and images

Nothing is fetched. Give each file the template needs, as bytes:

- **Fonts** in `fonts`: `{ family, src, weight?, style? }`, one entry per file. `src` is a TTF, OTF or WOFF file's bytes, and `family` is the name your `fontFamily` stacks use. A Canvas's own `fonts` given as `data:` URIs are drawn too. Ones given by URL aren't loaded.
- **Images** in `images`, by the URL the template gives them (`{ "https://…/photo.png": bytes }`), or as `data:` URIs in the template: PNG, JPEG, GIF or SVG.

An image with text needs at least one font. Text whose `fontFamily` has no file given is drawn in the first font given.

### Diagnostics

| Code | Severity | When |
|------|----------|------|
| `image/root` | error | The template isn't a Canvas |
| `image/version` | error | A second copy of `@hyper-elements/react` lays the template out in another version |
| `image/font` | error | The Canvas has text and no font is given |
| `image/font` | warning | A font in the Canvas's `fonts` isn't given, or a file given is WOFF2 |
| `image/font-weight` | warning | Text in a weight or style of a family that isn't given. It's drawn in the nearest file given |
| `image/image` | error | An image isn't given, or its file isn't a PNG, JPEG, GIF or SVG |
| `image/unsupported` | warning | What an image can't show that the HTML can: a hover, a Video's player, an `Html` block's markup (its plain text is drawn), a line too wide to wrap (it goes past the edge) |
| `canvas/overflow` | warning | The content looks taller than the Canvas. An estimate: text isn't measured yet |

`validate()` from `@hyper-elements/react` reports `image/unsupported` and `canvas/overflow` without rendering. The font and image checks need the files, so only `renderImage()` makes them.

## Limits

- **WOFF2 isn't drawn.** Satori reads TTF, OTF and WOFF. Give one of those.
- **Text is drawn only in the fonts you give.** A character none of them has comes out as an empty box. Give a font that has it.
- **What doesn't fit is cut off** at the Canvas's edges. Text isn't measured before layout, so check long titles: `canvas/overflow` is an estimate.
- **No hover and no video.** A Button shows its own colors, a Video its title.
