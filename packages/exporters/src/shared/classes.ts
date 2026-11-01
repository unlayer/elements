/**
 * The stylesheet: what inline styles can't do (phone overrides, hiding, hover,
 * a Row stacking on phones), each rule under a class named after its content.
 * The same rule always gets the same short name (`e` and five characters), so
 * nodes with the same rule share it, a template renders the same every time,
 * and two renders on one page (or a block pasted into another email) can't
 * give one name two meanings.
 */

export type Media = "all" | "phone" | "desktop";

/** A 32-bit FNV-1a hash: small, fast, and the same everywhere. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** What a class prefix may be: it starts every class name. */
export const CLASS_PREFIX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export class Stylesheet {
  private readonly names = new Map<string, string>();
  private readonly keys = new Map<string, string>();
  private readonly rules: Record<Media, string[]> = { all: [], phone: [], desktop: [] };

  constructor(private readonly prefix = "e") {
    if (!CLASS_PREFIX.test(prefix)) throw new Error(`[Elements] A class prefix starts with a letter and holds letters, digits, "_" and "-", not ${JSON.stringify(prefix)}`);
  }

  /**
   * The class for `rule`, written with `&` where the class goes (`&{…}`,
   * `&:hover{…}`, `&>*{…}`), under `media`.
   */
  classFor(media: Media, rule: string): string {
    const key = `${media}\n${rule}`;
    const known = this.names.get(key);
    if (known) return known;
    const hash = fnv1a(key).toString(36).padStart(7, "0");
    // Two rules of one render with the same five characters: the later one takes more of its hash.
    let name = `${this.prefix}${hash.slice(-5)}`;
    for (let size = 6; this.keys.has(name); size++) name = size <= 7 ? `${this.prefix}${hash.slice(-size)}` : `${name}x`;
    this.names.set(key, name);
    this.keys.set(name, key);
    this.rules[media].push(rule.replace(/&/g, `.${name}`));
    return name;
  }

  /** The rules, with the queries that say what a phone and a desktop are. */
  css(phone: string, desktop: string): string {
    return [
      ...this.rules.all,
      ...(this.rules.desktop.length ? [`${desktop}{${this.rules.desktop.join("")}}`] : []),
      ...(this.rules.phone.length ? [`${phone}{${this.rules.phone.join("")}}`] : []),
    ].join("");
  }
}
