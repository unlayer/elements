/**
 * A migrated template rendered as users render it: its HTML with the new components' render(), and the design JSON the
 * visual editor opens, with toDesign().
 */
import type React from "react";
import { render } from "@unlayer/react-elements";
import { toDesign } from "@unlayer/react-elements/builder";

export async function htmlOf(element: React.ReactElement): Promise<string> {
  return (await render(element)).html;
}

export function designOf(element: React.ReactElement): any {
  return toDesign(element).design;
}
