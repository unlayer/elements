/**
 * The builder adapter (RFC 0001, step 11), experimental: a template in the new components as the Unlayer builder's
 * design JSON, and back. To the builder, it goes through today's components (`raise`), whose design JSON the builder
 * has opened for years; each item keeps in its values what the builder can't hold (payload.ts), so what the builder
 * has no editor for yet stays in the design (the builder keeps it, and shows no editor for it). Back from the builder,
 * the template is the builder's values read into what was kept; what was made in the builder comes from its values.
 * The format isn't frozen yet (payload.ts says when it will be): a design written now may read otherwise later.
 */
import type React from "react";
import { lower, type Design } from "./lower";
import { printTemplate, toElement } from "./print";
import { writeDesign, type DesignResult } from "./write";

export { raise, type Raised } from "./raise";
export type { DesignResult } from "./write";

/** A template in the new components (an `<Email>`, a `<Page>` or a `<Document>`) as the builder's design JSON. */
export function toDesign(element: React.ReactElement): DesignResult {
  return writeDesign(element);
}

export interface TemplateResult {
  /** The template, to render. */
  element: React.ReactElement;
  /** The template as JSX source in the new components. */
  code: string;
  /** What the builder changed that the template can't hold, and what was left out: one line each. */
  report: string[];
}

export interface FromDesignOptions {
  /** Components of the template's own (made with component()), by name, for `element`. */
  components?: Record<string, React.ComponentType<any>>;
  /** The name of the component in `code`. */
  name?: string;
}

/** The builder's design JSON as a template in the new components: one made with toDesign() as it was, with the builder's changes. */
export function fromDesign(design: object, options: FromDesignOptions = {}): TemplateResult {
  const report: string[] = [];
  const root = lower(design as Design, report);
  const code = printTemplate(root, options.name, report);
  return { element: toElement(root, options.components), code, report };
}
