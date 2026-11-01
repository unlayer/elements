/**
 * How the async renderers wait for a template's wrappers: each called until its root, awaited where it waits (its
 * promise, or what it `use()`d). The main entry's engine does the rest (src/engine; this entry reaches it through the
 * main entry's internals, so one copy of the engine renders): the content rendered by react-dom's streaming render,
 * waited for whole, where React waits for what suspends (an async component, `use()` of a pending promise, a thrown
 * promise, a lazy component, a promise as a child), siblings at once; the output is read in tree order once
 * everything has settled, whatever settled first (a render that fails, with its first error in tree order).
 */
import type React from "react";
import type { Steps, Unwrapped } from "../utils/unwrap-root";

/** What a template's wrappers lead to (its root), awaiting what each waits for (its promise, or what it `use()`d). */
export async function take(steps: Steps): Promise<Unwrapped> {
  let step = steps.next();
  while (!step.done) {
    let value: unknown;
    try {
      value = await step.value;
    } catch (error) {
      step = steps.throw(error);
      continue;
    }
    step = steps.next(value);
  }
  return step.value;
}

