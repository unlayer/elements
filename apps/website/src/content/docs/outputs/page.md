---
title: "Page"
description: "What a Page root renders to: semantic HTML and flexbox with inline styles, a small stylesheet for phones and hover, no client JavaScript, ready to embed."
---

A `<Page>` root renders to a responsive web page: one element per component, semantic tags, inline styles and flexbox. Use it for the web version of an email, a receipt behind a login, or a landing page you generate on the server.

```tsx
import { Button, Column, Heading, Page, Text, Row, render } from "@hyper-elements/react";

const { html } = await render(
  <Page title="Pricing" description="Plans for teams of every size" width={960}>
    <Heading>Pricing</Heading>
    <Row style={{ gap: 16 }}>
      <Column>
        <Text hidden={{ mobile: true }}>Compare every plan side by side.</Text>
      </Column>
      <Column>
        <Button href="/buy" hover={{ backgroundColor: "#374151" }}>Buy</Button>
      </Column>
    </Row>
  </Page>,
  { pretty: true }
);
```

## What you get

The HTML above, shortened where it says `…`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pricing</title>
    <meta name="description" content="Plans for teams of every size">
    <style>.emw6dn:hover{background-color:#374151!important}@media (max-width: 480px){…}</style>
  </head>
  <body style="margin:0">
    <main style="max-width:960px;margin:0 auto;display:flex;flex-direction:column;…">
      <h1 style="margin:0;font-size:32px;font-weight:700;line-height:1.25">Pricing</h1>
      <div class="emfqa6" style="display:flex;gap:16px">…</div>
    </main>
  </body>
</html>
```

- **Semantic tags**: `main`, `section`, `h1` to `h6`, `p`, `ul` and `ol`, `table`, `a`, `img`.
- **Styles inline**, with flexbox for Rows and stacks.
- **A small stylesheet** for what inline styles can't say: phone styles, hiding, hover, and a Row stacking on phones. Its classes are short and named after their rule, so the same template always gets the same classes.
- **No client-side JavaScript** and no React hydration markers. The page is plain HTML.

The content is centered and as wide as the Page's `width` at most, 1200px by default. A `Section`'s background spans the window, with its content at that width. On phones, at 480px and narrower, Rows stack and `mobile` styles apply.

A `Video` is its player on a page: YouTube's or Vimeo's embed, in a 16:9 box. Web fonts in `fonts` are `@font-face` rules with `font-display: swap`.

## Embed it in your own page

`render()` also returns the document in parts, so you can put the output inside a page of your own, a Next.js route or a CMS layout. With the `InvoiceContent` from [Templates and roots](/docs/templates#share-content-between-roots):

```tsx
import { Page, render } from "@hyper-elements/react";

const { head, body, bodyStyle } = await render(<Page title="Receipt"><InvoiceContent invoice={invoice} /></Page>, { classPrefix: "receipt-" });
```

| Part | What it is |
|------|------------|
| `head` | What goes in `<head>`: meta tags, the title, the stylesheet |
| `body` | What goes in `<body>`: the `<main>` and everything in it |
| `bodyStyle` | The body's own style, such as `margin:0;background-color:#fafafa` for a Page with a background |

`classPrefix` sets what every class in the stylesheet starts with (`e` by default), so the output's rules don't collide with the CSS already on your page. With `classPrefix: "receipt-"`, a class looks like `receipt-mw6dn`.

> **Tip:** Embedding and the plain `html` come from the same render, so a page you embed and the one you serve on its own are the same markup.

## Page, Document and Canvas

A `Document` renders to print HTML with the same page writer, plus a CSS `@page` size, page breaks and one box per page. A `Canvas` renders to HTML to look at, at its fixed size. See [PDF](/docs/outputs/pdf) and [Image](/docs/outputs/image).

## Limits

- The layout gives every box a width in px without measuring text. A box with less room than its words needs overflows on a page. See [Layout](/docs/layout#every-box-gets-a-px-width).
- `validate()` reports what a page can't show as asked (`web/unsupported`).
