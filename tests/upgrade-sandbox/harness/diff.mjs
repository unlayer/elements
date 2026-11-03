// Sequence and JSON differences.

/**
 * Aligns two sequences (Myers, after trimming what they share at each end). Returns the pairs that match
 * ([i, j]) and the hunks that don't ({ a: [from, to), b: [from, to) }).
 */
export function align(a, b, key = (x) => x) {
  const ka = a.map(key);
  const kb = b.map(key);
  let start = 0;
  while (start < ka.length && start < kb.length && ka[start] === kb[start]) start++;
  let endA = ka.length;
  let endB = kb.length;
  while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) {
    endA--;
    endB--;
  }
  const pairs = [];
  for (let i = 0; i < start; i++) pairs.push([i, i]);
  const middle = myers(ka.slice(start, endA), kb.slice(start, endB));
  const hunks = [];
  let hunk = null;
  for (const op of middle) {
    if (op[0] === "=") {
      pairs.push([op[1] + start, op[2] + start]);
      hunk = null;
      continue;
    }
    if (!hunk) {
      // "-": op[1] is the index in a, op[2] where in b; "+": op[1] is the index in b, op[2] where in a.
      const i = (op[0] === "-" ? op[1] : op[2]) + start;
      const j = (op[0] === "+" ? op[1] : op[2]) + start;
      hunk = { a: [i, i], b: [j, j] };
      hunks.push(hunk);
    }
    if (op[0] === "-") hunk.a[1] = op[1] + start + 1;
    else hunk.b[1] = op[1] + start + 1;
  }
  for (let i = endA, j = endB; i < ka.length; i++, j++) pairs.push([i, j]);
  return { pairs, hunks };
}

/** Myers' diff: ops ["=", i, j] | ["-", i, nextJ] | ["+", j, nextI], in order. Falls back to replace-all if huge. */
function myers(a, b) {
  const n = a.length;
  const m = b.length;
  if (!n && !m) return [];
  const max = n + m;
  const limit = Math.min(max, 1500);
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = -1;
  outer: for (let d = 0; d <= limit; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break outer;
      }
    }
  }
  if (found < 0) {
    // Too different to align: everything removed, then everything added.
    return [...a.map((_, i) => ["-", i, 0]), ...b.map((_, j) => ["+", j, n])];
  }
  const ops = [];
  let x = n;
  let y = m;
  for (let d = found; d >= 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && vd[off + k - 1] < vd[off + k + 1]) ? k + 1 : k - 1;
    const prevX = vd[off + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push(["=", x - 1, y - 1]);
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) ops.push(["+", prevY, prevX]);
      else ops.push(["-", prevX, prevY]);
    }
    x = prevX;
    y = prevY;
  }
  return ops.reverse();
}

/** Where two JSON values differ, as `path: old → new` lines. */
export function jsonDiff(a, b, path = "$", out = [], limit = 50) {
  if (out.length >= limit) return out;
  if (Object.is(a, b)) return out;
  const ta = Array.isArray(a) ? "array" : a === null ? "null" : typeof a;
  const tb = Array.isArray(b) ? "array" : b === null ? "null" : typeof b;
  if (ta !== tb || (ta !== "object" && ta !== "array")) {
    out.push(`${path}: ${short(a)} → ${short(b)}`);
    return out;
  }
  if (ta === "array") {
    if (a.length !== b.length) out.push(`${path}: ${a.length} items → ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) jsonDiff(a[i], b[i], `${path}[${i}]`, out, limit);
    return out;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const p = /^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`;
    if (!(k in b)) out.push(`${p}: ${short(a[k])} → (missing)`);
    else if (!(k in a)) out.push(`${p}: (missing) → ${short(b[k])}`);
    else jsonDiff(a[k], b[k], p, out, limit);
    if (out.length >= limit) break;
  }
  return out;
}

export const short = (v, n = 80) => {
  const s = v === undefined ? "undefined" : JSON.stringify(v);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

/** The first place two texts differ, with a little context. */
export function textDiff(a, b) {
  const la = a.split("\n");
  const lb = b.split("\n");
  const { hunks } = align(la, lb);
  return hunks.slice(0, 5).map((h) => {
    const removed = la.slice(h.a[0], h.a[1]).map((l) => JSON.stringify(l.slice(0, 120)));
    const added = lb.slice(h.b[0], h.b[1]).map((l) => JSON.stringify(l.slice(0, 120)));
    return `line ${h.a[0] + 1}: ${removed.length ? `- ${removed.join(" / ")}` : ""}${removed.length && added.length ? "  " : ""}${added.length ? `+ ${added.join(" / ")}` : ""}`;
  });
}
