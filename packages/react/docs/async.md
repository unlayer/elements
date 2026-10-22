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

- **An async template** (`async function Receipt()`), or a lazy one (`React.lazy(() => import("./Receipt"))`), also wrapped in a context provider, a Fragment, a `<Suspense>` or a `<Tailwind>`. A `<Suspense>` around the template's root is outside the document, and its fallback isn't a document, so it never renders: the template in it is waited for (the synchronous renderers say it's async, as without it), and one that fails rejects the render, naming it. A `<Suspense>` inside the root (or around a template with no root, whose content it is) is React's: these renderers wait for what's in it, and the synchronous ones render its fallback where what's in it suspends.
- **Async components** in a Column, among rows, in a Paragraph's, Heading's or Button's text, and in a `<Head>`.
- **Suspense**: `use(promise)` on React 19, and components that throw a promise until their data is there (React 18's way, which React 19 keeps).
- **`<Tailwind config>`**: its config compiled, as with the [Tailwind guide](./tailwind.md)'s renderers, which are these. `tailwindcss` is loaded only when a template has a config.
- **Errors**: a component that throws, also after an `await`, rejects the render with a `RenderError` naming the component and where it is, with what it threw as its `cause`, as the synchronous renderers throw. Where two fail, it's the first in the template, whichever failed first. With `onError: "omit"` the failed parts are left out instead (see [Errors](../README.md#errors)).

## How it works

The template's root is resolved first: an async template is called and awaited (and one that `use()`s or throws a promise, called again once it's there). Elements then renders the content once, itself, with hooks, context and `use()` working as in React's server renderer: where a component waits, it goes on with the rest, so the data of sibling components loads at once, and puts each part where it is in the template once it's there, whatever arrives first, so the output is the same every time. The synchronous renderer makes the HTML, the head, the plain text or the design from that render: each component runs once per render. Several renders can run at once. See [ARCHITECTURE.md](../ARCHITECTURE.md#the-async-walk).

## React 18 and React 19

| | React 19 | React 18 |
|--|--|--|
| Async templates (`async function Template()`) | ✓ | ✓ |
| Async components, anywhere (in a Column, in text, in a component of yours) | ✓ | ✓ |
| Components that throw a promise (Suspense) | ✓ | ✓ |
| `use(promise)` | ✓ | ✗ (React 18 has no `use`) |

With React 18's types (`@types/react` 18), TypeScript rejects an async component written as JSX: `error TS2786: 'Receipt' cannot be used as a JSX component` (its `Promise<Element>` isn't a `ReactNode` there). React's canary types allow it: add `/// <reference types="react/canary" />` to a `.d.ts` file in your project (or `"react/canary"` to `compilerOptions.types`). They change types only, nothing at runtime. React 19's types allow async components as they are.

## `pretty`

`renderToHtml` and `renderToHtmlParts` take `pretty: true` to format the HTML for reading: indented, a tag per line where whitespace allows it.

```ts
const html = await renderToHtml(<Receipt orderId="A-1001" />, { pretty: true });
```

It uses [prettier](https://prettier.io), an optional peer dependency (`npm install prettier`), loaded only when `pretty` is set; without it, the render rejects saying what to install. Whitespace that shows (in text, between inline elements) isn't touched, and comments, Outlook's `<!--[if mso]>` blocks included, are kept exactly as they were: the document shows the same text. Send the unformatted HTML: it's smaller.

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
