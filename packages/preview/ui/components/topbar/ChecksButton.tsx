import { verb, type SectionSummary } from "../checks/summary";
import { AlertIcon, CheckCircleIcon } from "../icons";
import { Tip } from "../Tip";

/** Opens the checks drawer; shows "All clear", or how much there is to fix (something broken) or to check, in the color of the worst. */
export function ChecksButton({ summary, open, onClick }: { summary: SectionSummary; open: boolean; onClick(): void }) {
  const text = summary.count ? `${summary.count} ${verb(summary)}` : summary.pending ? "Checking…" : "All clear";
  const tone = summary.count ? summary.tone : summary.pending ? "pending" : "ok";
  return (
    <Tip label={open ? "Hide checks" : "Checks: rendering, email clients, links and images"} kbd="." align="end">
      <button className={`button checks-button ${tone}`} aria-expanded={open} aria-label={`Checks: ${text}`} aria-keyshortcuts="." onClick={onClick}>
        {summary.count ? <AlertIcon /> : summary.pending ? <span className="spinner" aria-hidden /> : <CheckCircleIcon />}
        <span className="label">{text}</span>
        {summary.count > 0 && <span className="short-count">{summary.count}</span>}
      </button>
    </Tip>
  );
}
