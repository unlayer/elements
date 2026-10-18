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

const empty = (): Sheet => ({ rules: [], vars: new Map(), initial: new Map() });

/**
 * Reads classes with a compiler: each class built once, its rules read back from the latest stylesheet. Past `limit`
 * classes, a fresh compiler from `renew` (Tailwind compiles asynchronously) takes over once it's ready, with none
 * built: a class string reads the same whatever its compiler built before.
 */
export function declarationReader(compiler: Compiler, renew?: () => Promise<Compiler>, limit = CLASSES): (className: string) => ClassDeclarations {
  let seen = new Set<string>();
  let sheet = empty();
  let byToken = new Map<string, Rule[]>();
  let renewing = false;
  return (className) => {
    const tokens = [...new Set(String(className).split(/\s+/).filter(Boolean))];
    const fresh = tokens.filter((token) => !seen.has(token));
    if (fresh.length) {
      // The stylesheet holds every class built so far, in Tailwind's order: read again, places stay comparable.
      sheet = parseSheet(compiler.build(fresh));
      fresh.forEach((token) => seen.add(token));
      byToken = new Map();
      for (const rule of sheet.rules) {
        const rules = byToken.get(rule.token);
        if (rules) rules.push(rule);
        else byToken.set(rule.token, [rule]);
      }
      // Once (one that fails leaves this one in use).
      if (renew && !renewing && seen.size > limit) {
        renewing = true;
        renew().then((next) => {
          compiler = next;
          seen = new Set();
          sheet = empty();
          byToken = new Map();
          renewing = false;
        }, () => {});
      }
    }
    const ignored: ClassDeclarations["ignored"] = [];
    const applied: Array<{ rule: Rule; when: ClassCondition }> = [];
    for (const token of tokens) {
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
