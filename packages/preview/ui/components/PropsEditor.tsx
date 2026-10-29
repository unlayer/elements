import { useEffect, useState } from "react";
import { formatJson } from "./files";

interface PropsEditorProps {
  /** The props the template rendered with. */
  props: unknown;
  previewProps: unknown;
  /** Whether the props shown are edited ones, not the template's PreviewProps. */
  edited: boolean;
  /** Whether the template has rendered since the page opened (so whether its PreviewProps are known). */
  rendered: boolean;
  /** A static build: shows the props, which can't change. */
  readOnly?: boolean;
  onApply(props: unknown): void;
  onReset(): void;
}

export function PropsEditor({ props, previewProps, edited, rendered, readOnly, onApply, onReset }: PropsEditorProps) {
  const [text, setText] = useState(() => formatJson(props ?? previewProps ?? {}));
  const [error, setError] = useState<string>();

  useEffect(() => {
    setText(formatJson(props ?? previewProps ?? {}));
    setError(undefined);
  }, [props, previewProps]);

  const apply = () => {
    try {
      onApply(text.trim() ? JSON.parse(text) : {});
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (readOnly) {
    return (
      <div className="props-editor">
        <p className="check-intro">
          The props this build rendered with (the template's <code>PreviewProps</code>). To try other props, run the preview with <code>elements-preview dev</code>.
        </p>
        <pre className="props-text">{formatJson(previewProps ?? {}) || "{}"}</pre>
      </div>
    );
  }

  return (
    <div className="props-editor">
      <p className="check-intro">
        {!rendered && !edited ? (
          <>The template hasn't rendered yet, so its <code>PreviewProps</code> aren't known. You can still try props here.</>
        ) : previewProps === undefined && !edited ? (
          <>
            This template has no <code>PreviewProps</code>. Add them to the component to preview it with sample data:{" "}
            <code>Welcome.PreviewProps = {"{ name: \"Ada\" }"}</code>. You can also try props here.
          </>
        ) : edited ? (
          <>Rendered with the props below instead of the template's <code>PreviewProps</code>. Only the preview uses them; the file isn't changed.</>
        ) : (
          <>The template's <code>PreviewProps</code>. Edit them to try other data; the file isn't changed.</>
        )}
      </p>
      <textarea
        className="props-text"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            apply();
          }
        }}
        aria-label="Props as JSON"
      />
      {error && <div className="props-error">Not valid JSON: {error}</div>}
      <div className="props-actions">
        <button className="button primary" onClick={apply}>
          Render with these props
        </button>
        {edited && (
          <button className="button" onClick={onReset}>
            Back to PreviewProps
          </button>
        )}
        <span className="muted"><kbd>⌘/Ctrl</kbd> <kbd>Enter</kbd></span>
      </div>
    </div>
  );
}
