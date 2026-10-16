import { STATIC, type TemplateError } from "../api";

export function ErrorView({ error }: { error: TemplateError }) {
  const where = error.file ? `${error.file}${error.line ? `:${error.line}:${error.column ?? 1}` : ""}` : undefined;
  return (
    <div className="error-view" role="alert">
      <div className="error-kind">{error.phase === "load" ? "The template doesn't compile" : "The template threw while rendering"}</div>
      <h2 className="error-message">{error.message.split("\n")[0]}</h2>
      {where && <div className="error-where">{where}</div>}
      {error.frame && <pre className="error-frame">{error.frame}</pre>}
      {error.message.includes("\n") && <pre className="error-detail">{error.message.split("\n").slice(1).join("\n")}</pre>}
      {error.stack && (
        <details className="error-stack">
          <summary>Stack trace</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
      <p className="error-hint">
        {STATIC ? "A build doesn't update as you edit: fix the file, then build the preview again." : "Fix the file and save: the preview updates by itself."}
      </p>
    </div>
  );
}
