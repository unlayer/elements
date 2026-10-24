import type { ReactNode } from "react";
import { CheckCircleIcon } from "../icons";
import { countLabel, type SectionSummary } from "./summary";

interface SectionProps {
  title: string;
  /** What the section checks, for its tooltip. */
  about: string;
  summary: SectionSummary;
  /** Shown instead of "Nothing to fix" (a check that doesn't apply, or failed). */
  status?: ReactNode;
  /** A control in the header ("Check again"). */
  action?: ReactNode;
  /** The findings; nothing collapses the section to its header line. */
  children?: ReactNode;
}

/** One section of the Checks tab: a header line with its status, and what it found under it. */
export function Section({ title, about, summary, status, action, children }: SectionProps) {
  const label = countLabel(summary);
  return (
    <section className="check-section" aria-label={title}>
      <header className="check-head">
        <h3 title={about}>{title}</h3>
        <span className="check-status">
          {status ??
            (summary.pending ? (
              <span className="muted">Checking…</span>
            ) : summary.count ? (
              <span className={`pill ${summary.tone}`}>{label}</span>
            ) : (
              <span className="all-clear">
                <CheckCircleIcon /> Nothing to fix
              </span>
            ))}
        </span>
        {action}
      </header>
      {children && <div className="check-body">{children}</div>}
    </section>
  );
}
