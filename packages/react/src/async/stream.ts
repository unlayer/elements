/**
 * A React render that waits for everything: react-dom's streaming server renderer, read once all of it is ready
 * (`onAllReady`, `allReady`), so async components, Suspense and `use()` have resolved: what a synchronous render
 * would have left out. Its markers for Suspense boundaries and text are taken out, so it's what a static render writes.
 */
import React from "react";
import * as server from "react-dom/server";

/** The component an error came from, by the component stack React gives with it (React 19). */
function componentOf(info: unknown): string | undefined {
  return /\n\s*at ([A-Z][\w$.]*)/.exec(String((info as { componentStack?: string } | undefined)?.componentStack ?? ""))?.[1];
}

/** Errors an async component Elements called itself (React 18) threw, by the component's name. */
const thrownBy = new WeakMap<object, string>();

/** An error a component threw, said for this render, with the error itself as its cause. */
function failure(error: unknown, info?: unknown): Error {
  const name = componentOf(info) ?? (error && typeof error === "object" ? thrownBy.get(error) : undefined);
  const message = String((error as Error)?.message ?? error);
  const hint = /Objects are not valid as a React child \(found: \[object Promise\]\)/.test(message)
    ? " (React 18 renders no async component Elements doesn't place itself, as a child of a root, Row, Column or text: use React 19)"
    : "";
  return Object.assign(new Error(`[Unlayer] ${name ? `<${name}>` : "A component"} threw while rendering: ${message}${hint}`), { cause: error });
}

/** This react-dom's static renderer, for the check whose React it renders with (see the main entry's idsSeen). */
export const renderStatic = (server as unknown as { renderToStaticMarkup?: (node: React.ReactNode, options?: object) => string }).renderToStaticMarkup;

/** What a streaming render writes for hydration, which a static render doesn't: Suspense boundaries' and text's markers. */
const clean = (html: string) => html.replace(/<!--(?:\$[?!]?|\/\$| )-->(?:<template[^>]*><\/template>)?/g, "");

/** `node` rendered to HTML once everything in it has resolved; rejects with what a component threw (as its cause). */
export function renderAll(node: React.ReactNode, identifierPrefix: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let failed: Error | undefined;
    const onError = (error: unknown, info?: unknown) => {
      failed ??= failure(error, info);
    };
    const done = (html: string) => (failed ? reject(failed) : resolve(clean(html)));
    const streaming = server as unknown as Record<string, Function>;
    if (typeof streaming.renderToPipeableStream === "function") {
      // Node's: written to a destination of its own (no Node stream needed).
      const decoder = new TextDecoder();
      let html = "";
      const destination = {
        write(chunk: string | Uint8Array) {
          html += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
          return true;
        },
        end() {
          done(html + decoder.decode());
        },
        on() {
          return destination;
        },
        once() {
          return destination;
        },
        emit() {
          return true;
        },
        removeListener() {
          return destination;
        },
      };
      const stream = streaming.renderToPipeableStream(node, {
        identifierPrefix,
        onError,
        onShellError: (error: unknown) => reject(failure(error)),
        onAllReady: () => stream.pipe(destination),
      });
    } else {
      // The web's (edge runtimes, browsers, Bun).
      (streaming.renderToReadableStream(node, { identifierPrefix, onError }) as Promise<ReadableStream & { allReady: Promise<void> }>).then(async (stream) => {
        await stream.allReady;
        done(await new Response(stream).text());
      }, (error) => reject(failure(error)));
    }
  });
}

/**
 * On React 18, which can't render an async component: one Elements places (as a child of a root, a Row, a Column or
 * text) called first, and React shown what it gives once it has (it suspends until then, as React 18 supports).
 */
const settled = new WeakMap<object, { promise: Promise<void>; node?: { value: React.ReactNode }; error?: { value: unknown } }>();

function Awaited({ element }: { element: React.ReactElement }): React.ReactNode {
  let state = settled.get(element);
  if (!state) {
    const type = element.type as unknown as (props: unknown) => Promise<React.ReactNode>;
    const next: { promise: Promise<void>; node?: { value: React.ReactNode }; error?: { value: unknown } } = { promise: Promise.resolve() };
    next.promise = Promise.resolve()
      .then(() => type({ ...element.props }))
      .then(
        (value) => void (next.node = { value }),
        (value) => {
          if (value && typeof value === "object") thrownBy.set(value, (type as { displayName?: string }).displayName || type.name);
          next.error = { value };
        }
      );
    settled.set(element, (state = next));
  }
  if (state.error) throw state.error.value;
  if (state.node) return state.node.value;
  throw state.promise;
}

/** How an async render gives React an async component: as it is on React 19, which renders it; resolved first on 18. */
export const asyncComponent = (element: React.ReactElement): React.ReactElement =>
  typeof (React as { use?: unknown }).use === "function" ? element : React.createElement(Awaited, { element });
