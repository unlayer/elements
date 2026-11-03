/**
 * An item's payload with only what the builder can't hold (payload.ts): its node without what the builder's values
 * give back, and the part of each value that's the node's place. Each is checked by reading the item back as
 * fromDesign() does: a value that wouldn't come back as it was is kept as written, with what of the node it sets; an
 * item that still wouldn't is kept whole.
 */
import type { Json, Node, ResolvedNode } from "@unlayer-internal/elements-core";
import { FIELDS, NEW_BLOCK } from "./fields";
import { changesOf, readItem, unchanged, type Values } from "./lower";
import { pathsOf, sameValue, setAt, setPaths, valueAt } from "./paths";
import { baseline, BUILDER_OWN, DEFAULTS, fingerprint, type Payload, type Sides } from "./payload";
import { say, taken } from "./taken";

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Values that are a node's padding and its place (a block's spacing is its padding and its stack's gap). */
const PADDING_BY = new Set(["heading.containerPadding", "text.containerPadding", "divider.containerPadding", "column.padding"]);
/** Values that are only a block's place (a button's spacing is its stack's). */
const PLACED = new Set(["button", "image", "menu", "social", "video", "html", "page_break"].map((kind) => `${kind}.containerPadding`));

/** Which part of a value with parts sets which of the node. */
const PART_OF: Record<string, Record<string, string>> = {
  "button.buttonColors": { color: "style.color", backgroundColor: "style.backgroundColor", hoverColor: "hover.color", hoverBackgroundColor: "hover.backgroundColor" },
  "image.src": { url: "props.src", width: "props.src", height: "props.src", autoWidth: "style.width", maxWidth: "style.width" },
};

const sides = (css: unknown): Sides => {
  const [top = 0, right = top, bottom = top, left = right] = String(css ?? "0px").trim().split(/\s+/).map((part) => parseFloat(part) || 0);
  return { top, right, bottom, left };
};

/** What of a node each of its values sets, each by itself. */
function setBy(kind: string, type: string, values: Values): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [key, setter] of Object.entries(FIELDS[kind] ?? {})) {
    if (values[key] === undefined || BUILDER_OWN.has(key)) continue;
    const scratch: Node = { type };
    try {
      setter({ node: scratch, now: values[key], was: undefined, say: () => undefined });
    } catch {
      // A setter that reads the node's own (a list it merges with) sets nothing on an empty one.
    }
    out.set(key, pathsOf(scratch));
  }
  return out;
}

/** The node a value of an image's sets: the Image, in its Link or not. */
const imageIn = (node: Node): Node => (node.type === "Link" ? ((node.children ?? []).find((child) => typeof child !== "string" && child.type === "Image") as Node) : node);
const resolvedImage = (resolved: ResolvedNode | undefined): ResolvedNode | undefined =>
  resolved?.type === "Link" ? (resolved.children.find((child) => typeof child !== "string" && child.type === "Image") as ResolvedNode | undefined) : resolved;

/**
 * Where a node read back isn't the one written, by path. A value read from the builder (`read`) the node doesn't set
 * is fine where it's what the node takes (it's left out on the way back): those are `taken`, the others read `own`.
 */
function compare(got: Node, want: Node, resolved: ResolvedNode | undefined, read: string[]): { differ: string[]; taken: string[]; own: string[] } {
  const out = { differ: [] as string[], taken: [] as string[], own: [] as string[] };
  for (const path of new Set([...pathsOf(got), ...pathsOf(want)])) {
    const now = valueAt(got, path);
    const was = valueAt(want, path);
    if (read.includes(path) && path.includes(".")) (was === undefined ? out.taken : out.own).push(path);
    if (sameValue(now, was)) continue;
    // The template's node has none: what the builder holds there is what it takes (resolved, it has none).
    if (was === undefined && read.includes(path) && path.includes(".") && resolved !== undefined && sameValue(now, taken(resolved, path))) continue;
    out.differ.push(path);
  }
  if (got.type !== want.type) out.differ.push("type");
  return out;
}

/** The payload an item's values are kept with: the least that reads back as it was (none for a run's column, which is the run's). */
export function minimal(kind: string, values: Values, full: Payload, resolved: ResolvedNode | undefined): Payload | undefined {
  // A row is a run of blocks where it has neither a node nor a Grid: it isn't said.
  const { node, w: _w, run: _run, ...structure } = full;
  const place: Record<string, Partial<Sides>> = {};
  for (const key of ["containerPadding", "padding"]) {
    const at = `${kind}.${key}`;
    if (values[key] === undefined || !(PADDING_BY.has(at) || PLACED.has(at) || at === "row.padding")) continue;
    const mine = node && !PLACED.has(at) ? ((node.style?.padding as Sides | undefined) ?? ZERO) : ZERO;
    const kept = at === "row.padding" ? { ...ZERO, top: mine.top, bottom: mine.bottom } : mine;
    const all = sides(values[key]);
    const part: Partial<Sides> = {};
    for (const side of ["top", "right", "bottom", "left"] as const) if (all[side] - kept[side]) part[side] = Math.round((all[side] - kept[side]) * 100) / 100;
    if (Object.keys(part).length) place[key] = part;
  }
  const w: Record<string, Json> = {};
  const h: Record<string, string> = {};
  // A row's columns' widths, as the builder holds them (it shares them out its own way).
  if (kind === "row" && Array.isArray(values.cells) && JSON.stringify(values.cells) !== "[1]") w.cells = values.cells as Json;
  if (full.locked && typeof values.html === "string") h.html = fingerprint(values.html);

  const assemble = (hidden: Node | undefined, said: { taken: string[]; own: string[] } = { taken: [], own: [] }): Payload => {
    const out: Payload = { v: full.v };
    const bareBlock = hidden && (kind === "column" ? "Column" : NEW_BLOCK[kind]) === hidden.type && Object.keys(hidden).length === 1 && !full.locked;
    if (hidden && !bareBlock) out.node = hidden;
    if (Object.keys(place).length) out.place = place;
    if (Object.keys(w).length) out.w = w;
    // Whichever is shorter: the values taken, or the node's own (all others taken).
    if (said.taken.length && said.own.length < said.taken.length) out.own = say(said.own);
    else if (said.taken.length) out.taken = say(said.taken);
    if (Object.keys(h).length) out.h = h;
    return { ...out, ...structure };
  };
  const bandChanged = () => kind === "row" && !unchanged("backgroundColor", baseline("row", assemble(undefined))?.backgroundColor, values.backgroundColor);

  // An item standing for no node of its own (a run of blocks' row, a Grid's row): nothing reads as changed.
  if (!node) {
    for (const key of changesOf(kind, values, assemble(undefined), kind === "row" ? (key) => key !== "backgroundColor" : undefined)) {
      // Phone values are only told apart (they're said where they change, but for hiding): by a fingerprint.
      if (key === "_override") h[key] = fingerprint(values[key]);
      else w[key] = values[key];
    }
    if (bandChanged()) w.backgroundColor = values.backgroundColor;
    const said = assemble(undefined);
    return kind === "column" && full.run && Object.keys(said).length === 1 ? undefined : said;
  }

  const touched = setBy(kind, kind === "image" ? "Image" : node.type, values);
  const hidden: Node = copy(node);
  const target = kind === "image" ? imageIn(hidden) : hidden;
  for (const paths of touched.values()) for (const path of paths) setAt(target, path, undefined);
  if (kind === "row" && node.style?.padding) {
    // A Row's sides are its columns' in the builder: they stay the node's.
    const padding = node.style.padding as Sides;
    setAt(hidden, "style.padding", padding.left || padding.right ? { ...padding, top: 0, bottom: 0 } : undefined);
  }
  if (bandChanged()) w.backgroundColor = values.backgroundColor;

  const want = kind === "image" ? imageIn(node) : node;
  const resolvedHere = kind === "image" ? resolvedImage(resolved) : resolved;
  /** Reads back as it was: the item kept with what's said of it. */
  const reads = () => {
    const heard = new Set<string>();
    const before = copy(target);
    const read = readItem(kind, hidden, values, assemble(hidden), (_message, key) => heard.add(key));
    const got = kind === "image" ? imageIn(read) : read;
    return { heard, read, found: compare(got, want, resolvedHere, setPaths(before, got)) };
  };
  /**
   * Its phone values, read only for whether it's hidden there (the rest are said where they change): told apart by
   * a fingerprint, the node keeping what they set.
   */
  const phoneTold = (found: ReturnType<typeof compare>): Payload => {
    if (w._override === undefined || !touched.has("_override")) return assemble(hidden, found);
    const written = w._override;
    const keptPaths = (touched.get("_override") ?? []).filter((path) => valueAt(want, path) !== undefined);
    delete w._override;
    h._override = fingerprint(values._override);
    for (const path of keptPaths) setAt(target, path, valueAt(want, path));
    const again = reads();
    if (!again.found.differ.length && !again.heard.size) return assemble(hidden, again.found);
    w._override = written;
    delete h._override;
    for (const path of keptPaths) setAt(target, path, undefined);
    return assemble(hidden, found);
  };
  for (let round = 0; round < 4; round++) {
    const heard = new Set<string>();
    const before = copy(target);
    const read = readItem(kind, hidden, values, assemble(hidden), (_message, key) => heard.add(key));
    const got = kind === "image" ? imageIn(read) : read;
    const found = compare(got, want, resolvedHere, setPaths(before, got));
    const linkDiffers = kind === "image" && (read.type !== node.type || (node.type === "Link" && !sameValue(read.props, node.props)));
    if (!found.differ.length && !heard.size && !linkDiffers) return phoneTold(found);
    if (linkDiffers) w.action = values.action;
    for (const [key, paths] of touched) {
      const hit = found.differ.filter((path) => paths.includes(path));
      if (!hit.length && !heard.has(key)) continue;
      const parts = PART_OF[`${kind}.${key}`];
      if (parts && hit.length) {
        // Only the parts that set what didn't come back, kept as written; the node keeps its own there.
        const kept: Values = { ...((w[key] as Values | undefined) ?? (DEFAULTS[kind]?.[key] as Values | undefined) ?? {}) };
        for (const [part, path] of Object.entries(parts)) if (hit.includes(path) && values[key]?.[part] !== undefined) kept[part] = values[key][part];
        w[key] = kept as Json;
        for (const path of hit) setAt(target, path, valueAt(want, path));
      } else {
        w[key] = values[key];
        for (const path of paths) if (valueAt(want, path) !== undefined) setAt(target, path, valueAt(want, path));
      }
    }
    // A report on a value no setter sets anything for (a place the builder shows): kept as written.
    for (const key of heard) if (!touched.get(key)?.length && key !== "html") w[key] = values[key];
  }
  // Still not as it was: the item kept whole, read as it was written.
  const whole: Record<string, Json> = {};
  for (const [key, value] of Object.entries(values)) if (!BUILDER_OWN.has(key) && value !== undefined) whole[key] = copy(value as Json);
  return { ...structure, node, w: whole, ...(Object.keys(h).length ? { h } : {}) };
}
