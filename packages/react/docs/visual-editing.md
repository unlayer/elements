# Make React and AI-generated email templates visually editable with renderToJson

Use `@unlayer/react-elements` when a developer or AI agent writes a template in React and another person needs to edit its content in Unlayer's visual editor. Templates already written with React Email open the same way: see [Open React Email templates in the Unlayer editor](./migrate-from-react-email.md#open-react-email-templates-in-the-unlayer-editor). `renderToJson()` creates design data; `loadDesign()` opens it; the editor's `exportHtml()` callback returns the updated design and HTML.

## Generate Unlayer design JSON from React

```bash
npm install @unlayer/react-elements react react-dom
npm install --save-dev tsx typescript @types/node @types/react @types/react-dom
npm pkg set type=module
```

This complete `src/export-design.tsx` can be run in a TypeScript project with `npx tsx src/export-design.tsx` (set `"jsx": "react-jsx"` in `tsconfig.json`):

```tsx
import { mkdir, writeFile } from "node:fs/promises";
import { Email, Row, Column, Paragraph, renderToJson } from "@unlayer/react-elements";

const design = renderToJson(
  <Email contentWidth="600px">
    <Row>
      <Column>
        <Paragraph html="Welcome to your new workspace." />
      </Column>
    </Row>
  </Email>
);
await mkdir("output", { recursive: true });
await writeFile("output/design.json", JSON.stringify(design, null, 2));
```

Expected: a serializable object with `body.rows`, `body.values`, `counters`, and `schemaVersion`, saved as `output/design.json`. It contains design structure, not HTML. For the full invoice used in the other guides, [render-email.ts](../../../examples/content-workflows/src/render-email.ts) writes `output/invoice.design.json`.

## Load and edit the invoice

Run the complete example from the repository root:

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example render:email
pnpm --filter @unlayer/content-workflows-example preview
```

Open <http://127.0.0.1:3001/editor.html>. This is the full [editor.html](../../../examples/content-workflows/editor.html):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Edit an Elements invoice</title>
</head>
<body>
  <button id="save" disabled>Download edited design and HTML</button>
  <p id="status" role="status">Loading editor…</p>
  <div id="editor" style="height: 80vh"></div>
  <script src="https://editor.unlayer.com/embed.js"></script>
  <script>
    const status = document.getElementById("status");
    const save = document.getElementById("save");
    const editor = unlayer.createEditor({
      id: "editor",
      displayMode: "email",
      // Add your projectId and allowed domain for your deployed integration.
    });
    editor.addEventListener("design:loaded", () => {
      save.disabled = false;
      status.textContent = "Design loaded. Edit it, then download your changes.";
    });
    editor.addEventListener("editor:ready", async () => {
      try {
        const response = await fetch("./output/invoice.design.json");
        if (!response.ok) throw new Error(`Design request failed: ${response.status}`);
        editor.loadDesign(await response.json());
      } catch (error) {
        status.textContent = error.message;
      }
    });
    function download(name, contents, type) {
      const url = URL.createObjectURL(new Blob([contents], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    save.addEventListener("click", () => {
      editor.exportHtml(({ design, html }) => {
        download("edited.design.json", JSON.stringify(design, null, 2), "application/json");
        download("edited.html", html, "text/html");
        status.textContent = "Exported design JSON and HTML. Allow multiple downloads if prompted.";
      });
    });
  </script>
</body>
</html>
```

Expected: the editor loads the invoice after `editor:ready`; after `design:loaded`, the download button becomes enabled. Change a paragraph and export. The browser downloads `edited.design.json` and `edited.html`. Save the JSON in your application and pass it to `loadDesign()` next time to preserve edits. The sample downloads files instead of assuming an application backend. See [editor installation](https://docs.unlayer.com/builder/installation) and [loading/saving designs](https://docs.unlayer.com/builder/load-and-save-designs) for hosted integration setup.

## Constraints

- `renderToJson()` is synchronous and statically walks `root > Row > Column > content`. It does not run a full React render. Plain synchronous root wrappers can be unwrapped, but hooks, async components, class components, `memo`, and `forwardRef` wrappers are not supported by that unwrapping path.
- Nested custom layout components or fragments hiding Row/Column nodes are not expanded by the walker; they can be skipped. Return the actual Elements nodes as in the [shared invoice factory](../../../examples/content-workflows/src/invoice.tsx). Fetch data before building the tree.
- A hand-written content wrapper is not a registered Elements item. Custom items must use [the custom tool API](../README.md#custom-tools) and need matching tool registration in the hosted editor.
- Match the editor's `displayMode` to the design (`email` in this example). Preserve the generated schema version and counters rather than constructing guessed design JSON. Editor support for individual tools/features depends on its version and project configuration.
- Exported JSON preserves design content and settings; it does not preserve React functions, business logic, hooks, or event handlers. There is no JSON-to-JSX or JSON-to-React renderer in this package. `renderToHtml()` takes a React element, not saved design JSON. Use the editor's `exportHtml()` for the edited design's HTML.
- After handing a design to an editor user, persist their latest JSON. Regenerating it from the original React source and reloading it would overwrite visual changes. Keep the template source and saved edited designs as separate application records.

For agent-authored templates, start with the [task selection guide](./README.md) and validate generated code with the same runnable example checks. For delivery, pass the edited HTML to your [email provider](./email-providers.md) and generate/update the plain-text alternative to match those edits.
