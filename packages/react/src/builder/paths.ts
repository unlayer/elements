/** A node's values by path: `style.color`, `props.level`, `hover.color`, `mobile.padding`, or a key of its own (`hidden`). */
type Values = Record<string, any>;

const PARTS = ["style", "props", "hover", "mobile"] as const;
const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

/** What of a node is set, as `style.x`, `props.x`, `hover.x`, `mobile.x`, `hidden`, `children`, `compat`, `id`. */
export function pathsOf(node: Values): string[] {
  const out: string[] = [];
  for (const part of PARTS) for (const key of Object.keys(node[part] ?? {})) out.push(`${part}.${key}`);
  for (const key of ["hidden", "children", "compat", "id"]) if (node[key] !== undefined) out.push(key);
  return out;
}

export function valueAt(node: Values, path: string): unknown {
  const [part, key] = path.split(".");
  return key === undefined ? node[part] : node[part]?.[key];
}

/** Sets (or, with `undefined`, removes) a node's value at `path`; a part left empty goes. */
export function setAt(node: Values, path: string, value: unknown) {
  const [part, key] = path.split(".");
  if (key === undefined) {
    if (value === undefined) delete node[part];
    else node[part] = copy(value);
    return;
  }
  const rest = { ...node[part] };
  if (value === undefined) delete rest[key];
  else rest[key] = copy(value);
  if (Object.keys(rest).length) node[part] = rest;
  else delete node[part];
}

/** Two values the same, keys in any order, a color in any case. */
export function sameValue(a: unknown, b: unknown): boolean {
  const canon = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Values)[k])])) : typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v) ? v.toLowerCase() : v;
  return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
}

/** The paths where `after` sets something `before` doesn't, or something else. */
export function setPaths(before: Values, after: Values): string[] {
  return pathsOf(after).filter((path) => !sameValue(valueAt(before, path), valueAt(after, path)));
}
