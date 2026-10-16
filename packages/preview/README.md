# @unlayer/elements-preview

Preview your [Unlayer Elements](https://github.com/unlayer/elements) templates in the browser while you edit them, check them against email clients (in the browser, or from a terminal, CI or a coding agent), take screenshots, and export them to HTML.

```bash
npm install -D @unlayer/elements-preview
npx elements-preview dev
```

Open http://localhost:3000. Every template in `./emails` is listed, rendered with your project's own Elements and React, and updated as you save.

## Templates

A template is a `.tsx`, `.jsx` or `.js` file with an `export default` component (or element). These are the same rules as React Email's preview, so an `emails` folder moved from it works as it is:

- Folders starting with `_` aren't listed: put shared components in `_components/`.
- Files in `static/` are served at `/static/`: `<Image src="/static/logo.png" />`. Host them elsewhere for the emails you send.
- `PreviewProps` on the component are the props it previews and exports with:

```tsx
import { Email, Row, Column, Heading, Button } from "@unlayer/react-elements";

export default function Welcome({ name }: { name: string }) {
  return (
    <Email>
      <Row>
        <Column>
          <Heading>Welcome, {name}</Heading>
          <Button href="https://example.com">Get started</Button>
        </Column>
      </Row>
    </Email>
  );
}

Welcome.PreviewProps = { name: "Ada" };
```

TypeScript, JSX, your `tsconfig.json` path aliases (`@/components/...`) and imports of your other files all work as in your project.

## The preview

The top bar has the template's name (its render time and whether it's live are in the tooltip), the views in the middle, and on the right the preview's width and dark mode, **Checks** and **Export**.

- **Preview**: the template as an email, page or document, at desktop or phone width. Drag the frame's edges for any width (it shows the width as you drag); double-click an edge to go back.
- **Dark mode** (the sun and moon): what email clients do to an email's colors for readers in dark mode. By default every color flips, as in the Gmail apps and Outlook.com; the arrow next to it switches to light colors only, as in Apple Mail and Outlook on phones. It catches unreadable text and logos that vanish. It flips the colors written on the elements themselves, as Elements writes them; a color set only by a stylesheet (text in an Html block with no color of its own, an unstyled link) keeps its light-mode color.
- **Editor**: the template's design JSON in the [Unlayer editor](https://unlayer.com), to check how it opens there. Each render loads it again; changes made in the editor aren't saved to your file. The editor comes from `editor.unlayer.com`, so this view needs an internet connection (the others don't). Images from `static/` are copied into the design it gets, since the editor's page can't load them from localhost. It opens without an Unlayer project; pass `--project-id` (or set `UNLAYER_PROJECT_ID`) to open it in yours, with your project's settings.
- **Code**: the template's source, the HTML, the plain text and the design JSON, highlighted, to copy or download.
- **Checks**: the button says "All clear", or how many things there are to fix (something broken) or to check, in the color of the worst. It opens a drawer with three sections:
  - **Rendering**: what Elements and React report while rendering (a column too many, a block left out), and a design JSON (the template then won't open in the Unlayer editor) or plain text that can't be made. A template that doesn't compile or throws shows its error, with the file, line and code, in place of the preview; the preview keeps running and recovers when you fix the file.
  - **Email clients**: the HTML and CSS the email uses that Gmail, Outlook, Apple Mail, Yahoo Mail, Samsung Email or Thunderbird don't support, from [caniemail.com](https://www.caniemail.com), with the block it's on and the template lines it likely comes from. Elements' own email HTML uses some CSS on purpose, with fallbacks for the clients that ignore it; those are listed apart, as handled by Elements.
  - **Links & images**: links that go nowhere, relative or `http:` URLs, links to localhost, images without alt text, SVG and `data:` images most clients block, `/static/` images to host before sending, and HTML over Gmail's 102 KB clipping limit. Each URL is requested, so broken links (404), hosts that don't exist, non-images and large images show too.
- **Props** (the drawer's other tab): render with other props than `PreviewProps`, without changing the file.
- **Export**: download the HTML, plain text or design JSON (it opens in the Unlayer builder with `loadDesign()`), copy the HTML, or **Copy for AI**: the template, its problems, compatibility and link findings as one prompt to paste into an AI assistant.

`elements-preview check` runs the same checks from a terminal, and `elements-preview screenshot --dark` takes the same dark mode.

Keyboard shortcuts (also in the tooltips): <kbd>/</kbd> filters the templates, <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> switch to Preview, Editor and Code, <kbd>D</kbd> switches between desktop and phone width, <kbd>T</kbd> turns dark mode on and off, and <kbd>.</kbd> opens and closes the checks.

The preview follows your system's light or dark appearance.

## Commands

### `elements-preview dev`

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder |
| `--port <number>` | `3000` | The port. When it's taken, the next free one is used, unless you set it. |
| `--open` | | Open the preview in your browser |
| `--project-id <id>` | `UNLAYER_PROJECT_ID`, or none | The Unlayer project the Editor view opens designs in |

The server listens on localhost only and answers only requests addressed to localhost.

### `elements-preview export`

Renders every template with its `PreviewProps` to `out/<path>.html` (`emails/billing/receipt.tsx` → `out/billing/receipt.html`), and copies `static/`. Existing files with the same names are replaced; nothing else in the folder is deleted.

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder |
| `--outDir <path>` | `out` | Where to write the files |
| `--pretty` | | Format the HTML for reading |
| `--plainText` | | Write plain text instead of HTML |
| `--design` | | Also write each template's design JSON (`<name>.design.json`) for the Unlayer builder |
| `--extension <ext>` | `html` | The file extension, e.g. `blade.php` (`txt` with `--plainText`) |

It exits with 1 when a template fails, after exporting the others; with `--plainText`, a template whose plain text can't be made fails too, and gets no file. It exits with 2, before writing anything, when two templates would write the same file (`welcome.jsx` and `welcome.tsx` both export to `welcome.html`): rename one of them. Export is for backends that can't run JavaScript, or platforms that only take HTML; when your code can call Elements, render at send time with the real data instead (`renderToHtml`).

### `elements-preview check`

Renders templates with their `PreviewProps` and checks them as the preview's **Checks** do, without a browser: for a terminal, a CI job or a coding agent that just edited a template.

```bash
npx elements-preview check                          # every template
npx elements-preview check welcome.tsx --json       # one, as JSON
```

For each template it reports render errors (with the file and line), what Elements and React warn about, a design JSON that can't be made (the template won't open in the Unlayer editor) or plain text that can't, the CSS and HTML the template brings in that email clients don't support (with the template lines it likely comes from), links and images, and HTML over Gmail's clipping size. The levels are the preview's: **to fix** is something broken (a render error, a block Elements left out, no design JSON, a link that goes nowhere or answers 404, a `javascript:` or relative URL); **to check** is worth a look (warnings, compatibility, placeholder or `http:` URLs, Gmail clipping); notes are for information.

```
✗ showcase/needs-fixes.tsx (email, 10 KB): 3 to fix, 5 to check, 1 note
    fix    Paragraph 1 · “terms” → # · This link goes nowhere: give it a URL.
    fix    Button 1 · “Click me” → javascript:alert(1) · Email clients don't run javascript: links.
    check  Html 1 · line 13 · `display:flex` isn't supported in Outlook (2 clients) and only partly in Gmail (1 client): remove it or add a fallback.
✓ receipt.tsx (email, 16 KB): 1 note

Checked 2 templates: 3 to fix, 5 to check. (2 notes: --json lists them)
```

Name templates by their path in the templates folder (`welcome.tsx`) or from the working directory (`emails/welcome.tsx`), with or without the extension, or name a folder of them (`billing`). With none, it checks every template.

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder |
| `--json` | | Print the report as JSON (below) |
| `--strict` | | Fail on what's to check too, not only on what's to fix |
| `--offline` | | Don't request the links' and images' URLs; check the HTML only |

| Exit code | |
| --- | --- |
| `0` | Nothing to fix (with `--strict`, nothing to check either) |
| `1` | Something to fix (with `--strict`, or to check) |
| `2` | The check couldn't run: an option, folder or template that isn't right, a folder with no templates, or Elements not installed. With `--json`, stderr has `{"error": "…"}` |

#### The JSON report

```json
{
  "ok": false,
  "strict": false,
  "network": true,
  "templates": [
    {
      "path": "showcase/needs-fixes.tsx",
      "file": "emails/showcase/needs-fixes.tsx",
      "ok": false,
      "mode": "email",
      "bytes": 10342,
      "toFix": [
        {
          "kind": "link",
          "level": "error",
          "message": "Email clients don't run javascript: links.",
          "block": "Button 1",
          "url": "javascript:alert(1)",
          "label": "Click me"
        }
      ],
      "toCheck": [
        {
          "kind": "client",
          "level": "warning",
          "message": "`display:flex` isn't supported in Outlook (2 clients) and only partly in Gmail (1 client): remove it or add a fallback.",
          "block": "Html 1",
          "line": 13,
          "lines": [13],
          "url": "https://www.caniemail.com/features/css-display-flex/",
          "feature": "display:flex",
          "support": "none",
          "clients": [{ "client": "outlook.windows", "label": "Outlook (Windows)", "support": "none" }]
        }
      ],
      "notes": []
    }
  ],
  "summary": { "templates": 1, "toFix": 3, "toCheck": 5, "notes": 1 }
}
```

- `ok`: what the exit code says (`true` is 0). Each template's `ok` is the same for it.
- `templates`: worst first. `path` is in the templates folder, `file` from the working directory. `mode` is `email`, `web` (a `Page`) or `document`, and `bytes` the size of the HTML; both are `null` when the template doesn't render.
- `toFix`, `toCheck` and `notes` hold findings of `level` `error`, `warning` and `info`. Each has a `kind` and a `message`, and when they apply:

| Field | |
| --- | --- |
| `kind` | `render` (doesn't compile or throws, or Elements left a block out), `warning` (from Elements or React), `log` (other console output), `design` (no design JSON), `text` (no plain text), `client` (email client compatibility), `link`, `image`, `size` (Gmail clipping) |
| `block` | The Elements block: `Button 1`, `Html 2` (a `client` finding lists every block, comma-separated) |
| `file`, `line`, `column`, `frame` | A `render` error's file (from the working directory), position and surrounding code |
| `line`, `lines` | A `client` finding's first template line, and every line that likely brings it in |
| `url`, `label`, `status` | A link or image: its URL, its text or alt text, and the HTTP status it answered with. For a `client` finding, `url` is its caniemail.com page |
| `feature`, `support`, `clients` | A `client` finding: caniemail's name for it, `none` or `partial`, and each client with its support |

New fields may be added; existing ones keep their meaning.

### `elements-preview screenshot`

Saves full-length PNGs of templates rendered with their `PreviewProps`, to look at the layout without opening the preview: `screenshots/<template path>.<variant>.png`, and prints each file.

```bash
npx elements-preview screenshot welcome.tsx --all
# screenshots/welcome.desktop.png
# screenshots/welcome.phone.png
# screenshots/welcome.dark.png
```

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder |
| `--out <path>` | `screenshots` | Where to write the PNGs |
| `--phone` | | Also at phone width (375 px) |
| `--dark` | | Also in dark mode: the preview's simulation, with every color flipped as in the Gmail apps and Outlook.com |
| `--all` | | Desktop, phone and dark |
| `--width <px>` | `680` | The desktop (and dark) width. A `Document` is taken at its page's width (A4: 794 px) unless you set one |
| `--browser <path>` | `CHROME_PATH`, or the one found | The browser to use |
| `--json` | | Print `{ ok, browser, outDir, templates: [{ path, ok, mode, screenshots: [{ variant, width, height, file }], warnings, error? }] }` |

Templates are named as for `check` (`.` takes them all). Each page loads the templates folder's `static/` files as the preview does, and waits for its images and web fonts; an image that doesn't load is reported. Templates are taken one at a time, in one browser tab.

It uses a browser already installed, never downloads one: Chrome, Chromium, Microsoft Edge or Brave, in their usual places on macOS, Windows and Linux. Point to another with `--browser` or `CHROME_PATH`. It exits with `1` when a template fails to render, and `2` when it can't run (no browser, an option, folder or template that isn't right, or two templates whose screenshots would have the same name, such as `welcome.jsx` and `welcome.tsx`).

### `elements-preview render`

Renders templates with their `PreviewProps` and prints what a program needs to use them elsewhere: the mode, the HTML and the design JSON the Unlayer editor opens.

```bash
npx elements-preview render welcome.tsx --json      # one JSON object
npx elements-preview render . --json --check        # every template, a line each, with check's findings
npx elements-preview render welcome.tsx > out.html  # without --json: one template's HTML
```

With `--json`, it prints one JSON object per template, a line each (one template: one object):

```json
{ "path": "welcome.tsx", "file": "emails/welcome.tsx", "ok": true, "mode": "email", "html": "<!DOCTYPE html …", "design": { "body": { "rows": […] } }, "warnings": [] }
```

- `path` is the template's path in the templates folder, `file` its path from the working directory, and `mode` is `email`, `web` (a `Page`) or `document`.
- `design` is the design JSON; it's `null` when it can't be made, with the reason in `designError`.
- A template that doesn't render has `ok: false`, `mode`, `html` and `design` `null`, and an `error` with its `message`, `file`, `line`, `column` and `frame`.
- `warnings` are what Elements and React warned about while rendering.
- With `--check`, `check` holds the template's findings as `check --json` reports them (`toFix`, `toCheck`, `notes`) and `ok` (nothing to fix); the template's `ok` is then `false` when there's something to fix.

Templates are named as for `check` (`.` takes them all); name at least one.

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder |
| `--json` | | Print each template as a line of JSON (without it: one template's HTML) |
| `--check` | | Also run `check`'s checks on each template |
| `--offline` | | With `--check`, don't request the links' and images' URLs |

| Exit code | |
| --- | --- |
| `0` | Every template rendered (with `--check`, with nothing to fix) |
| `1` | One didn't, or has something to fix (`--check`) |
| `2` | It couldn't run: an option, folder or template that isn't right, or Elements not installed. With `--json`, stderr has `{"error": "…"}` |

New fields may be added; existing ones keep their meaning.

### `elements-preview build` and `start`

`build` writes the preview as static files to share, for example with teammates who review emails without running the project: every template rendered with its `PreviewProps`, with its compatibility and link checks (link checks from the HTML only: a build doesn't request URLs). Host the folder on any static host, under any path, or serve it on localhost with `start`.

| Option | Default | |
| --- | --- | --- |
| `--dir <path>` | `emails` | The templates folder (`build`) |
| `--outDir <path>` | `.elements-preview` | Where to write the build (`build`), or the build to serve (`start`) |
| `--project-id <id>` | `UNLAYER_PROJECT_ID`, or none | The Unlayer project the Editor view opens designs in (`build`) |
| `--port <number>` | `3000` | The port (`start`) |
| `--open` | | Open it in your browser (`start`) |

A build can't render with other props or update as you edit: that's what `dev` is for. Its Editor view works as in `dev`.

Building again replaces the previous build: the files it wrote are removed first, so a template you deleted, and the app files of an earlier version, don't stay in the folder. A build lists the files it writes in `.elements-preview-build.json` in the folder, and removes only those, so files you add (a host's `_headers`, a `CNAME`) stay. It only writes into a new or empty folder, or one with a build in it: it exits with 2, writing nothing, when the folder has other files (or a build from an earlier version of the preview, without the list). Delete the folder, or build to another one with `--outDir`.

#### Deploy a build

A build is plain static files with relative paths, so it works on any static host, under any path. Every host needs the same two settings: the build command `npx elements-preview build` and the output folder `.elements-preview`.

- **Vercel**: in the project settings, set the build command and the output directory, or add a `vercel.json`:

  ```json
  { "buildCommand": "npx elements-preview build", "outputDirectory": ".elements-preview" }
  ```

- **Netlify**: add a `netlify.toml`:

  ```toml
  [build]
    command = "npx elements-preview build"
    publish = ".elements-preview"
  ```

- **Cloudflare Pages**: set the build command to `npx elements-preview build` and the build output directory to `.elements-preview`.
- **GitHub Pages**: build in a workflow and publish the folder with the official Pages actions, in a job with `pages: write` and `id-token: write` permissions (see GitHub's [custom workflows for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)):

  ```yaml
  - run: npm ci && npx elements-preview build
  - uses: actions/upload-pages-artifact@v3
    with:
      path: .elements-preview
  - uses: actions/deploy-pages@v4
  ```

A build contains each template's source code and its `PreviewProps`, so whoever can open it can read them. Keep real customer data and secrets out of `PreviewProps`, and put the deployment behind your host's access protection when the templates are private.

### Vite plugins

`dev`, `check`, `screenshot`, `render`, `export` and `build` load templates with [Vite](https://vite.dev). For a file type your templates import that Vite doesn't load by itself (SVG as components, MDX, YAML), pass plugins with `--vite-plugins <path>`: a module whose default export is an array of Vite plugins, or a function that returns one.

```js
// preview-plugins.js
import svgr from "vite-plugin-svgr";

export default [svgr()];
```

```bash
npx elements-preview dev --vite-plugins ./preview-plugins.js
```

## Requirements

- Node.js 20.19 or later, or 22.12 or later
- `@unlayer/react-elements` 0.2.0 or later, and React 18 or 19, installed in your project
- For `screenshot`: Chrome, Chromium, Microsoft Edge or Brave
