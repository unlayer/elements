/**
 * What a cost takes at two sizes (`time` takes the size and gives the milliseconds, or a promise of them), and whether
 * it grows faster than its size: the larger more than `ratio` times the smaller (taken as 2 ms at least) and more than
 * `floor` ms. Both sizes are timed on the same machine, so a slower one isn't taken for a slower cost.
 *
 * One that looks so is timed twice more at both sizes, its fastest kept: a garbage collection or a busy machine in one
 * timing (a CI runner running other tests at once) isn't its cost. Given `next`, a size as much larger again, one that
 * still looks so and took a second at most is timed there too, and grows only if it grows as fast again: a busy
 * machine can slow a larger size more than a smaller one (its data out of the processor's caches, say), which looks
 * like growth between them but isn't past them, where a cost that grows faster than its size grows faster at every
 * size. (One past a second isn't: ten times its size could take minutes.)
 */
export async function growth(time: (size: number) => number | Promise<number>, [small, large]: [number, number], { ratio, floor, next }: { ratio: number; floor: number; next?: number }) {
  const grows = (fast: number, quick: number) => fast > ratio * quick && fast > floor;
  let quick = Math.max(await time(small), 2);
  let fast = await time(large);
  let past: number | undefined;
  if (grows(fast, quick)) {
    quick = Math.max(Math.min(quick, await time(small), await time(small)), 2);
    fast = Math.min(fast, await time(large), await time(large));
    if (next !== undefined && grows(fast, quick) && fast <= 1000) past = await time(next);
  }
  return { small: quick, large: fast, next: past, grows: grows(fast, quick) && (past === undefined || grows(past, fast)) };
}
