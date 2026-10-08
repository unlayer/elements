/**
 * Template components (`<Welcome />`, `memo`, `forwardRef`) unwrapped down to
 * their root element. `renderToJson` walks the element tree and `renderToHtml`
 * reads the root's settings (fonts, language, direction, phone styles) from it,
 * so a wrapper is called first to reach <Email>/<Page>/<Document>/<Body>.
 */

import React from "react";
import { UNLAYER_RENDER_KEY } from "./create-component";

/** The root components a design starts from. */
export const ROOT_NAMES = new Set(["Body", "Email", "Page", "Document"]);
const CONTAINER_NAMES = new Set([...ROOT_NAMES, "Row", "Column"]);
const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");

/** Get the displayName of a React element's component type. */
export function getDisplayName(element: React.ReactElement): string | undefined {
  const type = element.type as any;
  return type?.displayName || type?.name;
}

/** Whether the element is an Elements component (a root, a container or a content block). */
function isElementsComponent(element: React.ReactElement): boolean {
  const type = element.type as any;
  return !!type?.[UNLAYER_RENDER_KEY] || CONTAINER_NAMES.has(type?.displayName);
}

/**
 * Call wrapper components (plain functions, `memo`, `forwardRef`, nested in any
 * order) until a root element comes out. Returns the element it stops at, which
 * isn't a root when a wrapper can't be called (a class) or doesn't return an
 * element (async, null, an array). Throws what a wrapper throws: React hooks
 * can't run outside a React render.
 */
export function unwrapRoot(element: React.ReactElement): React.ReactElement {
  let current = element;
  for (let depth = 0; depth < 20; depth++) {
    if (ROOT_NAMES.has(getDisplayName(current) ?? "")) break;
    const type = current.type as any;
    const props = current.props as Record<string, unknown>;
    if (type?.$$typeof === MEMO) {
      current = React.createElement(type.type, props);
      continue;
    }
    let produced: unknown;
    if (type?.$$typeof === FORWARD_REF) produced = type.render({ ...props }, null);
    else if (typeof type === "function" && !type.prototype?.isReactComponent) produced = type({ ...props });
    else break;
    if (!React.isValidElement(produced)) break;
    current = produced;
  }
  return current;
}

/** The advice both render functions give when a wrapper can't be unwrapped. */
export const UNWRAP_ADVICE = "Pass the root element (<Email>…</Email>), or a wrapper that returns one without React hooks.";

/**
 * For renderToHtml: the root a template component unwraps to. An element that
 * is already an Elements component (or plain HTML) is returned as it is. When
 * a wrapper can't be unwrapped it's rendered through React as before, with a
 * warning: its root's settings aren't read.
 */
export function htmlRoot(element: React.ReactElement, api: string): React.ReactElement {
  if (typeof element.type === "string" || isElementsComponent(element)) return element;
  let reason = "it doesn't return a root element";
  try {
    const root = unwrapRoot(element);
    if (ROOT_NAMES.has(getDisplayName(root) ?? "")) return root;
  } catch (cause) {
    reason = cause instanceof Error ? cause.message : String(cause);
  }
  console.warn(`[Unlayer] ${api}: couldn't unwrap <${getDisplayName(element) || "wrapper"}> (${reason}): its root's fonts, lang, dir and phone styles are ignored. ${UNWRAP_ADVICE}`);
  return element;
}
