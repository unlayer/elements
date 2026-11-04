# @unlayer/react-elements

React component library for transactional emails, email templates, landing pages, invoices, reports, documents, and PDFs. Render email-safe HTML, responsive web HTML, and print-ready HTML for PDF from the same React components. Full SSR support — works with `renderToHtml`, `renderToString`, Next.js, Remix, and any server-side framework.

## Installation

```bash
npm install @unlayer/react-elements
# or
pnpm add @unlayer/react-elements
```

## New components (`@unlayer/react-elements/primitives`)

A preview of the next major version, at its own entry: new components with typed `style` props, one template for an email, a web page, a printed document or an image, and `validate()` to check a template before it's sent. The components further down (the main import) keep their API and render through the same new engine since 0.3.0 (see [The rendering engine](#the-rendering-engine)); they don't mix with these: a template uses one set or the other.

**With an AI agent:** in Claude Code, add this line to your project's `CLAUDE.md`, and every session starts out knowing these components:

```
@node_modules/@unlayer/react-elements/PRIMITIVES.md
```

For Codex, Cursor and other agents, add to `AGENTS.md` (or a rule): "Before writing an Elements template, read node_modules/@unlayer/react-elements/PRIMITIVES.md."

Or install the same guide as an agent skill: `npx skills add unlayer/elements`.

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

```tsx
import { outline, render, validate } from "@unlayer/react-elements/primitives";

const { html, text, diagnostics } = await render(<Receipt />); // warnings in diagnostics; errors throw an ElementsError
const { valid } = validate(<Receipt />); // the same checks, without rendering
console.log(outline(<Receipt />)); // the laid-out template as text: each block, its width, its words
```

**To the Unlayer builder and back** (`@unlayer/react-elements/builder`): `toDesign()` writes a template as the builder's design JSON, for `loadDesign()`; `fromDesign()` reads a design (made by `toDesign()`, edited in the builder or made there) back as a template, as an element to render and as JSX source.

```tsx
import { fromDesign, toDesign } from "@unlayer/react-elements/builder";

const { design, report } = toDesign(<Receipt />); // report: what the builder can't hold as it is, one line each
// …the design is edited in the builder, and saved…
const { element, code, report: read } = fromDesign(saved, { displayMode: "email" }); // "web" a Page, "document" a Document
```

The design holds no Elements data. A style or prop a builder tool has no field for is a hidden property of that tool, kept in the design under its own name and drawn by Elements, with no editor in the builder yet. What the builder can't arrange comes back with the same look, flatter: a Section around several Rows as a Section each, a box's padding on its blocks, a Grid as Rows of Columns. What no tool shows (a Layer, an Svg, a Table, a box nested in a column, your own `component()`) goes as an HTML block of the new engine's markup, and comes back as an `Html` block, as the builder's own HTML blocks do. A design's markup comes back as it is: where designs can hold untrusted content, pass your sanitizer, `fromDesign(saved, { toSafeHtml })`.

**To write one, read [PRIMITIVES.md](./PRIMITIVES.md)** in this package: how a template is written, how the new components differ from the ones below, and every component on a line. [PRIMITIVES-REFERENCE.md](./PRIMITIVES-REFERENCE.md) has every prop and style in full. Both are written from the components' definitions. To move templates from the components below, see the [migration guide](https://github.com/unlayer/elements/blob/main/docs/migrating-to-primitives.md) and `npx @unlayer/migrate --from elements`.

## Quick Start

The rest of this README is about the main import, today's components. For the new ones, see [New components](#new-components-unlayerreact-elementsprimitives).

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

**Try it in your browser:** the [Elements Playground](https://examples.unlayer.com/examples/elements-playground/) renders Elements code as an email, page, or document with nothing to install, and can open the result in the Unlayer builder.

## Using with AI agents (Claude, Cursor, etc.)

Assembling these templates in code is something AI coding agents do well. The official **`unlayer-elements`** skill teaches them the strict structure, the canonical prop shapes, the image-sizing model, and the patterns that make generated emails actually look good:

```bash
npx skills add unlayer/unlayer-skills
```

This installs the `unlayer-elements` skill (alongside the other Unlayer skills). Your agent then knows how to build emails, pages, and documents with these components and render them via `renderToHtml` / `renderToJson`. See [unlayer/unlayer-skills](https://github.com/unlayer/unlayer-skills).

The skill teaches the main import's components. For the [new components](#new-components-unlayerreact-elementsprimitives), install this repository's skill instead (`npx skills add unlayer/elements`), or give your agent [PRIMITIVES.md](./PRIMITIVES.md) from this package: how a template is written and every component, short enough to read whole. Both skills are named `unlayer-elements`, so a project has one or the other.

Agents can also preview Elements code without installing anything through the [Elements Playground](https://examples.unlayer.com/examples/elements-playground/):

- Open `https://examples.unlayer.com/examples/elements-playground/#code=<base64url of the code>` to render a snippet. Add `&mode=email|page|document` to pick the output and `&view=preview` to hide the editor.
- In browsers with [WebMCP](https://webmachinelearning.github.io/webmcp/), the page registers `render_elements` (code to HTML, design JSON, or plain text) and `show_elements_preview` tools.

## Task guides and runnable examples

- [Transactional email in React](https://github.com/unlayer/elements/blob/main/packages/react/docs/transactional-email.md): render HTML and plain text, then send a receipt.
- [Resend, AWS SES, Postmark, SendGrid, and Nodemailer](https://github.com/unlayer/elements/blob/main/packages/react/docs/email-providers.md): complete provider integrations.
- [One React template to email, web, and PDF](https://github.com/unlayer/elements/blob/main/packages/react/docs/one-template-email-web-pdf.md): shared invoice content with output-specific roots.
- [React invoice PDF with Playwright](https://github.com/unlayer/elements/blob/main/packages/react/docs/react-to-pdf.md): generate actual PDF bytes from document HTML.
- [React to Unlayer visual editing](https://github.com/unlayer/elements/blob/main/packages/react/docs/visual-editing.md): `renderToJson()`, editor loading, export, and supported tree constraints.

See [when to choose Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/README.md) and the [runnable example](https://github.com/unlayer/elements/tree/main/examples/content-workflows).

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
- **Text shows as typed**: Heading and Button children and text placed straight in a Row or Column show markup and entities as written, as React shows text (`{"Terms &amp; Conditions"}` shows `&amp;`; in JSX text, `Terms &amp; Conditions` is already `&`). Put markup in Paragraph's `html` prop or an `<Html>` block, and template syntax with `<` or `>` in it (a Liquid `{% if count > 1 %}`) in the `text` prop. An email service's `<%name%>` tag stays as written, for it to fill in. Menu item text shows markup as typed; in an email, an entity (`&rarr;`) and a single quote stay as written, as in 0.1.22, and a double quote is escaped, also in a template tag (the text is also written in an `aria-label`): write a template's string in single quotes (`{{ name | default: 'you' }}`; in Go templates, backticks).
- **`text` and `html` props are HTML**: Heading's and Button's `text` prop, like Paragraph's `html` and `<Html>`, is written into the email as given (as in 0.1.22). Put only markup you wrote there: a value a user typed (a name, a message) goes in as children, which show it as text.
- **Link URLs**: `"`, `<` and `>` are percent-encoded, so a URL can't end its attribute. Fill template tags that contain them (a Liquid filter with quotes) in before rendering; a `<%name%>` tag stays as written.
- **Your own components** render as React renders them: hooks, Context (also from a Provider around the root) and Fragments work. One that's async, suspends or throws is left out with a console message, and the rest renders. Elements renders the template once, and may call a component once more on its own, to take the HTML it puts in a Column or to say why it failed (the whole template once more when it holds markup React rejects), so keep side effects, like creating a coupon code, out of rendering.
- **Inside your own render**: `renderToHtml`, `renderToJson` and `renderToPlainText` can run while React renders (a preview page's `useMemo`, a client component, Next.js's server render of one). Inside react-dom/server's own `renderToString`, Elements renders with another of react-dom's modules where a synchronous `require` can load one with your React (CommonJS, Jest, an ES module on Node 20.16+ / 22.3+). Where it can't (a bundle with React in it, some test runners' module registries), it renders with the same module, as 0.1.22 did: call it in the component's body, not in `useMemo` and not before another hook (React keeps a render's hooks in that module), or render first and pass the result as a prop. In Next.js's edge runtime, react-dom can't render at all (React there is React Server Components'): render emails in the Node.js runtime. Waku's Server Components get a `react-dom/server` that can't render either (every release of Elements fails there): render emails in a Client Component.

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
| `<PageBreak>` | Force subsequent document content onto a new PDF page |
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
- `previewText?: string` — plain text shown in email client inboxes, escaped for HTML. Pass `"Fish & chips"`, not `"Fish &amp; chips"`; entities supplied in the string display literally.
- `textDirection?: string` — document direction (`"ltr"` or `"rtl"`), kept in design JSON. When opening the design in the editor, also set its direction with `unlayer.setTextDirection(...)`.
- `lang?: string` — document language, such as `"ar"`; emitted on `<html>` by `renderToHtml`. Language is document metadata and is not stored in design JSON. Renderer options override both props.

### Page
Root wrapper for responsive web display. Same props as Email.

### Document
Root wrapper for print/PDF rendering. It accepts the shared Body props plus:
- `documentSize?: "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid"` — `"A4"`
- `documentOrientation?: "portrait" | "landscape"` — `"portrait"`

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
- `repeatHeaderOnEachPage?: boolean` — `true`
- `enableFooter?: boolean` — `false`
- `repeatFooterOnEachPage?: boolean` — `true`

### PageBreak
Forces the next block onto a new page in document output. It is inert in email and web output.

```tsx
<Document>
  <Row>
    <Column>
      <Paragraph>Page one</Paragraph>
      <PageBreak />
      <Paragraph>Page two</Paragraph>
    </Column>
  </Row>
</Document>
```

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

## The rendering engine

Since 0.3.0 these components render entirely through Elements' own writers, open source in this repository. `@unlayer/exporters` is no longer a dependency. Your templates and the functions you call don't change. Content, links, images and layout are preserved; the HTML may change; input that can't be drawn gets a diagnostic (a `[Unlayer]` console warning), never silent loss. A few small differences from 0.2.1 are listed below, each with its reason.

This was checked against the published 0.2.1 and the Unlayer editor's own export, in Chromium, on desktop and on phones. The new output is checked in Chromium and against a model of Outlook, not in real Outlook.

**New errors.** `renderToHtml`, `renderToHtmlParts` and `renderToPlainText` throw, saying what to do, where 0.2.1 wrote something anyway:

- a `<div>` as the root, or a component returning plain markup: put the markup in an `<Html>` block inside a root;
- a root inside markup (`<div><Email>…</Email></div>`), or two roots: render each root on its own;
- more than 20 wrappers around the root: pass the root, or fewer wrappers;
- a root from a copy older than 0.3: a duplicate install, which `npm ls @unlayer/react-elements` shows.

A Row, Column or block on its own, and Rows in a list, still get a root around them.

**Drawn differently from 0.2.1.**

- **Rows with side padding:** an email no longer sits off centre and scrolls sideways in a window narrower than its content plus that padding.
- **Long words:** a word too long for its column wraps inside it, where 0.2.1's page let it run out of the column.
- **Dividers:** a divider's block on a page or in a printed document is exactly its line and its padding. 0.2.1's was 0.3 to 1.6px taller, by its font's metrics, which adds up down a page of dividers.
- **Font weights:** a weight that isn't a hundred (650) draws at the nearest hundred, with a warning. The new writers' weights are in hundreds.
- **Phone widths:** an image whose phone width can't be read keeps its place, with a warning. 0.2.1 let it run past the window, which scrolled sideways.
- **A Row in a Column:** it stays in its box and its blocks' phone settings apply. 0.2.1 lost those settings, and in an email ran it 20px past its box. A bare Column among an email's rows stacks to the window on a phone, where 0.2.1's was 500px wide and scrolled sideways.

**Other changes you could notice.**

- **Service tags in plain text:** plain text keeps an email service's tag, so the service still fills it in: `Hi <%= name %>, you have items`, where 0.2.1 wrote `Hi , you have items`. A heading's keeps a tag as written (`{% if orders > 1 %}THANKS{% endif %}`), where 0.2.1 uppercased it with the words.
- **Service tags in links:** a Button or Menu link holding a service tag no longer leaks markup into an email's plain text.
- **`onClick`:** a link's `onClick` isn't written, and a warning says so.
- **`javascript:` links:** on an image or a Button, one becomes a link to nothing, with a warning.
- **Image widths in email:** an image's `width` attribute is its column less its padding, the width it's drawn at (580 in a column of 600 with 10px of padding, where 0.2.1 wrote 600).
- **Generated ids and classes:** the ones 0.2.1 wrote for its own markup (`#u_row_1`, `#u_content_button_1`, `.u-row`, `.v-color`, `.v-button`) aren't written, so CSS that selects them no longer matches. Text kept as your own markup still has `.v-line-height`, `.v-font-size` and `.v-text-align`. Ids and classes you set in a block's or row's `_meta`, and a custom tool's `u_content_custom_<slug>_<n>` id and class, are kept.
- **Unusual input:** a Social icon with no name draws the rest of the block, with a warning, where 0.2.1's page lost the block. A table whose rows have more cells than its first row shares its columns evenly, with a warning.

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

The document shell matches the mode: `<Email>` gets Office's namespace plus the MSO conditional comments Outlook needs, `<Page>` gets a standard HTML5 shell, and `<Document>` gets a print/PDF-friendly shell. All three start with `<!DOCTYPE html>`. Options accept config overrides plus:

- `title` — document `<title>`
- `fonts` — web-font stylesheet URLs to load via `<link>` tags, e.g. `[{ url: "https://fonts.googleapis.com/css2?family=Inter" }]`

If your app owns the document shell (an existing page template, an ESP template, an iframe `srcdoc`), use `renderToHtmlParts` instead — it returns `{ head, body }` plus the granular pieces (`css`, `js`, `tags`) for pipelines that need them separately, e.g. CSS inlining. This mirrors the editor's [chunk parameters](https://docs.unlayer.com/builder/latest/export-html#chunk-parameters) with two deliberate differences: `tags` is extra (components can contribute head tags, and reassembling from `css` + `js` alone would drop them), and there is no `fonts` chunk (Elements has no font registry — pass font stylesheet URLs via `renderToHtml`'s `fonts` option instead).

```tsx
const { head, body, css, js, tags } = renderToHtmlParts(<Email>...</Email>);
// head = css/js/tags pre-assembled; css = raw stylesheet (no <style> wrapper)
```

## Custom Tools

**A custom tool is the custom component you create.** We keep the editor's term — Custom Tools — because it's the same API across the Builder and Elements, and that shared vocabulary is where the power is: the same definition you pass to the editor's [`unlayer.registerTool`](https://docs.unlayer.com/builder/tools/custom) renders from code too. Elements uses the `renderer.exporters` and `renderer.head` halves of the definition; the editor-only parts (`label`, `icon`, `options`, `Viewer`, `validator`) are accepted and ignored:

```tsx
import { registerTool, Email, Row, Column, renderToHtml, renderToJson } from '@unlayer/react-elements';
import { countdownTool } from './countdown-tool'; // the same object you register in the editor

const Countdown = registerTool(countdownTool); // same term, same config as the editor

const tree = (
  <Email>
    <Row><Column>
      <Countdown endTime="2026-08-01T00:00:00Z" digitColor="#e11d48" />
    </Column></Row>
  </Email>
);

renderToHtml(tree);  // renders via YOUR exporters, in a box with the tool's id and class
renderToJson(tree);  // emits { type: "custom", slug: "countdown", values } — opens in the Builder as the real tool
```

- Props are the tool's `values` (flat), merged over the definition's defaults; `values={{...}}` works as an escape hatch.
- Modes fall back like the editor: `document` uses the `web` exporter; an email-only tool renders via its `email` exporter everywhere.
- **Sanitization:** when your config provides `toSafeHtml`, the tool's HTML output is passed through it (matching editor exports). The default config has no sanitizer — configure one if tool values can contain untrusted content.
- **Reading designs back:** `fromDesign()` (`/builder`) takes the same sanitizer as an option, `fromDesign(design, { toSafeHtml })`: every builder HTML block's markup, and every text's before it's read, goes through it. Without one, a design's markup is kept as it is — give one if designs can hold untrusted content.

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

## Phone settings

Rows, columns and content items accept `mobile` settings with the same flat CSS inputs as desktop props. For example:

```tsx
<Column padding="24px 40px" mobile={{ padding: "16px 20px" }}>
  <Heading fontSize={32} mobile={{ fontSize: 24, lineHeight: "120%", textAlign: "center" }}>Welcome</Heading>
  <Image src={{ url: "https://example.com/photo.png", width: 800 }} width="50%" mobile={{ autoWidth: true }} />
  <Paragraph hideOnMobile>Desktop detail</Paragraph>
  <Paragraph hideOnDesktop>Phone detail</Paragraph>
</Column>
```

Supported settings are padding, content `containerPadding`, font size, line height, text alignment and image/button width (`width`, `maxWidth`, `autoWidth`), where the component supports them. Numeric padding and font sizes use pixels; numeric line height is a multiplier. Phone CSS applies at 480px and below, matching the editor. `noStackMobile` still controls column stacking separately.

`hideOnMobile` and `hideOnDesktop` work on rows and content, as in the editor; a column can't be hidden on its own (hide its content or its row). `renderToJson` stores these settings in `_override.mobile` and `_override.desktop`, so designs keep them when opened in the visual editor. Image `autoWidth` follows the editor's natural-size cap. Document output keeps its desktop settings.

## Development

```bash
pnpm build          # Build the package
pnpm test           # Run tests
pnpm storybook      # Launch Storybook
```

## License

MIT
