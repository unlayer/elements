/**
 * React's development warnings for keys in lists, which its renderer gave and the walker, rendering instead of it,
 * gives too: an element of a list without a `key`, and two with the same one. Development builds only (their elements
 * carry `_store`: React marks the children it validated there), each once per component.
 */
import { createElement } from "react";

const said = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (said.has(key)) return;
  said.add(key);
  console.error(message);
}

type DevElement = { $$typeof?: unknown; key: string | null; _store?: { validated?: unknown } };

/** Whether React is its development build, whose elements carry `_store` (its production build checks no keys). */
const DEVELOPMENT = "_store" in createElement("i");

/** Lists Elements made of the template's (already checked, as the template wrote them), which aren't checked again. */
const made = new WeakSet<object>();
export const checked = <T extends object>(list: T): T => (DEVELOPMENT && made.add(list), list);

/**
 * Checks a list of children (`items.map(…)`) the way React's renderer does, for the component `owner` renders it in.
 * React marks the elements it validated (`_store.validated`: 1, static children and ones it warned for; 2, ones
 * React.Children gave keys to that it still warns for), which the walker reads and marks the same way.
 */
export function checkKeys(list: readonly unknown[], owner: string): void {
  if (!DEVELOPMENT || made.has(list)) return;
  let keys: Set<string> | undefined;
  for (const child of list) {
    const element = child as DevElement | null;
    // Only React's elements in a development build (`_store`).
    if (!element || typeof element !== "object" || !element._store) continue;
    const validated = element._store.validated;
    if ((!validated && element.key == null) || validated === 2) {
      try {
        element._store.validated = 1;
      } catch {
        // A frozen store: said once anyway.
      }
      warnOnce(`missing:${owner}`, `[Unlayer] Each child in a list should have a unique "key" prop (in the list <${owner}> renders). See https://react.dev/link/warning-keys.`);
    } else if (element.key != null) {
      if ((keys ??= new Set()).has(element.key)) warnOnce(`duplicate:${owner}:${element.key}`, `[Unlayer] Two children in a list have the same key, "${element.key}" (in the list <${owner}> renders): keys should be unique.`);
      else keys.add(element.key);
    }
  }
}
