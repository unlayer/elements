---
title: "Templates and roots"
description: "Every template has one root (Email, Page, Document or Canvas) that decides its output. Root props, your own components, and sharing content."
---

A template is JSX with one root, and the root decides what `render()` writes. This page covers the four roots, their props, and how to build templates out of your own components.

```tsx
import { Email, Heading, Text } from "@hyper-elements/react";

const welcome = (
  <Email width={600} previewText="Thanks for signing up" lang="en">
    <Heading>Welcome</Heading>
    <Text>Thanks for signing up.</Text>
  </Email>
);
```

That is a whole email. A root stacks its children down its content width, centered in the window, so you don't need a `Row`, a `Column` or a container to start.

## The four roots

| Root | Output | Width |
|------|--------|-------|
| [`Email`](/docs/components/email) | Email-safe HTML | `width`, 600 by default |
| [`Page`](/docs/components/page) | A responsive web page | `width`, 1200 by default: the widest the content gets |
| [`Document`](/docs/components/document) | Print-ready HTML on pages of its size, and a PDF with `@hyper-elements/react/pdf` | From its `size`, `orientation` and `margin` |
| [`Canvas`](/docs/components/canvas) | An image with `@hyper-elements/react/image` (and HTML from `render()`, to look at) | `width` 1200 and `height` 630 by default |

A template has exactly one root. A `<div>` or any other HTML element around it is an error.

## Root props

| Prop | Roots | What it does |
|------|-------|--------------|
| `width` | Email, Page, Canvas | The content width in px |
| `height` | Canvas | The image's height in px. What's past it is cut |
| `previewText` | Email | Shown after the subject in inbox lists, not in the email |
| `description` | Page | The page's meta description |
| `title` | all | The document's `<title>`, shown in a browser tab and by some email clients |
| `lang` | all | The language, as a BCP 47 tag (`"en"`, `"ar"`) |
| `dir` | all | `"ltr"`, `"rtl"` or `"auto"`. Text starts on that side unless you align it |
| `fonts` | all | The font files the template loads. See [Styles](/docs/styles#fonts) |
| `size` | Document | `"A3"`, `"A4"`, `"A5"`, `"Letter"`, `"Legal"` or `"Tabloid"`, `"A4"` by default |
| `orientation` | Document | `"portrait"` or `"landscape"`, `"portrait"` by default |
| `margin` | Document | Around each page's content, 48px on each side by default (96px to the inch) |

A root's width is a prop, not a style, and a root has no padding. Put padding on a `Column` (a card) or a `Section` (a band) inside it:

```tsx
<Email width={640} style={{ backgroundColor: "#f4f4f5" }}>
  <Column style={{ backgroundColor: "#ffffff", padding: 32 }}>
    <Text>The card has the padding, not the root.</Text>
  </Column>
</Email>
```

The root's `style` takes the text styles every block inherits (`color`, `fontFamily`, `fontSize`, `lineHeight` and the rest), `backgroundColor`, `gap` and `alignItems`. A `Canvas` also takes `padding` and `justifyContent`. See [Styles](/docs/styles).

## What goes inside

| Kind | Components |
|------|------------|
| Layout | [`Section`](/docs/components/section), [`Row`](/docs/components/row), [`Column`](/docs/components/column), [`Grid`](/docs/components/grid), [`Layer`](/docs/components/layer) |
| Text | [`Heading`](/docs/components/heading) (`level` 1 to 6), [`Text`](/docs/components/text) |
| Inside text | [`Span`](/docs/components/span), [`Link`](/docs/components/link), [`LineBreak`](/docs/components/linebreak), [`MergeTag`](/docs/components/mergetag) |
| Blocks | [`Button`](/docs/components/button), [`Image`](/docs/components/image), [`Divider`](/docs/components/divider), [`List`](/docs/components/list), [`Table`](/docs/components/table), [`Video`](/docs/components/video), [`Social`](/docs/components/social), [`Menu`](/docs/components/menu), [`Svg`](/docs/components/svg) (not in an Email), [`Html`](/docs/components/html) |
| Parts | [`ListItem`](/docs/components/listitem) in a `List`; [`TableRow`](/docs/components/tablerow) and [`TableCell`](/docs/components/tablecell) in a `Table` |
| Shapes, in an `Svg` | [`Rect`](/docs/components/rect), [`Circle`](/docs/components/circle), [`Ellipse`](/docs/components/ellipse), [`Line`](/docs/components/line), [`Polygon`](/docs/components/polygon), [`Path`](/docs/components/path) |
| Document parts | [`Document.Page`](/docs/components/document-page), [`PageBreak`](/docs/components/pagebreak), [`PageHeader`](/docs/components/pageheader), [`PageFooter`](/docs/components/pagefooter), [`PageNumber`](/docs/components/pagenumber) |

Text is components, not HTML. Inside a `Text`, a `Span` styles a run, a `Link` links one, a `LineBreak` breaks the line and a `MergeTag` writes a merge tag:

```tsx
<Text>
  Order <Span style={{ fontWeight: 700 }}>#10482</Span> ships tomorrow.<LineBreak />
  <Link href="https://example.com/orders/10482">Track it</Link>
</Text>
```

`<b>`, `<br>`, `<div>` and other HTML elements in a template are errors (`jsx/markup`). For markup no component says, there's [`<Html>`](/docs/custom-components#html-markup-as-it-is).

## Your own components

A function that returns components is a component of your own. Write templates the way you write the rest of your React app:

```tsx
import { Column, Email, Heading, Text } from "@hyper-elements/react";

function Footer({ company }: { company: string }) {
  return <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>{company}</Text>;
}

export function OrderShipped({ name, items }: { name: string; items: string[] }) {
  return (
    <Email previewText="Your order is on its way" style={{ gap: 16 }}>
      <Column style={{ gap: 8 }}>
        <Heading level={1}>On its way, {name}</Heading>
        {items.map((item) => (
          <Text key={item}>{item}</Text>
        ))}
      </Column>
      <Footer company="Acme Inc." />
    </Email>
  );
}
```

`render()` runs your components with React, so props, hooks, Context, Fragments, arrays and conditions work as React shows them.

A component that's async or suspends is an error (`jsx/async`): `render()` doesn't wait for it. Fetch your data first and pass it in as props.

Data you pass as children or props is escaped when the HTML is written, so a customer's name can't add markup.

## Share content between roots

Write the content once, and give each output its root:

```tsx
import { Button, Column, Document, Email, Heading, Page, Text, Span, render } from "@hyper-elements/react";

interface Invoice {
  number: string;
  customer: string;
  total: string;
  url: string;
}

function InvoiceContent({ invoice }: { invoice: Invoice }) {
  return (
    <Column style={{ backgroundColor: "#ffffff", padding: 24, gap: 16 }}>
      <Heading level={1} style={{ fontSize: 28 }}>Payment receipt</Heading>
      <Text>Invoice <Span style={{ fontWeight: 700 }}>{invoice.number}</Span></Text>
      <Text>Thank you, {invoice.customer}. You paid {invoice.total}.</Text>
      <Button href={invoice.url}>View invoice</Button>
    </Column>
  );
}

const invoice = { number: "INV-1001", customer: "Ada Lovelace", total: "$49.00", url: "https://example.com/invoices/INV-1001" };
const title = `Invoice ${invoice.number}`;

const email = await render(<Email title={title} previewText="Your payment receipt is ready."><InvoiceContent invoice={invoice} /></Email>);
const page = await render(<Page title={title} width={600}><InvoiceContent invoice={invoice} /></Page>);
const printed = await render(<Document title={title} size="A4" margin={48}><InvoiceContent invoice={invoice} /></Document>);
```

`render()` needs no mode: the root says what to write. `email.html` is email HTML, `page.html` a web page and `printed.html` print HTML. For the PDF itself, pass the same `Document` to `renderPdf()`. See [PDF](/docs/outputs/pdf).

Shared content doesn't mean identical pixels. Email is written as tables, a page with flexbox, and a document on pages of a fixed size. Each output's page says what it does differently.

## Next

- [Layout](/docs/layout): arrange blocks with Section, Row, Column, Grid and Layer.
- [Custom components](/docs/custom-components): named blocks with typed props.
