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
import type { CollectOptions, Flat, Part, Task, Wait } from "../engine";
import type { Hole } from "../engine/output";
import type { Engine } from "../utils/internals";
import type { Steps } from "../utils/unwrap-root";

/** The root a template's wrappers lead to, awaiting what each waits for (its promise, or what it `use()`d). */
export async function take(steps: Steps): Promise<React.ReactElement> {
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

/** `node` collected once what's async in it has settled (see above). */
export function collectWaiting(engine: Engine, node: React.ReactNode, options: CollectOptions): Promise<Flat> {
  return new Promise((resolve, reject) => {
    // Over once it's flattened (or failed): holes that settle after do nothing. (Flattened from when the walk is over:
    // a thenable can settle as the walk runs.)
    let done = false;
    let walked = false;
    let parts: Part[] = [];
    let omit = false;
    const flatten = () => {
      if (done || !walked) return;
      try {
        const flat = engine.flatten(parts, omit);
        if (flat === engine.PENDING) return;
        done = true;
        resolve(flat as Flat);
      } catch (error) {
        done = true;
        reject(error);
      }
    };
    // A hole for what `thenable` gives, filled, where the walk was, once it settles.
    const wait: Wait = (w, task, out, thenable, fill) => {
      const part: Hole = { t: "hole", parts: [], settled: false };
      out.push(part);
      const at: Task = { tree: task.tree, contexts: task.contexts, frame: task.frame, watch: null };
      engine.track(thenable);
      const settled = () => {
        if (done) return;
        try {
          fill({ ...at }, part.parts);
        } catch (error) {
          part.parts.push(engine.errorPart(w, error, at.frame));
        }
        part.settled = true;
        flatten();
      };
      thenable.then(settled, settled);
    };
    ({ parts, omit } = engine.walk(node, options, wait));
    walked = true;
    flatten();
  });
}
