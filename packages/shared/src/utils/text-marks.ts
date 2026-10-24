/**
 * The plain text's placeholders are U+0000 and U+0001 around a number (a link's URL, preformatted text): the text's own
 * (as it's written, or as an entity: `&#1;`, and `&amp;#1;`, which is decoded twice, as 0.2.1 decoded it) are kept out of
 * their way, as two private-use characters the HTML holds none of (as it's written or as an entity), put back once the
 * placeholders are gone. Where the HTML holds all of those (6,400), its own are left out.
 */
export class TextMarks {
  private free?: [nul: string, one: string] | null;

  constructor(private html: string) {}

  /** The HTML, its own U+0000 and U+0001 as their stand-ins. */
  input(): string {
    if (!/[\0\u0001]/.test(this.html)) return this.html;
    return this.html.replace(/[\0\u0001]/g, (char) => this.standIn(char));
  }

  /** What stands for `char` (U+0000 or U+0001) until the end: one of two private-use characters, or nothing. */
  standIn(char: string): string {
    const free = this.pick();
    return free ? free[char === "\0" ? 0 : 1] : "";
  }

  /** The text, its stand-ins as what they stood for. */
  output(text: string): string {
    const free = this.free;
    return free ? text.split(free[0]).join("\0").split(free[1]).join("\u0001") : text;
  }

  /** Two private-use characters the HTML holds none of, as written or as an entity (found once, where first needed). */
  private pick(): [string, string] | null {
    if (this.free !== undefined) return this.free;
    const held = new Set<number>();
    for (let i = 0; i < this.html.length; i++) held.add(this.html.charCodeAt(i));
    // (Each `#…;`, wherever it is: `&amp;#xE000;` is decoded to one too.)
    for (const [, decimal, hex] of this.html.matchAll(/#(?:(\d+)|x([0-9a-f]+));/gi)) held.add(String.fromCharCode(decimal ? parseInt(decimal, 10) : parseInt(hex, 16)).charCodeAt(0));
    const free: string[] = [];
    for (let code = 0xe000; code <= 0xf8ff && free.length < 2; code++) if (!held.has(code)) free.push(String.fromCharCode(code));
    return (this.free = free.length === 2 ? [free[0], free[1]] : null);
  }
}
