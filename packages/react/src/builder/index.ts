/**
 * The builder adapter (RFC 0001, step 11): a template in the new components as the Unlayer builder's design JSON,
 * through today's components (`raise`), whose design JSON the builder has opened for years. What the builder can't
 * hold as a tool is an HTML block, and listed in the report.
 */
import type React from "react";
import { renderToJson } from "../index";
import { raise } from "./raise";

export { raise, type Raised } from "./raise";

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: ReturnType<typeof renderToJson>;
  /** What the builder can't hold as it is: one line each, with where. */
  report: string[];
}

/** A template in the new components (an `<Email>` or a `<Page>`) as the builder's design JSON. */
export function toDesign(element: React.ReactElement): DesignResult {
  const { element: raised, report } = raise(element);
  if (!raised) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  return { design: renderToJson(raised), report };
}
