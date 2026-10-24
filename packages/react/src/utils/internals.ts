/**
 * What the other entries ("@unlayer/react-elements/async", "/tailwind", "/head") use of the main one's internals,
 * on `renderToHtml` (no export of its own): a render's scope, a template collected waiting for what's async in it
 * (the waiting itself is the async entry's: see src/async/collect.ts), the synchronous renders in that scope (the
 * render functions make one of their own), the engine's static markup, and a part of a template that's left out alone
 * when it fails (Markdown's).
 */
import type React from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { collectedFrom, collecting, type Collected } from "../model";
import { isElementsType, providedConfig, sayUnread, unwrapSteps, type Steps, type Unwrapped } from "./unwrap-root";
import { isRoot, rootName, ROOTLESS } from "./root-type";
import { newScope, setRenderConfig, withScope, type Scope } from "./render-scope";
import { rootConfig, type RootConfigProps } from "../context/layer-config";
import { htmlDocument, htmlParts, plainText } from "./render-to-html";
import { designJson } from "./render-to-json";
import { errorPart, flatten, PENDING, renderStatic, track, walkAsync, type CollectOptions, type Flat } from "../engine";
import { boundary } from "../engine/records";

export const INTERNALS = Symbol.for("@unlayer/react-elements/internals");

/**
 * The root a template unwraps to, its steps taken by `take` (awaiting what they wait for), what it found kept in the
 * render's `scope` (see unwrap-root.ts's `Unwrapped`). Where none comes out, what the template rendered: the
 * synchronous render after renders it as it renders a template with no root, without calling the template again; in
 * `api` (a render function that renders one), what it says where a root's settings go unread, as the synchronous one.
 */
async function unwrapAsync(element: React.ReactElement, scope: Scope, take: (steps: Steps) => Promise<Unwrapped>, idPrefix?: string, api?: string): Promise<React.ReactElement> {
  if (typeof element.type === "string" || isElementsType(element.type)) return element;
  const found = (scope.unwrapped = await take(unwrapSteps(element, idPrefix)));
  if (isRoot(found.root.type)) return found.root;
  if (api) withScope(scope, () => sayUnread(found, element, api));
  return found.rendered ?? element;
}

/**
 * A root's content collected in `scope` by `collect` (waiting for its async components, `use()` and Suspense,
 * siblings at once), for the synchronous render after: what it does with parts that fail is `options`' over the
 * root's config. A template with no root (what it rendered: see `unwrapAsync`) is its own content, as the
 * synchronous render collects it (see root-content.ts).
 */
async function collectAsync(root: React.ReactElement, scope: Scope, options: Partial<UnlayerConfig> | undefined, collect: (node: React.ReactNode, walk: CollectOptions) => Promise<Flat>): Promise<Collected> {
  const props = root.props as RootConfigProps & { children?: React.ReactNode };
  const content = isRoot(root.type) ? props.children : root;
  const name = rootName(root.type) ?? ROOTLESS;
  const { node, options: walk } = withScope(scope, () => {
    setRenderConfig(rootConfig(props, providedConfig(root), options));
    return collecting(content, name);
  });
  const flat = await collect(node, walk);
  const done = withScope(scope, () => collectedFrom(flat));
  scope.cache.set(content as object, done);
  return done;
}

/** What the async entry's walk uses of the engine (see src/async/collect.ts). */
const engine = { walk: walkAsync, flatten, PENDING, errorPart, track };
export type Engine = typeof engine;

/** The synchronous renders, run in the scope the async renderers collected the template in. */
const renders = { html: htmlDocument, parts: htmlParts, text: plainText, json: designJson };
export type Renders = typeof renders;

/**
 * `child` as a part of the template that's left out alone when it fails (`onError: "omit"`), as each component in a
 * Column is: what a component renders isn't (it fails with the component), but for this (Markdown's table that's too large).
 */
const part = (child: React.ReactElement): React.ReactElement => boundary({ kind: "boundary", element: child }, child);

export const internals = { newScope, withScope, unwrapAsync, collectAsync, isRoot, render: renderStatic, engine, renders, part };
