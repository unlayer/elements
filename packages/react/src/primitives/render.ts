import React from "react";
import { ElementsError, type Diagnostic, type ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate, renderTemplate, validateTemplate, type RenderOptions, type RenderResult } from "@unlayer-internal/elements-exporters";
import { collectTemplate } from "./collect";

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
 * A template laid out, for a package that writes another output (`@unlayer/elements-pdf`): its tree, every block's
 * width worked out, and what was found. What render() does before it writes HTML; `root` is null where there are
 * errors. The tree is the writers' input, not a format to store: it changes with Elements.
 */
export function prepare(element: React.ReactElement): { root: ResolvedNode | null; diagnostics: Diagnostic[] } {
  const { document, diagnostics, components } = template(element, "prepare");
  if (!document || diagnostics.some((d) => d.severity === "error")) return { root: null, diagnostics };
  const prepared = prepareTemplate(document, { components });
  return { root: prepared.resolved?.root ?? null, diagnostics: [...diagnostics, ...prepared.diagnostics] };
}

export type { RenderOptions, RenderResult, ResolvedNode };
