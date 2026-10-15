/**
 * What the other entries ("@unlayer/react-elements/tailwind", "/async", "/head") use of the main one's internals,
 * on `renderToHtml` (no export of its own): the collecting render's parts, its scope, and the render it renders with.
 */
import type React from "react";
import { collecting } from "./collect";
import { guard, recordContainer, whileCollecting } from "./record";
import { parse } from "./normalize";
import { htmlRoot, unwrapRoot } from "./unwrap-root";
import { withRenderScope, withScope } from "./render-scope";
import { renderToStaticMarkup } from "./server-renderer";

export const INTERNALS = Symbol.for("@unlayer/react-elements/internals");

/** The root `api` unwraps a template to, in `scope` (the render after reuses it); the element itself where it can't. */
function unwrap(element: React.ReactElement, api: string, scope: WeakMap<object, unknown>): React.ReactElement {
  try {
    return withScope(scope, () => withRenderScope(() => (api === "renderToJson" ? unwrapRoot(element) : htmlRoot(element, api))));
  } catch {
    // The render after says what's wrong.
    return element;
  }
}

export const internals = { collecting, whileCollecting, recordContainer, guard, parse, withScope, unwrap, render: renderToStaticMarkup };
