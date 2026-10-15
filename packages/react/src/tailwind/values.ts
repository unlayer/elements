/**
 * A declaration's value as an email can take it: variables replaced by what they hold (the theme's, the element's
 * own `--tw-*`, a registered property's initial value), `calc()` worked out, `rem` in pixels (16px, as React Email's
 * pixel-based preset), and colors in hex or rgba (see color.ts).
 */
import { emailColors } from "./color";
import { skip, split } from "./css";

/** A variable's value, as written (it may use others). */
export type Lookup = (name: string) => string | undefined;

/** `value` with each `var()` replaced; undefined when one is unset and has no fallback (the declaration is invalid). */
function resolveVars(value: string, lookup: Lookup, depth = 0): string | undefined {
  if (depth > 32) return undefined;
  let out = "";
  let from = 0;
  for (let at = value.indexOf("var(", from); at >= 0; at = value.indexOf("var(", from)) {
    const end = skip(value, at + 3);
    const [name, ...fallback] = split(value.slice(at + 4, end - 1), ",");
    const set = lookup(name.trim());
    const resolved =
      set !== undefined ? resolveVars(set, lookup, depth + 1) : fallback.length ? resolveVars(fallback.join(",").trim(), lookup, depth + 1) : undefined;
    if (resolved === undefined) return undefined;
    out += value.slice(from, at) + resolved;
    from = end;
  }
  return out + value.slice(from);
}

const round = (n: number) => String(parseFloat(n.toFixed(4)) || 0);

/** A number and its unit (`rem` read as px). */
type Quantity = { n: number; unit: string };

/** `calc()`'s expression worked out; throws where units can't combine (it's then kept as it is). */
function evaluate(text: string): Quantity {
  const tokens = text.match(/calc\(|[()*/]|[+-](?=\s)|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z%]*|[+-]?infinity|\S/gi) ?? [];
  let i = 0;
  const quantity = (): Quantity => {
    const token = tokens[i++];
    if (token === "(" || token?.toLowerCase() === "calc(") {
      const inner = sum();
      if (tokens[i++] !== ")") throw new Error("calc");
      return inner;
    }
    const match = /^([+-]?)(?:(infinity)|((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*))$/i.exec(token ?? "");
    if (!match) throw new Error("calc");
    const sign = match[1] === "-" ? -1 : 1;
    if (match[2]) return { n: sign * Infinity, unit: "" };
    const unit = match[4].toLowerCase();
    return unit === "rem" ? { n: sign * parseFloat(match[3]) * 16, unit: "px" } : { n: sign * parseFloat(match[3]), unit };
  };
  const product = (): Quantity => {
    let left = quantity();
    while (tokens[i] === "*" || tokens[i] === "/") {
      const op = tokens[i++];
      const right = quantity();
      if (op === "*") {
        if (left.unit && right.unit) throw new Error("calc");
        left = { n: left.n * right.n, unit: left.unit || right.unit };
      } else if (!right.unit || right.unit === left.unit) left = { n: left.n / right.n, unit: right.unit ? "" : left.unit };
      else throw new Error("calc");
    }
    return left;
  };
  const sum = (): Quantity => {
    let left = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++];
      const right = product();
      // The same unit, or a unitless 0 taking the other's.
      const unit = left.unit === right.unit || (!right.unit && !right.n) ? left.unit : !left.unit && !left.n ? right.unit : undefined;
      if (unit === undefined) throw new Error("calc");
      left = { n: op === "+" ? left.n + right.n : left.n - right.n, unit };
    }
    return left;
  };
  const result = sum();
  if (i !== tokens.length) throw new Error("calc");
  return result;
}

/** Each `calc()` in `value` worked out (innermost first), where its units combine. */
function calcs(value: string): string {
  let out = "";
  let from = 0;
  const pattern = /calc\(/gi;
  for (let match = pattern.exec(value); match; match = pattern.exec(value)) {
    const at = match.index;
    const end = skip(value, at + 4);
    pattern.lastIndex = end;
    let replaced: string;
    try {
      const { n, unit } = evaluate(value.slice(at, end));
      // `calc(infinity * 1px)`, Tailwind's fully round corners: as large as the editor takes.
      replaced = Number.isFinite(n) ? `${round(n)}${unit}` : `9999${unit}`;
    } catch {
      replaced = value.slice(at, end);
    }
    out += value.slice(from, at) + replaced;
    from = end;
  }
  return out + value.slice(from);
}

/** A declaration's value for an email; undefined when a variable it uses isn't set (as the browser drops it). */
export function emailValue(value: string, lookup: Lookup): string | undefined {
  const resolved = resolveVars(value, lookup);
  if (resolved === undefined) return undefined;
  const pixels = calcs(resolved).replace(/(^|[\s(,])(-?(?:\d+\.?\d*|\.\d+))rem\b/g, (_, before: string, n: string) => `${before}${round(parseFloat(n) * 16)}px`);
  return emailColors(pixels).replace(/\s+/g, " ").trim();
}
