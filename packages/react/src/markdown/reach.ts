/**
 * How much of the text marked's inline rules (marked 18.0.14's, the version built in) can look at, from where they
 * read: given that much, a rule reads as it does given all of it, and doesn't look further. A reach is a number of
 * characters, past the last one the rule can look at; the length of the text where it could look to the end.
 */

/** The end of what `run` (sticky) matches at `from`, or `from`. */
export const runEnd = (src: string, from: number, run: RegExp): number => {
  run.lastIndex = from = Math.min(from, src.length);
  return run.test(src) ? run.lastIndex : from;
};

/** Where `pattern` (global) first matches at or after `from`, or the text's length. */
const first = (src: string, from: number, pattern: RegExp): number => {
  pattern.lastIndex = from;
  return pattern.exec(src)?.index ?? src.length;
};

const WHITESPACE = /\s*/y;
const SPACES = / */y;
const TICKS = /`*/y;
const TILDES = /~*/y;
/** What an email address is made of, as marked looks for one before an `@`. */
const EMAIL = /[a-zA-Z0-9.!#$%&'*+/=?_`{|}~-]*/y;

/**
 * Text: up to where marked's text rule stops (before a character that could start something else, `http`, `www.`,
 * an email address, two spaces at a line's end), and what it looks at past that, the email address or the spaces it's
 * in. With `breaks` it stops at each line's end too, before its spaces: there marked looks for that line's end again
 * at each of a run of spaces, so text with a long run of them is read up into the run (it reads on from there).
 */
const TEXT_STOP = /[\\<!\[`*~_]|[hH][tT][tT][pP]|[fF][tT][pP]:\/\/|www\.|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+/=?_`{|}~-](?=[a-zA-Z0-9.!#$%&'*+/=?_`{|}~-]+@)|[^a-zA-Z0-9](?=(?:mailto|xmpp):)/g;
const TEXT_STOP_BREAKS = new RegExp(`${TEXT_STOP.source}|\\n`, "g");
/** In text, with `breaks`: a run of spaces long enough that marked reads it in time growing with its length squared. */
const LONG_SPACES = / {64}/g;

export const textReach = (src: string, breaks: boolean): number => {
  const start = src[0] === "`" ? runEnd(src, 0, TICKS) : src[0] === "~" ? runEnd(src, 0, TILDES) : 1;
  const pattern = breaks ? TEXT_STOP_BREAKS : TEXT_STOP;
  pattern.lastIndex = start;
  const match = pattern.exec(src);
  let stop = match ? match.index : src.length;
  if (breaks && match?.[0] === "\n") while (stop > start && src[stop - 1] === " ") stop--;
  stop++;
  if (breaks) {
    const spaces = first(src.slice(0, stop), start, LONG_SPACES);
    if (spaces + 65 < stop) return spaces + 32;
  }
  if (stop >= src.length) return src.length;
  return Math.max(stop + 8, runEnd(src, stop, EMAIL), runEnd(src, stop, SPACES)) + 1;
};

/** A URL or an email address marked links by itself: no further than the first whitespace. */
export const urlReach = (src: string): number => first(src, 0, /\s/g) + 1;

/** `<scheme:…>` or `<address@…>`: to its `>`, or what can't be in one. */
export const autolinkReach = (src: string): number => first(src, 1, /[\s\x00-\x1f<>]/g) + 1;

/** Code: to the next run of as many backticks. */
export const codeReach = (src: string): number => {
  const ticks = runEnd(src, 0, TICKS);
  const runs = /`+/g;
  runs.lastIndex = ticks;
  for (let run; (run = runs.exec(src)); ) if (run[0].length === ticks) return runs.lastIndex + 1;
  return src.length;
};

/** A line break: two spaces or a backslash at a line's end, and the whitespace after it. */
export const brReach = (src: string): number => {
  const end = src[0] === "\\" ? 1 : runEnd(src, 0, SPACES);
  return src[end] === "\n" ? runEnd(src, end + 1, WHITESPACE) + 1 : end + 1;
};

/** Raw HTML: a comment, a tag with its attributes (each quoted value to its quote), `<?…?>`, `<!…>`, CDATA. */
export const tagReach = (src: string): number => {
  const to = (end: string, from: number) => {
    const at = src.indexOf(end, from);
    return at < 0 ? src.length : at + end.length;
  };
  if (src.startsWith("<!--")) return to("-->", 4) + 1;
  if (src.startsWith("<![CDATA[")) return to("]]>", 9) + 1;
  if (src[1] === "?") return to("?>", 2) + 1;
  if (src[1] === "!") {
    const name = runEnd(src, 2, LETTERS);
    return name > 2 && /\s/.test(src[name] ?? "") ? to(">", name) + 1 : name + 1;
  }
  if (src[1] === "/") return runEnd(src, runEnd(src, 2, TAG_NAME), WHITESPACE) + 2;
  if (!/[a-zA-Z]/.test(src[1] ?? "")) return 2;
  // A tag: its name, then attributes, each after whitespace, with a value or not.
  let at = runEnd(src, 1, TAG_NAME);
  for (;;) {
    const space = runEnd(src, at, WHITESPACE);
    const end = src[space] === "/" ? space + 1 : space;
    if (src[end] === ">" || space === at || !ATTRIBUTE.test(src[space] ?? "")) return end + 2;
    at = runEnd(src, space, ATTRIBUTE_NAME);
    const equals = runEnd(src, at, WHITESPACE);
    if (src[equals] !== "=") continue;
    const value = runEnd(src, equals + 1, WHITESPACE);
    const quote = src[value];
    if (quote === '"' || quote === "'") {
      const close = src.indexOf(quote, value + 1);
      if (close < 0) return src.length;
      at = close + 1;
    } else {
      at = runEnd(src, value, UNQUOTED);
      if (at === value) return value + 2;
    }
  }
};

const LETTERS = /[a-zA-Z]*/y;
const TAG_NAME = /[a-zA-Z][a-zA-Z0-9-]*/y;
const ATTRIBUTE = /[a-zA-Z:_]/;
const ATTRIBUTE_NAME = /[a-zA-Z:_][\w.:-]*/y;
const UNQUOTED = /[^\s"'=<>`]*/y;

/**
 * A link's text: from `[` (after `!` for an image) to its `]` outside the brackets it holds (two deep at most), its
 * escapes and its code skipped (a run of backticks to the next run, as code can hold a `]`). Its `]`, or (as a negative
 * number, -1 - reach) how far marked looks where it hasn't one.
 */
const label = (src: string): number => {
  let at = src[0] === "!" ? 2 : 1;
  for (let depth = 0; at < src.length; at++) {
    const char = src[at];
    if (char === "\\") at++;
    else if (char === "`" && !depth) {
      const ticks = runEnd(src, at, TICKS);
      // Two or more before a `]` may end the text there too: then marked may look either way.
      const next = ticks - at > 1 && src[ticks] === "]" ? -1 : src.indexOf("`", ticks);
      if (next < 0) return -1 - src.length;
      at = runEnd(src, next, TICKS) - 1;
    } else if (char === "[" && ++depth > 2) return -1 - (at + 1);
    else if (char === "]" && !depth--) return at;
  }
  return -1 - src.length;
};

/** How far marked looks from each `<` in a link's text (from `from` to `to`): it reads raw HTML and autolinks there again. */
const angles = (src: string, from: number, to: number): number => {
  const text = src.slice(0, to);
  let reach = 0;
  for (let at = text.indexOf("<", from); at >= 0; at = text.indexOf("<", at + 1)) {
    const rest = src.slice(at);
    reach = Math.max(reach, at + Math.max(tagReach(rest), autolinkReach(rest)));
  }
  return reach;
};

/** `[text](url "title")`: its text, then from `(` its URL and title as marked tries them, and `)`. */
export const linkReach = (src: string): number => {
  const end = label(src);
  if (end < 0) return -1 - end;
  const text = angles(src, 1, end);
  if (src[end + 1] !== "(") return Math.max(text, end + 2);
  const start = runEnd(src, end + 2, WHITESPACE);
  // Its URL: `<…>`, or up to whitespace.
  let angle = start + 1;
  if (src[start] === "<") {
    while (angle < src.length && src[angle] !== "\n" && src[angle] !== "<" && src[angle] !== ">") angle += src[angle] === "\\" && !LINE_END.test(src[angle + 1] ?? "\n") ? 2 : 1;
    angle = src[angle] === ">" ? after(src, angle + 1) : angle + 1;
  }
  return Math.max(text, angle, after(src, start), after(src, runEnd(src, start, HREF))) + 1;
};

const HREF = /[^ \t\n\x00-\x1f]*/y;
/** What `.` doesn't match: a backslash before one doesn't escape it. */
const LINE_END = /[\n\r\u2028\u2029]/;

/** From where a link's URL may end: whitespace, a title in `"…"`, `'…'` or `(…)` to its end, whitespace and `)`. */
const after = (src: string, from: number): number => {
  const space = runEnd(src, from, WHITESPACE);
  const quote = src[space];
  if (space === from || (quote !== '"' && quote !== "'" && quote !== "(")) return space + 1;
  const close = quote === "(" ? ")" : quote;
  let at = space + 1;
  while (at < src.length && src[at] !== close) at += src[at] === "\\" && src[at + 1] === close ? 2 : 1;
  return at < src.length ? runEnd(src, at + 1, WHITESPACE) + 1 : src.length;
};

/** `[text][label]`, `[label][]` and `[label]`: the text, then the label, to their `]`. */
export const reflinkReach = (src: string): number => {
  const start = src[0] === "!" ? 2 : 1;
  // `[label]` (and `[]` after it): to the first bracket, its escapes skipped.
  let bracket = start;
  while (bracket < src.length && src[bracket] !== "[" && src[bracket] !== "]") bracket += src[bracket] === "\\" ? 2 : 1;
  const plain = Math.max(bracket + 3, angles(src, start, bracket));
  const end = label(src);
  if (end < 0) return Math.max(-1 - end, plain);
  const text = Math.max(plain, angles(src, start, end));
  if (src[end + 1] !== "[") return Math.max(end + 2, text);
  let close = end + 2;
  while (close < src.length && src[close] !== "[" && src[close] !== "]") close += src[close] === "\\" ? 2 : 1;
  return Math.max(close + 2, text);
};
