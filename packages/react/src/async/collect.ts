/**
 * How the async renderers wait for what's async in a template, the main entry's walker doing the rest (src/engine;
 * this entry reaches it through the main entry's internals, so one copy of the engine renders): a template's
 * wrappers called until its root, each awaited where it waits; and its content walked with a hole wherever a
 * component suspends (an async component, `use()` of a pending promise, a thrown promise, a lazy component, a promise
 * as a child). The walk goes on past a hole, so siblings start their own work at once; a hole is filled when its
 * promise settles, walking that component again at the tree position, with the context and in the place it had; and
 * the output is flattened in tree order once everything before the first error (or everything) has settled, whatever
 * settled first.
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

