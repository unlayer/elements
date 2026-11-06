---
title: "AI agents"
description: "Give your coding agent the Hyper Elements guide, and a loop to check its own templates: write, validate, outline, render."
---

If an agent writes your templates, Hyper Elements is built so its first try works more often, and so a wrong try tells it exactly what to fix. You don't read HTML to find out. In [our benchmark](/docs/benchmark), an agent reached a passing email 2× faster with Hyper Elements than with hand-written HTML or React Email.

## Why the API suits agents

- **One way to write each thing.** Styles go in `style={{ }}`, never as props. Space between blocks is the parent's `gap`; there are no margins. Text is components, not HTML. An agent doesn't have to guess which of three equivalent forms you meant.
- **Errors say where and what to do.** Every problem comes back with a `code`, a `path` into the template and a `message` that names the fix.
- **Layout without HTML.** `outline()` prints the laid-out template as text: each block, its width, its words. An agent checks that two columns sit side by side by reading a few lines, not nested email tables.
- **The guide ships with the package.** `GUIDE.md` is written from the components' own definitions, so it matches the version you installed.

## Give your agent the guide

### Claude Code

Add this line to your project's `CLAUDE.md`, and every session starts out knowing the components:

```text
@node_modules/@hyper-elements/react/GUIDE.md
```

### Codex, Cursor and other agents

Add this to `AGENTS.md`, or to a rule:

```text
Before writing a Hyper Elements template, read node_modules/@hyper-elements/react/GUIDE.md.
```

### As a skill

Install the same guide as an agent skill:

```bash
npx skills add hyper-elements/hyper-elements
```

### For any model, from the web

The site serves the docs in plain text for language models:

- [`https://hyperelements.dev/llms.txt`](https://hyperelements.dev/llms.txt): an index of the docs.
- [`https://hyperelements.dev/llms-full.txt`](https://hyperelements.dev/llms-full.txt): the docs in one file.

Every docs page also has a **Copy page** button that copies it as Markdown, ready to paste into a chat.

> **Tip:** `GUIDE.md` is the short guide: how a template is written, the common mistakes, every component on a line. `REFERENCE.md`, next to it in the package, has every prop and style in full, with defaults.

## The loop

Point your agent at this loop. Each step is cheap, and only the last one writes HTML.

### 1. Write

The agent writes a template with the components from `@hyper-elements/react`.

### 2. Validate

`validate()` runs every check `render()` runs, without rendering and without throwing:

```tsx
import { validate } from "@hyper-elements/react";

const { valid, diagnostics } = validate(<Welcome />);
for (const d of diagnostics) console.log(d.code, d.path, d.message);
```

Here's what comes back for `<Email backgroundColor="#fff">` with a `Text` styled `marginBottom: 16`:

```text
prop/unknown root.props.backgroundColor An Email has no prop "backgroundColor": it's a style, style={{ backgroundColor: … }}
style/unknown root.children[0].style.marginBottom "marginBottom" isn't a style a Text takes: use the parent's gap, or padding. See Text in @hyper-elements/react/GUIDE.md
```

Each line is a fix the agent can apply without asking you. Warnings and notes leave a template valid; only errors make `valid` false.

### 3. Outline

`outline()` prints the template as laid out on desktop, and says whether each `Row` stacks on phones:

```tsx
import { Column, Email, Heading, Text, Row, outline } from "@hyper-elements/react";

console.log(outline(
  <Email width={600}>
    <Heading level={1}>Your order</Heading>
    <Row style={{ gap: 16 }}>
      <Column style={{ width: 180 }}><Text>Shipping to</Text></Column>
      <Column><Text>Ada Lovelace</Text></Column>
    </Row>
  </Email>
));
```

```text
Email 600px
  Heading h1 600px "Your order"
  Row 600px: 2 side by side, stacked on phones
    Column 180px
      Text 180px "Shipping to"
    Column 404px
      Text 404px "Ada Lovelace"
```

The agent compares this against what you asked for. Wrong width, wrong nesting, missing words: all visible here. `outline()` throws an `ElementsError` if the template has errors, so validate first.

### 4. Render

```tsx
import { render } from "@hyper-elements/react";

const { html, text, diagnostics } = await render(<Welcome />);
```

A template with errors rejects with an `ElementsError` whose `diagnostics` hold the same `code`, `message` and `path` as `validate()`. `diagnostics` on success holds warnings. A few checks need the written output, such as an email's size against Gmail's limits, so they only run here.

## Common mistakes

Each of these made an agent's first try fail:

- `<Email backgroundColor="#fff">` → `<Email style={{ backgroundColor: "#fff" }}>`. Styles never go as props.
- `<Email style={{ width: 600, padding: 24 }}>` → `<Email width={600}>`, with the padding on a `Column` (a card) or a `Section` (a band) inside it. A root's width is a prop, and a root has no padding.
- `items={[{ text: "Home", link: "/" }]}` → `items={[{ text: "Home", href: "/" }]}`. A `Menu`'s items are `{ text, href }`, a `Social`'s icons `{ name, href }`.
- `style={{ marginBottom: 16 }}` → `gap: 16` on the parent. There are no margins.
- `ColumnLayouts`, `layout`, `headingType`, `altText`, `html` are props of the older Elements components, not these: use a `Row` of `Column`s, `level`, `alt`, and text as children.
- `<Image src="https://example.com/logo.png">` → `src={{ src: "https://example.com/logo.png", width: 240, height: 80 }}`, the file's size. Without it Outlook shows the image at its file's size, and Elements warns.

## Rules worth giving your agent

- Read `GUIDE.md` before writing a template.
- A template has one root: `Email`, `Page`, `Document` or `Canvas`. The root decides the output.
- Raw tags such as `<b>`, `<br>` or `<div>` are errors. Use `Span`, `LineBreak` and the layout components.
- Build reusable trees with a plain synchronous function that returns the root. Fetch data first: a component that is async or suspends is an error.
- Pass dynamic values as children or props, which Elements escapes. Only put markup you trust in an `Html` block.
- To move React Email templates, run `npx @hyper-elements/migrate` instead of rewriting them by hand. It keeps their logic and checks the result. Exit code `2` means a template failed to convert or lost content: report it, with the file and the reason. Don't pass `--force` to hide it. See [From React Email](/docs/migrate/react-email).
