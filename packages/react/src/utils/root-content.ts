/**
 * A root's content as HTML, as Body puts it in the body: collected once (src/model), markup among the rows as it is,
 * and each Row and block rendered by Elements with the root's config and body values. A template with no root (Rows,
 * a block, markup: see unwrap-root.ts's `Unwrapped`) is that content alone, with no body around it, so its rows
 * are numbered and rendered as the head and the plain text read them, from the same render.
 */
import React from "react";
import type { RenderMode, UnlayerConfig } from "@unlayer-internal/shared-elements";
import { mergeValues } from "@unlayer-internal/shared-elements";
import { renderOwn } from "../engine";
import { childrenHtml, rootDefaults } from "../model";
import { BODY_DEFAULTS } from "./container-defaults";
import { cssUrl, isOwn } from "./create-component";
import { mapSemanticProps } from "./semantic-props";
import { setRenderConfig, withRenderScope } from "./render-scope";
import { isTailwindError } from "./tailwind";
import { ROOTLESS } from "./root-type";

/** How Elements' own markup renders (see the engine's renderStatic). */
export const OWN_MARKUP = { bare: isOwn, passes: isTailwindError };

const Rootless = () => null;
Rootless.displayName = ROOTLESS;

/** The root a template with no root is read as (its head, its plain text): its content as the root's, in `mode`. */
export const rootlessRoot = (content: React.ReactElement, mode: RenderMode): React.ReactElement => React.createElement(Rootless, { mode }, content);

/**
 * The content of a root (`props`, Body's, in `mode`, named `name`) as HTML: its rows and blocks rendered with
 * `_config` (its ids counted on it) and the body's values, which the content's own defaults (a <Font default>'s
 * family) go in, with each of `also`. A Row or block that fails and is left out (`onError: "omit"`) gives back the
 * ids it took, so the HTML numbers as the head and design do.
 */
export function contentHtml(props: Record<string, any> & { children?: React.ReactNode }, config: UnlayerConfig, _config: UnlayerConfig, mode: RenderMode, name: string, values: Record<string, any>, ...also: Array<Record<string, any>>): string {
  // A render of its own when Body is rendered straight through React (not renderToHtml).
  return withRenderScope(() => {
    setRenderConfig(config);
    // What its content gives it (a <Font default>'s family), where it sets none: the body's, and its rows'.
    const given = rootDefaults(props, name);
    for (const target of [values, ...also]) Object.assign(target, given);
    const ids = (_config as unknown as { __ids: Record<string, number> }).__ids;
    const render = (child: React.ReactElement) => {
      const before = { ...ids };
      try {
        // (Elements' own, which call no hooks: called as they are, no walk around them.)
        const { html, inner } = renderOwn(child, { _config, bodyValues: values }, OWN_MARKUP);
        return inner === undefined ? html : `<div>${inner}</div>`;
      } catch (error) {
        for (const key of Object.keys(ids)) if (!(key in before)) delete ids[key];
        Object.assign(ids, before);
        throw error;
      }
    };
    return childrenHtml(props.children, render, { ...props, mode }, name);
  });
}

/**
 * A template with no root (`content`: what it rendered, or an Elements component or markup), as HTML: its content as
 * a root's is, in `mode`, with the render's `config` and the body's default values, and no body around it.
 */
export function rootlessHtml(content: React.ReactElement, config: UnlayerConfig, mode: RenderMode): string {
  const _config = { ...config, mode, __ids: {} } as UnlayerConfig;
  const values: Record<string, any> = mergeValues(BODY_DEFAULTS, mapSemanticProps({}, BODY_DEFAULTS, "Body"));
  cssUrl(values);
  return contentHtml({ mode, children: content }, config, _config, mode, ROOTLESS, values);
}
