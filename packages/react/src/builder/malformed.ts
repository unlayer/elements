/**
 * A design's values that would throw where they're read: an object with a `toString` or `valueOf` of its own that isn't
 * a function (JSON can hold one, `{"toString": null}`), which a value parser turning it into text can't. Each is left
 * out of a copy of the design, and said; a design without one is read as it is.
 */

/** How deep values are looked at: deeper than any the reader reads. */
const DEPTH = 32;

const coerces = (value: object) => (["toString", "valueOf"] as const).some((key) => Object.hasOwn(value, key) && typeof (value as Record<string, unknown>)[key] !== "function");

/** The design with each value that can't be read as text left out, each said in `report`. */
export function withoutMalformed(design: unknown, report: string[]): unknown {
  const found: string[][] = [];
  const walk = (value: unknown, path: string[]) => {
    if (!value || typeof value !== "object" || path.length > DEPTH) return;
    for (const key of Object.keys(value)) {
      const child = (value as Record<string, unknown>)[key];
      if (child && typeof child === "object" && !Array.isArray(child) && coerces(child)) found.push([...path, key]);
      else walk(child, [...path, key]);
    }
  };
  walk(design, []);
  if (!found.length) return design;
  const copy = JSON.parse(JSON.stringify(design)) as Record<string, unknown>;
  for (const path of found) {
    const holder = path.slice(0, -1).reduce<unknown>((at, key) => (at as Record<string, unknown> | undefined)?.[key], copy) as Record<string, unknown> | unknown[] | undefined;
    const last = path[path.length - 1];
    if (Array.isArray(holder)) holder[Number(last)] = null;
    else if (holder) delete holder[last];
    report.push(`${path.map((key, i) => (/^\d+$/.test(key) ? `[${key}]` : i ? `.${key}` : key)).join("")}: a value whose own toString or valueOf isn't a function can't be read: left out`);
  }
  return copy;
}
