/**
 * Timing tests that hold on a busy or slower machine (a CI runner running other tests at once) and still fail on code
 * whose cost grows faster than its size: every test here that times something goes through `growth` (a cost at two
 * sizes) or `within` (a cost against a limit).
 */

/** Milliseconds `run` takes (awaited where it gives a promise), and what it gave. */
async function timed<T>(run: () => T | Promise<T>): Promise<{ ms: number; result: T }> {
  const start = performance.now();
  const result = await run();
  return { ms: performance.now() - start, result };
}

/**
 * How many times slower this machine runs now than the one the limits were set on (1 at least): a fixed piece of
 * string work, the fastest of three, against what it took there (Node 20, about 14 ms).
 */
export function slowness(): number {
  const work = () => {
    const text = '<p class="a b">x &amp; y, <a href="https://e.test/1">z</a></p>\n'.repeat(4000);
    let n = 0;
    for (let i = 0; i < 16; i++) n += text.replace(/<[^>]+>/g, "").split("&amp;").join("&").toUpperCase().length + JSON.stringify(text.split("\n")).length;
    return n;
  };
  let fastest = Infinity;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    work();
    fastest = Math.min(fastest, performance.now() - start);
  }
  return Math.max(1, fastest / 14);
}

/**
 * Whether `run` takes less than `limit` ms (a limit set on a laptop, well under what the code it guards against took).
 * One that takes longer is run twice more, its fastest kept, against the limit times this machine's `slowness` then:
 * a garbage collection or a busy machine in one run isn't its cost, and a machine several times slower takes several
 * times as long for the same work. Gives the fastest time, the limit it was held to, and what the first run gave.
 *
 * `retime` times another run in place of `run` (`again`), after what `before` gives it, untimed: where running it again
 * would change what the test reads after (what it says), or would read what the first run kept (a handle's classes).
 */
export async function within<T, P = undefined>(
  limit: number,
  run: () => T | Promise<T>,
  retime: { before?: () => P | Promise<P>; again?: (prepared: P) => unknown } = {}
): Promise<{ ok: boolean; ms: number; limit: number; result: T }> {
  const first = await timed(run);
  if (first.ms < limit) return { ok: true, ms: first.ms, limit, result: first.result };
  let ms = first.ms;
  for (let i = 0; i < 2; i++) {
    const prepared = (await retime.before?.()) as P;
    ms = Math.min(ms, (await timed(() => (retime.again ? retime.again(prepared) : run()))).ms);
  }
  const scaled = limit * slowness();
  return { ok: ms < scaled, ms, limit: scaled, result: first.result };
}

/**
 * What a cost takes at two sizes (`time` takes the size and gives the milliseconds, or a promise of them), and whether
 * it grows faster than its size: the larger more than `ratio` times the smaller and more than `floor` ms. Both sizes
 * are timed on the same machine, so a slower one isn't taken for a slower cost.
 *
 * One that looks so is timed again: each size's fastest of three samples, a sample being as many timings as add up to
 * `least` ms at least (20), their mean, so a small size's few milliseconds aren't noise; a garbage collection or a busy
 * machine in one timing isn't its cost. (`time` is called again for a size: where what it times keeps what it built, it
 * times on something fresh.) Given `next`, a size as much larger again, one that still looks so and took a second at
 * most is timed there too, and grows only if it grows as fast again: a busy machine can slow a larger size more than a
 * smaller one (its data out of the processor's caches, say), which looks like growth between them but isn't past
 * them, where a cost that grows faster than its size grows faster at every size. (One past a second isn't: ten times
 * its size could take minutes.)
 */
export async function growth(
  time: (size: number) => number | Promise<number>,
  [small, large]: [number, number],
  { ratio, floor, next, least = 20 }: { ratio: number; floor: number; next?: number; least?: number }
) {
  const grows = (fast: number, quick: number) => fast > ratio * Math.max(quick, 0.05) && fast > floor;
  const sample = async (size: number) => {
    let total = 0;
    let n = 0;
    do {
      total += await time(size);
      n++;
    } while (total < least && n < 100);
    return total / n;
  };
  let quick = await time(small);
  let fast = await time(large);
  let past: number | undefined;
  if (grows(fast, quick)) {
    quick = Math.min(await sample(small), await sample(small), await sample(small));
    fast = Math.min(fast, await sample(large), await sample(large));
    if (next !== undefined && grows(fast, quick) && fast <= 1000) past = await time(next);
  }
  return { small: quick, large: fast, next: past, grows: grows(fast, quick) && (past === undefined || grows(past, fast)) };
}

/** `true` for a run `within` its limit, else what it took and the limit it was held to (for an assertion). */
export const inTime = ({ ok, ms, limit }: { ok: boolean; ms: number; limit: number }): true | string => ok || `${ms.toFixed(0)} ms, past ${limit.toFixed(0)} ms`;
