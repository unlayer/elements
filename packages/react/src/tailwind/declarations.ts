/**
 * A class string as the declarations Tailwind gives it, read for an email: when each applies (everywhere, on
 * phones, above a breakpoint, on hover) and its value in the forms email clients read (see values.ts). What can't
 * apply in an email (an unknown class, `dark:`, `focus:`, a rule for other elements) is listed with why.
 */
import { parseSheet, type Rule, type Sheet } from "./css";
import { emailValue, MAX_VALUE, TOO_LONG } from "./values";

/** When a declaration applies: everywhere, on phones (`max-sm:`), above a breakpoint (`sm:`, `md:` …), or on hover. */
export type ClassCondition = "always" | "phone" | "desktop" | "hover";

export interface ClassDeclaration {
  /** The class it comes from (`max-sm:p-2`). */
  className: string;
  /** The CSS property (`padding`). */
  property: string;
  /** Its value for an email: pixels, hex or rgba colors, variables and `calc()` worked out (`8px`). */
  value: string;
  when: ClassCondition;
  important: boolean;
}

export interface ClassDeclarations {
  /** In the order they apply: a later one for the same property and condition wins. */
  declarations: ClassDeclaration[];
  /** Classes that don't apply in an email (or Tailwind doesn't know), and why. */
  ignored: Array<{ className: string; reason: string }>;
}

const AND = /and/iy;
/**
 * Whether a media query (its spaces out) is `(…)` parts, each with a width and no `(` or `)` in it, with `and` or
 * nothing between them, as `/^(\([^()]*width[^()]*\)(and)?)+$/i` reads it: read once, where that regex tries each
 * `width` in each part, which is exponential in their number.
 */
function widthParts(q: string): boolean {
  for (let i = 0; i < q.length; ) {
    const end = q.indexOf(")", i);
    if (q[i] !== "(" || end < 0 || q.slice(i + 1, end).includes("(") || !/width/i.test(q.slice(i + 1, end))) return false;
    AND.lastIndex = i = end + 1;
    if (AND.test(q)) i += 3;
  }
  return q.length > 0;
}

/** Whether a media query is for small screens (an upper width bound), large ones (a lower bound), or neither. */
function widthOf(query: string): "phone" | "desktop" | undefined {
  const q = query.replace(/\s+/g, "").replace(/^(only)?screen(and)?/i, "");
  if (!widthParts(q) || /height|orientation|aspect|resolution/i.test(q)) return undefined;
  // (A number only from its run's start: from each digit of it, the number before `px` was read again.)
  const upper = /max-(?:device-)?width|width<=?|(?:^|[^\d.])[\d.]+(?:px|em|rem)>=?width/i.test(q);
  const lower = /min-(?:device-)?width|width>=?|(?:^|[^\d.])[\d.]+(?:px|em|rem)<=?width/i.test(q);
  return upper === lower ? undefined : upper ? "phone" : "desktop";
}

/** When a rule applies, or why it can't in an email. */
function conditionOf(rule: Rule): ClassCondition | { reason: string } {
  let when: ClassCondition = "always";
  let hoverable = false;
  for (const at of rule.at) {
    // What follows `@media `, where it's one line, as `/^@media\s+(.*)$/i` reads it (which read the spaces again for each).
    const media = /^@media\s+/i.exec(at);
    const query = media && !/[\n\r\u2028\u2029]/.test(at.slice(media[0].length)) ? at.slice(media[0].length) : undefined;
    if (query && /^\(\s*hover\s*:\s*hover\s*\)$/i.test(query.trim())) hoverable = true;
    else if (query && widthOf(query) && when === "always") when = widthOf(query)!;
    else return { reason: `it applies only for ${at}` };
  }
  if (rule.before.trim()) {
    // Inside a variant's selector (`.group:hover &`), or a selector for others in it (`:where(& > *)`).
    const inside = rule.before.split("(").length > rule.before.split(")").length;
    return { reason: inside ? `it styles other elements (\`${rule.before}.${rule.token}${rule.after}\`)` : `it applies only for \`${rule.before}&${rule.after}\`` };
  }
  const after = rule.after.trim();
  if (after === ":hover") return when === "always" ? "hover" : { reason: "Elements has no hover style for one screen size" };
  if (after) return { reason: `it applies only for \`${after}\`` };
  return hoverable ? { reason: "it applies only on hover" } : when;
}

/**
 * Tailwind's compiler, as `loadTailwind` gives it: `build` takes classes and gives the stylesheet for all so far;
 * `failures`, what its plugins' functions for a class's value threw (or gave that couldn't be read) while it built,
 * kept from Tailwind (see load.ts's `guarded`), for the reader to take after each build.
 */
export interface Compiler {
  build(candidates: string[]): string;
  failures?: PluginFailure[];
}

/**
 * A plugin's function that threw for a class (`error`), or gave CSS that couldn't be read (none): a utility's or a
 * variant's (`variant`), by its name, with the keys of its values that give the value it was given (where one does),
 * else that value (`value`: a class's arbitrary or bare value).
 */
export interface PluginFailure {
  name: string;
  variant?: boolean;
  keys?: string[];
  value?: string;
  /** The modifier it was given (`/50`'s, as Tailwind resolved it), where it was given one, and the keys giving it. */
  modifier?: string;
  modifierKeys?: string[];
  error?: unknown;
}

/** A class's variants and its utility (`hover:-boom-now/50!`: `hover`, `boom-now/50`), its important and negative marks aside. */
function partsOf(token: string): [string[], string] {
  const variants: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "\\") i++;
    else if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === ":" && !depth) {
      variants.push(token.slice(from, i));
      from = i + 1;
    }
  }
  return [variants, token.slice(from).replace(/^!|!$/g, "").replace(/^-/, "")];
}

/** A class's value and its modifier (`blue/50`: `blue`, `50`), at its last `/` outside brackets. */
function cut(given: string): [string, string | undefined] {
  let depth = 0;
  let at = -1;
  for (let i = 0; i < given.length; i++) {
    const c = given[i];
    if (c === "\\") i++;
    else if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === "/" && !depth) at = i;
  }
  return at < 0 ? [given, undefined] : [given.slice(0, at), given.slice(at + 1)];
}

/** A value as Tailwind gives a plugin's function the class's: an arbitrary one's (`[…]`, `(--x)` as `var(--x)`), its type hint aside, `_` a space. */
const decode = (part: string): string => {
  const bracket = /^\[(?:[\w-]+:)?([\s\S]*)\]$/.exec(part)?.[1];
  const paren = /^\((?:[\w-]+:)?(--[\s\S]*)\)$/.exec(part)?.[1];
  return bracket !== undefined ? bracket.replace(/_/g, " ") : paren !== undefined ? `var(${paren})` : part;
};

/** Whether two values are the same but for whitespace (Tailwind writes spaces in a `calc()` around its operators). */
const same = (a: string, b: string) => a.replace(/\s+/g, "") === b.replace(/\s+/g, "");

/**
 * Whether a variant or utility of a class (`boom-now`, `boom-[x]`, `boom`) is the one a failure was for: by its name,
 * its value (by its key, or as given) and its modifier (`loose`: by its name, any value).
 */
function named(part: string, { name, keys, value, modifier, modifierKeys }: PluginFailure, loose?: boolean): boolean {
  if (part === name) return loose || ((!keys || keys.includes("DEFAULT")) && modifier === undefined);
  // (Tailwind reads a value right after `@`, `@foo`, as after a name and a dash.)
  const start = name === "@" ? "@" : name + "-";
  if (!part.startsWith(start)) return false;
  if (loose) return true;
  const given = part.slice(start.length);
  const [bare, mod] = cut(given);
  // (A fraction's `/` is its value's, `w-1/2`: its key is all of it.)
  if (mod !== undefined && modifier === undefined && keys?.includes(given)) return true;
  if (mod === undefined ? modifier !== undefined : modifier === undefined || !(modifierKeys?.includes(mod) || same(decode(mod), modifier))) return false;
  if (keys?.includes(bare)) return true;
  return value === undefined ? !keys : same(decode(bare), value);
}

/** A variant and the variants inside it (`group-vboom-now` holds `vboom-now`), as Tailwind's compound variants hold them. */
function* inner(variant: string): Generator<string> {
  for (let part = variant; ; part = part.replace(/^(group|peer|not|in|has)-/, "")) {
    yield part;
    if (!/^(group|peer|not|in|has)-/.test(part)) return;
  }
}

/** Whether a class is one a plugin's failure was for: by its utility, or a variant's by its variants (`loose`: see named). */
const owns = (token: string, failure: PluginFailure, loose?: boolean) => {
  const [variants, utility] = partsOf(token);
  return failure.variant ? variants.some((v) => [...inner(v)].some((part) => named(part, failure, loose))) : named(utility, failure, loose);
};

/**
 * A class string's declarations, read with a compiler; `prepare` builds the classes of one it hasn't built, at once,
 * without reading them (a render's, before they're read one component at a time: see declarationReader).
 */
export interface DeclarationReader {
  (className: string, scope?: ReadScope): ClassDeclarations;
  prepare(className: string, scope?: ReadScope): void;
  /** Where a class can't be read till a fresh compiler is ready (see declarationReader): when it is. */
  ready?(): Promise<void> | undefined;
}

/**
 * What one render (or one class string) read: what a plugin's function threw (or gave that couldn't be read) while a
 * build of its classes ran that no class of the build was found for (see declarationReader's `blame`), with the classes
 * of that build that could have been why. It fails where the render reads one of them, in that render only: kept off
 * the compiler, whose classes other renders read.
 */
export interface ReadScope {
  strays: Array<{ tokens: Set<string>; error: unknown }>;
}

/**
 * The classes a compiler builds before a fresh one takes over. Tailwind's keeps every class it has built, and each new
 * one builds and reads again the stylesheet of them all: about 1 ms per 300 classes (7 ms at 2,000), and memory that
 * grows with each, as classes made from data (`w-[123px]`) keep coming. An app's own classes, hundreds to a couple of
 * thousand, don't get there.
 */
export const CLASSES = 2000;

/**
 * The characters of the different classes a render reads, and a compiler builds before a fresh one takes over: each
 * build is the stylesheet of every class built so far, so their length is a cost on every build after them too
 * (2,000 classes of 512 characters made each later build take 0.1 s, and a process 300 MB). An app's own come to a
 * few kilobytes.
 */
export const CHARACTERS = 64 * 1024;
export const COMPILED = 4 * CHARACTERS;

/** How many times what a compiler takes (CLASSES, COMPILED) it builds while no fresh one is ready (see FULL). */
export const CEILING = 4;

/**
 * Why a class isn't read: a render (or a class string) reads its first CLASSES different classes, CHARACTERS of them,
 * only (see capped).
 */
export const OVER = `it's past the first ${CLASSES} different classes of the render (or class string), or ${CHARACTERS} characters of them, all one reads`;

/**
 * A reader of one render's classes (or one class string's): the first CLASSES different classes it's given, CHARACTERS
 * of them, are read, by `read`; the others aren't built or read, but listed with OVER (`first`: the first a read left
 * out, since it was last cleared). Classes made from data (a Markdown's, thousands in one attribute) can't take more
 * memory or time than that, as each class Tailwind builds takes memory while it builds them, and time in each build
 * after it; an app's own, hundreds, don't get there. A class past CLASS_LIMITS is never given to Tailwind, but listed
 * with its reason (`beyond`: the first a read left out so, since it was last cleared).
 */
export function capped(read: DeclarationReader, scope: ReadScope = { strays: [] }): DeclarationReader & { first?: string; said?: boolean; beyond?: string; told?: boolean } {
  const names = new Set<string>();
  let characters = 0;
  const admit = (className: string) => {
    const kept: string[] = [];
    const left: string[] = [];
    const past: string[] = [];
    for (const token of String(className).split(/\s+/)) {
      if (!token) continue;
      if (names.has(token)) kept.push(token);
      else if (beyond(token)) past.push(token);
      else if (names.size < CLASSES && characters + token.length <= CHARACTERS) {
        names.add(token);
        characters += token.length;
        kept.push(token);
      } else left.push(token);
    }
    return [kept, left, past];
  };
  const reader = Object.assign(
    (className: string): ClassDeclarations => {
      const [kept, left, past] = admit(className);
      const found = read(kept.join(" "), scope);
      if (!left.length && !past.length) return found;
      if (left.length) reader.first ??= left[0];
      if (past.length) reader.beyond ??= past[0];
      const ignored = [...new Set(past)].map((className) => ({ className, reason: beyond(className)! }));
      return { ...found, ignored: [...found.ignored, ...ignored, ...[...new Set(left)].map((className) => ({ className, reason: OVER }))] };
    },
    { prepare: (className: string) => read.prepare(admit(className)[0].join(" "), scope) } as { prepare(className: string): void; first?: string; said?: boolean; beyond?: string; told?: boolean }
  );
  return reader;
}

const empty = (): Sheet => ({ rules: [], vars: new Map(), initial: new Map(), clean: true });

/** Why a class isn't read: Tailwind's stylesheet of it couldn't be read as written (see `readable`). */
const UNREADABLE = "it isn't a class Tailwind can read here";

/** Why a class isn't read: Tailwind doesn't have it. */
const UNKNOWN = "Tailwind has no such class";

/**
 * The declaration a plugin's `@apply` is given to Tailwind as (its classes URL-encoded: see guard.ts), and how deep
 * classes applying classes are read. Tailwind's compiler throws for an `@apply` of a class or a variant it doesn't have,
 * or of the class itself, and then for every build after it; here such an `@apply` fails where its class is read.
 */
export const APPLY = "--unlayer-apply-";
const APPLIES = 8;

/** Why a class isn't read yet: built with one that didn't read cleanly, or after it, so Tailwind is compiling again. */
export const WAITING = "it's read once Tailwind has compiled again, after a class it couldn't read";

/** How the reason a class isn't read starts where Tailwind can't compile again (see RENEWALS). */
export const STUCK = "Tailwind couldn't compile again";

/**
 * Why a class isn't read yet: its compiler has built twice the classes one takes (CLASSES, COMPILED), and no fresh one is
 * ready. A handle keeps one ready (compiled with it), which takes over at once; the next is compiled in the background,
 * which a synchronous loop of renders doesn't let run: past twice what a compiler takes, each build would cost more than
 * the last (Tailwind builds every class it has built again) and memory would grow with each, so new classes aren't
 * built till the fresh one is ready.
 */
export const FULL = `Tailwind has built ${CEILING * CLASSES} different classes (or ${(CEILING * COMPILED) / 1024} KB of them) since its last fresh compiler, which is compiled once the app yields: yield between synchronous renders (\`await new Promise((resolve) => setImmediate(resolve))\`), or use the async renderers ("@unlayer/react-elements/tailwind"), which wait for it`;

/**
 * Fresh compilers that can fail in a row. One compiles the config this one was compiled from, so one that fails (out of
 * memory, a plugin that throws now) is asked for again, by the next read that needs one: no timer, so nothing is
 * compiled while no class needs it and nothing keeps the process running. Past three in a row, it's taken to fail for
 * good: the reader keeps its compiler, and after a build that didn't read cleanly reads no new class (and says so).
 */
const RENEWALS = 3;

/**
 * The classes of a build that didn't read cleanly that are built alone on one compiler, one at a time, to find the one
 * that was why (see declarationReader): past them, the others wait for a fresh compiler, on which as many more are
 * built alone. Each build is Tailwind's whole stylesheet again, so the many classes of one build (a render's) can't
 * each be built alone on one compiler.
 */
export const SUSPECTS = 100;

/**
 * The builds one read takes, at most, to find the classes a build threw for where the compiler builds on after it
 * (see declarationReader's `isolate`): a class Tailwind can't parse in a render's 2,000 is found in about 25.
 */
const HALVES = 64;

/**
 * Whether Tailwind can build a class without changing how what it builds after it reads: its brackets, parentheses,
 * braces and quotes closed (`\` escaping the character after it, as in CSS), no comment in it, no escape of a code
 * point past U+10FFFF (`\23ff00`, which Tailwind's build throws for where it decodes it). Tailwind's compiler keeps
 * every class it builds, so one that isn't (`[color:x(]`) is never built.
 */
export function readable(token: string): boolean {
  if (/\/\*|\*\//.test(token)) return false;
  const open: string[] = [];
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    const last = open[open.length - 1];
    if (c === "\\" && parseInt(/^[\da-f]{0,6}/i.exec(token.slice(i + 1, i + 7))![0] || "0", 16) > 0x10ffff) return false;
    if (c === "\\") i++;
    else if (last === '"' || last === "'") c === last && open.pop();
    else if (c === '"' || c === "'") open.push(c);
    else if (c === "(" || c === "[" || c === "{") open.push({ "(": ")", "[": "]", "{": "}" }[c]);
    else if ((c === ")" || c === "]" || c === "}") && open.pop() !== c) return false;
  }
  return !open.length && namedProperty(token);
}

/**
 * Whether an arbitrary property's name (`[mask-type:luminance]`, after its variants) is one, a CSS identifier: Tailwind
 * writes it as given, so one that isn't (`[a(:b)]`) is CSS its compiler can't read, and every render on that compiler
 * after it waits for a fresh one. A class that isn't an arbitrary property is one.
 */
function namedProperty(token: string): boolean {
  // Its utility: after the variants' `:`s, outside brackets, parentheses and quotes.
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "\\") i++;
    else if (quote) c === quote && (quote = "");
    else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === ":" && depth === 0) start = i + 1;
  }
  const utility = token.slice(start).replace(/^!|!$/g, "");
  if (!utility.startsWith("[")) return true;
  const name = /^\[([^:]*):/.exec(utility)?.[1];
  return name === undefined || /^(--[\w-]+|-?[a-zA-Z][\w-]*)$/.test(name);
}

/**
 * How much of a class Tailwind's compiler is given. Its build takes time growing faster than a class's size with some
 * of their shapes, and keeps every class it built, building them all again with each new one: each `&` of an arbitrary
 * variant is the whole selector again (100 KB of `[&:hover&:hover…]:` made a stylesheet longer than a string can be,
 * which failed that build and every build after it, other renders' too; 20 KB took 0.6 s on every build after it),
 * chained compound variants (`group-group-…-hover:`) take time cubic in their number (8 KB 3 s, 20 KB 40 s), and
 * variants or brackets thousands deep overflow its stack, as `max-sm:` 3,000 times did. Within these a class builds in
 * about a millisecond whatever its shape, and an app's own classes are far within them (a radial gradient's
 * arbitrary value is about 80 characters). A class past one isn't given to Tailwind: it's left out and said, once a
 * render (see capped).
 */
export const CLASS_LIMITS = { characters: 512, variants: 8, ampersands: 4, depth: 8 };

/** How the reason a class past CLASS_LIMITS isn't read starts. */
export const BEYOND = "Tailwind isn't given";

/** Variants that take another variant (`group-hover`, `not-group-hover`): each counts as one of a class's variants. */
const COMPOUND = /^(?:group|peer|not|in|has)-/;

/** Why a class is past CLASS_LIMITS, or undefined where it isn't. */
export function beyond(token: string): string | undefined {
  const { characters, variants, ampersands, depth } = CLASS_LIMITS;
  if (token.length > characters) return `${BEYOND} a class of more than ${characters} characters`;
  let deepest = 0;
  const open: string[] = [];
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    const last = open[open.length - 1];
    if (c === "\\") i++;
    else if (last === '"' || last === "'") c === last && open.pop();
    else if (c === '"' || c === "'") open.push(c);
    else if (c === "(" || c === "[" || c === "{") deepest = Math.max(deepest, open.push(c));
    else if (c === ")" || c === "]" || c === "}") open.pop();
  }
  if (deepest > depth) return `${BEYOND} brackets nested more than ${depth} deep`;
  let count = 0;
  let amps = 0;
  for (let variant of partsOf(token)[0]) {
    count++;
    for (let m = COMPOUND.exec(variant); m; m = COMPOUND.exec(variant)) {
      variant = variant.slice(m[0].length);
      count++;
    }
    for (const c of variant) if (c === "&") amps++;
  }
  if (count > variants) return `${BEYOND} a class of more than ${variants} variants`;
  if (amps > ampersands) return `${BEYOND} more than ${ampersands} \`&\` in a class's variants`;
  return undefined;
}

/**
 * Reads classes with a compiler: each class built once, its rules read back from the latest stylesheet. Past `limit`
 * classes (or COMPILED characters of them), a fresh compiler takes over, with none built: a class string reads the same
 * whatever its compiler built before. One is kept ready (`ready`, compiled with the handle), so it takes over at once,
 * synchronous renders too, where classes are next built; then another is asked for from `renew` (Tailwind compiles
 * asynchronously), the spare once it's ready. A synchronous loop of renders never lets it compile: there, past twice
 * `limit` with no fresh compiler ready, no class is built (FULL), as each build would cost more than the last and
 * memory would grow; a render that needs one fails, saying to yield between renders or use the async renderers (see
 * load.ts). A class that could change how the stylesheet reads isn't built (`readable`); a build whose stylesheet still
 * doesn't read cleanly is left out (its classes said, the classes before it read as they did), and a fresh compiler
 * takes over, on which each of that build's classes is built alone first (SUSPECTS of them on one compiler: the others
 * wait for the next), where a class string holding it is read: the one that was why is never built again, and only it.
 * What a plugin's function for a class throws, or gives that can't be read, is kept from the build (see guard.ts) and
 * blamed on its class, thrown where that's read (or the class left out): the compiler stays clean, for this render's
 * other classes and other renders'. A build that throws all the same (not a plugin's function) where Tailwind keeps its
 * classes (it throws again on the next build with a new one) is one that didn't read cleanly; where it doesn't, the
 * class that threw is found and refused (see isolate). While a fresh compiler is wanted and compiled, `ready` gives when
 * it's ready, for the async renderers to wait for; a synchronous render can't, and fails where it needs a class built
 * (see load.ts).
 *
 * Each build is Tailwind's whole stylesheet again (it keeps every class it built), so classes are best built many at
 * once: `prepare` builds a render's, all the classes its components and their markup are given, before they're read
 * one component at a time (which would take the square of their number: seconds for a few thousand).
 *
 * After a build that didn't read cleanly, which `readable` refuses every known cause of, with no fresh compiler ready,
 * new classes aren't read till one is (`WAITING`, said): a render that meets one before reads it as left out, and a
 * later one reads it. That can't be made synchronous: Tailwind compiles only asynchronously, and nothing more can be
 * built on a compiler whose stylesheet doesn't read cleanly (it keeps every class built). Reading on past the rule that
 * broke it, from Tailwind's rule boundaries, would trust how Tailwind prints CSS where the reader reads it as CSS does
 * (what keeps one class from changing how the next reads).
 */
export function declarationReader(compiler: Compiler, renew?: () => Promise<Compiler>, limit = CLASSES, ready?: Compiler): DeclarationReader {
  let seen = new Set<string>();
  // The characters of the classes built (see COMPILED).
  let built = 0;
  let sheet = empty();
  let byToken = new Map<string, Rule[]>();
  let renewing = false;
  // Whether the compiler built a stylesheet that didn't read cleanly: nothing more is built on it.
  let dirty = false;
  const suspects = new Set<string>();
  // Only classes built alone and seen to fail.
  const refused = new Set<string>();
  // Suspects built alone on this compiler (see SUSPECTS).
  let alone = 0;
  // What the last build threw, thrown once the build is taken as one that didn't read cleanly; or what a plugin threw
  // for a class of it that no class of it was found for (see blame).
  let thrown: { error: unknown } | undefined;
  // The classes this compiler built that a plugin's function threw for (their error, thrown where they're read) or gave
  // CSS that couldn't be read for (undefined): built again on a fresh compiler, as its plugin is called again there.
  let failed = new Map<string, unknown>();
  // Strays of the builds of the read under way (see blame), for its scope.
  let strays: ReadScope["strays"] = [];
  // The fresh compiler being compiled (see `ready`), and whether a class waits for it.
  let pending: Promise<void> | undefined;
  let waiting = false;
  // A fresh compiler ready to take over (one compiled with the handle, then each asked for after one takes over).
  let spare = ready;
  // Fresh compilers that failed in a row (see RENEWALS), and the last one's error.
  let failures = 0;
  let failure = "";
  // Builds left in one read to find, by halves, the classes a build threw for (see isolate), and checks so far.
  let halves = 0;
  let checks = 0;
  /**
   * Whether the compiler builds on after a build threw: where Tailwind kept the class it threw for, it throws again on
   * every build with a new class (this one, a custom property of nothing, new each time); where it didn't (a class it
   * couldn't parse), it builds on.
   */
  const sound = () => {
    halves--;
    try {
      return parseSheet(compiler.build([`[--unlayer-check-${checks++}:0]`])).clean;
    } catch {
      return false;
    }
  };
  /**
   * The classes of a build that threw on a compiler that builds on (see sound), by halves: each half built again, one
   * that throws halved again, a class alone that throws refused for good. Past HALVES builds in one read, the classes
   * left are suspects (see need) and what threw is thrown, as where the compiler doesn't build on.
   */
  const isolate = (tokens: string[], error: unknown): boolean => {
    if (tokens.length === 1) return !!refused.add(tokens[0]);
    if (halves <= 0) {
      thrown = { error };
      return false;
    }
    const half = tokens.length >> 1;
    for (const part of [tokens.slice(0, half), tokens.slice(half)]) {
      if (dirty || thrown) break;
      halves--;
      if (!build(part)) part.forEach((token) => !seen.has(token) && !refused.has(token) && suspects.add(token));
    }
    return !dirty && !thrown;
  };
  // Whether this compiler is past what one takes (CLASSES, COMPILED), and twice that (see FULL).
  const due = () => seen.size > limit || built > COMPILED;
  const full = () => seen.size > CEILING * limit || built > CEILING * COMPILED;
  /** A fresh compiler takes over: nothing built on it, the classes refused stay refused. */
  const swap = (next: Compiler) => {
    compiler = next;
    seen = new Set();
    built = 0;
    failed = new Map();
    sheet = empty();
    byToken = new Map();
    dirty = waiting = false;
    alone = 0;
  };
  /**
   * A fresh compiler asked for, once at a time (one that fails leaves this one in use): where this one is to be taken
   * over by then (it didn't read cleanly, or classes wait, or it's past what it takes), it takes over, and another is
   * asked for; else it's the spare.
   */
  const ask = () => {
    if (!renew || renewing || failures >= RENEWALS) return;
    renewing = true;
    pending = renew().then(
      (next) => {
        renewing = false;
        failures = 0;
        if (dirty || waiting || due()) {
          swap(next);
          ask();
        } else spare = next;
      },
      (error) => {
        renewing = false;
        failures++;
        failure = error instanceof Error ? error.message : String(error);
      }
    );
  };
  const fresh = () => void (spare || ask());
  const build = (tokens: string[]): boolean => {
    let css: string;
    let plugins: PluginFailure[] | undefined;
    try {
      css = compiler.build(tokens);
    } catch (error) {
      // Where Tailwind didn't keep what it threw for, the class that threw is found (see isolate); where it did, it
      // builds those classes again with the next new one, throwing again.
      if (halves > 0 && sound()) return isolate(tokens, error);
      thrown = { error };
      return !(dirty = true);
    } finally {
      plugins = compiler.failures?.splice(0);
    }
    const next = parseSheet(css);
    if (!next.clean) return !(dirty = true);
    // The stylesheet holds every class built so far, in Tailwind's order: read again, places stay comparable.
    sheet = next;
    for (const token of tokens) {
      seen.add(token);
      built += token.length;
    }
    byToken = new Map();
    for (const rule of sheet.rules) {
      const rules = byToken.get(rule.token);
      if (rules) rules.push(rule);
      else byToken.set(rule.token, [rule]);
    }
    if (plugins?.length) blame(tokens, plugins);
    if (due()) fresh();
    return true;
  };
  // What plugins' functions threw while a build built `tokens` (kept from Tailwind, which built the class's CSS without
  // what the function gave: see guard.ts), on the classes of it it was for, each thrown where it's read, in every render
  // that reads it (whatever another utility gives the class): those of the utility or variant of that name, value and
  // modifier. One no class of the build was found for so is a stray (see ReadScope), for the render that built them, on
  // the build's classes of that name, else those with no CSS, else all its classes: not kept, as the build may hold
  // others' classes (an app's own `brand-blue`, where a user's `brand-(--x)` is the one).
  const blame = (tokens: string[], plugins: PluginFailure[]) => {
    for (const failure of plugins) {
      const own = tokens.filter((token) => owns(token, failure));
      if (own.length) for (const token of own) failed.set(token, failure.error);
      else {
        const loose = tokens.filter((token) => owns(token, failure, true));
        const plain = tokens.filter((token) => !byToken.has(token));
        strays.push({ tokens: new Set(loose.length ? loose : plain.length ? plain : tokens), error: failure.error });
      }
    }
  };
  const tokensOf = (className: string) => [...new Set(String(className).split(/\s+/).filter(Boolean))];
  // The classes not built yet, built: a suspect alone (past SUSPECTS on this compiler, on the next one), where a class
  // string is read (not prepared: what building it throws comes out where it's read), the rest at once. What a build
  // threw is thrown after.
  const need = (tokens: string[], prepare?: boolean) => {
    const unbuilt = () => tokens.filter((token) => !seen.has(token) && !refused.has(token) && readable(token) && !beyond(token));
    let unread = unbuilt();
    if (!unread.length) return;
    // The spare takes over where this compiler is to be taken over, synchronously, and another is asked for: only where
    // classes are built (a render's components read what it prepared on the compiler it prepared them on).
    if (spare && (dirty || waiting || due())) {
      swap(spare);
      spare = undefined;
      ask();
      unread = unbuilt();
    }
    // Past CEILING times what a compiler takes, with no fresh one ready, nothing more is built (see FULL), unless none
    // can come (fresh ones failed: see RENEWALS).
    if (!dirty && full() && renew && failures < RENEWALS) {
      waiting = true;
      ask();
      return;
    }
    halves = HALVES;
    let later = false;
    for (const token of unread) {
      if (prepare || dirty || !suspects.has(token)) continue;
      if (alone >= SUSPECTS) later = true;
      else if ((suspects.delete(token), alone++, !build([token]))) refused.add(token);
    }
    const rest = unread.filter((token) => !seen.has(token) && !refused.has(token) && !suspects.has(token));
    if (rest.length && !dirty && !build(rest)) rest.forEach((token) => suspects.add(token));
    if (later) waiting = true;
    if (dirty || later) fresh();
    if (thrown) {
      const { error } = thrown;
      thrown = undefined;
      throw error;
    }
  };
  // The classes a class's plugin applies (`@apply`, see APPLY), read as its own declarations, for `when`.
  const applying = new Set<string>();
  const apply = (token: string, classes: string, when: ClassCondition, important: boolean, leave: (className: string, reason: string) => void, scope: ReadScope): ClassDeclaration[] => {
    const names = classes.split(/\s+/).filter(Boolean);
    const own = names.filter((name) => name !== "!important");
    if (applying.has(token)) throw new Error(`<Tailwind> can't read \`${token}\`: it applies itself (\`@apply\`), a circular dependency`);
    if (applying.size >= APPLIES || own.length > SUSPECTS) throw new Error(`<Tailwind> can't read \`${token}\`: it applies (\`@apply\`) classes more than ${APPLIES} deep, or more than ${SUSPECTS} at once`);
    applying.add(token);
    let found: ClassDeclarations;
    try {
      found = read(own.join(" "), scope);
    } finally {
      applying.delete(token);
    }
    for (const { className, reason } of found.ignored) {
      if (reason === UNKNOWN) throw new Error(`<Tailwind> can't read \`${token}\`: it applies (\`@apply\`) \`${className}\`, a class Tailwind doesn't have`);
      leave(token, reason === WAITING || reason.startsWith(STUCK) ? reason : `its \`@apply\` of \`${className}\` isn't read: ${reason}`);
    }
    const declarations: ClassDeclaration[] = [];
    for (const d of found.declarations) {
      const at = when === "always" ? d.when : d.when === "always" || d.when === when ? when : undefined;
      if (at) declarations.push({ ...d, className: token, when: at, important: d.important || important || names.includes("!important") });
      else leave(token, `its \`@apply\` of \`${d.className}\` applies for ${d.when} within ${when}, which Elements has no setting for`);
    }
    return declarations;
  };
  const read = (className: string, scope: ReadScope = { strays: [] }): ClassDeclarations => {
    const tokens = tokensOf(className);
    try {
      need(tokens);
    } finally {
      scope.strays.push(...strays.splice(0));
    }
    const ignored: ClassDeclarations["ignored"] = [];
    // (Each class once, with the first reason it isn't read.)
    const left = new Set<string>();
    const leave = (className: string, reason: string) => void (!left.has(className) && left.add(className) && ignored.push({ className, reason }));
    const applied: Array<{ rule: Rule; when: ClassCondition }> = [];
    for (const token of tokens) {
      // One a plugin's function failed for: its error, or a class Tailwind can't read here; in this render, one of a
      // build a stray failure was in.
      const stray = scope.strays.find((stray) => stray.tokens.has(token));
      if (failed.has(token) || stray) {
        const error = stray ? stray.error : failed.get(token);
        if (error !== undefined) throw error;
        leave(token, UNREADABLE);
        continue;
      }
      // One not built on this compiler: refused, or waiting for a fresh one (see declarationReader).
      if (!seen.has(token)) {
        leave(token, beyond(token) ?? (refused.has(token) || !readable(token) || !renew ? UNREADABLE : failures >= RENEWALS ? `${STUCK} after a class it couldn't read (${failure})` : !dirty && full() ? FULL : WAITING));
        continue;
      }
      const rules = byToken.get(token);
      if (!rules?.length) leave(token, UNKNOWN);
      for (const rule of rules ?? []) {
        const when = conditionOf(rule);
        if (typeof when === "string") applied.push({ rule, when });
        else leave(token, when.reason);
      }
    }
    applied.sort((a, b) => a.rule.order - b.rule.order);
    // The element's own variables (`--tw-leading`), by condition: a phone rule's apply on phones only.
    const own: Record<ClassCondition, Map<string, string>> = { always: new Map(), phone: new Map(), desktop: new Map(), hover: new Map() };
    for (const { rule, when } of applied) for (const d of rule.declarations) if (d.property.startsWith("--")) own[when].set(d.property, d.value);
    const declarations: ClassDeclaration[] = [];
    for (const { rule, when } of applied) {
      for (const d of rule.declarations) {
        if (d.property.startsWith(APPLY)) declarations.push(...apply(rule.token, decodeURIComponent(d.value), when, d.important, leave, scope));
        if (d.property.startsWith("--")) continue;
        const value = emailValue(d.value, (name) => own[when].get(name) ?? own.always.get(name) ?? sheet.vars.get(name) ?? sheet.initial.get(name));
        if (value === undefined || value === TOO_LONG) leave(rule.token, value === TOO_LONG ? `\`${d.property}\`'s variables come to more than ${MAX_VALUE} characters` : `\`${d.property}\` uses a variable Tailwind doesn't set`);
        else declarations.push({ className: rule.token, property: d.property, value, when, important: d.important });
      }
    }
    // `!important` wins over the rest, wherever it is.
    return { declarations: [...declarations.filter((d) => !d.important), ...declarations.filter((d) => d.important)], ignored };
  };
  const prepare = (className: string, scope: ReadScope = { strays: [] }) => {
    try {
      need(tokensOf(className), true);
    } finally {
      scope.strays.push(...strays.splice(0));
    }
  };
  // (The async renderers wait for a fresh compiler where this one is past what it takes too, so they never grow it.)
  return Object.assign(read, { prepare, ready: () => ((dirty || waiting || due()) && renewing ? pending : undefined) });
}
