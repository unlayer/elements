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

- **An async template** (`async function Receipt()`), also wrapped in a context provider, a Fragment or a `<Tailwind>`.
- **Async components** in a Column, among rows, and in a Paragraph's, Heading's or Button's text.
- **Suspense**: `use(promise)` on React 19, and components that throw a promise until their data is there (React 18's way, which React 19 keeps).
- **`<Tailwind config>`**: its config compiled, as with the [Tailwind guide](./tailwind.md)'s renderers, which are these. `tailwindcss` is loaded only when a template has a config.
- **Errors**: a component that throws, also after an `await`, rejects the render with an error naming the component, and with what it threw as the error's `cause`. (The synchronous renderers leave such a component out, with a warning, for a live preview.)

## How it works

The template's root is resolved first: an async template is called and awaited. The content is then rendered once by React's streaming server renderer, which the renderer reads only when everything in it is ready (`onAllReady` in Node, `allReady` on the web), so React itself resolves async components and Suspense, with hooks, context and `use()` working as in any server render. That render collects the template, and the synchronous renderer makes the HTML, the head, the plain text or the design from what it collected: each component runs once per render. Several renders can run at once.

## React 18 and React 19

| | React 19 | React 18 |
|--|--|--|
| Async templates (`async function Template()`) | ✓ | ✓ |
| Async components placed in a root, a Row, a Column or text | ✓ | ✓ (Elements resolves them) |
| Async components another component of yours renders | ✓ | ✗ (React 18 can't render them: the render rejects, saying so) |
| Components that throw a promise (Suspense) | ✓ | ✓ |
| `use(promise)` | ✓ | ✗ (React 18 has no `use`) |

A root template that suspends (`use()` in the component that returns `<Email>`) isn't resolved: make it an async function.

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

- Templates that `await` or suspend: import the renderers from `@unlayer/react-elements/async` and `await` them. The synchronous ones leave such components out, with a warning naming them.
- Keep data loading in the template's own async components; don't fetch inside a synchronous render.
- Use `pretty` for snapshots and debugging, not for what you send, and not on an edge runtime.
