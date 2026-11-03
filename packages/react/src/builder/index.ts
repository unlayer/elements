/**
 * The builder adapter (RFC 0001, step 11): a template in the new components as the Unlayer builder's design JSON. The
 * design holds no Elements data: a style or prop a tool has no field for is a hidden property of that tool
 * (manifest.ts), kept in the design with no editor yet.
 */
import type React from "react";
import { writeDesign, type Design, type DesignResult } from "./write";

export type { Design, DesignResult };

/** A template in the new components (an `<Email>`, a `<Page>` or a `<Document>`) as the builder's design JSON. */
export function toDesign(element: React.ReactElement): DesignResult {
  return writeDesign(element);
}
