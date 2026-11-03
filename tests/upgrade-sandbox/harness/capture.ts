// A story that shows its design through renderToHtmlParts (PhoneOverrides, the custom-tools gallery) imports this
// instead: it records the design it's given, so the harness can render that design itself, then does what the
// package does.
import type { ReactElement } from "react";
import { renderToHtmlParts as real } from "@unlayer/react-elements";

export function renderToHtmlParts(tree: ReactElement, config?: any) {
  (globalThis as any).__sandboxCaptured = tree;
  return (real as any)(tree, config);
}
