import { useState } from "react";
import type { LinkFinding, LinksResponse } from "../../api";
import { RefreshIcon } from "../icons";
import { Section } from "./Section";
import { linksSummary } from "./summary";

const LEVEL_LABEL: Record<LinkFinding["level"], string> = { error: "Broken", warning: "Check", info: "Note" };
const LEVEL_TONE: Record<LinkFinding["level"], string> = { error: "none", warning: "partial", info: "info" };

function FindingRow({ finding }: { finding: LinkFinding }) {
  return (
    <li className="finding">
      <span className={`badge ${LEVEL_TONE[finding.level]}`}>{LEVEL_LABEL[finding.level]}</span>
      <div className="finding-text">
        <div>{finding.message}</div>
        <div className="finding-meta">
          {finding.kind === "image" ? "Image" : finding.kind === "link" ? "Link" : "Email"}
          {finding.block ? ` · ${finding.block}` : ""}
          {finding.label ? ` · “${finding.label}”` : ""}
          {finding.url && (
            <>
              {" · "}
              <a href={finding.url} target="_blank" rel="noreferrer" className="finding-url">
                {finding.url.length > 90 ? `${finding.url.slice(0, 87)}…` : finding.url}
              </a>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

interface LinkChecksProps {
  report?: LinksResponse;
  stale: boolean;
  loading: boolean;
  error?: string;
  /** Requests the URLs again (not in a static build, which doesn't request them). */
  onRecheck?(): void;
}

/** "Links & images": links that go nowhere, images without alt text, /static/ images, Gmail's size limit; each URL requested. */
export function LinkChecks({ report, stale, loading, error, onRecheck }: LinkChecksProps) {
  const [showNotes, setShowNotes] = useState(false);
  const about = "Links that go nowhere, relative or http: URLs, images without alt text, images most clients block, and HTML over Gmail's clipping limit";
  const summary = linksSummary(report);
  const recheck = onRecheck && report && (
    <button className="text-button" onClick={onRecheck} disabled={loading} title="Request every link and image again">
      <RefreshIcon /> Check again
    </button>
  );
  if (error) return <Section title="Links & images" about={about} summary={summary} status={<span className="bad-text">Couldn't check: {error}</span>} />;
  if (!report) return <Section title="Links & images" about={about} summary={{ ...summary, pending: true }} />;
  if (!report.applicable) return <Section title="Links & images" about={about} summary={summary} status={<span className="muted">{report.reason}</span>} />;

  const problems = report.findings.filter((f) => f.level !== "info");
  const notes = report.findings.filter((f) => f.level === "info");
  return (
    <Section title="Links & images" about={about} summary={summary} action={recheck}>
      {(problems.length > 0 || loading || stale) && (
        <p className="check-intro">
          {report.links} {report.links === 1 ? "link" : "links"} and {report.images} {report.images === 1 ? "image" : "images"}
          {report.network ? ", each requested." : ", checked in the HTML only (a static build doesn't request them)."}
          {(loading || stale) && <span className="muted"> Checking again…</span>}
        </p>
      )}
      {problems.length > 0 && (
        <ul className="findings">
          {problems.map((finding, i) => (
            <FindingRow key={i} finding={finding} />
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <div className="check-more">
          <button className="link" onClick={() => setShowNotes(!showNotes)} aria-expanded={showNotes}>
            {showNotes ? "Hide" : "Show"} {notes.length} {notes.length === 1 ? "note" : "notes"}
          </button>
          {showNotes && (
            <ul className="findings">
              {notes.map((finding, i) => (
                <FindingRow key={i} finding={finding} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
