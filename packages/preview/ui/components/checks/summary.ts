import { clientFindings, linkFindings, renderingFindings, type Finding } from "../../../shared/findings";
import type { CompatResponse, LinksResponse, RenderResponse } from "../../api";

/** How bad what a check found is: nothing, something to look at, or something broken. */
export type Tone = "ok" | "warn" | "bad";

/** What Elements and React reported for a render, and the project's warnings: the "Rendering" section. */
export function renderingItems(result: RenderResponse | undefined, warnings: string[]): Finding[] {
  return renderingFindings(result, warnings);
}

export interface SectionSummary {
  /** What to fix and to check: 0 when there's nothing (notes don't count). */
  count: number;
  tone: Tone;
  /** Not known yet: the check hasn't answered for this template. */
  pending: boolean;
}

/** A section's summary from its findings, with the same levels as `elements-preview check`: errors to fix, warnings to check. */
function summarize(findings: Finding[], pending: boolean): SectionSummary {
  const counted = findings.filter((f) => f.level !== "info");
  const tone: Tone = counted.some((f) => f.level === "error") ? "bad" : counted.length ? "warn" : "ok";
  return { count: counted.length, tone, pending };
}

export function renderingSummary(result: RenderResponse | undefined, warnings: string[]): SectionSummary {
  return summarize(renderingFindings(result, warnings), !result);
}

export function clientsSummary(report: CompatResponse | undefined): SectionSummary {
  return summarize(clientFindings(report), !report);
}

export function linksSummary(report: LinksResponse | undefined): SectionSummary {
  return summarize(linkFindings(report), !report);
}

/** "to fix" when something is broken, "to check" when it's only worth a look (a client that partly supports a feature). */
export function verb(summary: SectionSummary): string {
  return summary.tone === "bad" ? "to fix" : "to check";
}

const RANK: Record<Tone, number> = { ok: 0, warn: 1, bad: 2 };

/** All the sections together, for the Checks button: the total, and the worst tone. */
export function combine(sections: SectionSummary[]): SectionSummary {
  return sections.reduce<SectionSummary>(
    (all, s) => ({
      count: all.count + s.count,
      tone: RANK[s.tone] > RANK[all.tone] ? s.tone : all.tone,
      pending: all.pending || s.pending,
    }),
    { count: 0, tone: "ok", pending: false }
  );
}
