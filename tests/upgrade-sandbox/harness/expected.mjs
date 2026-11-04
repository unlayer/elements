// expected.json: the differences a release means to make. Each reason says why, and which kinds of difference it
// accepts; a difference of any other kind at a declared template, mode and width is still a difference.
import fs from "node:fs";

/** Whether a reason accepts a difference: by its kind (`position`), or its kind and what of it (`image box`). */
export const accepts = (reason, d) => reason.accepts.some((a) => a === d.kind || (d.what != null && a === `${d.kind} ${d.what}`));

/** expected.json's declarations, each with its reason ({ why, accepts }). Throws on a reason that isn't defined. */
export function readExpected(file) {
  const { reasons = {}, expected = {} } = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [name, r] of Object.entries(reasons)) {
    if (typeof r?.why !== "string" || !Array.isArray(r.accepts) || !r.accepts.length) throw new Error(`${file}: reason "${name}" needs a "why" and the kinds of difference it "accepts"`);
  }
  const declared = [];
  for (const [id, modes] of Object.entries(expected)) {
    for (const [mode, widths] of Object.entries(modes)) {
      for (const [width, name] of Object.entries(widths)) {
        if (!Object.hasOwn(reasons, name)) throw new Error(`${file}: ${id} · ${mode} · ${width}: no reason "${name}" in "reasons"`);
        declared.push({ id, mode, width: Number(width), reason: reasons[name] });
      }
    }
  }
  return declared;
}

/**
 * Marks the declared differences expected. A declared width whose differences are all of kinds its reason accepts
 * becomes "expected"; one with any other difference stays a difference, listing only those (what its reason accepts
 * moves to `accepted`). A declaration whose reason accepts nothing that differs is stale.
 */
export function applyExpected(templates, file) {
  if (!file || file === "none") return { file: null, matched: [], stale: [] };
  if (!fs.existsSync(file)) throw new Error(`--expected ${file}: no such file`);
  const matched = [];
  const stale = [];
  for (const { id, mode, width, reason } of readExpected(file)) {
    const x = templates.find((t) => t.id === id)?.modes[mode]?.widths[width];
    if (!x) continue;
    const at = { id, mode, width, reason: reason.why };
    const accepted = x.status === "diff" ? x.differences.filter((d) => accepts(reason, d)) : [];
    if (!accepted.length) {
      stale.push(at);
      continue;
    }
    const rest = x.differences.filter((d) => !accepts(reason, d));
    if (rest.length) {
      x.differences = rest;
      x.accepted = accepted;
      continue;
    }
    x.status = "expected";
    x.reason = reason.why;
    matched.push(at);
  }
  return { file, matched, stale };
}
