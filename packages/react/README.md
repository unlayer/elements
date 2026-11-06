# @unlayer/react-elements

React components for transactional emails, email templates, landing pages, invoices, reports and documents. One template renders to email-safe HTML, a responsive web page, print-ready HTML, a PDF or an image, on your own server, with no network calls.

## Installation

```bash
npm install @unlayer/react-elements
# or
pnpm add @unlayer/react-elements
```

## Quick start

Import from `@unlayer/react-elements`. A template has one root, its styles go in `style={{ }}`, and the space between blocks is their parent's `gap`.

```tsx
import { Button, Column, Email, Heading, Image, Link, List, ListItem, MergeTag, Paragraph, Row, Span, Table, TableCell, TableRow } from "@unlayer/react-elements";

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
            <Paragraph style={{ fontWeight: 700 }}>Shipping to</Paragraph>
            <Paragraph>Ada Lovelace, London</Paragraph>
          </Column>
          <Column>
            <Paragraph style={{ fontWeight: 700 }}>Next steps</Paragraph>
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
      <Paragraph style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Email>
  );
}
```

```tsx
import { outline, render, validate } from "@unlayer/react-elements";

const { html, text, diagnostics } = await render(<Receipt />); // warnings in diagnostics; errors throw an ElementsError
const { valid } = validate(<Receipt />); // the same checks, without rendering
console.log(outline(<Receipt />)); // the laid-out template as text: each block, its width, its words
```

To write a template, read [GUIDE.md](./GUIDE.md): how a template is written, and every component on a line. [REFERENCE.md](./REFERENCE.md) has every prop and style in full. Both are written from the components' definitions.

Upgrading from Elements 0.2? See [Moving from Elements 0.2](#moving-from-elements-02).

## Using with an AI agent

**With an AI agent:** in Claude Code, add this line to your project's `CLAUDE.md`, and every session starts out knowing these components:

```
@node_modules/@unlayer/react-elements/GUIDE.md
```

For Codex, Cursor and other agents, add to `AGENTS.md` (or a rule): "Before writing an Elements template, read node_modules/@unlayer/react-elements/GUIDE.md."

Or install the same guide as an agent skill: `npx skills add unlayer/elements`.

## Structure

```
<Email>            ← the root: Email, Page, Document or Canvas
  <Section>        ← a band whose background spans the window (optional)
    <Row>          ← its children side by side, stacked on phones
      <Column>     ← its children stacked
        <Heading />
        <Paragraph />
        <Button />
      </Column>
    </Row>
  </Section>
</Email>
```

A root, a `Section` and a `Column` stack what they hold, so a block doesn't need a `Row` around it. There are no margins: space between blocks is their parent's `gap`, and space inside a box is its `padding`.

## Components

### Roots

| Component | Renders to |
|-----------|-------------|
| `<Email>` | Email-safe HTML: tables, with Outlook's markup in conditional comments |
| `<Page>` | A responsive web page |
| `<Document>` | Print-ready HTML on pages of its size, and a PDF with `@unlayer/react-elements/pdf` |
| `<Canvas>` | An image of a fixed size, with `@unlayer/react-elements/image` |

### Layout

| Component | Description |
|-----------|-------------|
| `<Section>` | A band across the whole window, directly in an Email or Page |
| `<Row>` | Its children side by side; stacked on phones |
| `<Column>` | Its children stacked, with its own spacing and box; with a background, a card |
| `<Grid>` | Its children in columns of equal width, row after row |
| `<Layer>` | Its children over each other: an image with words on it |

### Content

| Component | Description |
|-----------|-------------|
| `<Heading>` | A heading, `level` 1 to 6 |
| `<Paragraph>`, `<Paragraph>` | A block of text |
| `<Span>`, `<Link>`, `<LineBreak>`, `<MergeTag>` | Inside text: a styled run, a link, a new line, a value the sending service fills in |
| `<Button>` | A link drawn as a button, with its colors on hover |
| `<Image>` | An image; `src` has the file's size, `style.width` the size shown |
| `<Divider>` | A horizontal line |
| `<List>`, `<ListItem>` | A bulleted or numbered list |
| `<Table>`, `<TableRow>`, `<TableCell>` | A table of data |
| `<Video>` | A YouTube or Vimeo video: its player on a page, its linked thumbnail in an email |
| `<Social>` | A line of social network icons, each a link |
| `<Menu>` | A line or column of links |
| `<Svg>` and its shapes | Shapes drawn in a box of their own |
| `<Html>` | Markup written as it is, for what no component says |
| `<PageBreak>`, `<PageHeader>`, `<PageFooter>`, `<PageNumber>` | In a Document: where a page ends, what's on every page, and page numbers |

## Columns

A `Column` in a `Row` takes its `width`, or a share of what's left.

```tsx
import { Column, Grid, Row } from "@unlayer/react-elements";

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

// Side by side on phones too.
<Row stackOnMobile={false}>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Row>

// Rows of three, one under another on phones.
<Grid columns={3} style={{ gap: 16 }}>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
  <Column>{/* content */}</Column>
</Grid>
```

## Rendering

```tsx
const { html, text, head, body, bodyStyle, diagnostics } = await render(<Receipt />);
```

- `html` is the whole document, from `<!DOCTYPE html>`, with no React hydration markers and no client-side JavaScript.
- `text` is the plain-text version.
- `head`, `body` and `bodyStyle` are for embedding the output in a page of your own.
- `diagnostics` holds warnings and notes. A template with errors throws an `ElementsError`, whose `diagnostics` give each problem's `code`, `message` and `path`.

The options are `pretty` (the HTML indented, for reading it), `mergeTag` (how a merge tag is written, by default `{{name}}`) and `classPrefix` (what every class name starts with, for HTML embedded where other CSS is).

`validate()` runs the same checks without rendering, and `outline()` prints the laid-out template, to check the layout without reading the HTML.

## One template, every output

Share the content, and give each output its root:

```tsx
import { Button, Column, Document, Email, Heading, Page, Paragraph, render } from "@unlayer/react-elements";

const Invoice = () => (
  <Column style={{ gap: 12 }}>
    <Heading level={1} style={{ fontSize: 24 }}>Invoice 2705</Heading>
    <Paragraph>Thank you for your order.</Paragraph>
    <Button href="https://example.com/invoices/2705" style={{ backgroundColor: "#111827" }}>View it online</Button>
  </Column>
);

const email = await render(<Email><Invoice /></Email>);
const page = await render(<Page><Invoice /></Page>);
const printed = await render(<Document size="A4" margin={48}><Invoice /></Document>);
```

`printed.html` is print-ready HTML. For PDF files, [`@unlayer/react-elements/pdf`](https://github.com/unlayer/elements/blob/main/packages/react/docs/render-pdf.md) writes a `Document` with no browser, and [`@unlayer/react-elements/image`](https://github.com/unlayer/elements/blob/main/packages/react/docs/render-image.md) writes a `Canvas` as PNG or SVG.

## Phones and hover

`mobile` holds a component's styles on phones, `hidden` shows it on one size only, and `hover` holds its styles under the pointer. Each component's list is in [GUIDE.md](./GUIDE.md).

```tsx
<Heading style={{ fontSize: 32 }} mobile={{ fontSize: 24, textAlign: "center" }}>Welcome</Heading>
<Paragraph hidden={{ mobile: true }}>Desktop detail</Paragraph>
<Paragraph hidden={{ desktop: true }}>Phone detail</Paragraph>
<Button href="https://example.com" style={{ backgroundColor: "#111827" }} hover={{ backgroundColor: "#374151" }}>Buy</Button>
```

## Common design patterns

### Header with a logo

```tsx
<Section style={{ backgroundColor: "#ffffff", padding: [24, 40] }}>
  <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Logo" style={{ width: 120 }} />
</Section>
```

### Accent bar

```tsx
<Divider style={{ borderTop: "3px solid #4f46e5" }} />
```

### Feature grid

```tsx
<Grid columns={2} style={{ backgroundColor: "#ffffff", padding: [24, 40], gap: 24 }}>
  <Column style={{ gap: 4 }}>
    <Heading level={3} style={{ fontSize: 16, fontWeight: 600 }}>Feature 1</Heading>
    <Paragraph style={{ fontSize: 13, color: "#71717a" }}>Description of the feature.</Paragraph>
  </Column>
  <Column style={{ gap: 4 }}>
    <Heading level={3} style={{ fontSize: 16, fontWeight: 600 }}>Feature 2</Heading>
    <Paragraph style={{ fontSize: 13, color: "#71717a" }}>Description of the feature.</Paragraph>
  </Column>
</Grid>
```

### Metric cards

```tsx
<Row style={{ gap: 16 }}>
  <Column style={{ backgroundColor: "#ffffff", padding: 16, borderRadius: 8, textAlign: "center" }}>
    <Heading level={2} style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>1.2M</Heading>
    <Paragraph style={{ fontSize: 12, color: "#94a3b8" }}>API calls</Paragraph>
  </Column>
  {/* One Column for each metric */}
</Row>
```

### Product card

```tsx
<Row style={{ backgroundColor: "#ffffff", padding: [20, 40], gap: 16 }}>
  <Column style={{ width: 160 }}>
    <Image src={{ src: "https://example.com/product.jpg", width: 320, height: 320 }} alt="Product" style={{ width: "100%" }} />
  </Column>
  <Column style={{ gap: 4 }}>
    <Heading level={3} style={{ fontSize: 16, fontWeight: 600 }}>Product name</Heading>
    <Paragraph style={{ fontSize: 13, color: "#a1a1aa" }}>Matte white, medium</Paragraph>
    <Paragraph style={{ fontSize: 16, fontWeight: 700 }}>$89.00</Paragraph>
  </Column>
</Row>
```

### Footer

```tsx
<Section style={{ padding: [20, 40, 40, 40] }}>
  <Paragraph style={{ fontSize: 12, color: "#a1a1aa", textAlign: "center" }}>Company name, City, State</Paragraph>
</Section>
```

## Your own components

A function that returns components is a component of your own, as in [One template, every output](#one-template-every-output). For a named block with typed props and its own editors, use `component()`:

```tsx
import { Button, Column, Heading, Image, component, prop } from "@unlayer/react-elements";

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    name: prop.text({ label: "Name", required: true }),
    photo: prop.image({ label: "Photo", required: true }),
    href: prop.link({ label: "Link", required: true }),
    accent: prop.color({ label: "Accent", default: "#0879a1" }),
  },
  render: ({ name, photo, href, accent }) => (
    <Column style={{ gap: 8 }}>
      <Image src={photo} alt={name} />
      <Heading level={3}>{name}</Heading>
      <Button href={href} style={{ backgroundColor: accent }}>Buy</Button>
    </Column>
  ),
});
```

For markup no component says, `<Html html="…" />` writes it as it is, in an email and on a page, with nothing in it checked or escaped. Put only markup you wrote there.

## To the Unlayer builder and back

`@unlayer/react-elements/builder`: `toDesign()` writes a template as the builder's design JSON, for `loadDesign()`; `fromDesign()` reads a design (made by `toDesign()`, edited in the builder or made there) back as a template, as an element to render and as JSX source.

```tsx
import { fromDesign, toDesign } from "@unlayer/react-elements/builder";

const { design, report } = toDesign(<Receipt />); // report: what the builder can't hold as it is, one line each
// …the design is edited in the builder, and saved…
const { element, code, report: read } = fromDesign(saved, { displayMode: "email" }); // "web" a Page, "document" a Document
```

The design holds no Elements data. A style or prop a builder tool has no field for is a hidden property of that tool, kept in the design under its own name and drawn by Elements, with no editor in the builder yet. What the builder can't arrange comes back with the same look, flatter: a Section around several Rows as a Section each, a box's padding on its blocks, a Grid as Rows of Columns. What no tool shows (a Layer, an Svg, a Table, a box nested in a column, your own `component()`) goes as an HTML block of the new engine's markup, and comes back as an `Html` block, as the builder's own HTML blocks do. A design's markup comes back as it is: where designs can hold untrusted content, pass your sanitizer, `fromDesign(saved, { toSafeHtml })`. A line height goes in the builder's field as a whole percentage, as browsers draw it, so `24px` at 13px is `185%`, a twentieth of a pixel taller there. The builder has no page numbers yet: a `PageNumber` goes as its token, which the editor's PDF prints as it is, and `report` says so.

## Task guides and runnable examples

- [Transactional email in React](https://github.com/unlayer/elements/blob/main/packages/react/docs/transactional-email.md): render HTML and plain text, then send a receipt.
- [Resend, AWS SES, Postmark, SendGrid, and Nodemailer](https://github.com/unlayer/elements/blob/main/packages/react/docs/email-providers.md): complete provider integrations.
- [One React template to email, web, and PDF](https://github.com/unlayer/elements/blob/main/packages/react/docs/one-template-email-web-pdf.md): shared invoice content with output-specific roots.
- [React invoice PDF with Playwright](https://github.com/unlayer/elements/blob/main/packages/react/docs/react-to-pdf.md): generate actual PDF bytes from document HTML.
- [React to Unlayer visual editing](https://github.com/unlayer/elements/blob/main/packages/react/docs/visual-editing.md): `toDesign()`, editor loading, export, and what the builder can hold.

See [when to choose Elements](https://github.com/unlayer/elements/blob/main/packages/react/docs/README.md) and the [runnable example](https://github.com/unlayer/elements/tree/main/examples/content-workflows).

## Moving from Elements 0.2

Elements 0.2's components (`Body`, `ColumnLayouts`, `renderToHtml()` and the rest) aren't in 0.3.0: the package's components are these. The codemod moves templates written with them:

```bash
npx @unlayer/migrate src/emails --from elements   # templates written for Elements 0.2
npx @unlayer/migrate src/emails                   # React Email templates
```

It lists what it would change, and `--write` replaces the files (only those git can restore). What it can't move is listed, and that file is left as it was to rewrite by hand. See the [migration guide](https://github.com/unlayer/elements/blob/main/packages/react/docs/migrating-from-0.2.md) and [`@unlayer/migrate`](https://github.com/unlayer/elements/tree/main/packages/migrate).

## Development

```bash
pnpm build          # Build the package
pnpm test           # Run tests
pnpm storybook      # Launch Storybook
```

## License

MIT
