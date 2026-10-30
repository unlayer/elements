/**
 * What inline Markdown from data can't make marked's inline lexer do: take more than its size calls for. marked reads
 * an opener (`*`, `_`, `~`, `[`, `<`, a backtick) by looking ahead for what closes it, to the end of the paragraph when
 * nothing does, and an email's or a URL's characters again at each place it could start, so a paragraph of openers
 * nothing closes (`*a *a *a …`, `[a]([a](…`) took time growing with its size squared: seconds for 40 KB. Here each
 * rule is given only as much of the text as it can look at (see `reach.ts`), so it reads the same, and what it looks
 * at is counted: a Markdown's inline syntax has WORK steps for each of its characters (and BASE more), far more than
 * Markdown as people write it takes, and past them the rest of its inline Markdown is text. Emphasis, strikethrough and
 * links nest INLINE_NESTING deep: deeper, their delimiters are text.
 */
import { Lexer, type Links, type Token, type Tokens, type TokensList } from "marked";
import { Limited, QUOTE_BASE, QUOTE_WORK } from "./limits";
import { autolinkReach, brReach, codeReach, linkReach, reflinkReach, runEnd, tagReach, textReach, urlReach } from "./reach";

/** The steps a Markdown's inline syntax can take for each of its characters, and BASE more (see the comment above). */
export const WORK = 32;
export const BASE = 1 << 20;

/** How deep emphasis, strikethrough and links nest in one another: deeper, their delimiters are text. */
export const INLINE_NESTING = 32;

/** The text rule past the work: the rest of what's being read, as text. */
const REST = /^[\s\S]+/;

/** marked's tokenizer, keeping to Limited's limits and to the inline work above. */
class Inline extends Limited {
  /** Steps left: below zero, the work is spent. */
  left: number;

  constructor(cells: number, quotes: number, work: number, private breaks: boolean) {
    super(cells, quotes);
    this.left = work;
  }

  /** Whether the work is spent: the rest of the inline Markdown is text. */
  get spent(): boolean {
    return this.left < 0;
  }

  /** Spends `steps`, if they're left; when they aren't, the work is spent. */
  spend(steps: number): boolean {
    if (this.left >= steps) {
      this.left -= steps;
      return true;
    }
    this.left = -1;
    this.rules.inline.text = REST;
    return false;
  }

  /**
   * Counts the rules marked runs over the text itself (not from where it reads): its own copy of them, so others'
   * lexers aren't counted (and with no task item found by marked: see limits.ts).
   */
  count(): void {
    this.own();
    const inline = { ...this.rules.inline };
    for (const name of ["emStrongRDelimAst", "emStrongRDelimUnd", "delRDelim", "_backpedal"] as const) inline[name] = counted(inline[name], this);
    this.rules = { ...this.rules, inline };
  }

  /** What `read` makes of `src` given only as much of it as its rule can look at (`reach`), which is spent. */
  private within<T>(src: string, reach: number, read: (src: string) => T): T | undefined {
    if (this.spent) return undefined;
    const size = Math.min(src.length, reach);
    return this.spend(size) ? read(size < src.length ? src.slice(0, size) : src) : undefined;
  }

  /** Whether an emphasis, a strikethrough or a link here would be deeper than INLINE_NESTING. */
  private get deep(): boolean {
    return (this.lexer as unknown as Bounded).depth > INLINE_NESTING;
  }

  tag(src: string): Tokens.Tag | undefined {
    return src[0] === "<" ? this.within(src, tagReach(src), (part) => super.tag(part)) : super.tag(src);
  }

  link(src: string): Tokens.Link | Tokens.Image | undefined {
    if (src[0] !== "[" && !src.startsWith("![")) return super.link(src);
    if (this.deep || this.spent) return undefined;
    // What marked reads from each `<` in its text is counted too (see Looks).
    const looks = { steps: 0 };
    return tagged(src, (text) => linkReach(text, looks), (text, reach) => (this.spend(looks.steps) ? this.within(text, reach, (part) => super.link(part)) : undefined), lineEnd, (steps) => this.spend(steps));
  }

  reflink(src: string, links: Links): Tokens.Link | Tokens.Image | Tokens.Text | undefined {
    if (src[0] !== "[" && !src.startsWith("![")) return super.reflink(src, links);
    if (this.deep || this.spent) return undefined;
    const looks = { steps: 0 };
    const reach = reflinkReach(src, looks);
    return this.spend(looks.steps) ? this.within(src, reach, (part) => super.reflink(part, links)) : undefined;
  }

  emStrong(src: string, maskedSrc: string, prevChar?: string): Tokens.Em | Tokens.Strong | undefined {
    if (src[0] !== "*" && src[0] !== "_") return super.emStrong(src, maskedSrc, prevChar);
    // Its delimiters, then what closes them (counted as marked looks for it: see count()).
    if (this.deep || this.spent || !this.spend(runEnd(src, 0, src[0] === "*" ? STARS : UNDERSCORES))) return undefined;
    return super.emStrong(src, maskedSrc, prevChar);
  }

  codespan(src: string): Tokens.Codespan | undefined {
    return src[0] === "`" ? this.within(src, codeReach(src), (part) => super.codespan(part)) : super.codespan(src);
  }

  br(src: string): Tokens.Br | undefined {
    return src[0] === " " || src[0] === "\\" || src[0] === "\n" ? this.within(src, brReach(src), (part) => super.br(part)) : super.br(src);
  }

  del(src: string, maskedSrc: string, prevChar?: string): Tokens.Del | undefined {
    if (src[0] !== "~") return super.del(src, maskedSrc, prevChar);
    return this.deep || this.spent ? undefined : super.del(src, maskedSrc, prevChar);
  }

  autolink(src: string): Tokens.Link | undefined {
    return src[0] === "<" ? tagged(src, autolinkReach, (text, reach) => this.within(text, reach, (part) => super.autolink(part)), (text) => AUTOLINK_END(text.slice(1)) + 2, (steps) => this.spend(steps)) : super.autolink(src);
  }

  url(src: string): Tokens.Link | undefined {
    return URL_START.test(src[0] ?? "") ? tagged(src, urlReach, (text, reach) => this.within(text, reach, (part) => super.url(part)), (text) => URL_END(text), (steps) => this.spend(steps)) : super.url(src);
  }

  def(src: string): Tokens.Def | undefined {
    // (Its label, its URL and its title: three lines at most.)
    return tagged(src, defReach, (text) => super.def(text), (_text, reach) => reach, () => true);
  }

  inlineText(src: string): Tokens.Text | undefined {
    if (this.spent) return super.inlineText(src);
    return this.within(src, textReach(src, this.breaks), (part) => super.inlineText(part)) ?? super.inlineText(src);
  }
}

/**
 * An email service's tag, on one line (`{{ … }}`, `{% … %}`, `<% … %>`, `%% … %%`, `${…}`, Mailchimp's `*|…|*`): in a
 * link's URL (`[text](url)`, `![alt](src)`, a URL Markdown links by itself, `<url>`, a link's definition) one piece of
 * it, so the URL doesn't end inside it, at a space or at what else ends one (see HIDE). Elsewhere, Markdown as
 * CommonMark reads it. (Its length kept to a tag's: each is read once from where it starts.)
 */
const TAG = /\{\{[^\n{}]{0,256}\}\}|\{%[^\n{}]{0,256}%\}|<%[^\n<>]{0,256}%>|%%[^\n%]{0,256}%%|\$\{[^\n{}]{0,256}\}|\*\|[^\s|*]{0,256}\|\*/g;
const OPENER = /\{\{|\{%|<%|%%|\$\{|\*\|/;
/** What in a tag could end a URL or a link's parts, while marked reads it: one character of Unicode's private use for each. */
const HIDE: Record<string, string> = { " ": "\uE000", "\t": "\uE001", "<": "\uE002", ">": "\uE003", "*": "\uE004", "|": "\uE005", "(": "\uE006", ")": "\uE007", '"': "\uE008", "'": "\uE009" };
const SHOW: Record<string, string> = Object.fromEntries(Object.entries(HIDE).map(([shown, hidden]) => [hidden, shown]));
const ENDS = /[ \t<>*|()"']/g;
const PRIVATE = /[\uE000-\uE009]/;
const HIDDEN = /[\uE000-\uE009]/g;

/**
 * What a rule reads of `src` to `end` (and a tag's length past it), with the tags that start before `end` hidden (see
 * HIDE): each character where it was. Only that much: the rest of the text, copied for each link, took time growing
 * with its size squared. `src` itself where there's no tag there.
 */
function hideTags(src: string, end: number): string {
  const head = src.slice(0, end + 270);
  let out = "";
  let at = 0;
  TAG.lastIndex = 0;
  for (let tag; (tag = TAG.exec(head)) && tag.index < end; ) {
    out += head.slice(at, tag.index) + tag[0].replace(ENDS, (ch) => HIDE[ch]);
    at = TAG.lastIndex;
  }
  return at ? out + head.slice(at) : src;
}

/** A token read with tags hidden, shown again (its URL, its text, what's in it). */
function shown<T>(value: T): T {
  if (typeof value === "string") return value.replace(HIDDEN, (ch) => SHOW[ch]) as T;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = shown(value[i]);
  } else if (value && typeof value === "object") {
    for (const key of Object.keys(value)) (value as Record<string, unknown>)[key] = shown((value as Record<string, unknown>)[key]);
  }
  return value;
}

/**
 * What `read` makes of `src` (as far as `reachOf` says it looks) with the tags hidden in what it could look at
 * (`extent`: once, as far as it ends, which `spend` is charged for), read as far as that reaches with them hidden.
 * Text with Unicode's private use characters in it is read as it is.
 */
function tagged<T>(src: string, reachOf: (src: string) => number, read: (src: string, reach: number) => T | undefined, extent: (src: string, reach: number) => number, spend: (steps: number) => boolean): T | undefined {
  const reach = reachOf(src);
  if (!OPENER.test(src.slice(0, reach + 2)) || PRIVATE.test(src.slice(0, reach + 270))) return read(src, reach);
  const end = extent(src, reach);
  if (!spend(end)) return undefined;
  const hidden = hideTags(src, end);
  if (hidden === src) return read(src, reach);
  const token = read(hidden, reachOf(hidden));
  return token && shown(token);
}

const STICKY_TAG = new RegExp(TAG.source, "y");
/**
 * Where a URL Markdown links by itself (or one in `<…>`) ends: the first of `stops` (whitespace, `<`, and `>` in `<…>`)
 * that isn't in a tag (each tag read once from where it starts, as long as one can be).
 */
const urlEnd = (stops: RegExp) => (src: string): number => {
  for (let at = 0; at < src.length; ) {
    STICKY_TAG.lastIndex = at;
    const tag = "{<%$*".includes(src[at]) ? STICKY_TAG.exec(src) : null;
    if (tag) at += tag[0].length;
    else if (stops.test(src[at])) return at;
    else at++;
  }
  return src.length;
};
const URL_END = urlEnd(/[\s<]/);
const AUTOLINK_END = urlEnd(/[\s<>]/);
/** A link's URL ends on the line it's on (a tag is on one line): to the end of the line `reach` is on. */
const lineEnd = (src: string, reach: number): number => {
  const end = src.indexOf("\n", Math.min(reach, src.length));
  return end < 0 ? src.length : end;
};

/** A link's definition: its label, its URL and its title, three lines at most. */
const defReach = (src: string): number => {
  let at = 0;
  for (let lines = 0; lines < 3 && at < src.length; lines++) {
    const end = src.indexOf("\n", at);
    at = end < 0 ? src.length : end + 1;
  }
  return at;
};

const STARS = /\**/y;
const UNDERSCORES = /_*/y;
/** What a URL marked links by itself starts with (`www.`, `http://`, `mailto:`, an email address). */
const URL_START = /[A-Za-z0-9._+-]/;

/**
 * `rule`, counting what it reads: marked runs these over the text from where it last stopped (emphasis's and
 * strikethrough's closing delimiters) or over a link it trims again and again (`_backpedal`). Past the work, they find
 * nothing more (a link isn't trimmed further).
 */
function counted(rule: RegExp, inline: Inline): RegExp {
  const trims = !rule.global;
  return new (class extends RegExp {
    exec(src: string): RegExpExecArray | null {
      if (inline.spent) return trims ? ([src] as unknown as RegExpExecArray) : ((this.lastIndex = 0), null);
      const from = this.lastIndex;
      const match = super.exec(src);
      if (inline.spend(trims ? src.length : (match ? this.lastIndex : src.length) - from)) return match;
      return trims ? ([src] as unknown as RegExpExecArray) : ((this.lastIndex = 0), null);
    }
  })(rule.source, rule.flags);
}

/** The work a Markdown can take: its inline syntax's (see WORK) and its quotes' and list items' lines' (QUOTE_WORK). */
export interface Work {
  inline: number;
  quotes: number;
}

/**
 * marked's lexer for a Markdown of `size` characters: its tables and its quotes' and lists' nesting kept to `cells`
 * and NESTING, its quotes to QUOTE_WORK (see limits.ts), its inline syntax to the work and the nesting above; or to
 * `work`, where that's given (the render's: see work.ts).
 */
export class Bounded extends Lexer {
  /** How deep in emphasis, strikethrough and links the inline lexer is reading. */
  depth = 0;
  private reader: Inline;

  constructor({ breaks, cells, size, work }: { breaks: boolean; cells: number; size: number; work?: Work }) {
    const inline = new Inline(cells, work?.quotes ?? QUOTE_BASE + QUOTE_WORK * size, work?.inline ?? BASE + WORK * size, breaks);
    super({ gfm: true, breaks, tokenizer: inline });
    inline.count();
    this.reader = inline;
  }

  /** The work it has left (below zero, spent), and its tables' cells. */
  get left(): Work & { cells: number } {
    return { inline: this.reader.left, quotes: this.reader.quotesLeft, cells: this.reader.cellsLeft };
  }

  blockTokens(src: string, tokens?: Token[], lastParagraphClipped?: boolean): Token[];
  blockTokens(src: string, tokens?: TokensList, lastParagraphClipped?: boolean): TokensList;
  /** marked reads each of its blocks from what's left of `src`: the text is kept, for the rules read from it (headings.ts). */
  blockTokens(src: string, tokens: Token[] = [], lastParagraphClipped = false): Token[] {
    this.reader.texts.push({ text: src, tokens });
    try {
      return super.blockTokens(src, tokens, lastParagraphClipped);
    } finally {
      this.reader.texts.pop();
    }
  }

  inlineTokens(src: string, tokens: Token[] = []): Token[] {
    if (this.reader.spent) {
      // Past the work: all of it, as text (with no looking for links to mask first).
      const text = src && this.reader.inlineText(src);
      if (text) tokens.push(text);
      return tokens;
    }
    // marked masks the reference links in the text (`[a][b]`, `[a]`) for its emphasis and strikethrough rules, with a
    // search from each `[` up to 999 steps long (100 KB of `\[` took 0.4 s). Where the Markdown defines none, it masks
    // nothing, and where the text has no `*`, `_` or `~`, nothing reads what it masks: there, it isn't run.
    const inline = this.reader.rules.inline;
    const search = inline.reflinkSearch;
    if (!defines(this.tokens.links) || !DELIMITERS.test(src)) inline.reflinkSearch = NO_REFERENCE;
    this.depth++;
    try {
      return super.inlineTokens(src, tokens);
    } finally {
      this.depth--;
      inline.reflinkSearch = search;
    }
  }
}

/** A search that finds nothing: for reference links where there are none to find. */
const NO_REFERENCE = /(?!)/g;
/** What marked's emphasis and strikethrough rules, the masked text's only readers, start with. */
const DELIMITERS = /[*_~]/;

/** A Markdown's link definitions known to hold one: they're only added to, so once they do, they always do. */
const defining = new WeakSet<Links>();

/**
 * Whether `links` (a Markdown's link definitions) holds one. Once a time per Markdown: a `for…in` gathers every key
 * before its first (each inline pass reading thousands of definitions took time growing with the Markdown's size squared).
 */
const defines = (links: Links): boolean => {
  if (defining.has(links)) return true;
  for (const _ in links) {
    defining.add(links);
    return true;
  }
  return false;
};
