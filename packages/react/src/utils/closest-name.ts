/**
 * The first of `names` a slip away from `name`, case aside: a letter more, less or another, or two swapped
 * (`textColour`, `fontsize`, `textAling`). What a warning about a prop no component takes suggests instead.
 */
export function closestName(name: string, names: string[]): string | undefined {
  const a = name.toLowerCase();
  return names.find((other) => {
    const b = other.toLowerCase();
    let i = 0;
    while (a[i] && a[i] == b[i]) i++;
    const rest = (m: number, n: number) => a.slice(i + m) == b.slice(i + n);
    return other != name && (rest(1, 1) || rest(1, 0) || rest(0, 1) || (a[i] == b[i + 1] && a[i + 1] == b[i] && rest(2, 2)));
  });
}
