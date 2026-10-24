import type { RenderMode, RenderResponse } from "../../api";
import type { LiveState } from "../../hooks/useLiveChanges";
import { Tip } from "../Tip";

const MODE_LABEL: Record<RenderMode, string> = { email: "Email", web: "Page", document: "Document" };

interface TemplateTitleProps {
  path?: string;
  result?: RenderResponse;
  /** The mode of the template's last successful render (kept while it fails). */
  mode?: RenderMode;
  live: LiveState;
  builtAt?: string;
}

/** The template's name, its folder before it, and its mode; render time and live updates in the tooltip. */
export function TemplateTitle({ path, result, mode, live, builtAt }: TemplateTitleProps) {
  if (!path) return <div className="title muted">No template</div>;
  const slash = path.lastIndexOf("/");
  const folder = slash >= 0 ? path.slice(0, slash + 1) : "";
  const name = path.slice(slash + 1).replace(/\.[^.]+$/, "");
  const details = [
    path,
    result ? (result.ok ? `Rendered in ${result.durationMs} ms` : "Doesn't render") : "Rendering…",
    live === "static"
      ? `A static build${builtAt ? ` from ${new Date(builtAt).toLocaleString()}` : ""}: it doesn't update`
      : live === "live"
        ? "Updates as you save"
        : live === "reconnecting"
          ? "Not connected to the preview server: reconnecting"
          : "Connecting…",
  ];
  return (
    <div className="title">
      <Tip
        align="start"
        label={
          <span className="tip-lines">
            {details.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        }
      >
        <span className="title-text" tabIndex={0} aria-label={details.join(". ")}>
          {folder && <span className="title-folder">{folder}</span>}
          <span className="title-name">{name}</span>
        </span>
      </Tip>
      {mode && <span className="title-mode">{MODE_LABEL[mode]}</span>}
      {live === "reconnecting" && (
        <span className="reconnecting" role="status">
          <span className="spinner" aria-hidden /> Reconnecting…
        </span>
      )}
    </div>
  );
}
