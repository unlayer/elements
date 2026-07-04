# @unlayer/react-elements

React components for building emails, pages, and documents with Unlayer Elements. Full SSR support — works with `renderToHtml`, `renderToString`, Next.js, Remix, and any server-side framework.

## Installation

```bash
npm install @unlayer/react-elements
# or
pnpm add @unlayer/react-elements
```

## Quick Start

```tsx
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button } from '@unlayer/react-elements';

function WelcomeEmail() {
  return (
    <Email backgroundColor="#f0f0f0" contentWidth="600px">
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="20px">
        <Column>
          <Heading
            fontSize="24px"
            fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }}
          >
            Hello World
          </Heading>
        </Column>
        <Column>
          <Paragraph html="Welcome to our newsletter!" fontSize="14px" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} padding="10px">
        <Column>
          <Button
            href="https://example.com"
            backgroundColor="#0879A1"
            color="#ffffff"
          >
            Click Me
          </Button>
        </Column>
      </Row>
    </Email>
  );
}
```

## Using with AI agents (Claude, Cursor, etc.)

Assembling these templates in code is something AI coding agents do well. The official **`unlayer-elements`** skill teaches them the strict structure, the canonical prop shapes, the image-sizing model, and the patterns that make generated emails actually look good:

```bash
npx skills add unlayer/unlayer-skills
```

This installs the `unlayer-elements` skill (alongside the other Unlayer skills). Your agent then knows how to build emails, pages, and documents with these components and render them via `renderToHtml` / `renderToJson`. See [unlayer/unlayer-skills](https://github.com/unlayer/unlayer-skills).

## Critical Rules

These props have non-obvious shapes that **must** be followed exactly:

- **fontFamily**: Accepts a plain family-name string (`fontFamily="Georgia"`) or, for a full stack, `{ label, value }` (recommended).
  ```tsx
  fontFamily={{ label: "Arial", value: "arial, sans-serif" }}
  ```
- **fontWeight**: Accepts a number (`700`), a numeric string (`"700"`), or a CSS keyword (`"bold"`).
- **fontSize / padding**: Accept a CSS string (`"28px"`, `"20px 40px"`) or a bare number (treated as px: `fontSize={28}` → `28px`).
- **lineHeight**: Accepts a CSS string (`"1.4"`, `"140%"`) or a bare number (kept **unitless**: `lineHeight={1.4}` → `"1.4"`).
- **Wrapper component**: Use `<Email>`, `<Page>`, or `<Document>` as root — they set the rendering mode automatically.
- **href**: Can be a plain string URL (auto-wrapped) or `{ name: "web", values: { href, target } }`.
- **Image sizing**: `src` is a plain URL string or `{ url, width?, height?, ... }`, where `width`/`height` are the image's **natural** size. By default an image is **responsive** — it fills its container, capped at its natural size. For a **fixed** display size, use a **percent**: `width="50%"` or `maxWidth="50%"`. A px/number `width` is treated as the natural size, so `width="300px"` shows the image at up to 300px (responsive).
- **Heading level**: `headingType` (or its alias `level`) accepts `h1`–`h6`.
- **children**: Text components accept children as shorthand. `<Heading>Hello</Heading>` sets the heading text. `<Paragraph>` supports children for plain text.
- **Paragraph text**: Use `html` prop for text content (supports inline formatting like `<b>`, `<a>`). Use children for plain text.

## Structure: Email/Page/Document > Row > Column > Items

```
<Email>          ← root wrapper for email-safe HTML (tables)
<Page>           ← root wrapper for responsive web (div + flexbox)
<Document>       ← root wrapper for print/PDF

  <Row>          ← layout container, use layout={ColumnLayouts.X} or cells={[1,1]}
    <Column>     ← must match layout column count
      <Button /> ← item components go inside columns
      <Paragraph />
    </Column>
  </Row>
</Email>
```

## Components

### Root Wrappers

| Component | Description |
|-----------|-------------|
| `<Email>` | Root wrapper for email-safe HTML (tables for Outlook, Gmail, Yahoo). |
| `<Page>` | Root wrapper for responsive web display (div + flexbox). |
| `<Document>` | Root wrapper for print-optimized / PDF rendering. |

### Layout

| Component | Description |
|-----------|-------------|
| `<Row>` | Layout container. Accepts `layout={ColumnLayouts.X}` or `cells={[1, 1]}`. |
| `<Column>` | Column inside a Row. Number of Columns must match the layout. |

### Content

| Component | Description |
|-----------|-------------|
| `<Button>` | CTA button with hover states, links, and full styling |
| `<Paragraph>` | Rich text with `html` (formatted) prop or children (plain text) |
| `<Heading>` | Heading (h1-h4) with `headingType` prop |
| `<Image>` | Responsive image with `src` / `altText` props |
| `<Divider>` | Horizontal rule / separator |
| `<Social>` | Social media icons with `icons` shorthand array |
| `<Menu>` | Navigation menu with `items` shorthand array |
| `<Table>` | Data table with `headers` / `data` shorthands |
| `<Video>` | Video embed with `videoUrl` shorthand |
| `<Html>` | Custom HTML passthrough |

## Component Reference

### Email
Root wrapper for email-safe HTML. Same props as Body (without `mode`).
- `backgroundColor?: string` — `"#F7F8F9"`
- `contentWidth?: string` — `"500px"`
- `contentAlign?: string` — `"center"`
- `fontFamily?: { label: string, value: string }` — `{ label: "Arial", value: "arial,helvetica,sans-serif" }`
- `textColor?: string` — `"#000000"`
- `linkStyle?: { linkColor, linkHoverColor, linkUnderline, linkHoverUnderline }`
- `previewText?: string` — preview text shown in email client inboxes

### Page
Root wrapper for responsive web display. Same props as Email.

### Document
Root wrapper for print/PDF rendering. Same props as Email.

### Row
Layout container. Must be child of Email/Page/Document/Body.
- `layout?: ColumnLayout` — use `ColumnLayouts.X`
- `cells?: number[]` — alternative to layout
- `backgroundColor?: string`
- `padding?: string` — `"0px"`
- `noStackMobile?: boolean` — `false`

### Column
Must be child of Row. Count must match layout.
- `padding?: string` — `"10px"`
- `backgroundColor?: string`
- `borderRadius?: string`

### Button
- `text?: string` — `"Button"` (or use children)
- `href?: string | Href` — plain string auto-wrapped
- `backgroundColor?: string` — `"#0879A1"`
- `color?: string` — `"#FFFFFF"`
- `hoverBackgroundColor?: string`
- `hoverColor?: string`
- `fontSize?: string` — `"14px"`
- `fontWeight?: number` — `400`
- `fontFamily?: { label: string, value: string }`
- `padding?: string` — `"10px 20px"`
- `borderRadius?: string` — `"4px"`
- `width?: number | string` — display width; `width="100%"` makes the button full-width, `width="200px"` pins it
- `textAlign?: "left" | "center" | "right"` — `"center"`

### Paragraph
- `html?: string` — **rich HTML string** with inline formatting: `<b>`, `<i>`, `<u>`, `<s>`, `<a>`, `<code>`
- `children` — plain text shorthand (auto-converted internally)
- `fontSize?: string` — `"14px"`
- `color?: string` — `"#000000"`
- `textAlign?: "left" | "center" | "right"` — `"left"`
- `lineHeight?: string` — `"140%"`
- `fontFamily?: { label: string, value: string }`

Use `html` for formatted text, children for plain text.

```tsx
<Paragraph html="Hello <b>bold</b> and <a href='#'>link</a>" fontSize="14px" />
<Paragraph fontSize="14px">Plain text paragraph</Paragraph>
```

### Heading
- `text?: string` — `"Heading"` (or use children)
- `headingType?: "h1" | "h2" | "h3" | "h4"` — `"h1"`
- `fontSize?: string` — `"22px"`
- `fontWeight?: number` — `400`
- `fontFamily?: { label: string, value: string }`
- `color?: string` — `"#000000"`
- `textAlign?: "left" | "center" | "right"` — `"left"`
- `lineHeight?: string` — `"110%"`

### Divider
- `borderTopWidth?: string` — `"1px"`
- `borderTopColor?: string` — `"#BBBBBB"`
- `borderTopStyle?: string` — `"solid"`
- `textAlign?: "left" | "center" | "right"` — `"center"`

### Image
- `src?: string | { url, width?, autoWidth?, maxWidth? }` — string URLs auto-wrapped
- `altText?: string` — alt text for accessibility
- `textAlign?: "left" | "center" | "right"` — `"center"`
- `action?: { name: "web", values: { href, target } }`

### Video
- `videoUrl?: string` — YouTube/Vimeo URL, auto-parsed
- `video?: { type: "youtube" | "vimeo", videoId, thumbnail }` — manual control

### Html
- `html?: string` — `"<p>Custom HTML content</p>"`

### Table
- `headers?: string[]` — shorthand for column headers
- `data?: string[][]` — shorthand for row data
- `columns?: number` — `3`
- `rows?: number` — `3`
- `enableHeader?: boolean` — `true`

### Social
- `icons?: { name: string, url: string }[]` — shorthand
- `iconType?: "circle" | "rounded" | "squared"` — `"circle"`
- `iconSize?: number` — `32`
- `spacing?: number` — `10`
- `align?: "left" | "center" | "right"` — `"center"`

### Menu
- `items?: { text: string, href: string, target?: string }[]` — shorthand
- `layout?: "horizontal" | "vertical"` — `"horizontal"`
- `separator?: string` — `"|"`
- `align?: "left" | "center" | "right"` — `"center"`

## Column Layouts

Pre-built layouts for common column configurations:

```tsx
import { Row, Column, ColumnLayouts } from '@unlayer/react-elements';

// Each Row must contain the matching number of <Column> children.
<Row layout={ColumnLayouts.OneColumn}>                {/* [1]       → 100% */}
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoEqual}>                 {/* [1,1]     → 50% + 50% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoWideNarrow}>            {/* [2,1]     → 67% + 33% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.TwoNarrowWide}>            {/* [1,2]     → 33% + 67% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.ThreeEqual}>               {/* [1,1,1]   → 33% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.ThreeNarrowWideNarrow}>    {/* [1,2,1]   → 25% + 50% + 25% */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.FourEqual}>                {/* [1,1,1,1] → 25% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row layout={ColumnLayouts.FiveEqual}>                {/* [1,1,1,1,1] → 20% each */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
<Row cells={[3, 1]}>                                  {/* Custom ratio */}
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>
```

Number of `<Column>` children must match the layout.

## Rendering Modes

Use the semantic wrapper component that matches your target:

```tsx
<Email>...</Email>       // Email-client safe (tables for Outlook, Gmail, Yahoo)
<Page>...</Page>         // Responsive web (div + flexbox)
<Document>...</Document> // Print/PDF optimized
```

Each wrapper threads the correct mode to all children automatically.

## renderToHtml

Render any element tree to a complete, ready-to-use HTML document — from `<!DOCTYPE ...>` to `</html>` — with no React hydration markers. Perfect for email sending and PDF generation:

```tsx
import { renderToHtml, Email, Row, Column, ColumnLayouts, Paragraph, Button } from '@unlayer/react-elements';

const html = renderToHtml(
  <Email backgroundColor="#f4f4f4">
    <Row layout={ColumnLayouts.OneColumn}>
      <Column>
        <Paragraph html="Hello World" fontSize="14px" />
        <Button
          backgroundColor="#3b82f6"
          color="#ffffff"
        >
          Click me
        </Button>
      </Column>
    </Row>
  </Email>,
  { title: "Welcome" }
);
```

The document shell matches the mode: `<Email>` gets the XHTML transitional doctype plus the MSO conditional comments Outlook needs, `<Page>` gets a standard HTML5 shell, and `<Document>` gets a print/PDF-friendly XHTML shell. Options accept config overrides plus:

- `title` — document `<title>`
- `fonts` — web-font stylesheet URLs to load via `<link>` tags, e.g. `[{ url: "https://fonts.googleapis.com/css2?family=Inter" }]`

If your app owns the document shell (an existing page template, an ESP template, an iframe `srcdoc`), use `renderToHtmlParts` instead — it returns `{ head, body }` chunks for you to place yourself.

## UnlayerProvider

Configure global settings like CDN base URL, merge tags, text direction, and rendering mode:

```tsx
import { UnlayerProvider, Email, Row, Column, Social, Menu } from '@unlayer/react-elements';

function App() {
  return (
    <UnlayerProvider config={{
      cdnBaseUrl: "https://my-cdn.example.com",
      mergeTagState: { firstName: "Jane", company: "Acme" },
      textDirection: "ltr"
    }}>
      <Email>
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} />
            <Menu items={[{ text: "Home", href: "/" }, { text: "About", href: "/about" }]} />
          </Column>
        </Row>
      </Email>
    </UnlayerProvider>
  );
}
```

**Important:** The root wrapper (`Email`/`Page`/`Document`) bridges the provider context to child components. Components inside `UnlayerProvider` but without a root wrapper won't receive the config.

## Types

All types are exported and sourced from `@unlayer/types`:

```tsx
import type {
  ButtonValues, SocialValues, TableValues,
  Href, Icons, TextAlign, LinkStyle,
  SocialIcon, MenuItem,
  ButtonProps, MenuProps, ImageProps,
} from '@unlayer/react-elements';
```

## Common Font Stacks

fontFamily must always be an object. Here are ready-to-use stacks:

```tsx
const sansFont = { label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" };
const serifFont = { label: "Georgia", value: "Georgia, 'Times New Roman', Times, serif" };
const monoFont = { label: "Monospace", value: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace" };
```

## Common Design Patterns

### Header with Logo

```tsx
<Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 40px">
  <Column>
    <Image src="https://example.com/logo.png" altText="Logo" textAlign="left" />
  </Column>
</Row>
```

### Accent Bar

```tsx
<Row layout={ColumnLayouts.OneColumn} backgroundColor="#4f46e5" padding="0px">
  <Column>
    <Divider borderTopWidth="3px" borderTopColor="#4f46e5" borderTopStyle="solid" />
  </Column>
</Row>
```

### Feature Grid (2×2)

```tsx
<Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 40px">
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Feature 1</Heading>
    <Paragraph html="Description of the feature." fontSize="13px" color="#71717a" />
  </Column>
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Feature 2</Heading>
    <Paragraph html="Description of the feature." fontSize="13px" color="#71717a" />
  </Column>
</Row>
```

### Metric Cards (3-column)

```tsx
<Row layout={ColumnLayouts.ThreeEqual} backgroundColor="#ffffff" padding="0px 40px">
  <Column>
    <Heading headingType="h2" fontSize="28px" fontWeight={700} color="#0f172a" textAlign="center">1.2M</Heading>
    <Paragraph html="API Calls" fontSize="12px" color="#94a3b8" textAlign="center" />
  </Column>
  {/* Repeat for each metric */}
</Row>
```

### Product Card (image + details)

```tsx
<Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="20px 40px">
  <Column>
    <Image src="https://example.com/product.jpg" altText="Product" />
  </Column>
  <Column>
    <Heading headingType="h3" fontSize="16px" fontWeight={600} color="#1a1a1a">Product Name</Heading>
    <Paragraph html="Matte White · Medium" fontSize="13px" color="#a1a1aa" />
    <Heading headingType="h3" fontSize="16px" fontWeight={700} color="#1a1a1a">$89.00</Heading>
  </Column>
</Row>
```

### Footer

```tsx
<Row layout={ColumnLayouts.OneColumn} padding="20px 40px 40px 40px">
  <Column>
    <Paragraph html="Company Name · City, State" fontSize="12px" color="#a1a1aa" textAlign="center" />
  </Column>
</Row>
```

## Common Mistakes

1. **Column count mismatch** — `TwoEqual` layout requires exactly 2 `<Column>` children
2. **Missing Column** — Items must be inside `<Column>`, never directly in `<Row>`
3. **Missing Row** — Columns must be inside `<Row>`, never directly in `<Email>`/`<Page>`/`<Document>`
4. **JSX formatting in children** — `<Heading>Hi <b>x</b></Heading>` is flattened to plain text (the formatting is **not** preserved). For inline formatting use `<Paragraph html="Hi <b>x</b>" />`.

> Note: the CSS-idiom forms that used to be mistakes now work — a string `fontFamily`, a string/number `fontWeight`, a numeric `fontSize`, `padding="0"`, and `<Paragraph text="..." />` are all accepted and normalized. The object/numeric forms above are still recommended for clarity.

## Development

```bash
pnpm build          # Build the package
pnpm test           # Run tests
pnpm storybook      # Launch Storybook
```

## License

MIT
