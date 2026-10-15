/**
 * The checks of a rendered template, as the dev server, `build` and `check`
 * all run them: email client compatibility (with the template lines each
 * finding likely comes from) and links and images.
 */

import { baselineFeatures, checkCompatibility, sourceLines, type CompatReport } from "./compat.js";
import { checkLinks, type LinkReport } from "./links.js";
import type { RenderedTemplate, TemplateLoader } from "./loader.js";

export const NOT_AN_EMAIL = "Email client compatibility applies to emails. This template is a page or a document.";

export type CompatResult = ({ applicable: true } & CompatReport) | { applicable: false; reason: string };
export type LinksResult = ({ applicable: true } & LinkReport) | { applicable: false; reason: string };

export interface TemplateChecks {
  /** Email client compatibility, for an email; `source` is the template's source, for the lines each finding comes from. */
  compat(result: RenderedTemplate, source: string): Promise<CompatResult>;
  /** Links and images; `network: false` checks the HTML only. */
  links(result: RenderedTemplate, options?: { network?: boolean; timeoutMs?: number; fetch?: typeof fetch }): Promise<LinksResult>;
  /** Measure Elements' own HTML again on the next compatibility check (the project's packages changed). */
  reset(): void;
}

/** The checks for templates in `dir` rendered by `loader`, which also renders the reference email Elements' own HTML is measured with. */
export function createChecks(loader: TemplateLoader, dir: string): TemplateChecks {
  let baseline: Set<string> | undefined;
  return {
    async compat(result, source) {
      if (result.mode !== "email") return { applicable: false, reason: NOT_AN_EMAIL };
      baseline ??= baselineFeatures(await loader.referenceHtml());
      const report = checkCompatibility(result.html, baseline);
      for (const issue of report.issues) if (issue.source === "template") issue.sourceLines = sourceLines(issue.feature, source);
      return { applicable: true, ...report };
    },
    async links(result, options = {}) {
      return { applicable: true, ...(await checkLinks(result.html, { dir, ...options })) };
    },
    reset() {
      baseline = undefined;
    },
  };
}
