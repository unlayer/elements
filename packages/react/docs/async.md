# Async templates and readable HTML

Elements' renderers (`renderToHtml`, `renderToPlainText`, `renderToJson`, `renderToHtmlParts`) are synchronous. When a template loads data as it renders, as an async component or by suspending, use the async renderers from `@unlayer/react-elements/async`. They take the same arguments and return Promises:

```tsx
import { Email, Row, Column, Heading, Paragraph } from "@unlayer/react-elements";
import { renderToHtml, renderToPlainText, renderToJson } from "@unlayer/react-elements/async";

async function CustomerName({ id }: { id: string }) {
  const customer = await db.customers.find(id);
  return <strong>{customer.name}</strong>;
}

async function Receipt({ orderId }: { orderId: string }) {
  const order = await db.orders.find(orderId);
  return (
    <Email previewText={`Order ${order.number}`}>
      <Row>
        <Column>
          <Heading>Order {order.number}</Heading>
          <Paragraph>
            Thanks, <CustomerName id={order.customerId} />.
          </Paragraph>
        </Column>
      </Row>
    </Email>
  );
}

const html = await renderToHtml(<Receipt orderId="A-1001" />, { title: "Your receipt" });
const text = await renderToPlainText(<Receipt orderId="A-1001" />);
const design = await renderToJson(<Receipt orderId="A-1001" />);
```

The output is what the synchronous renderers give for the same content, and the same as theirs for a template with nothing async.

## What resolves

- **An async template** (`async function Receipt()`), or a lazy one (`React.lazy(() => import("./Receipt"))`), also wrapped in a context provider, a Fragment, a `<Suspense>` or a `<Tailwind>`. In a lazy template's module, a `<Tailwind>` or an `<UnlayerProvider>` around its root works as in a template that isn't lazy, but a context's provider there doesn't reach the content (React's public API gives no way to what the module renders around its root): put it inside the root (`<Email><Locale.Provider value="fr">…`), or around the lazy element (`<Locale.Provider value="fr"><LazyReceipt /></Locale.Provider>`). A `<Suspense>` around the template's root is outside the document, and its fallback isn't a document, so it never renders: the template in it is waited for (the synchronous renderers say it's async, as without it), and one that fails rejects the render, naming it. A `<Suspense>` inside the root (or around a template with no root, whose content it is) is React's: these renderers wait for what's in it, and the synchronous ones render its fallback where what's in it suspends.
- **Async components** in a Column, among rows, in a Paragraph's, Heading's or Button's text, and in a `<Head>`.
- **A lazy component in the template** (`React.lazy` for a section), which React renders itself: Elements' components in it are blocks and rows as anywhere, and the rest of its HTML (its markup, `dangerouslySetInnerHTML`) is kept as React wrote it, as React Email keeps it. HTML given whole there that leaves a tag, a quote, a comment or a `<style>` open runs on into what's after it in a browser, as in React's own render, and these renderers take React's stream comments out of it (`<!-- -->`, `<!--$-->`, …), in HTML given whole there too, as the synchronous ones write none. In a Column, a lazy section that's markup only is an Html block, a lone link or rule too. Elements can't count how deep the components in it nest, so on React 19 a recursive component there whose data nests thousands deep (a reply chain) can break React's renderer for the whole process, as with react-dom alone: render such data outside a lazy section. HTML that holds the text of one of Elements' internal markers (`<unlayer-mark …>`, `</unlayer-mark>`) fails the render, saying so, and so does a `</unlayer-mark>` anywhere in a template with a lazy section, even in a `<Head>`'s JSON-LD data. A part that fails in a `<Suspense>` in what it renders fails the render all the same (with `onError`, it's said, the fallback standing for it).
- **Suspense**: `use(promise)` on React 19, and components that throw a promise until their data is there (React 18's way, which React 19 keeps).
- **`<Tailwind config>`**: its config compiled, as with the [Tailwind guide](./tailwind.md)'s renderers, which are these. `tailwindcss` is loaded only when a template has a config.
- **Errors**: a component that throws, also after an `await`, rejects the render with a `RenderError` naming the component and where it is, with what it threw as its `cause`, as the synchronous renderers throw. Where two fail, it's the first in the template, whichever failed first: the render waits for everything in it first, as React's stream does (React Email's render too), so a component whose data never arrives holds the render. Give the fetches your components make a timeout. With `onError: "omit"` the failed parts are left out instead (see [Errors](../README.md#errors)).

## How it works

The template's root is resolved first: an async template is called and awaited (and one that `use()`s or throws a promise, called again once it's there). Elements then renders the content with react-dom's streaming render, waited for whole, with hooks, context and `use()` working as in React's server renderer: where a component waits, React goes on with the rest, so the data of sibling components loads at once, and each part is where it is in the template once it's there, whatever arrives first, so the output is the same every time. The synchronous renderer makes the HTML, the head, the plain text or the design from that render: each component runs once per render. Several renders can run at once. See [ARCHITECTURE.md](../ARCHITECTURE.md#the-async-renderers).

## Contexts

> **Security: a context a template doesn't provide can be read from another request's render, and a template's provider values by another request's render: either can be another tenant's data.** React's server renders keep one value for each context, read by every react-dom build in the process, and a build puts back only what it left itself. Where your app also renders with another react-dom build (`react-dom/server.edge`, `.browser` or `.bun`, or `react-dom/static.edge`'s `prerender`), as React's own renders do (React Email's `render` reads the same):
>
> - The async renderers read a provider's value an app's stream of that build left after a part in a `<Suspense>` waited, until that build renders again (react-dom's own Node.js stream reads it there too).
> - Every renderer, the synchronous ones too, reads a provider's value an app's `renderToString` of that build left where a part inside the provider threw or suspended, until that build renders again: also where a `<Suspense>` caught it and the page rendered its fallback (a part that suspended, failed or never loaded).
> - While an async render waits, an app's stream of that build reads the template's provider values where its page doesn't provide the context; a render that never settles leaves them there.
> - While an app's stream of that build runs at the same time as an async render, **even a value a template (or the page) provides itself** can be the other's: where a part resumes under a provider, React doesn't put the provider's value back if it last left it there, and the other build changed it meanwhile (React's development build says "Detected multiple renderers concurrently rendering the same context provider"). Providing every context doesn't prevent this one.
>
> Where your app streams with another react-dom build in the same process (Next.js's App Router renders pages with `react-dom/server.edge`), pass what's sensitive to the template as props, not in a context; or render emails with the synchronous renderers, which never wait while another render runs, and read no value a stream left; or render them in a worker or a process of their own.

**A template must provide every context it reads, and so must your app's renders; don't put secrets in a context another render could read.** Wrap the template's content in its own providers, with the values the render is given:

```tsx
async function Receipt({ user, id }: { user: User; id: string }) {
  const order = await getOrder(id);
  return (
    <Email>
      <UserContext.Provider value={user}>
        <Row><Column><Greeting /><Paragraph>Order {order.number}</Paragraph></Column></Row>
      </UserContext.Provider>
    </Email>
  );
}
```

The synchronous renderers read a context's default where the template doesn't provide it, except inside a component of an app's own `renderToString`, where they read the page's value, as 0.2 did, and after another build's `renderToString` in which a part inside a provider threw or suspended, a `<Suspense>` around it or not (above). No stream's provider values reach them, not even those of an async render of Elements' own that waits meanwhile: react-dom keeps its static render's context values apart from its streams'.

## React 18 and React 19

| | React 19 | React 18 |
|--|--|--|
| Async templates (`async function Template()`) | ✓ | ✓ |
| Async components, anywhere (in a Column, in text, in a component of yours) | ✓ | ✓ |
| Components that throw a promise (Suspense) | ✓ | ✓ |
| `use(promise)` | ✓ | ✗ (React 18 has no `use`) |
| An async template or component that `React.lazy` loads | ✓ | ✗ (React 18 renders what a lazy component loads itself: load it with `await import()` and render it) |

On React 18, a lazy component whose module's component is async fails the render, saying so: React renders what `React.lazy` loads itself, and React 18 has no async components. In a development build, React 18 also calls it again with no props for a warning, so one that reads its props there rejects where nothing handles it, which Node.js ends the process on; and in any build, a promise of it that rejects is one nothing handles (React 18 never reads it), which ends the process too: load the module with `await import()` and render what it gives (or render a lazy component's async parts as components of their own, which Elements calls).

With React 18's types (`@types/react` 18), TypeScript rejects an async component written as JSX: `error TS2786: 'Receipt' cannot be used as a JSX component` (its `Promise<Element>` isn't a `ReactNode` there). React's canary types allow it: add `/// <reference types="react/canary" />` to a `.d.ts` file in your project (or `"react/canary"` to `compilerOptions.types`). They change types only, nothing at runtime. React 19's types allow async components as they are.

## `pretty`

`renderToHtml` and `renderToHtmlParts` take `pretty: true` to format the HTML for reading: indented, a tag per line where whitespace allows it.

```ts
const html = await renderToHtml(<Receipt orderId="A-1001" />, { pretty: true });
```

It uses [prettier](https://prettier.io) 3, an optional peer dependency (`npm install prettier`), loaded only when `pretty` is set; without it, or with prettier 2, the render rejects saying what to install. Where prettier can't read the HTML (an Html block that opens a `<div>` a later one closes, which a browser reads, or text with a NUL character), it's returned as it renders, said with `console.warn`: formatting never fails the render. Whitespace that shows (in text, between inline elements) isn't touched, and comments, Outlook's `<!--[if mso]>` blocks included, are kept exactly as they were: the document shows the same text. Send the unformatted HTML: it's smaller.

`pretty(html)` formats any HTML the same way, the synchronous renderers' too:

```ts
import { renderToHtml } from "@unlayer/react-elements";
import { pretty } from "@unlayer/react-elements/async";

const html = await pretty(renderToHtml(<Receipt order={order} />));
```

`pretty` doesn't work on edge runtimes (Vercel Edge Functions, Cloudflare Workers): prettier is loaded when it runs, from `node_modules`, which they don't have. Format at build time there (a snapshot, a script), or render in the Node.js runtime.

The plain text takes the synchronous renderer's options too: `await renderToPlainText(template, { links: "after", wordwrap: 72 })` (see `renderToPlainText` in the [React API reference](../README.md)).

## Agent rules

- Templates that `await` or suspend: import the renderers from `@unlayer/react-elements/async` and `await` them. The synchronous ones throw for such components, naming them.
- Keep data loading in the template's own async components; don't fetch inside a synchronous render.
- Use `pretty` for snapshots and debugging, not for what you send, and not on an edge runtime.
