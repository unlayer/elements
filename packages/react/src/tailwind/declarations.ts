/**
 * A class string as the declarations Tailwind gives it, read for an email: when each applies (everywhere, on
 * phones, above a breakpoint, on hover) and its value in the forms email clients read (see values.ts). What can't
 * apply in an email (an unknown class, `dark:`, `focus:`, a rule for other elements) is listed with why.
 */
import { parseSheet, type Rule, type Sheet } from "./css";
import { emailValue } from "./values";

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

/** Tailwind's compiler, as `loadTailwind` gives it: `build` takes classes and gives the stylesheet for all so far. */
export interface Compiler {
  build(candidates: string[]): string;
}

/**
 * The classes a compiler builds before a fresh one takes over. Tailwind's keeps every class it has built, and each new
 * one builds and reads again the stylesheet of them all: about 1 ms per 300 classes (7 ms at 2,000), and memory that
 * grows with each, as classes made from data (`w-[123px]`) keep coming. An app's own classes, hundreds to a couple of
 * thousand, don't get there.
 */
export const CLASSES = 2000;

const empty = (): Sheet => ({ rules: [], vars: new Map(), initial: new Map(), clean: true });

/** Why a class isn't read: Tailwind's stylesheet of it couldn't be read as written (see `readable`). */
const UNREADABLE = "it isn't a class Tailwind can read here";

/** Why a class isn't read yet: built with one that didn't read cleanly, or after it, so Tailwind is compiling again. */
const WAITING = "it's read once Tailwind has compiled again, after a class it couldn't read";

/**
 * Fresh compilers that can fail in a row. One compiles the config this one was compiled from, so one that fails (out of
 * memory, a plugin that throws now) is asked for again, by the next read that needs one: no timer, so nothing is
 * compiled while no class needs it and nothing keeps the process running. Past three in a row, it's taken to fail for
 * good: the reader keeps its compiler, and after a build that didn't read cleanly reads no new class (and says so).
 */
const RENEWALS = 3;

/**
 * Whether Tailwind can build a class without changing how what it builds after it reads: its brackets, parentheses,
 * braces and quotes closed (`\` escaping the character after it, as in CSS), no comment in it. Tailwind's compiler
 * keeps every class it builds, so one that isn't (`[color:x(]`) is never built.
 */
function readable(token: string): boolean {
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
 * build's classes is built alone first: the one that was why is never built again.
 *
 * So after such a build, which `readable` refuses every known cause of, new classes aren't read till the fresh compiler
 * is ready (`WAITING`, said): a render that meets one before reads it as left out, and a later one reads it. That can't
 * be made synchronous: Tailwind compiles only asynchronously, and nothing more can be built on a compiler whose
 * stylesheet doesn't read cleanly (it keeps every class built). Reading on past the rule that broke it, from Tailwind's
 * rule boundaries, would trust how Tailwind prints CSS where the reader reads it as CSS does (what keeps one class from
 * changing how the next reads), and a spare compiler kept ready would double each handle's compiling and memory for a
 * case no known class reaches.
 */
export function declarationReader(compiler: Compiler, renew?: () => Promise<Compiler>, limit = CLASSES): (className: string) => ClassDeclarations {
  let seen = new Set<string>();
  let sheet = empty();
  let byToken = new Map<string, Rule[]>();
  let renewing = false;
  // Whether the compiler built a stylesheet that didn't read cleanly: nothing more is built on it.
  let dirty = false;
  const suspects = new Set<string>();
  const refused = new Set<string>();
  // Fresh compilers that failed in a row (see RENEWALS), and the last one's error.
  let failures = 0;
  let failure = "";
  // Once at a time (one that fails leaves this one in use).
  const fresh = () => {
    if (!renew || renewing || failures >= RENEWALS) return;
    renewing = true;
    renew().then(
      (next) => {
        compiler = next;
        seen = new Set();
        sheet = empty();
        byToken = new Map();
        renewing = dirty = false;
        failures = 0;
      },
      (error) => {
        renewing = false;
        failures++;
        failure = error instanceof Error ? error.message : String(error);
      }
    );
  };
  const build = (tokens: string[]): boolean => {
    const next = parseSheet(compiler.build(tokens));
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
    if (seen.size > limit) fresh();
    return true;
  };
  return (className) => {
    const tokens = [...new Set(String(className).split(/\s+/).filter(Boolean))];
    const unread = tokens.filter((token) => !seen.has(token) && !refused.has(token) && readable(token));
    if (unread.length) {
      for (const token of unread) if (!dirty && suspects.delete(token) && !build([token])) refused.add(token);
      const rest = unread.filter((token) => !seen.has(token) && !refused.has(token) && !suspects.has(token));
      if (rest.length && !dirty && !build(rest)) rest.forEach((token) => suspects.add(token));
      if (dirty) fresh();
    }
    const ignored: ClassDeclarations["ignored"] = [];
    const applied: Array<{ rule: Rule; when: ClassCondition }> = [];
    for (const token of tokens) {
      // One not built on this compiler: refused, or waiting for a fresh one (see declarationReader).
      if (!seen.has(token)) {
        const reason = refused.has(token) || !readable(token) || !renew ? UNREADABLE : failures < RENEWALS ? WAITING : `Tailwind couldn't compile again after a class it couldn't read (${failure})`;
        ignored.push({ className: token, reason });
        continue;
      }
      const rules = byToken.get(token);
      if (!rules?.length) ignored.push({ className: token, reason: "Tailwind has no such class" });
      for (const rule of rules ?? []) {
        const when = conditionOf(rule);
        if (typeof when === "string") applied.push({ rule, when });
        else if (!ignored.some((i) => i.className === token)) ignored.push({ className: token, ...when });
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
        if (value === undefined) {
          if (!ignored.some((i) => i.className === rule.token)) ignored.push({ className: rule.token, reason: `\`${d.property}\` uses a variable Tailwind doesn't set` });
        }
        else declarations.push({ className: rule.token, property: d.property, value, when, important: d.important });
      }
    }
    // `!important` wins over the rest, wherever it is.
    return { declarations: [...declarations.filter((d) => !d.important), ...declarations.filter((d) => d.important)], ignored };
  };
}
