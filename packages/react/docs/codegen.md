# Unlayer designs as Elements code

Turn a template made in the Unlayer editor into Elements code: `designToElements()` takes the design JSON (what the editor's `saveDesign()` and `exportHtml()` give) and writes a `.tsx` module whose component renders back to the same design with `renderToJson()`. Edit the template in code from then on, render it with `renderToHtml()`, or open it in the editor again.

```bash
npm install @unlayer/react-elements
```

It comes from its own entry, `@unlayer/react-elements/codegen`, so the main entry doesn't carry it. It's pure (no React rendering, no Node APIs): it runs in a CLI, on a server and in a browser.

## Convert a design

```ts
import { writeFile } from "node:fs/promises";
import { designToElements } from "@unlayer/react-elements/codegen";

const { code, warnings } = designToElements(design, { componentName: "OrderShipped" });
await writeFile("OrderShipped.tsx", code);
for (const warning of warnings) console.warn(warning);
```

`design` is the design object or its JSON text. The options:

| Option | Default | |
|--------|---------|--|
| `displayMode` | the design's `displayMode` (`body.values.displayMode`, which `renderToJson()` writes), else `"email"` | The root: `"email"` (`<Email>`), `"web"` (`<Page>`), `"document"` (`<Document>`). A `"popup"` design is written as a `<Page>`. |
| `componentName` | `"Template"` | The component's name: `export default function OrderShipped()`. |
| `html` | | The design's exported HTML (`exportHtml()`'s `html`): blocks Elements has no component for are kept as `<Html>` blocks with theirs. |

The result is `{ code, warnings }`: the module, and a line for each thing that didn't convert as it is, naming its row and column.

In the browser, convert what the editor holds:

```ts
unlayer.exportHtml(({ design, html }) => {
  const { code } = designToElements(design, { html });
  // show it, or save it as a file
});
```

The code imports from `@unlayer/react-elements` (and `@unlayer/react-elements/font` when the design uses a web font). It uses the automatic JSX runtime (`"jsx": "react-jsx"` in `tsconfig.json`, the default in Next.js and Vite projects), and it type-checks against the package's types.

## Formatting

The code is already written as prettier formats it (80 columns, two spaces, double quotes). To format it with your project's settings, `formatElements()` runs prettier (an optional peer dependency) when it's installed, and gives the code back as it is when it isn't:

```ts
import { designToElements, formatElements } from "@unlayer/react-elements/codegen";

const code = await formatElements(designToElements(design).code, { printWidth: 100, singleQuote: true });
```

## What the code looks like

A design from the editor (shortened: each block's settings at their defaults are left out here):

```json
{
  "body": {
    "values": {
      "contentWidth": "600px",
      "backgroundColor": "#f3f4f6",
      "preheaderText": "Order #1001 has shipped",
      "linkStyle": { "linkColor": "#4f46e5", "linkHoverColor": "#4338ca" }
    },
    "rows": [
      {
        "cells": [1],
        "values": { "backgroundColor": "#ffffff", "padding": "24px 32px" },
        "columns": [{ "values": {}, "contents": [
          { "type": "image", "values": { "src": { "url": "https://cdn.example.com/logo.png", "width": 400, "height": 120, "autoWidth": false, "maxWidth": "30%" }, "altText": "Acme", "textAlign": "left" } }
        ] }]
      },
      {
        "cells": [2, 1],
        "values": { "backgroundColor": "#ffffff" },
        "columns": [
          { "values": { "padding": "16px" }, "contents": [
            { "type": "heading", "values": { "headingType": "h2", "fontWeight": 700, "fontSize": "26px", "color": "#111827", "text": "Your order is on its way" } },
            { "type": "text", "values": { "fontSize": "15px", "color": "#4b5563", "lineHeight": "160%", "text": "<p>Track it any time from <a href=\"https://acme.com/orders\">your orders</a>.</p>", "_override": { "mobile": { "fontSize": "14px" } } } },
            { "type": "button", "values": { "href": { "name": "web", "values": { "href": "https://acme.com/track/1001", "target": "_blank" } }, "buttonColors": { "backgroundColor": "#4f46e5", "hoverBackgroundColor": "#4338ca" }, "textAlign": "left", "padding": "12px 24px", "borderRadius": "6px", "text": "Track package" } }
          ] },
          { "values": { "backgroundColor": "#f3f4f6", "padding": "16px", "borderRadius": "8px" }, "contents": [
            { "type": "image", "values": { "src": { "url": "https://cdn.example.com/box.png", "width": 600, "height": 600, "autoWidth": true, "maxWidth": "100%" }, "_override": { "mobile": { "hideMobile": true } } } }
          ] }
        ]
      }
    ]
  }
}
```

becomes:

```tsx
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Button,
  Heading,
  Image,
  Paragraph,
} from "@unlayer/react-elements";

export default function OrderShipped() {
  return (
    <Email
      previewText="Order #1001 has shipped"
      contentWidth="600px"
      backgroundColor="#f3f4f6"
      linkStyle={{ linkColor: "#4f46e5", linkHoverColor: "#4338ca" }}
    >
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="24px 32px"
      >
        <Column>
          <Image
            src={{
              url: "https://cdn.example.com/logo.png",
              width: 400,
              height: 120,
            }}
            width="30%"
            alt="Acme"
            textAlign="left"
          />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.TwoWideNarrow} backgroundColor="#ffffff">
        <Column padding="16px">
          <Heading
            headingType="h2"
            fontWeight={700}
            fontSize="26px"
            color="#111827"
          >
            Your order is on its way
          </Heading>
          <Paragraph
            html='<p>Track it any time from <a href="https://acme.com/orders">your orders</a>.</p>'
            fontSize="15px"
            color="#4b5563"
            lineHeight="160%"
            mobile={{ fontSize: "14px" }}
          />
          <Button
            href="https://acme.com/track/1001"
            backgroundColor="#4f46e5"
            hoverBackgroundColor="#4338ca"
            textAlign="left"
            padding="12px 24px"
            borderRadius="6px"
          >
            Track package
          </Button>
        </Column>
        <Column backgroundColor="#f3f4f6" padding="16px" borderRadius="8px">
          <Image
            src={{
              url: "https://cdn.example.com/box.png",
              width: 600,
              height: 600,
              autoWidth: true,
            }}
            hideOnMobile
          />
        </Column>
      </Row>
    </Email>
  );
}
```

## What's kept as props

Each setting that differs from the component's default is a prop, written as you'd write it by hand:

- **The root**: `<Email>`, `<Page>` or `<Document>`, with the body's `backgroundColor`, `contentWidth`, `contentAlign`, `textColor`, `fontFamily`, `linkStyle` (what differs), `textDirection`, `previewText` (the preheader) and a document's `documentSize` and `documentOrientation`. A web font (a font with a URL, as the editor's Google Fonts) gets a `<Font>` that loads it; where the body's font is what `<Font default>` writes, it's that. The fonts of its family are written without the URL, which the `<Font>` writes back on them in the design.
- **Rows**: `<Row>` with `layout={ColumnLayouts.X}` where the design's cells are one of them, else `cells={[…]}`; `backgroundColor`, `columnsBackgroundColor`, `backgroundImage`, `padding` (the editor's, around the row) and phone padding as `mobile={{ padding }}`, `noStackMobile`, `hideOnMobile`, `hideOnDesktop`.
- **Columns**: `backgroundColor`, `padding`, `borderRadius`, `border`, and phone padding as `mobile={{ padding }}`.
- **Text**: a Paragraph's text as `html`, which renders as the design has it (a Paragraph's children are text, with inline JSX as rich text); a Heading's as children when it's plain text (words with nothing React would escape), else its `text`. A Heading's `headingType`; text styles as flat props.
- **Buttons**: the text as children, the link as `href` (and `target` when it isn't a new tab), colors as `color`, `backgroundColor`, `hoverColor`, `hoverBackgroundColor`, a fixed width as `width`.
- **Images**: `src` (a URL, or `{ url, width, height }` with the image's natural size, and `autoWidth: true` when its width is automatic), a fixed width as `width={32}` where its percent of the column is a whole pixel (as renderToJson writes a px width: Elements then renders exactly that), else `width="45.5%"`, `alt`, `action` (its link, as a web link to its URL).
- **Menus, social icons, tables and videos**: `items` (or `menu`, which keeps the editor's keys for its items, each link a web link to its URL), `icons` (and `iconType`), `headers` and `data` (or `columns` and `rows` for an empty grid), `videoUrl` (or `video`, which keeps the editor's URL).
- **Phone and visibility settings**: `mobile={{ … }}`, `hideOnMobile`, `hideOnDesktop`.

A link is the URL the builder exports for it: the editor saves a link as an action (a web page, an email, a phone call, a text message) with templates its export fills in, so an email link is `href="mailto:support@example.com?subject=Help"` (its subject and body encoded as the builder encodes them, empty ones left out), a phone call `tel:…`, a text message `sms:…`. The builder opens such a URL as that action again. A link to a page section, or of a link type of your own, is written as its URL too, which the builder opens as a web link (said); a link with more than a URL holds (code it runs, a class, a download, a `rel` or `title`, data attributes, any other attribute) is written as the design has it (said too), and Elements' HTML doesn't write those as the builder does.

A text block without a color of its own shows the body's text color in the editor; Elements always writes a color, so the code gives it that one. Likewise in a right-to-left design: the editor shows a text block without an alignment left-aligned, where Elements would align it right, so the code sets `textAlign="left"`.

## What goes in `values`

Anything a prop can't hold as it is goes in the component's `values` escape hatch, which the component merges under its props:

- **Builder settings no prop sets**: an `anchor`, a display condition, `locked`, phone settings the `mobile` prop doesn't take.
- **Values a prop would change or can't type**: a number where the prop writes px (`fontSize: 14`), a `lineHeight` number, a numeric `fontWeight` string, a font with more than its label and value on a block (the editor's web fonts), a value outside what a prop's type takes (an alignment like `start`), and settings a component's props don't list (a table's `headerColor`).

Every component's `values` takes as many of its values as you set, at any depth (the defaults fill in the rest), so the code writes them as they are:

```tsx
<Paragraph values={{ anchor: "intro" }}>Hello</Paragraph>
```

The type checks the keys, so a misspelled one is a type error, and takes any text, number or true/false in them, as the builder stores them (`lineHeight: 1.5`). Where a design holds a key the types don't have (one a newer builder writes, an image's `href`), the code writes that one object as the component's `values` type, so it still type-checks, and imports the type:

```tsx
import { …, Image, type ImageProps } from "@unlayer/react-elements";

<Image
  src="https://example.com/a.png"
  values={
    {
      href: { name: "web", values: { href: "https://example.com" } },
    } as unknown as ImageProps["values"]
  }
/>
```

## What becomes `<Html>` or a TODO

Blocks Elements has no component for (custom tools, forms, timers, carousels) are kept as `<Html>` blocks with their HTML when you pass the design's exported HTML (`html` option): each block's HTML is found by its id in it. They then open in the editor as HTML blocks, not as the tool they were. Without exported HTML, each is a `{/* TODO … */}` comment where it was, and a warning.

## Warnings

Each warning names where it is (`Row 2, column 1, block 3: …`). They say:

- a block has no Elements component (kept as `<Html>`, or left out as a TODO);
- the editor's Lexical `paragraph` block is a Paragraph, a `text` block with the same HTML;
- a builder flag is `false` (`selectable`, `draggable`, `duplicatable`, `deletable`, `hideable`): renderToJson writes them as `true`;
- an image's fixed width is in px: the design keeps it as the percent of its column it is;
- a link is written as its URL where the builder opens that URL as a web link (a page section's), or as the design has it where a URL can't hold it (code it runs, a class, a download, a `rel` or `title`, data attributes, any other attribute);
- a value comes back in the form Elements writes it, not as the design has it (a row's `noStackMobile` at the top of its values goes to its phone settings, where the exporters read it);
- row, column and block ids aren't kept (the editor gives new ones), a document's headers and footers are left out, the design's schema version isn't this Elements' (open and save it in the editor first), a popup design is written as a `<Page>`.

## The round trip

`renderToJson()` of the generated component gives the design back, as the builder shows it. Codegen's tests check it over the examples, the demo's templates, designs the editor saved and random designs, each also type-checked. The comparison leaves aside:

- `counters`, `schemaVersion`, node `id`s and `_meta.htmlID`/`htmlClassNames` (numbering, which the editor assigns);
- a value missing and the same value at the builder's default (the builder fills defaults in; an image without `autoWidth` is sized automatically);
- a text block's missing color and the body's text color;
- `textJson` beside `text` (`text` is what the builder renders and exports), and a Lexical `paragraph` block as a `text` block with its HTML;
- colors and font stacks written another way, links in their other shape (a URL string and `{ name: "web", values: { href } }`; an email, phone call or text message link and a web link to the URL it exports, which the builder opens as that link), paddings written shorter (`0px 0px` and `0px`), and a bare zero in a px length (`0 0 12px` and `0px 0px 12px`: renderToJson writes `0px`, as the design's schema types it);
- device settings that are off (`hideMobile: false`) and empty ones, and a row's `noStackMobile` at the top of its values (read as its phone setting, where the exporters read it);
- a font without its family's web font URL where another font of that family has it (the builder loads a family's web font for all its fonts, and a `<Font>` writes its URL on each).

What doesn't come back: builder flags set to `false` (above), a px image width (it comes back as a percent), a link to a page section or of a link type of your own (it comes back as a web link to its URL), and blocks without an Elements component (they come back as HTML blocks, or not at all).

The code is Elements code from then on: it doesn't bring back the React components, logic or data a template had before it was a design (a design made from Elements code comes back as its rows and blocks, with the values it rendered).
