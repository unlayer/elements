---
title: "Quickstart"
description: "Install Hyper Elements, write a welcome email in JSX, render it to HTML and plain text, and send it with Resend."
---

This page takes you from an empty project to a sent email: install, write a template, render it, send it, and check it.

## Install

```bash
npm install @hyper-elements/react react react-dom
```

```bash
pnpm add @hyper-elements/react react react-dom
```

```bash
yarn add @hyper-elements/react react react-dom
```

```bash
bun add @hyper-elements/react react react-dom
```

`react` and `react-dom` are peer dependencies, version 18 or later. With TypeScript, set `"jsx": "react-jsx"` in your `tsconfig.json`.

## Write your first email

A template is a React component that returns one root. Everything comes from `@hyper-elements/react`.

```tsx
// emails/welcome.tsx
import { Button, Column, Email, Heading, Image, Text } from "@hyper-elements/react";

export function Welcome({ name }: { name: string }) {
  return (
    <Email previewText="Your Acme account is ready" style={{ backgroundColor: "#f4f4f5", fontFamily: "Helvetica, Arial, sans-serif", gap: 16 }}>
      <Image src={{ src: "https://example.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
      <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16, borderRadius: 8 }}>
        <Heading level={1} style={{ fontSize: 24 }} mobile={{ fontSize: 20 }}>
          Welcome, {name}
        </Heading>
        <Text>Your account is ready. Create your first project to get going.</Text>
        <Button href="https://example.com/projects/new" style={{ backgroundColor: "#111827", borderRadius: 6 }} hover={{ backgroundColor: "#374151" }}>
          Create a project
        </Button>
      </Column>
      <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Text>
    </Email>
  );
}
```

A few things to notice:

- Styles go in `style={{ }}`, never as props, and a number is px.
- There are no margins. The `gap` on the `Email` and the `Column` is the space between their children.
- The `Column` with a background and padding is a card. You didn't write a table.
- `Image` takes the file's size in `src` and the size shown in `style.width`. Without a width in either, Outlook shows the image at the size of its file. The file's size also gives Outlook its height.
- `mobile` holds the heading's size on phones, and `hover` the button's color under the pointer.

## Render it

```tsx
import { render } from "@hyper-elements/react";
import { Welcome } from "./emails/welcome";

const { html, text, diagnostics } = await render(<Welcome name="Ada" />);
```

`html` is the whole email document. `text` is the plain-text version, written from the same template:

```text
[Acme]

WELCOME, ADA

Your account is ready. Create your first project to get going.

Create a project (https://example.com/projects/new)

Acme Inc., 1 Market St, San Francisco
```

`diagnostics` holds warnings and notes. This template gets two notes, because classic Outlook draws square corners:

```text
info email/outlook-degraded at root.children[1].style.borderRadius: borderRadius on this Column in classic Outlook: square corners
info email/outlook-degraded at root.children[1].children[2].style.borderRadius: borderRadius on this Button in classic Outlook: square corners
```

A template with errors doesn't render: `render()` rejects with an `ElementsError` that lists each one. See [Diagnostics](/docs/diagnostics).

## Send it

Hyper Elements writes the email. Your provider delivers it. Pass both `html` and `text`. With [Resend](https://resend.com):

```bash
npm install resend
```

```tsx
import { Resend } from "resend";
import { render } from "@hyper-elements/react";
import { Welcome } from "./emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);
const { html, text } = await render(<Welcome name="Ada" />);

const { data, error } = await resend.emails.send({
  from: "Acme <hello@your-verified-domain.com>",
  to: "ada@example.com",
  subject: "Welcome to Acme",
  html,
  text,
});
if (error) throw new Error(`Resend: ${error.message}`);
console.info("Resend accepted:", data?.id);
```

Send the `html` string as it is, head styles included. The provider doesn't render your React tree again.

> **Note:** Keep rendering and your API key on the server. The subject is the provider's field. The `Email`'s `title` prop sets the HTML `<title>`, which is a different thing.

The same `html` and `text` work with AWS SES, Postmark, SendGrid or Nodemailer: each takes an HTML body and a text body.

## Preview it

Write the HTML to a file and open it in a browser:

```tsx
import { writeFile } from "node:fs/promises";

await writeFile("welcome.html", html);
```

> **Warning:** A browser preview shows you the layout, not what every inbox does. Send a test to the email clients your users have.

## Check it without rendering

`validate()` runs `render()`'s checks without writing anything, and never throws. It runs all of them but the email's size against Gmail's limits, which needs the HTML:

```tsx
import { validate } from "@hyper-elements/react";

const { valid, diagnostics } = validate(<Welcome name="Ada" />);
```

`outline()` prints the laid-out template, each block with its width, so you can check the layout without reading HTML:

```tsx
import { outline } from "@hyper-elements/react";

console.log(outline(<Welcome name="Ada" />));
```

```text
Email 600px: background #f4f4f5
  Image 120px [Acme] https://example.com/logo.png
  Column 600px: background #ffffff
    Heading h1 536px "Welcome, Ada"
    Text 536px "Your account is ready. Create your first project to get going."
    Button: background #111827 "Create a project" → https://example.com/projects/new
  Text 600px "Acme Inc., 1 Market St, San Francisco"
```

The heading is 536px: the 600px column less 32px of padding on each side.

## With an AI agent

The package ships a guide to writing templates, `GUIDE.md`. In Claude Code, add this line to your project's `CLAUDE.md` and every session starts out knowing the components:

```text
@node_modules/@hyper-elements/react/GUIDE.md
```

For Codex, Cursor and other agents, add to `AGENTS.md` (or a rule): "Before writing a Hyper Elements template, read node_modules/@hyper-elements/react/GUIDE.md." Then have the agent run `validate()` on what it writes. See [Diagnostics](/docs/diagnostics).

## Next

- [Templates and roots](/docs/templates)
- [Layout](/docs/layout)
- [Rendering](/docs/rendering)
