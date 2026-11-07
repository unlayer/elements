---
title: "Diagnostics"
description: "What validate() and render() report: ElementsError, severities, each diagnostic's code, message and path, the codes you'll meet, and checks in CI."
---

Every check Hyper Elements runs ends up as a diagnostic: a stable code, a severity, a message that says what to do instead, and the path to the value. Errors stop a render. Warnings and notes tell you what an output can't show as you asked.

```tsx
import { Email, Text, validate } from "@hyper-elements/react";

const { valid, diagnostics } = validate(
  <Email>
    <Text style={{ marginBottom: 16 }}>Hi</Text>
  </Email>
);
// valid: false
// diagnostics[0].code: "style/unknown"
// diagnostics[0].path: "root.children[0].style.marginBottom"
// diagnostics[0].message: "\"marginBottom\" isn't a style a Text takes: use the parent's gap, or padding. …"
```

Props and styles are typed from each component's definition, so in TypeScript a margin like this one is a type error before it's a diagnostic. `validate()` catches it at runtime too, with the path and the fix, for JavaScript, generated templates and agents.

## A diagnostic

```ts
interface Diagnostic {
  code: string;                              // stable, for tools to match on: "style/unknown"
  severity: "error" | "warning" | "info";
  message: string;                           // what's wrong, and what to do instead
  path: string;                              // where: "root.children[1].style.padding"
  nodeId?: string;                           // the node's id, where it has one
}
```

The path walks the template from the root: `root.children[2].style.justifyContent` is the third child's `justifyContent` style.

## Severities

| Severity | Means | `render()` | `validate()` |
|----------|-------|------------|--------------|
| `error` | The template can't be rendered as written | Rejects with an `ElementsError` | `valid: false` |
| `warning` | It renders, but not as you asked: an output can't show something, a width doesn't fit | In `diagnostics` | `valid: true` |
| `info` | A note: shown as asked, except somewhere (classic Outlook's square corners) | In `diagnostics` | `valid: true` |

## ElementsError

A template with errors makes `render()` reject, and `outline()` throw, with an `ElementsError`. Its `diagnostics` hold everything found, and its message lists the errors, one per line:

```text
[Elements] The template has 1 error:
error style/unknown at root.children[0].style.marginBottom: "marginBottom" isn't a style a Text takes: use the parent's gap, or padding. …
```

`formatDiagnostics(diagnostics)` writes any list in that one-line form, for logs.

```tsx
import { ElementsError, formatDiagnostics, render } from "@hyper-elements/react";

try {
  const { html, diagnostics } = await render(<Receipt />);
  if (diagnostics.length) console.warn(formatDiagnostics(diagnostics));
} catch (error) {
  if (error instanceof ElementsError) console.error(formatDiagnostics(error.diagnostics));
  throw error;
}
```

## Codes you'll meet

### Errors: how the template is written

| Code | What triggers it |
|------|------------------|
| `jsx/markup` | An HTML element in a template (`<b>`, `<br>`, `<div>`), or around the root |
| `jsx/root` | Something beside the root, such as two roots |
| `jsx/async` | A component that's async or suspends. Load its data first and pass it in as props |
| `jsx/error` | A component that threw inside a `<Suspense>` |
| `prop/unknown` | A prop the component doesn't take, often a style written as a prop: `<Email backgroundColor="#fff">` |
| `prop/required` | A required prop is missing: a Button's `href`, an Image's `src` |
| `prop/invalid` | A prop's value isn't one it takes, such as a `javascript:` link |
| `style/unknown` | A style the component doesn't take: a margin, a root's `padding`, an old name like `align` (the message names the new one) |
| `style/invalid` | A style's value isn't one it takes: `justifyContent: "around"`, `fontWeight: 650` |
| `mobile/not-allowed` | A phone style the component doesn't take on phones |
| `mobile/not-supported` | Phone styles in a Document or a Canvas, which have no phone width |
| `hidden/not-supported` | `hidden` in a Document or a Canvas |
| `hover/not-allowed` | A hover style the component doesn't take |
| `children/not-allowed` | A child the component can't hold: a Heading in a Text, a root inside a root |
| `children/text-not-allowed` | Loose text where it can't go, such as straight in a Row. Put it in a Text or Heading |
| `children/one-only` | A second `PageHeader` or `PageFooter` in a Document |
| `id/duplicate` | Two components with one `id` |
| `id/invalid` | An `id` that doesn't start with a letter |
| `mobile/invalid`, `hover/invalid`, `hidden/invalid` | A `mobile`, `hover` or `hidden` value that isn't one they take |
| `target/unsupported` | A component the output can't draw: an `Svg` or a `PageNumber` in an email (Gmail and classic Outlook drop inline SVG) |
| `document/page-number` | A `PageNumber` in a Page or a Canvas, which have no pages |
| `email/layer` | A Layer email can't draw: in an email it's an Image as wide as the Layer with one child over it |
| `custom/render` | A custom component's `render` throws, or returns something other than one component |
| `custom/depth` | Custom components expanding into each other too deep, as when one contains itself |
| `custom/duplicate` | Two different `component()` definitions with one `type` |

### Warnings and notes: what an output can't show

| Code | Severity | What triggers it |
|------|----------|------------------|
| `email/unsupported` | warning | A style or prop email can't show. The message says what it shows instead: `justifyContent: "space-between"` starts children at the left |
| `email/outlook-degraded` | info | Shown as asked, except in classic Outlook: square corners, normal letter spacing |
| `email/degraded` | info | Not quite as asked anywhere the email is read, such as web fonts in Gmail |
| `email/image-width` | warning | An Image with no width: Outlook shows it at its file's size. Give `src` the file's `width` and `height` |
| `email/width` | warning | A child of a Row takes its own size and its size isn't known, so Outlook can't lay the Row out |
| `email/font-fallback` | warning | A font stack ends on a web font, so a client that can't load it picks its own |
| `email/video-thumbnail` | warning | A Vimeo Video with no `thumbnail`, which can't be found without the network |
| `email/size` | warning | The HTML is large enough for Gmail to clip it (`render()` only) |
| `email/style-size` | warning | The stylesheet is more than Gmail reads (`render()` only) |
| `web/unsupported` | warning | The same, for a page |
| `layout/shrunk` | warning | A Row's children's widths add up to more than it has. They're narrowed to fit, as a browser does |
| `layout/overflow` | warning | Content wider than the space it has: a Row's children at their minimum widths, a box wider than its parent, a Table's columns wider than the Table |
| `style/ignored` | warning | A style that does nothing where it is, such as `flex` on a child that isn't in a Row |
| `email/layer-phone` | info | On phones, an email keeps a Layer's height and cuts its image at the sides |
| `hidden/everywhere` | warning | Hidden on phones and on desktop, so it never shows |
| `id/dropped` | info | An `id` inside a custom component used without one of its own is left out |
| `mobile/not-shown` | warning | A custom component's `mobile` style that nothing it renders has a phone version of |
| `jsx/compat` | warning | A `compat` prop on a root, which is left out |
| `document/overflow` | warning | A page's content looks taller than the page (an estimate) |
| `canvas/overflow` | warning | A Canvas's content looks taller than the Canvas (an estimate) |

`renderPdf()` and `renderImage()` add codes of their own (`pdf/…`, `image/…`). See [PDF](/docs/outputs/pdf#diagnostics) and [Image](/docs/outputs/image#diagnostics).

## Where support data comes from

Each style and prop of each component declares how each output shows it: `full`, `outlook` (as asked, but classic Outlook shows something else), `partial`, or `none` (with what it shows instead). One pass reads those declarations for the styles and props you set, and turns each into a diagnostic. A test keeps the declarations true: every style and prop, at every value, either changes the output or gives a diagnostic. Nothing is dropped silently.

Each declaration names its evidence: captures of real classic Outlook for Windows, caniemail.com's tables, the writer's own output checked in Chromium and against a model of Outlook's layout, or plain CSS. Some are marked as not checked yet.

## Use it in CI and with agents

`validate()` is synchronous, writes nothing, and returns what's wrong rather than throwing it, so it fits in a unit test:

```tsx
import { expect, test } from "vitest";
import { validate } from "@hyper-elements/react";
import { Welcome } from "./emails/welcome";

test("the welcome email is valid and has no warnings", () => {
  const { valid, diagnostics } = validate(<Welcome name="Ada" />);
  expect(valid).toBe(true);
  expect(diagnostics.filter((d) => d.severity === "warning")).toEqual([]);
});
```

Match on `code`, which is stable for tools to match on, and show people the `message`.

For an agent, `validate()` is the feedback loop. Each message says what to use instead and where, so an agent that writes a template, validates it and reads the messages can fix its own mistakes: a margin becomes the parent's `gap`, a style written as a prop goes into `style`. Pair it with [`outline()`](/docs/rendering#outline) to check the layout as text, without reading HTML.

> **Tip:** Point your agent at the package's guide, `node_modules/@hyper-elements/react/GUIDE.md`, before it writes a template. It lists every component on a line, and the mistakes that most often fail a first try.
