# Code in emails, pages and documents

Show code in a developer newsletter, an API key email or a changelog. `CodeBlock` is syntax-highlighted code that email clients show as it looks in the browser, and `CodeInline` is code inside a sentence.

```bash
npm install @unlayer/react-elements
```

Both come from `@unlayer/react-elements/code`. The highlighter ([highlight.js](https://github.com/highlightjs/highlight.js)) is built into that entry: there's nothing more to install, and the main entry never loads it.

## CodeBlock

```tsx
import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
import { CodeBlock, CodeInline } from "@unlayer/react-elements/code";

<Email>
  <Row>
    <Column>
      <Paragraph>
        Install it with <CodeInline>npm install @acme/sdk</CodeInline>, then:
      </Paragraph>
      <CodeBlock language="ts" theme="dark" lineNumbers>{`
import { Acme } from "@acme/sdk";

const acme = new Acme({ apiKey: process.env.ACME_KEY });
await acme.orders.list({ limit: 10 });
`}</CodeBlock>
    </Column>
  </Row>
</Email>
```

How it stays readable in email:

- **Inline styles only.** Each token is a `<span style="color: …">`: there's no class for a stylesheet to resolve, which most clients would drop.
- **Outlook.** The code is in a `<pre>`, which Outlook shows with its spaces and line breaks, in a monospace font (the stack ends in Consolas and Courier New), on the block's background (`bgcolor`). Line heights are in pixels, which Outlook reads.
- **Line numbers** are a table row per line, so a number stays beside its line when a long line wraps. They're left out of the plain text.
- **Plain text** (`renderToPlainText()`) is the code as written, its indentation kept.

In the design (`renderToJson()`), a CodeBlock is an HTML block.

### Props

| Prop | Default | |
|------|---------|--|
| `children` / `code` | | The code. A leading line break and trailing whitespace are taken off. |
| `language` | none (no colors) | A language highlight.js knows: `ts`, `tsx`, `js`, `json`, `html`, `css`, `bash`, `shell`, `python`, `ruby`, `go`, `rust`, `java`, `kotlin`, `swift`, `c`, `cpp`, `csharp`, `php`, `sql`, `yaml`, `graphql`, `ini`, `markdown`, `diff`, … |
| `theme` | `"light"` | `"light"`, `"dark"`, one of highlight.js's (`"github-light"`, `"github-dark"`, `"one-dark"`, `"monokai"`, `"dracula"`, `"nord"`, `"solarized-light"`, `"solarized-dark"`), or a theme of your own. |
| `lineNumbers` | `false` | `true`, or the first line's number. |
| `fontSize` | `13px` | |
| `lineHeight` | `1.5` | A ratio of the size (written in pixels), or a length. |
| `fontFamily` | system monospace, Consolas, Courier New | |
| `padding` | `16px` | |
| `borderRadius` | `6px` | |
| `wrap` | `true` | Long lines wrap; `false` keeps them on one line (they scroll where a client can). |
| `containerPadding`, `hideOnMobile`, `hideOnDesktop` | | As on any block. |

Code in a language Elements doesn't build in is shown without colors, with a warning. Add the language with highlight.js's definition (install `highlight.js` in your project for it):

```ts
import { registerLanguage } from "@unlayer/react-elements/code";
import elixir from "highlight.js/lib/languages/elixir";

registerLanguage("elixir", elixir);
```

`listLanguages()` lists the languages it knows. `highlightCode(code, options)` returns a CodeBlock's HTML, for markup you build yourself.

### Themes

`codeThemes.light` and `codeThemes.dark` are Elements' own. The others are ported from highlight.js's style sheets (their colors and font styles, as inline CSS; see `THIRD_PARTY_LICENSES.md` for their authors and licenses):

| Name | From highlight.js | |
|------|-------------------|--|
| `github-light` | `github.css` | light, with a border |
| `github-dark` | `github-dark.css` | dark |
| `one-dark` | `atom-one-dark.css` | dark |
| `monokai` | `monokai.css` | dark |
| `dracula` | `base16/dracula.css` | dark |
| `nord` | `nord.css` | dark |
| `solarized-light` | `base16/solarized-light.css` | light, with a border |
| `solarized-dark` | `base16/solarized-dark.css` | dark |

```tsx
<CodeBlock language="ts" theme="github-dark" lineNumbers>{source}</CodeBlock>
```

A theme of your own has the block's `background`, `color`, an optional `border`, the `lineNumbers` color, the `inline` colors CodeInline uses, and `tokens`: CSS declarations by highlight.js scope. A scope a theme doesn't name takes its parent's style (`title.function` takes `title`'s):

```ts
import { codeThemes, type CodeTheme } from "@unlayer/react-elements/code";

const brand: CodeTheme = {
  ...codeThemes.dark,
  background: "#0b1020",
  tokens: { ...codeThemes.dark.tokens, keyword: "color: #ff9e64; font-weight: bold", string: "color: #9ece6a" },
};
```

## CodeInline

Code in the text of a `Paragraph`, `Heading` or `Button`:

```tsx
<Paragraph>
  Set <CodeInline>ACME_KEY</CodeInline> before you deploy.
</Paragraph>
```

It's a `<code>` with inline styles: a monospace font a little smaller than the text, on the theme's inline background. Outlook shows it in Courier New, without the padding and corners. It's kept in the design's text. For an `html` prop or a Heading's `text`, `codeInline(code, { theme })` returns the same HTML:

```tsx
<Paragraph html={`Run ${codeInline("npm test")} before you push.`} />
```

## Agent rules

- Import `CodeBlock`, `CodeInline`, `codeInline` from `@unlayer/react-elements/code`. Put `CodeBlock` in a `Column`, like any block.
- Give `language` for colors. Pass code as a string (a template literal), not JSX.
- For inline code in text, use `<CodeInline>` in the children, or `codeInline()` in an `html` prop. Don't hand-write `<code>` with classes.
