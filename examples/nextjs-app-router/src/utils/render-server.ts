import React from "react";
import {
  renderToHtml as baseRenderToHtml,
  renderToPlainText as baseRenderToPlainText,
} from "@unlayer/react-elements";

/**
 * Server-rendering wrappers that bridge the React 18 types expected by
 * @unlayer/react-elements and the React 19 types resolved in this Next.js 15
 * application.
 *
 * Centralizes the type casting boundary required due to React 18/19 typings
 * incompatibilities in component children definitions.
 */

export function renderEmailToHtml(
  element: React.ReactElement,
  options?: Parameters<typeof baseRenderToHtml>[1]
): string {
  return baseRenderToHtml(
    element as unknown as Parameters<typeof baseRenderToHtml>[0],
    options
  );
}

export function renderEmailToPlainText(
  element: React.ReactElement,
  config?: Parameters<typeof baseRenderToPlainText>[1]
): string {
  return baseRenderToPlainText(
    element as unknown as Parameters<typeof baseRenderToPlainText>[0],
    config
  );
}
