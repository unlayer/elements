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

/** Whether a media query is for small screens (an upper width bound), large ones (a lower bound), or neither. */
function widthOf(query: string): "phone" | "desktop" | undefined {
  const q = query.replace(/\s+/g, "").replace(/^(only)?screen(and)?/i, "");
  if (!/^(\([^()]*width[^()]*\)(and)?)+$/i.test(q) || /height|orientation|aspect|resolution/i.test(q)) return undefined;
  const upper = /max-(?:device-)?width|width<=?|[\d.]+(?:px|em|rem)>=?width/i.test(q);
  const lower = /min-(?:device-)?width|width>=?|[\d.]+(?:px|em|rem)<=?width/i.test(q);
  return upper === lower ? undefined : upper ? "phone" : "desktop";
}

/** When a rule applies, or why it can't in an email. */
function conditionOf(rule: Rule): ClassCondition | { reason: string } {
  let when: ClassCondition = "always";
  let hoverable = false;
  for (const at of rule.at) {
    const query = /^@media\s+(.*)$/i.exec(at)?.[1];
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
 * variant's (`variant`), by its name, with the keys of its values that give the value it was given (where one does).
 */
export interface PluginFailure {
  name: string;
  variant?: boolean;
  keys?: string[];
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

/** Whether a variant or utility of a class (`boom-now`, `boom-[x]`, `boom`) is the one a failure was for. */
function named(part: string, { name, keys }: PluginFailure): boolean {
  if (part === name) return !keys || keys.includes("DEFAULT");
  if (!part.startsWith(name + "-")) return false;
  const value = part.slice(name.length + 1);
  return !keys || value.startsWith("[") || keys.includes(value) || keys.includes(value.replace(/\/[^/]*$/, ""));
}

/** Whether a class is one a plugin's failure was for: by its utility, or a variant's by its variants. */
const owns = (token: string, failure: PluginFailure) => {
  const [variants, utility] = partsOf(token);
  return failure.variant ? variants.some((v) => named(v, failure)) : named(utility, failure);
};

/**
 * A class string's declarations, read with a compiler; `prepare` builds the classes of one it hasn't built, at once,
 * without reading them (a render's, before they're read one component at a time: see declarationReader).
 */
export interface DeclarationReader {
  (className: string): ClassDeclarations;
  prepare(className: string): void;
  /** Where a class can't be read till a fresh compiler is ready (see declarationReader): when it is. */
  ready?(): Promise<void> | undefined;
}

/**
 * The classes a compiler builds before a fresh one takes over. Tailwind's keeps every class it has built, and each new
 * one builds and reads again the stylesheet of them all: about 1 ms per 300 classes (7 ms at 2,000), and memory that
 * grows with each, as classes made from data (`w-[123px]`) keep coming. An app's own classes, hundreds to a couple of
 * thousand, don't get there.
 */
export const CLASSES = 2000;

/** Why a class isn't read: a render (or a class string) reads its first CLASSES different classes only (see capped). */
export const OVER = `it's past the first ${CLASSES} different classes of the render (or class string), all one reads`;

/**
 * A reader of one render's classes (or one class string's): the first CLASSES different classes it's given are read,
 * by `read`; the others aren't built or read, but listed with OVER (`first`: the first a read left out, since it was
 * last cleared). Classes made from data (a Markdown's, thousands in one attribute) can't take more memory than that,
 * as each class Tailwind builds takes memory while it builds them; an app's own, hundreds, don't get there.
 */
export function capped(read: DeclarationReader): DeclarationReader & { first?: string; said?: boolean } {
  const names = new Set<string>();
  const admit = (className: string) => {
    const kept: string[] = [];
    const left: string[] = [];
    for (const token of String(className).split(/\s+/)) if (token) (names.has(token) || (names.size < CLASSES && names.add(token)) ? kept : left).push(token);
    return [kept, left];
  };
  const reader = Object.assign(
    (className: string): ClassDeclarations => {
      const [kept, left] = admit(className);
      const found = read(kept.join(" "));
      if (!left.length) return found;
      reader.first ??= left[0];
      return { ...found, ignored: [...found.ignored, ...[...new Set(left)].map((className) => ({ className, reason: OVER }))] };
    },
    { prepare: (className: string) => read.prepare(admit(className)[0].join(" ")) } as { prepare(className: string): void; first?: string; said?: boolean }
  );
  return reader;
}

const empty = (): Sheet => ({ rules: [], vars: new Map(), initial: new Map(), clean: true });

/** Why a class isn't read: Tailwind's stylesheet of it couldn't be read as written (see `readable`). */
const UNREADABLE = "it isn't a class Tailwind can read here";

/** Why a class isn't read yet: built with one that didn't read cleanly, or after it, so Tailwind is compiling again. */
export const WAITING = "it's read once Tailwind has compiled again, after a class it couldn't read";

/** How the reason a class isn't read starts where Tailwind can't compile again (see RENEWALS). */
export const STUCK = "Tailwind couldn't compile again";

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
 * Whether Tailwind can build a class without changing how what it builds after it reads: its brackets, parentheses,
 * braces and quotes closed (`\` escaping the character after it, as in CSS), no comment in it. Tailwind's compiler
 * keeps every class it builds, so one that isn't (`[color:x(]`) is never built.
 */
export function readable(token: string): boolean {
  if (/\/\*|\*\//.test(token)) return false;
  const open: string[] = [];
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    const last = open[open.length - 1];
    if (c === "\\") i++;
    else if (last === '"' || last === "'") c === last && open.pop();
    else if (c === '"' || c === "'") open.push(c);
    else if (c === "(" || c === "[" || c === "{") open.push({ "(": ")", "[": "]", "{": "}" }[c]);
    else if ((c === ")" || c === "]" || c === "}") && open.pop() !== c) return false;
  }
  return !open.length;
}

/**
 * Reads classes with a compiler: each class built once, its rules read back from the latest stylesheet. Past `limit`
 * classes, a fresh compiler from `renew` (Tailwind compiles asynchronously) takes over once it's ready, with none
 * built: a class string reads the same whatever its compiler built before. A class that could change how the
 * stylesheet reads isn't built (`readable`); a build whose stylesheet still doesn't read cleanly is left out (its
 * classes said, the classes before it read as they did), and a fresh compiler takes over, on which each of that
 * build's classes is built alone first (SUSPECTS of them on one compiler: the others wait for the next), where a
 * class string holding it is read: the one that was why is never built again, and only it. What a plugin's function
 * for a class throws, or gives that can't be read, is kept from the build (see guard.ts) and blamed on its class,
 * thrown where that's read (or the class left out): the compiler stays clean, for this render's other classes and other
 * renders'. A build that throws all the same (not a plugin's function) is one that didn't read cleanly: Tailwind keeps
 * its classes, and throws again on the next build with a new one. While a fresh compiler is compiled, `ready` gives
 * when it's ready, for the async renderers to wait for; a synchronous render can't, and fails where it needs a class
 * built (see load.ts).
 *
 * Each build is Tailwind's whole stylesheet again (it keeps every class it built), so classes are best built many at
 * once: `prepare` builds a render's, all the classes its components and their markup are given, before they're read
 * one component at a time (which would take the square of their number: seconds for a few thousand).
 *
 * So after such a build, which `readable` refuses every known cause of, new classes aren't read till the fresh compiler
 * is ready (`WAITING`, said): a render that meets one before reads it as left out, and a later one reads it. That can't
 * be made synchronous: Tailwind compiles only asynchronously, and nothing more can be built on a compiler whose
 * stylesheet doesn't read cleanly (it keeps every class built). Reading on past the rule that broke it, from Tailwind's
 * rule boundaries, would trust how Tailwind prints CSS where the reader reads it as CSS does (what keeps one class from
 * changing how the next reads), and a spare compiler kept ready would double each handle's compiling and memory for a
 * case no known class reaches.
 */
export function declarationReader(compiler: Compiler, renew?: () => Promise<Compiler>, limit = CLASSES): DeclarationReader {
  let seen = new Set<string>();
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
  // The fresh compiler being compiled (see `ready`), and whether a class waits for it.
  let pending: Promise<void> | undefined;
  let waiting = false;
  // Fresh compilers that failed in a row (see RENEWALS), and the last one's error.
  let failures = 0;
  let failure = "";
  // Once at a time (one that fails leaves this one in use).
  const fresh = () => {
    if (!renew || renewing || failures >= RENEWALS) return;
    renewing = true;
    pending = renew().then(
      (next) => {
        compiler = next;
        seen = new Set();
        failed = new Map();
        sheet = empty();
        byToken = new Map();
        renewing = dirty = waiting = false;
        failures = alone = 0;
      },
      (error) => {
        renewing = false;
        failures++;
        failure = error instanceof Error ? error.message : String(error);
      }
    );
  };
  const build = (tokens: string[]): boolean => {
    let css: string;
    let plugins: PluginFailure[] | undefined;
    try {
      css = compiler.build(tokens);
    } catch (error) {
      // (Tailwind keeps the classes it was given, and builds them again with the next new one, throwing again.)
      thrown = { error };
      return !(dirty = true);
    } finally {
      plugins = compiler.failures?.splice(0);
    }
    const next = parseSheet(css);
    if (!next.clean) return !(dirty = true);
    // The stylesheet holds every class built so far, in Tailwind's order: read again, places stay comparable.
    sheet = next;
    tokens.forEach((token) => seen.add(token));
    byToken = new Map();
    for (const rule of sheet.rules) {
      const rules = byToken.get(rule.token);
      if (rules) rules.push(rule);
      else byToken.set(rule.token, [rule]);
    }
    if (plugins?.length) blame(tokens, plugins);
    if (seen.size > limit) fresh();
    return true;
  };
  // What plugins' functions threw while a build built `tokens` (kept from Tailwind, which built the class as one with no
  // CSS: see load.ts's `guarded`), on the classes of it it was for (with no CSS, a utility or a variant of that name and
  // value), each thrown where it's read; one none was found for is thrown now.
  const blame = (tokens: string[], plugins: PluginFailure[]) => {
    for (const failure of plugins) {
      const own = tokens.filter((token) => !byToken.has(token) && owns(token, failure));
      for (const token of own) failed.set(token, failure.error);
      if (!own.length && failure.error !== undefined) thrown ??= { error: failure.error };
    }
  };
  const tokensOf = (className: string) => [...new Set(String(className).split(/\s+/).filter(Boolean))];
  // The classes not built yet, built: a suspect alone (past SUSPECTS on this compiler, on the next one), where a class
  // string is read (not prepared: what building it throws comes out where it's read), the rest at once. What a build
  // threw is thrown after.
  const need = (tokens: string[], prepare?: boolean) => {
    const unread = tokens.filter((token) => !seen.has(token) && !refused.has(token) && readable(token));
    if (!unread.length) return;
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
  const read = (className: string): ClassDeclarations => {
    const tokens = tokensOf(className);
    need(tokens);
    const ignored: ClassDeclarations["ignored"] = [];
    // (Each class once, with the first reason it isn't read.)
    const left = new Set<string>();
    const leave = (className: string, reason: string) => void (!left.has(className) && left.add(className) && ignored.push({ className, reason }));
    const applied: Array<{ rule: Rule; when: ClassCondition }> = [];
    for (const token of tokens) {
      // One a plugin's function failed for: its error, or a class Tailwind can't read here.
      if (failed.has(token)) {
        const error = failed.get(token);
        if (error !== undefined) throw error;
        leave(token, UNREADABLE);
        continue;
      }
      // One not built on this compiler: refused, or waiting for a fresh one (see declarationReader).
      if (!seen.has(token)) {
        leave(token, refused.has(token) || !readable(token) || !renew ? UNREADABLE : failures < RENEWALS ? WAITING : `${STUCK} after a class it couldn't read (${failure})`);
        continue;
      }
      const rules = byToken.get(token);
      if (!rules?.length) leave(token, "Tailwind has no such class");
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
        if (d.property.startsWith("--")) continue;
        const value = emailValue(d.value, (name) => own[when].get(name) ?? own.always.get(name) ?? sheet.vars.get(name) ?? sheet.initial.get(name));
        if (value === undefined || value === TOO_LONG) leave(rule.token, value === TOO_LONG ? `\`${d.property}\`'s variables come to more than ${MAX_VALUE} characters` : `\`${d.property}\` uses a variable Tailwind doesn't set`);
        else declarations.push({ className: rule.token, property: d.property, value, when, important: d.important });
      }
    }
    // `!important` wins over the rest, wherever it is.
    return { declarations: [...declarations.filter((d) => !d.important), ...declarations.filter((d) => d.important)], ignored };
  };
  return Object.assign(read, { prepare: (className: string) => need(tokensOf(className), true), ready: () => ((dirty || waiting) && renewing ? pending : undefined) });
}
