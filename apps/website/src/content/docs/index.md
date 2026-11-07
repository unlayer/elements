---
title: "Introduction"
description: "Hyper Elements is a set of React components that render one template to email-safe HTML, a web page, a PDF or an image."
---

Hyper Elements is a set of React components for emails, web pages, printed documents and images. You write a template once in JSX, and `render()` gives you the HTML its root asks for, with a plain-text version beside it, on your own server and with no network calls.

```tsx
import { Button, Column, Email, Heading, Text, render } from "@hyper-elements/react";

const welcome = (
  <Email previewText="Your account is ready" style={{ backgroundColor: "#f4f4f5" }}>
    <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16 }}>
      <Heading level={1} style={{ fontSize: 24 }}>Welcome aboard</Heading>
      <Text>Your account is ready.</Text>
      <Button href="https://example.com/start">Get started</Button>
    </Column>
  </Email>
);

const { html, text } = await render(welcome);
```

## One template, four outputs

The root decides the output. Change the root and the same content renders somewhere else.

| Root | Output | Written by |
|------|--------|------------|
| `<Email>` | Email-safe HTML: tables, px widths, Outlook's markup in conditional comments | `render()` |
| `<Page>` | A responsive web page: semantic HTML and flexbox, no client-side JavaScript | `render()` |
| `<Document>` | Print-ready HTML on pages of its size, and a PDF | `render()`, and `renderPdf()` from `@hyper-elements/react/pdf` |
| `<Canvas>` | A PNG or SVG image of a fixed size | `renderImage()` from `@hyper-elements/react/image` |

## What you stop doing

- **Nesting tables by hand.** A `Row` of `Column`s becomes the tables Outlook needs, with every width worked out in px before anything is written.
- **Writing Outlook conditional comments.** Outlook-only markup goes inside `<!--[if mso]>`, and nothing other clients need goes in one.
- **Inlining styles.** Layout, colors, fonts, sizes and spacing are written inline, so the email holds its desktop layout where a client drops `<style>`.
- **Keeping a plain-text version in sync.** Every `render()` returns `text` beside `html`.
- **Writing media queries.** A `Row` stacks its children on phones by default, and `mobile={{ }}` holds a component's phone styles.
- **Running headless Chrome for a PDF.** `@hyper-elements/react/pdf` writes a `Document` as a PDF with no browser.
- **Guessing what an email client will do.** `validate()` checks every prop and style, and says what the output can't show as asked, with the path to the value.

## The shape of a template

```text
<Email>            the root: Email, Page, Document or Canvas
  <Section>        a band whose background spans the window (optional)
    <Row>          its children side by side, stacked on phones
      <Column>     its children stacked
        <Heading />
        <Text />
        <Button />
      </Column>
    </Row>
  </Section>
</Email>
```

A root, a `Section` and a `Column` stack what they hold, so a block doesn't need a `Row` around it. There are no margins: the space between blocks is their parent's `gap`, and the space inside a box is its `padding`. Styles go in `style={{ }}`, and a number is px.

## What's in the box

| Package | What it does |
|---------|--------------|
| `@hyper-elements/react` | The components, `render()`, `validate()`, `outline()`, `formatDiagnostics()`, `component()` and `prop`, and `ElementsError` |
| `@hyper-elements/react/builder` | `toDesign()` and `fromDesign()`: a template as the Unlayer builder's design JSON, and a design back as a template |
| `@hyper-elements/react/pdf` | `renderPdf()`: a `Document` as a PDF, with react-pdf, no browser |
| `@hyper-elements/react/image` | `renderImage()`: a `Canvas` as PNG or SVG, with Satori and resvg |
| `@hyper-elements/migrate` | `npx @hyper-elements/migrate`: React Email templates converted and checked against the originals, and templates written with Elements 0.2's components rewritten, with what may draw differently listed |

The source is on GitHub at [hyper-elements/hyper-elements](https://github.com/hyper-elements/hyper-elements), MIT licensed.

## What it doesn't do yet

- **Real email clients.** The email output is checked in Chromium and against a model of classic Outlook's layout built from captures of real Outlook. It hasn't been checked in real email clients yet, so test in the ones you send to.
- **Measuring text.** The layout gives every box a width without measuring its words, so a box can get less room than its content needs. See [Layout](/docs/layout).
- **Fetching files for PDF and images.** `renderPdf()` and `renderImage()` take fonts and images as bytes. Nothing is fetched.

## Where to go next

- [Quickstart](/docs/quickstart): install, write an email, render it and send it.
- [Templates and roots](/docs/templates): the four roots, their props, and your own components.
- [Layout](/docs/layout): Section, Row, Column, Grid and Layer.
- [Styles, phones and hover](/docs/styles): `style`, `mobile`, `hidden`, `hover` and fonts.
- [Rendering](/docs/rendering): `render()`, `validate()`, `outline()` and merge tags.
- [Diagnostics](/docs/diagnostics): what the checks report, and how to use them in CI.
- [Custom components](/docs/custom-components): `component()` and `<Html>`.
- Outputs: [Email](/docs/outputs/email), [Page](/docs/outputs/page), [PDF](/docs/outputs/pdf), [Image](/docs/outputs/image).
