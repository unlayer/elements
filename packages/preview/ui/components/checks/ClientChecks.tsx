import { useState } from "react";
import type { CompatIssue, CompatResponse } from "../../api";
import { ChevronRightIcon } from "../icons";
import { Section } from "./Section";
import { clientsSummary } from "./summary";

function supportLabel(support: "none" | "partial"): string {
  return support === "none" ? "Not supported" : "Partly supported";
}

function clientSummary(issue: CompatIssue): string {
  const names = issue.clients.map((c) => c.label);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
}

function IssueRow({ issue }: { issue: CompatIssue }) {
  const [open, setOpen] = useState(false);
  const notes = [...new Set(issue.clients.flatMap((c) => c.notes))];
  const blocks = [...new Set(issue.locations.map((l) => l.block))].join(", ");
  return (
    <li className="finding compat-issue">
      <button className="compat-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`disclosure${open ? " open" : ""}`}>
          <ChevronRightIcon />
        </span>
        <span className="compat-main">
          <span className="compat-title">
            <span className="compat-feature">{issue.feature}</span>
            <span className={`badge ${issue.support}`}>{supportLabel(issue.support)}</span>
          </span>
          <span className="finding-meta">
            {blocks}
            {issue.sourceLines?.length ? ` · line ${issue.sourceLines[0]}` : ""} · {clientSummary(issue)}
          </span>
        </span>
      </button>
      {open && (
        <div className="compat-body">
          <ul className="compat-client-list">
            {issue.clients.map((c) => (
              <li key={c.client}>
                <span className={`dot ${c.support}`} aria-hidden /> {c.label}: {supportLabel(c.support).toLowerCase()}
              </li>
            ))}
          </ul>
          {notes.length > 0 && (
            <ul className="compat-notes">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {issue.sourceLines && issue.sourceLines.length > 0 && (
            <div className="compat-source">
              Likely from the template's line{issue.sourceLines.length > 1 ? "s" : ""} {issue.sourceLines.join(", ")}
            </div>
          )}
          <div className="compat-lines">Lines in the HTML: {issue.locations.map((l) => (l.line ? `${l.line} (${l.block})` : l.block)).join(", ")}</div>
          {issue.url && (
            <a href={issue.url} target="_blank" rel="noreferrer">
              {issue.feature} on caniemail.com
            </a>
          )}
        </div>
      )}
    </li>
  );
}

interface ClientChecksProps {
  report?: CompatResponse;
  /** The report is from the previous render, while this one is checked. */
  stale: boolean;
  loading: boolean;
  error?: string;
}

/** "Email clients": what the email uses that Gmail, Outlook, Apple Mail… don't support, from caniemail.com. */
export function ClientChecks({ report, stale, loading, error }: ClientChecksProps) {
  const [showElements, setShowElements] = useState(false);
  const about = "HTML and CSS this email uses that Gmail, Outlook, Apple Mail, Yahoo Mail, Samsung Email or Thunderbird don't support, from caniemail.com";
  const summary = clientsSummary(report);
  if (error) return <Section title="Email clients" about={about} summary={summary} status={<span className="bad-text">Couldn't check: {error}</span>} />;
  if (!report) return <Section title="Email clients" about={about} summary={{ ...summary, pending: true }} />;
  if (!report.applicable) return <Section title="Email clients" about={about} summary={summary} status={<span className="muted" title={report.reason}>{/\bpage\b|\bdocument\b/.test(report.reason) ? "Emails only" : report.reason}</span>} />;

  const yours = report.issues.filter((i) => i.source === "template");
  const elements = report.issues.filter((i) => i.source === "elements");
  return (
    <Section title="Email clients" about={about} summary={summary}>
      {yours.length > 0 && (
        <>
          <p className="check-intro">
            {yours.length === 1 ? "A feature" : `${yours.length} features`} this template uses that some email clients don't support. Data from{" "}
            <a href="https://www.caniemail.com" target="_blank" rel="noreferrer">
              caniemail.com
            </a>
            .{(loading || stale) && <span className="muted"> Checking again…</span>}
          </p>
          <ul className="findings">
            {yours.map((issue) => (
              <IssueRow key={`${issue.source}|${issue.feature}`} issue={issue} />
            ))}
          </ul>
        </>
      )}
      {elements.length > 0 && (
        <div className="check-more">
          <button className="link" onClick={() => setShowElements(!showElements)} aria-expanded={showElements}>
            {showElements ? "Hide" : "Show"} {elements.length} handled by Elements
          </button>
          <span className="muted"> CSS Elements' email HTML uses on purpose, with fallbacks for the clients that ignore it.</span>
          {showElements && (
            <ul className="findings">
              {elements.map((issue) => (
                <IssueRow key={`${issue.source}|${issue.feature}`} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
