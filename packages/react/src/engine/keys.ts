/**
 * React's development warnings for keys in lists, given for the template's lists, which react-dom renders as Elements
 * prepares them (collector.ts gives each element of a list it makes a key, so react-dom says nothing of its own): an
 * element of a list without a `key`, and two with the same one. Development builds only, each once per component.
 *
 * A list the template wrote out in JSX (`<div><A /><B /></div>`, the children React's development build freezes as it
 * makes the element) needs no keys; one made in code (`items.map(…)`) does. That's told by `Object.isFrozen`, not by
 * React's own marks on its elements, which aren't its public API. React 18 says a list given as an element's children
 * lacks keys itself, as it makes the element (`given`): that list's missing keys aren't said again.
 */
import { createElement } from "react";
import { REACT_18 } from "./react-compat";

/** What's been said, each once: a hundred at most, as a list's keys can come from data (then once that no more are). */
const said = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (said.has(key) || said.size > 100) return;
  said.add(key);
  console.error(said.size > 100 ? "[Unlayer] More warnings about keys in lists aren't said." : message);
}

/** Whether React is its development build: it freezes the children it's given as arguments, as its production build doesn't. */
const DEVELOPMENT = Object.isFrozen((createElement("i", null, "a", "b").props as { children: unknown }).children);

/** Lists Elements made of the template's (already checked, as the template wrote them), which aren't checked again. */
const made = new WeakSet<object>();
export const checked = <T extends object>(list: T): T => (DEVELOPMENT && made.add(list), list);

const isElement = (node: unknown): node is { $$typeof: unknown; key: string | null } =>
  !!node && typeof node === "object" && "$$typeof" in node && "key" in node && "props" in node;

/**
 * Checks a list of children (`items.map(…)`) as React's renderer does, for the component `owner` renders it in;
 * `given`: an element's children (not what a component returned).
 */
export function checkKeys(list: readonly unknown[], owner: string, given = false): void {
  if (!DEVELOPMENT || Object.isFrozen(list) || made.has(list)) return;
  const missing = !(given && REACT_18);
  let keys: Set<string> | undefined;
  for (const child of list) {
    if (!isElement(child)) continue;
    if (child.key == null) {
      if (missing) warnOnce(`missing:${owner}`, `[Unlayer] Each child in a list should have a unique "key" prop (in the list <${owner}> renders). See https://react.dev/link/warning-keys.`);
    } else if ((keys ??= new Set()).has(child.key)) warnOnce(`duplicate:${owner}:${child.key}`, `[Unlayer] Two children in a list have the same key, "${child.key}" (in the list <${owner}> renders): keys should be unique.`);
    else keys.add(child.key);
  }
}
