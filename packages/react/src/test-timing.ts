/**
 * What a cost takes at two sizes (`time` takes the size and gives the milliseconds, or a promise of them), and whether
 * it grows faster than its size: the larger more than `ratio` times the smaller (taken as 2 ms at least) and more than
 * `floor` ms. One that looks so is timed twice more at both sizes, its fastest kept: a garbage collection or a busy
 * machine in one timing (a CI runner running other tests at once) isn't its cost, and a cost that grows faster than its
 * size does so in all three. Both sizes are timed on the same machine, so a slower one isn't taken for a slower cost.
 */
export async function growth(time: (size: number) => number | Promise<number>, [small, large]: [number, number], { ratio, floor }: { ratio: number; floor: number }) {
  const grows = (fast: number, quick: number) => fast > ratio * quick && fast > floor;
  let quick = Math.max(await time(small), 2);
  let fast = await time(large);
  if (grows(fast, quick)) {
    quick = Math.max(Math.min(quick, await time(small), await time(small)), 2);
    fast = Math.min(fast, await time(large), await time(large));
  }
  return { small: quick, large: fast, grows: grows(fast, quick) };
}
