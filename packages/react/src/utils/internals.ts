/**
 * What the other entries ("@unlayer/react-elements/async", "/tailwind", "/head") use of the main one's internals,
 * on `renderToHtml` (no export of its own): a render's scope, a template collected waiting for what's async in it,
 * and the engine's static markup.
 */
import type React from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { collectedFrom, collecting, type Collected } from "./normalize";
import { isElementsType, providedConfig, ROOT_NAMES, unwrapRootAsync } from "./unwrap-root";
import { newScope, setOnError, withScope, type Scope } from "./render-scope";
import { rootConfig, type RootConfigProps } from "../context/layer-config";
import { collectAsync as walkAsync, renderStatic } from "../engine";

export const INTERNALS = Symbol.for("@unlayer/react-elements/internals");

/** The root a template unwraps to, its async wrappers awaited; the element itself where none comes out (said after). */
async function unwrapAsync(element: React.ReactElement): Promise<React.ReactElement> {
  if (typeof element.type === "string" || isElementsType(element.type)) return element;
  const root = await unwrapRootAsync(element);
  return ROOT_NAMES.has((root.type as { displayName?: string })?.displayName ?? "") ? root : element;
}

/**
 * A root's content collected in `scope`, waiting for its async components, `use()` and Suspense (siblings at once),
 * for the synchronous render after: what it does with parts that fail is `options`' over the root's config.
 */
async function collectAsync(root: React.ReactElement, scope: Scope, options?: Partial<UnlayerConfig>): Promise<Collected> {
  const props = root.props as RootConfigProps & { children?: React.ReactNode };
  const name = (root.type as { displayName?: string }).displayName ?? "Body";
  const { node, options: walk } = withScope(scope, () => {
    setOnError(rootConfig(props, providedConfig(root), options).onError);
    return collecting(props.children, name);
  });
  const flat = await walkAsync(node, walk);
  const done = withScope(scope, () => collectedFrom(flat, walk.nonce));
  scope.cache.set(props.children as object, done);
  return done;
}

export const internals = { newScope, withScope, unwrapAsync, collectAsync, render: renderStatic };
