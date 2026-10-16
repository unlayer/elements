/**
 * Which async render the work under way is for, where its ids can't say (another copy of React than react-dom's: see
 * the main entry's collect.ts, `running`). An AsyncLocalStorage follows each render through React's work (its async
 * components, Suspense, `use()`), so renders still run at once: the runtime's (Next.js puts one on globalThis, on its
 * edge runtime too), else Node's, Bun's or Deno's. Where there's none (a browser, Node before 20.16), a render whose
 * ids can't say collects with no other under way, and the others wait for it.
 */
interface Storage<T> {
  run<R>(store: T, run: () => R): R;
  getStore(): T | undefined;
}

export interface Runner<T extends { blind?: boolean }> {
  /** `collect()`, for `collection`, under way. */
  run<R>(collection: T, collect: () => Promise<R>): Promise<R>;
  /** The collection whose work this is, where it can tell. */
  current(): T | undefined;
}

type Runtime = { AsyncLocalStorage?: new () => Storage<never>; process?: { getBuiltinModule?(id: string): Runtime | undefined } };

/** The runtime's AsyncLocalStorage, if it has one. */
export function storage<T>(): Storage<T> | undefined {
  const runtime = globalThis as Runtime;
  const Constructor = runtime.AsyncLocalStorage ?? runtime.process?.getBuiltinModule?.("node:async_hooks")?.AsyncLocalStorage;
  return typeof Constructor === "function" ? (new Constructor() as Storage<T>) : undefined;
}

export function runner<T extends { blind?: boolean }>(store?: Storage<T>): Runner<T> {
  if (store) return { run: (collection, collect) => store.run(collection, collect), current: () => store.getStore() };
  // Each render whose ids can't say, after the one before it and the renders under way when it started (another copy
  // of Elements', whose ids can); those wait for it while it's queued or under way.
  const settled = (turn: Promise<unknown>) => turn.then(() => {}, () => {});
  let last: Promise<unknown> = Promise.resolve();
  let queued = 0;
  const others = new Set<Promise<unknown>>();
  let only: T | undefined;
  return {
    run(collection, collect) {
      if (!collection.blind) {
        const turn = queued ? last.then(collect) : collect();
        const done = settled(turn);
        others.add(done);
        done.then(() => others.delete(done));
        return turn;
      }
      queued++;
      const turn = Promise.all([last, ...others]).then(async () => {
        only = collection;
        try {
          return await collect();
        } finally {
          only = undefined;
          queued--;
        }
      });
      last = settled(turn);
      return turn;
    },
    current: () => only,
  };
}
