/**
 * Runtime mode renders a template with sample props, so their values would
 * become fixed text. Text props the template shows as given become merge
 * tags instead (`{{user.name}}`), which the editor keeps and email services
 * fill in.
 *
 * The template is rendered once more with a marker in place of each text
 * prop. A prop becomes a merge tag only where its marker comes through
 * intact and, with the sample values put back, the conversion is the same:
 * a prop the template changes (`name.toUpperCase()`, a date it formats) or
 * tests keeps its sample value.
 */


const OPEN = "\uE000";
const CLOSE = "\uE001";
// Mixed case makes upper/lowercasing change the marker, even when the sample
// already has that case. Such a prop must keep its transformed sample value.
const MARKER = /\uE000uNlAyEr(\d+)\uE001/g;

/** A text prop: its path (`user.name`) and sample value. */
export interface TextProp {
  path: string;
  value: string;
}

/** The text props of `props`: string values, nested in plain objects (not in lists, which loops repeat). */
export function textProps(props: Record<string, unknown>, prefix = ""): TextProp[] {
  const out: TextProp[] = [];
  for (const [key, value] of Object.entries(props)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && value.trim()) out.push({ path, value });
    else if (isPlainObject(value)) out.push(...textProps(value, path));
  }
  return out;
}

/** `props` with the chosen text props replaced by markers. */
function withMarkers(props: Record<string, unknown>, probes: TextProp[], chosen: number[]): Record<string, unknown> {
  // Copies only the objects on each prop's path: props can hold functions and elements.
  const copy: Record<string, unknown> = { ...props };
  for (const i of chosen) {
    const keys = probes[i].path.split(".");
    let target = copy;
    for (const key of keys.slice(0, -1)) {
      target[key] = { ...(target[key] as Record<string, unknown>) };
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = `${OPEN}uNlAyEr${i}${CLOSE}`;
  }
  return copy;
}

/**
 * A converted template (an Elements tree, design JSON) with text props as
 * merge tags. `render` converts the template with the props given; `base`
 * is its output with the sample props. Props that fail together are tried
 * one by one. `used`: the props that became merge tags; `kept`: props the
 * output shows but that keep their sample value.
 */
export async function mergeTagged<T>(
  props: Record<string, unknown>,
  base: T,
  render: (props: Record<string, unknown>) => T | Promise<T>
): Promise<{ result?: T; used: string[]; kept: string[] }> {
  const probes = textProps(props);
  if (!probes.length) return { used: [], kept: [] };
  const attempt = async (chosen: number[]): Promise<T | undefined> => {
    let output: T;
    try {
      output = await render(withMarkers(props, probes, chosen));
    } catch {
      return undefined; // the template can't take a placeholder there
    }
    if (hasBrokenMarkers(output) || !sameOutput(replaceMarkers(output, probes, (p) => p.value), base)) return undefined;
    return output;
  };
  const all = probes.map((_, i) => i);
  let chosen = all;
  let marked = await attempt(all);
  if (!marked) {
    chosen = [];
    for (const i of all) if (await attempt([i])) chosen.push(i);
    marked = chosen.length ? await attempt(chosen) : undefined;
  }
  const shown = (p: TextProp) => JSON.stringify(base).includes(JSON.stringify(p.value).slice(1, -1));
  if (!marked) return { used: [], kept: probes.filter(shown).map((p) => p.path) };
  const tag = (p: TextProp) => `{{${p.path}}}`;
  const result = replaceMarkers(marked, probes, tag);
  const text = JSON.stringify(result);
  return {
    result,
    // Tagged somewhere (image sources keep the sample value).
    used: [...markersIn(marked)].sort((a, b) => a - b).map((i) => probes[i]).filter((p) => text.includes(tag(p))).map((p) => p.path),
    kept: probes.filter((p, i) => !chosen.includes(i) && shown(p)).map((p) => p.path),
  };
}

/**
 * The output with every marker replaced: `tag(prop)` where a merge tag can
 * go, the sample value in image sources (the editor shows the image).
 */
export function replaceMarkers<T>(output: T, probes: TextProp[], tag: (prop: TextProp) => string): T {
  const swap = (text: string, inSource: boolean) => text.replace(MARKER, (_, i: string) => (inSource ? probes[Number(i)].value : tag(probes[Number(i)])));
  const walk = (value: unknown, inSource: boolean): unknown => {
    if (typeof value === "string") return swap(value, inSource);
    if (Array.isArray(value)) return value.map((item) => walk(item, inSource));
    if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [key, inner] of Object.entries(node)) {
        // An image's src (and a background image's url) stays a real address.
        const source = inSource || (node.type === "Image" && key === "props") || key === "src" || key === "backgroundImage";
        out[key] = walk(inner, source && key !== "action" && key !== "alt");
      }
      return out;
    }
    return value;
  };
  return walk(output, false) as T;
}

/** Which markers appear in `output`. */
function markersIn(output: unknown): Set<number> {
  const found = new Set<number>();
  for (const m of JSON.stringify(output).matchAll(MARKER)) found.add(Number(m[1]));
  return found;
}

/** Whether marker characters appear outside whole markers (a marker cut or changed). */
function hasBrokenMarkers(output: unknown): boolean {
  return /[\uE000\uE001]/.test(JSON.stringify(output).replace(MARKER, ""));
}

/** Two outputs the same, reading HTML entities as the characters they stand for. */
function sameOutput(a: unknown, b: unknown): boolean {
  const text = (output: unknown) =>
    JSON.stringify(output).replace(/&(amp|lt|gt|quot|#x27|#39|apos);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'", apos: "'" })[e] ?? _);
  return text(a) === text(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
