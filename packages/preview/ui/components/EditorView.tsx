import { useMemo, useRef } from "react";
import { previewRoot, type RenderOk } from "../api";
import { EMBED_URL } from "../editor/unlayerEmbed";
import { useUnlayerEditor } from "../editor/useUnlayerEditor";
import { AlertIcon, InfoIcon } from "./icons";

interface EditorViewProps {
  /** The template's current render, when it succeeded. */
  result?: RenderOk;
  projectId?: number;
  /** Whether the view is on screen (it stays loaded, hidden, while another view is). */
  active: boolean;
}

/** The template's design JSON in the Unlayer editor, to check how it opens there. */
export function EditorView({ result, projectId, active }: EditorViewProps) {
  const host = useRef<HTMLDivElement>(null);
  const root = useMemo(previewRoot, []);
  const design = result && !result.jsonError ? result.json : undefined;
  const { state, error, retry } = useUnlayerEditor(host, { mode: result?.mode, design, projectId, active, root });

  return (
    <div className="editor-view" hidden={!active}>
      <div className="editor-note" role="note">
        <InfoIcon />
        <span>
          Changes here aren't saved to your file. <span className="muted">Each render loads the template's design again.</span>
        </span>
      </div>
      <div className="editor-stage">
        <div className="editor-host" ref={host} />
        {result?.jsonError ? (
          <div className="editor-overlay">
            <div className="notice">
              <AlertIcon />
              <h2>This template has no design JSON</h2>
              <p>The editor opens what Elements' renderToJson makes, and it failed for this template:</p>
              <pre>{result.jsonError}</pre>
            </div>
          </div>
        ) : state === "error" ? (
          <div className="editor-overlay">
            <div className="notice">
              <AlertIcon />
              <h2>The editor couldn't load</h2>
              <p>
                It comes from <code>{new URL(EMBED_URL).host}</code>, so it needs an internet connection. Preview and Code work without one.
              </p>
              {error && <p className="muted">{error}</p>}
              <button className="button" onClick={retry}>
                Try again
              </button>
            </div>
          </div>
        ) : state !== "ready" ? (
          <div className="editor-overlay quiet">
            <span className="spinner" aria-hidden /> Starting the editor…
          </div>
        ) : null}
      </div>
    </div>
  );
}
