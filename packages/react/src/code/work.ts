/**
 * The work a render's code blocks and Markdown share: what's left of each of their budgets for the whole render (see
 * the main entry's sharedByRender, in utils/render-scope.ts), so a template of many blocks (a digest of comments, each a
 * <Markdown> of its own) takes what one block of their size would, where each block had a budget of its own. It's
 * reached from a component's or template wrapper's call; outside one (a component React renders, a highlightCode()
 * call outside any render, an async component's code after an `await`), there's none: each block or call has its own.
 */
import { renderToHtml } from "@unlayer/react-elements";

type Shared = Record<symbol, unknown>;
const INTERNALS = Symbol.for("@unlayer/react-elements/internals");

/** What the component being rendered shares with the rest of its render, or undefined outside a render. */
const shared = (): Shared | undefined => (renderToHtml as unknown as Record<symbol, { shared?: () => Shared | undefined } | undefined>)[INTERNALS]?.shared?.();

/** The render's work under `key`, `make`'s the first time in the render; undefined outside a render. */
export function renderWork<T>(key: symbol, make: () => T): T | undefined {
  const all = shared();
  if (!all) return undefined;
  if (!(key in all)) all[key] = make();
  return all[key] as T;
}

const SAID = Symbol.for("@unlayer/react-elements/said");

const DONE = Symbol.for("@unlayer/react-elements/when-done");

/**
 * Says what `say` says once the render's done, once for all of it under `key` (the last `say` given), as it can say
 * what the whole render did; outside a render, at once.
 */
export function sayWhenDone(key: string, say: () => void): void {
  const done = renderWork(DONE, () => new Map<string, () => void>());
  if (done) done.set(key, say);
  else say();
}

/** Says `message` once in the render, under `key` (each time outside one). */
export function sayInRender(key: string, message: string): void {
  const said = renderWork(SAID, () => new Set<string>());
  if (said?.has(key)) return;
  said?.add(key);
  console.warn(message);
}

/**
 * The code a render's blocks are highlighted with, together: their sizes squared. highlight.js's time can grow with a
 * block's size squared (see highlight.ts's HIGHLIGHT_LIMIT, the most it's given at once: this is that squared), so
 * this is a block of 8,192 characters, or many smaller ones (64 of 1,024, a thousand of 256), about 0.4 s at the most
 * for the whole render; past it a block is shown without colors.
 */
export const CODE_WORK = 8192 ** 2;

/**
 * What's left of a render's CODE_WORK, and the code a Markdown charged to it already, by its text: a Markdown decides
 * which of its blocks are highlighted as it reads them, in order, before its CodeBlocks render; highlightCode doesn't
 * charge that code again (once for each time it was charged).
 */
export interface CodeWork {
  left: number;
  paid: Map<string, number>;
}

/** The render's code work (undefined outside a render). */
export const codeWork = (): CodeWork | undefined => renderWork(Symbol.for("@unlayer/react-elements/code-work"), () => ({ left: CODE_WORK, paid: new Map<string, number>() }));

/** Charges `code`, of `size` squared, to the render's `work`, before it's highlighted (see CodeWork). */
export function charge(work: CodeWork, code: string, size: number): void {
  work.left -= size;
  work.paid.set(code, (work.paid.get(code) ?? 0) + 1);
}

/** Whether `code` was charged already (see CodeWork), which it then isn't any more. */
export function paidFor(code: string): boolean {
  const work = codeWork();
  const times = work?.paid.get(code);
  if (!times) return false;
  if (times > 1) work!.paid.set(code, times - 1);
  else work!.paid.delete(code);
  return true;
}
