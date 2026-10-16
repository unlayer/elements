# Use Elements in a monorepo with npm, pnpm, Yarn, or Bun

Keep your email templates in one workspace package, render them there, and import render functions from your apps. This guide covers where the dependencies go, how apps consume the package, and the two problems monorepos add: a package that can't find Elements or React, and two copies of React. The pnpm, npm, Yarn 4, and Bun setups below were each installed and run with `@unlayer/react-elements` 0.2.1 and React 19.2.8, and an app rendered the package's templates. The preview script and the app's render below were run with 0.3.0.

## Layout

```text
acme/
├── package.json
├── pnpm-workspace.yaml          # pnpm only
├── packages/
│   └── emails/                  # @acme/emails
│       ├── package.json
│       ├── emails/
│       │   ├── welcome.tsx      # one template per file
│       │   └── _components/     # shared parts
│       │       └── footer.tsx
│       ├── scripts/
│       │   └── preview.ts       # writes each template's HTML to open in a browser
│       └── src/
│           └── index.ts         # what apps import
└── apps/
    └── api/                     # depends on @acme/emails
        └── package.json
```

## Where the dependencies go

- **The emails package** declares `@unlayer/react-elements`, `react`, and `react-dom` in its `dependencies`, and `tsx` (for its preview script) in its `devDependencies`. Everything a template imports must be declared there.
- **An app that calls the package's render functions** depends only on the emails package. It doesn't need React.
- **An app that renders the package's components itself** (`renderToHtml(<Welcome />)` in a route handler, for example) also declares Elements and React, at exactly the same versions as the emails package. See [one copy of React](#one-copy-of-react).

A template loads Elements and React as Node resolves any import: from the folder of the file that imports it, up through the `node_modules` folders above it. So the templates render with the copies the emails package resolves, wherever you run a script from, and that package must be able to resolve them.

## The shared emails package

`packages/emails/emails/welcome.tsx`, a template (a default export, with `PreviewProps` for the preview script):

```tsx
import { Button, Column, ColumnLayouts, Email, Heading, Row } from "@unlayer/react-elements";
import { Footer } from "./_components/footer";

export default function Welcome({ name }: { name: string }) {
  return (
    <Email previewText="Your account is ready.">
      <Row layout={ColumnLayouts.OneColumn}>
        <Column>
          <Heading>Welcome, {name}</Heading>
          <Button href="https://example.com/start">Get started</Button>
        </Column>
      </Row>
      <Footer />
    </Email>
  );
}

Welcome.PreviewProps = { name: "Ada" };
```

`packages/emails/emails/_components/footer.tsx`:

```tsx
import { Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";

export function Footer() {
  return (
    <Row layout={ColumnLayouts.OneColumn}>
      <Column>
        <Paragraph fontSize="12px">Acme Inc., 1 Example Street</Paragraph>
      </Column>
    </Row>
  );
}
```

`packages/emails/src/index.ts` renders inside the package, so apps get strings and never touch React:

```ts
import { createElement } from "react";
import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
import Welcome from "../emails/welcome";

export { Welcome };

export function renderWelcome(props: { name: string }) {
  const email = createElement(Welcome, props);
  return { subject: `Welcome, ${props.name}`, html: renderToHtml(email), text: renderToPlainText(email) };
}
```

An app then sends the result with any [email provider](./email-providers.md):

```ts
import { renderWelcome } from "@acme/emails";

const { subject, html, text } = renderWelcome({ name: "Ada" });
```

`packages/emails/scripts/preview.ts` writes each template's HTML and plain text with its `PreviewProps`, to open in a browser:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
import Welcome from "../emails/welcome";

const templates = { welcome: Welcome };

mkdirSync("out", { recursive: true });
for (const [name, Template] of Object.entries(templates)) {
  const email = createElement(Template, Template.PreviewProps);
  writeFileSync(`out/${name}.html`, renderToHtml(email));
  writeFileSync(`out/${name}.txt`, renderToPlainText(email));
  console.info(`out/${name}.html`);
}
```

[tsx](https://github.com/privatenumber/tsx) runs it, with the package's `tsconfig.json` for the JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true
  },
  "include": ["emails", "scripts", "src"]
}
```

This package exports TypeScript source (`"exports": { ".": "./src/index.ts" }`), which works when the app's toolchain compiles TypeScript from workspace packages. If it doesn't, build the package (for example with `tsc`) and point `exports` at the output. With [tsx](https://github.com/privatenumber/tsx), the app's `tsconfig.json` settings apply only to the files it includes: a template outside them is compiled with the classic JSX runtime and fails with `React is not defined`. Add the package to the app's `include` (`"include": ["src", "../../packages/emails/**/*"]`) or build the package.

## One copy of React

Templates call React's hooks, and Elements renders them with React DOM. If an app renders the package's components with its own Elements while the package's files import a different copy of React, the render fails with `Invalid hook call ... You might have more than one copy of React in the same app`. Package managers keep two copies when the versions differ: an app on React 19.2.7 next to an emails package on 19.2.8 produced exactly that error in our pnpm test. Use the same exact versions of `react`, `react-dom`, and `@unlayer/react-elements` everywhere: pnpm and Bun catalogs do this for you, and with npm or Yarn, write the same exact versions in each `package.json`. Check with `pnpm why react --recursive`, `npm ls react`, `yarn why react`, or `bun pm ls --all`.

## pnpm

`pnpm-workspace.yaml`, with a [catalog](https://pnpm.io/catalogs) that pins one version of each:

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  "@unlayer/react-elements": 0.3.0
  react: 19.2.8
  react-dom: 19.2.8
```

`packages/emails/package.json`:

```json
{
  "name": "@acme/emails",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "preview": "tsx scripts/preview.ts"
  },
  "dependencies": {
    "@unlayer/react-elements": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "tsx": "4.21.0"
  }
}
```

Add the emails package to an app:

```bash
pnpm --filter @acme/api add "@acme/emails@workspace:*"
```

pnpm links each package's own dependencies only: a package can import what its `package.json` declares and nothing else. If Elements is declared in an app but not in the emails package, rendering the templates fails with `Cannot find module '@unlayer/react-elements'`. Declare it, React, and anything else the templates import in the emails package.

Run the preview script from the root. pnpm runs it in the package's folder, so it writes `packages/emails/out/welcome.html`:

```bash
pnpm --filter @acme/emails preview
```

## npm

The root `package.json` lists the workspaces:

```json
{
  "name": "acme",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

```bash
npm install @unlayer/react-elements react react-dom --save-exact -w @acme/emails
npm install tsx --save-dev --save-exact -w @acme/emails
npm install @acme/emails -w @acme/api
npm run preview -w @acme/emails
```

npm installs the packages in the root `node_modules`, where the emails package finds them. A workspace that asks for a different version gets its own nested copy: that's the second React to avoid. npm doesn't support the `workspace:` protocol; the dependency on the emails package is `"@acme/emails": "*"`.

## Yarn

Yarn 4 uses the same `workspaces` field and the `workspace:*` protocol:

```bash
yarn workspace @acme/emails add @unlayer/react-elements react react-dom --exact
yarn workspace @acme/emails add -D tsx --exact
yarn workspace @acme/api add "@acme/emails@workspace:*"
yarn workspace @acme/emails preview
```

Install with `node_modules`. With Yarn's default Plug'n'Play install, the templates couldn't be loaded in our test (Yarn 4.9.2: `Named export 'Fragment' not found. The requested module 'react/jsx-runtime' is a CommonJS module`). Add this to `.yarnrc.yml` and run `yarn install` again:

```yaml
nodeLinker: node-modules
```

## Bun

The root `package.json` lists the workspaces and a catalog:

```json
{
  "name": "acme",
  "private": true,
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": {
      "@unlayer/react-elements": "0.3.0",
      "react": "19.2.8",
      "react-dom": "19.2.8"
    }
  }
}
```

The emails package uses `"catalog:"` as in the pnpm example, and the app depends on `"@acme/emails": "workspace:*"`. Bun 1.4 linked each workspace's dependencies from a shared store (`node_modules/.bun`) in our test, so as with pnpm, declare everything the templates import in the emails package.

```bash
bun install
bun run --filter @acme/emails preview
```

## Checklist

- Elements, React, and React DOM are in the emails package's `dependencies`, at one version for the whole workspace.
- Apps import render functions, or declare the same versions if they render the components themselves.
- The preview script runs in the emails package, so it renders with the copies the package resolves.
- For deployment, render at send time with `renderToHtml()`. Write HTML files ahead of time, as the preview script does, only for systems that take finished HTML.

Related: [transactional email](./transactional-email.md) and [email providers](./email-providers.md).
