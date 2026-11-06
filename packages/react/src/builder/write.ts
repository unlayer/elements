/**
 * The writing half of toDesign(): a template as the builder's rows, columns and blocks (raise.ts), each with its exact
 * values and hidden properties, written as the builder's design JSON (design.ts).
 */
import type React from "react";
import { writeParts, type Design } from "./design";
import { withFontStylesheets } from "./fonts";
import { raise } from "./raise";

export type { Design };

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: Design;
  /** What the builder can't hold as it is (a block of HTML, a style left out): one line each. */
  report: string[];
}

export function writeDesign(element: React.ReactElement): DesignResult {
  const { body, report } = raise(element);
  if (!body) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  return { design: withFontStylesheets(writeParts(body)), report };
}
