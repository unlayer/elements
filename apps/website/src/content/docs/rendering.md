---
title: "Rendering"
description: "render() turns a template into HTML and plain text. Its result and options, validate() and outline(), merge tags, and where it runs."
---

`render()` turns a template into the output its root asks for. `validate()` runs the same checks without writing anything, and `outline()` prints the layout as text.

```tsx
import { render } from "@hyper-elements/react";

const { html, text, head, body, bodyStyle, diagnostics } = await render(<Receipt />);
```

The examples on this page use this receipt:

```tsx
import { Button, Column, Email, Heading, Image, Link, List, ListItem, MergeTag, Text, Row, Span, Table, TableCell, TableRow } from "@hyper-elements/react";

export default function Receipt() {
  return (
    <Email previewText="Your Acme receipt" style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, Arial, sans-serif", gap: 16 }}>
      <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
      <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16, borderRadius: 8 }}>
        <Heading level={1} style={{ fontSize: 24 }} mobile={{ fontSize: 20 }}>
          Thanks for your order, <MergeTag name="first_name" />
        </Heading>
        <Text>
          Order <Span style={{ fontWeight: 700 }}>#10482</Span> ships tomorrow. <Link href="https://example.com/orders/10482">Track it</Link>.
        </Text>
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

## render()

`render(element, options?)` is async. It resolves to:

| Field | What it is |
|-------|------------|
| `html` | The whole document, with no React hydration markers and no client-side JavaScript |
| `text` | The plain-text version, from the same template |
| `head` | What goes in `<head>`: meta tags, the title, the stylesheet |
| `body` | What goes in `<body>` |
| `bodyStyle` | The body's own inline style |
| `diagnostics` | Warnings and notes. Errors aren't here: they make `render()` reject |

`head`, `body` and `bodyStyle` are for embedding the output in a page of your own. See [Page](/docs/outputs/page#embed-it-in-your-own-page).

A template with errors doesn't render. `render()` rejects with an `ElementsError`, whose `diagnostics` give each problem's `code`, `message` and `path`:

```tsx
import { ElementsError, render } from "@hyper-elements/react";

try {
  await render(<Receipt />);
} catch (error) {
  if (error instanceof ElementsError) {
    for (const { code, message, path } of error.diagnostics) console.error(code, path, message);
  }
  throw error;
}
```

### The plain-text version

`text` is written from the same template, so it never drifts from the HTML. Headings are in capitals, links and buttons show their URL in brackets, list items get their numbers (or a `-`), a table's cells are joined with `|`, and an image shows its alt text. The receipt's:

```text
[Acme]

THANKS FOR YOUR ORDER, {{first_name}}

Order #10482 ships tomorrow. Track it (https://example.com/orders/10482).

Item | Price
Linen shirt | $48.00

Shipping to

Ada Lovelace, London

Next steps

1. We pack it
2. You track it

View your order (https://example.com/orders/10482)

Acme Inc., 1 Market St, San Francisco
```

The preview text isn't in it.

### Options

| Option | Default | What it does |
|--------|---------|--------------|
| `pretty` | `false` | Indents the HTML, for reading it. For sending, keep the compact HTML: white space may change how some email clients show it |
| `mergeTag` | `` (name) => `{{name}}` `` | A function from a merge tag's name to how it's written |
| `classPrefix` | `"e"` | What every class name in the stylesheet starts with, for HTML embedded where other CSS is. A Document's page boxes keep the class `elements-page` |
| `hideBelow` | Where the phone styles start | In an Email, the window width in px at and below which what's hidden on phones is hidden |

```tsx
const { html } = await render(<Receipt />, { pretty: true, classPrefix: "acme-" });
```

## Merge tags

A [`MergeTag`](/docs/components/mergetag) is a value your sending service fills in, written in that service's syntax:

```tsx
<Text>
  Hi <MergeTag name="first_name" />, your order has shipped.
</Text>
```

By default it's written as `{{first_name}}`, in the HTML and in the plain text. For another syntax, pass `mergeTag`:

```tsx
// Mailchimp-style: *|FIRST_NAME|*
await render(<Receipt />, { mergeTag: (name) => `*|${name.toUpperCase()}|*` });

// Liquid with spaces: {{ first_name }}
await render(<Receipt />, { mergeTag: (name) => `{{ ${name} }}` });
```

What `mergeTag` returns goes into the HTML as it is, with the name in it escaped, so a syntax with `<` in it (`<%= name %>`) works there too.

A link can be a merge tag as well: `href` takes a URL or a tag, so `<Link href="{{unsubscribe_url}}">` writes `href="{{unsubscribe_url}}"`.

### Tags in your text

Text you write is escaped, and tags without `<`, `>` or `&` in them pass through unchanged: `{{code}}`, `*|FNAME|*` and `{% if vip %}` reach the HTML and the plain text as you wrote them. A tag with `<` in it, written as text, is escaped in the HTML (`&lt;%= name %&gt;`). Write those with `MergeTag` and a `mergeTag` function.

## validate()

`validate(element)` runs the checks `render()` runs, except Gmail's size limits, without writing anything. What's wrong with the template comes back in `diagnostics`, not as an error:

```tsx
import { validate } from "@hyper-elements/react";

const { valid, diagnostics } = validate(<Receipt />);
```

`valid` is `false` when there's an error. Warnings and notes leave it `true`. It checks props, styles, children and ids, expands your custom components, runs the output's checks and the layout, and reports what the output can't show as asked. Only what needs the written HTML is left to `render()`: an email's size against Gmail's limits. It's synchronous. See [Diagnostics](/docs/diagnostics).

## outline()

`outline(element)` prints the laid-out template: each block on a line under what holds it, with its width on desktop and what it shows (a heading's words, a link's URL, an image's alt text), and whether a Row stacks on phones. Use it to check a layout without reading HTML, in a test or from an agent.

```tsx
import { outline } from "@hyper-elements/react";

console.log(outline(<Receipt />));
```

```text
Email 600px: background #f4f4f5
  Image 120px [Acme] https://example.com/logo.png
  Column 600px: background #ffffff
    Heading h1 536px "Thanks for your order, {{first_name}}"
    Text 536px "Order #10482 ships tomorrow. Track it (https://example.com/orders/10482)."
    Table 536px
      TableRow 536px
        TableCell 268px "Item"
        TableCell 268px "Price"
      TableRow 536px
        TableCell 268px "Linen shirt"
        TableCell 268px "$48.00"
    Row 536px: 2 side by side, stacked on phones
      Column 260px
        Text 260px "Shipping to"
        Text 260px "Ada Lovelace, London"
      Column 260px
        Text 260px "Next steps"
        List 260px
          ListItem 236px "We pack it"
          ListItem 236px "You track it"
    Button: background #111827 "View your order" → https://example.com/orders/10482
  Text 600px "Acme Inc., 1 Market St, San Francisco"
```

Like `render()`, it throws an `ElementsError` when the template has errors.

## The same input, the same output

A template renders the same every time. Rules the inline styles can't express (phone styles, hiding, hover) go in a stylesheet under short classes named after the rule's content, like `.e3k9fa`. The same rule always gets the same class, and the HTML gets no generated ids, only the `id`s you write. Snapshot tests stay stable, and diffs show real changes.

`renderPdf()` and `renderImage()` hold to the same rule: the same template writes the same bytes.

## Where it runs

`render()` runs on your server, with no network calls. It works in plain Node.js and in Next.js route handlers, Server Components and Client Components' server render. Rendering is one React render that collects the template into a tree, lays it out, and writes it, and that render needs no React context, which React's server build doesn't have.

`@hyper-elements/react/pdf` and `@hyper-elements/react/image` run in Node.js only.

> **Tip:** Fetch your data before you render, and pass it in as props. A component that's async or suspends is an error, since `render()` doesn't wait for it.
