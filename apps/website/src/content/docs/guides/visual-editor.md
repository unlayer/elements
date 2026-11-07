---
title: "Visual editing"
description: "Turn a template into design JSON for Unlayer's builder with toDesign(), and read an edited design back as a template with fromDesign()."
---

You or an agent writes the template in code. Someone else changes the copy in a visual editor. You don't maintain two versions, and you don't hand-build design JSON.

`@hyper-elements/react/builder` connects your templates to Unlayer's builder, the drag-and-drop email and page editor:

- `toDesign(element)` writes a template as the builder's design JSON, for its `loadDesign()`.
- `fromDesign(design, options)` reads a design back as a template: an element to render, and its JSX source.

Rendering needs no Unlayer account or API key. The builder is Unlayer's product, with its own project setup.

## Template to design

```tsx
import { mkdir, writeFile } from "node:fs/promises";
import { toDesign } from "@hyper-elements/react/builder";
import { Email, Text } from "@hyper-elements/react";

const { design, report } = toDesign(
  <Email width={600}>
    <Text>Welcome to your new workspace.</Text>
  </Email>
);
for (const line of report) console.warn(line);
await mkdir("output", { recursive: true });
await writeFile("output/design.json", JSON.stringify(design, null, 2));
```

`design` is a serializable object with `body`, `counters` and `schemaVersion`. It holds design structure, not HTML, and no Elements data. Keep the schema version and counters it writes.

`toDesign()` is synchronous. It takes an `Email`, a `Page` or a `Document`. A `Canvas` has no design. It renders the template once with React, as `render()` does, so hooks, Context, Fragments and your own components work, at the root too.

## The report

`report` lists what the builder can't hold as it is, one line each, with the path to the block. It's empty when everything maps to a builder tool. A `Table`, for example:

```text
root.children[1]: a Table isn't a tool of the builder's: it's an HTML block of its own markup in the builder (it can be moved, not edited)
```

Read the report before you promise an editor user that a block is editable.

## What the builder holds

The builder holds what its tools can. Two things happen to the rest:

- **Hidden properties.** A style or prop a tool has no field for is a hidden property of that tool. It's kept in the design under its own name and drawn by Elements, but the builder shows no control for it yet.
- **HTML blocks.** What no tool shows (a `Layer`, an `Svg`, a `Table`, a box nested in a column, your own `component()`) goes in as an HTML block of its rendered markup. An editor user can move it, not edit it. The report names each one.

Two smaller details: a line height goes into the builder's field as a whole percentage, as browsers draw it, so `24px` at 13px becomes `185%`, a twentieth of a pixel taller there. The builder has no page numbers yet, so a `PageNumber` goes in as its token, which the editor's PDF prints as it is. The report says so.

## Load it in the builder

Create the editor, load the design when it's ready, and export when the user is done:

```html
<div id="editor" style="height: 80vh"></div>
<script src="https://editor.unlayer.com/embed.js"></script>
<script>
  const editor = unlayer.createEditor({
    id: "editor",
    displayMode: "email",
    // Add your projectId and allowed domain for your deployed integration.
  });
  editor.addEventListener("editor:ready", async () => {
    const response = await fetch("./output/design.json");
    editor.loadDesign(await response.json());
  });
  function save() {
    editor.exportHtml(({ design, html }) => {
      // Store `design` in your application. Load it next time to keep the edits.
    });
  }
</script>
```

Match the editor's `displayMode` to the template's root: `email` for an `Email`, `web` for a `Page`, `document` for a `Document`. Which tools and features the editor offers depends on its version and your project's configuration. Unlayer's docs cover [installing the editor](https://docs.unlayer.com/builder/installation) and [loading and saving designs](https://docs.unlayer.com/builder/load-and-save-designs).

> **Warning:** Once an editor user has changed a design, store their latest JSON and load that. Regenerating the design from your React source and reloading it overwrites their changes. Keep the template source and the saved designs as separate records.

## Design back to template

```tsx
import { readFile } from "node:fs/promises";
import { fromDesign } from "@hyper-elements/react/builder";
import { render } from "@hyper-elements/react";

const saved = JSON.parse(await readFile("edited.design.json", "utf8"));
const { element, code, report } = fromDesign(saved, { displayMode: "email" });
const { html, text } = await render(element);
```

- `element` renders the design. `render(element)` gives HTML and a plain-text body that match the edits, ready to [send](/docs/guides/sending).
- `code` is the same template as JSX in the new components.
- `report` lists what the template can't hold.

Pass the `displayMode` the design was made in: `email` gives an `Email`, `web` a `Page`, `document` a `Document`. Without one, a design with a header, a footer or a page break becomes a `Document`, any other an `Email`. `name` sets the component's name in `code`. `fromDesign()` reads designs made by `toDesign()`, edited in the builder, or made there from scratch. The builder's own HTML blocks come back as `Html` blocks.

### What comes back

The design as it stands, with its sample values. A design holds content and settings, not code, so the original's props, loops, conditions, hooks and event handlers don't come back.

What the builder can't arrange comes back with the same look, but flatter:

- a `Section` around several `Row`s comes back as a `Section` each;
- a box's padding comes back on its blocks;
- a `Grid` comes back as `Row`s of `Column`s.

The space between blocks comes back as padding too. A `Column` with `gap: 16` comes back like this, drawn the same:

```tsx
<Column style={{ padding: 32, backgroundColor: "#ffffff" }}>
  <Heading style={{ fontSize: 24 }}>{"Welcome, "}<MergeTag name="first_name" /></Heading>
  <Text style={{ padding: [16, 0, 0, 0] }}>Your Pro workspace is ready.</Text>
</Column>
```

### Untrusted designs: `toSafeHtml`

A design's markup comes back as it is. If your designs can hold content you don't trust, pass your sanitizer as `toSafeHtml`, a function from an HTML string to a safe one. Every builder HTML block's markup, and every text's before it's read, goes through it:

```tsx
const { element } = fromDesign(saved, { displayMode: "email", toSafeHtml });
```

## Limits

- A component that is async or suspends makes `toDesign()` throw, as it makes `render()` reject. Fetch data before you build the tree.
- Plain markup among the components (a `<div>`, a `<b>`) makes `toDesign()` throw too. Use the components, or an `Html` block for raw HTML, which the editor edits as HTML.
- Don't construct or guess design JSON by hand. Generate it with `toDesign()`.
