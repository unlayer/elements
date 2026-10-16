/**
 * Templates whose outputs have the same name: `welcome.jsx` and `welcome.tsx`
 * both export to `welcome.html`. Names are compared as macOS and Windows
 * compare them, without case and Unicode normalization, since there
 * `Welcome.html` and `welcome.html` are one file.
 */

import type { TemplateEntry } from "./discover.js";
import { UsageError } from "./errors.js";
import { shown } from "./paths.js";

/** Throws a UsageError naming two templates that would write the same file (`outputs`: the files each one writes). */
export function assertDistinctOutputs(templates: TemplateEntry[], outputs: (template: TemplateEntry) => string[]): void {
  const writers = new Map<string, TemplateEntry>();
  for (const template of templates) {
    for (const file of outputs(template)) {
      const name = file.normalize("NFC").toLowerCase();
      const other = writers.get(name);
      if (other && other !== template) throw new UsageError(`${other.path} and ${template.path} would both write ${shown(file)}. Rename one of them.`);
      writers.set(name, template);
    }
  }
}
