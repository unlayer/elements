/**
 * The stylesheet: what inline styles can't do (phone overrides, hiding, hover,
 * a Row stacking on phones), each rule under a class named after its content.
 * The same rule always gets the same short name (`e` and five characters), so
 * nodes with the same rule share it, a template renders the same every time,
 * and two renders on one page (or a block pasted into another email) can't
 * give one name two meanings.
 */

export type Media = "all" | "phone" | "desktop";

/**
 * Which rule wins where two set the same property on one element with the
 * same specificity (CSS takes the later one): a layout's rules for its
 * children (a Row stacking them on phones) come first, a node's own rules
 * (its phone styles, hiding) after them, so what the author set on the node
 * wins, then hover. The order rules are made in doesn't matter.
 */
export type Level = "layout" | "own" | "hover";
const LEVELS: Level[] = ["layout", "own", "hover"];

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
  private readonly rules: Record<Media, Array<{ level: Level; text: string }>> = { all: [], phone: [], desktop: [] };
  private readonly imported = new Set<string>();

  constructor(private readonly prefix = "e") {
    if (!CLASS_PREFIX.test(prefix)) throw new Error(`[Elements] A class prefix starts with a letter and holds letters, digits, "_" and "-", not ${JSON.stringify(prefix)}`);
  }

  /**
   * The class for `rule`, written with `&` where the class goes (`&{…}`,
   * `&:hover{…}`, `&>*{…}`), under `media`, at `level`.
   */
  classFor(media: Media, rule: string, level: Level = "own"): string {
    const key = `${media}\n${rule}`;
    const known = this.names.get(key);
    if (known) return known;
    const hash = fnv1a(key).toString(36).padStart(7, "0");
    // Two rules of one render with the same five characters: the later one takes more of its hash.
    let name = `${this.prefix}${hash.slice(-5)}`;
    for (let size = 6; this.keys.has(name); size++) name = size <= 7 ? `${this.prefix}${hash.slice(-size)}` : `${name}x`;
    this.names.set(key, name);
    this.keys.set(name, key);
    this.rules[media].push({ level, text: rule.replace(/&/g, `.${name}`) });
    return name;
  }

  /**
   * CSS an imported node carries (a builder block's rules), written as it is, once however many nodes carry it,
   * before the stylesheet's own rules. A `</style` in it would end the element: CSS escapes the slash.
   */
  addImported(css: string): void {
    if (css) this.imported.add(css.replace(/<\/(style)/gi, "<\\/$1"));
  }

  /**
   * The rules, with the queries that say what a phone and a desktop are: imported CSS first, then by media, then by
   * level, then in the order they were made. Without queries (`null`), what's of a fixed size (a Canvas, a Document)
   * has no phone: its phone rules are left out, and its desktop rules always apply.
   */
  css(phone: string | null, desktop: string | null): string {
    const ordered = (media: Media) =>
      LEVELS.flatMap((level) => this.rules[media].filter((rule) => rule.level === level))
        .map((rule) => rule.text)
        .join("");
    return [
      ...this.imported,
      ordered("all"),
      ...(this.rules.desktop.length ? [desktop === null ? ordered("desktop") : `${desktop}{${ordered("desktop")}}`] : []),
      ...(this.rules.phone.length && phone !== null ? [`${phone}{${ordered("phone")}}`] : []),
    ].join("");
  }
}
