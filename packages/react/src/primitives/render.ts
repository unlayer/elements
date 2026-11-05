import React from "react";
import { ElementsError, LAYOUT_VERSION, pagedSupport, prepareTemplate, renderTemplate, validateTemplate, type Diagnostic, type RenderOptions, type RenderResult, type ResolvedNode } from "@unlayer-internal/elements-core";
import { collectTemplate } from "./collect";
import { outlineOf } from "./outline";

function template(element: unknown, call: string) {
  if (!React.isValidElement(element)) {
    throw new TypeError(`[Elements] ${call}() takes a template as JSX (<Email>…</Email>, <Page>…</Page>), not ${element === null ? "null" : typeof element}`);
  }
  return collectTemplate(element);
}

/**
 * A template rendered to the output its root says: `<Email>` to email HTML,
 * `<Page>` to web HTML (`<Document>` to print HTML or PDF and `<Canvas>` to an
 * image come with their writers). Resolves to `{ html, text, … }`;
 * rejects with an `ElementsError` listing the problems if the
 * template has errors (see `validate()`).
 */
export async function render(element: React.ReactElement, options: RenderOptions = {}): Promise<RenderResult> {
  const { document, diagnostics, components } = template(element, "render");
  if (!document || diagnostics.some((d) => d.severity === "error")) throw new ElementsError(diagnostics);
  const rendered = renderTemplate(document, { ...options, components });
  return { ...rendered, diagnostics: [...diagnostics, ...rendered.diagnostics] };
}

export interface ValidationResult {
  /** No errors (there may be warnings and notes). */
  valid: boolean;
  /** Each problem: a code, how bad it is, what's wrong and what to do instead, and where (`root.children[2].style.margin`). */
  diagnostics: Diagnostic[];
}

/**
 * A template's problems, without rendering it or throwing: for editors, tests
 * and agents checking what they wrote. It goes as far as rendering does before
 * writing: custom components expanded (and their output checked), the output's
 * own checks, layout, and what the output can't do as asked (`email/…`).
 * Warnings and notes leave it valid. Only what needs the written output is
 * left to `render()`: an email's size against Gmail's limits (`email/size`,
 * `email/style-size`).
 */
export function validate(element: React.ReactElement): ValidationResult {
  const { document, diagnostics, components } = template(element, "validate");
  const all = [...diagnostics, ...(document && !diagnostics.some((d) => d.severity === "error") ? validateTemplate(document, { components }).diagnostics : [])];
  return { valid: !all.some((d) => d.severity === "error"), diagnostics: all };
}

/**
 * A template laid out, as text: each block on a line under what holds it, with its width on desktop and what it
 * shows (a heading's words, a link's URL, an image's alt text), and whether a Row stacks on phones. To check a
 * template's layout without reading its HTML. Throws an `ElementsError` listing the problems if it has errors.
 */
export function outline(element: React.ReactElement): string {
  const { document, diagnostics, components } = template(element, "outline");
  if (!document || diagnostics.some((d) => d.severity === "error")) throw new ElementsError(diagnostics);
  // Laying it out finds problems of its own (a composite's, an output's): those are the ones it throws.
  const prepared = prepareTemplate(document, { components });
  const root = prepared.resolved?.root;
  if (!root) throw new ElementsError([...diagnostics, ...prepared.diagnostics]);
  return outlineOf(root);
}

/**
 * A template laid out, for a package that writes another output (`@unlayer/elements-pdf`): its tree, every block's
 * width worked out, and what was found. What render() does before it writes HTML; `root` is null where there are
 * errors. The tree is the writers' input, not a format to store: it changes with Elements, and `layout` says which
 * format it's in (a writer refuses one it doesn't read).
 */
export function prepare(element: React.ReactElement): { root: ResolvedNode | null; diagnostics: Diagnostic[]; layout: number } {
  const { document, diagnostics, components } = template(element, "prepare");
  if (!document || diagnostics.some((d) => d.severity === "error")) return { root: null, diagnostics, layout: LAYOUT_VERSION };
  const prepared = prepareTemplate(document, { components });
  const root = prepared.resolved?.root ?? null;
  // A Document is prepared for its PDF and a Canvas for its image: what they can't show that the HTML can.
  const paged = root?.type === "Document" ? pagedSupport(root, "pdf") : root?.type === "Canvas" ? pagedSupport(root, "image") : [];
  return { root, diagnostics: [...diagnostics, ...prepared.diagnostics, ...paged], layout: LAYOUT_VERSION };
}

export type { RenderOptions, RenderResult, ResolvedNode };
