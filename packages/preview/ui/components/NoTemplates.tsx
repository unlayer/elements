import { useState } from "react";
import { copyText } from "./files";
import { CopyIcon } from "./icons";

/** The command that adds starter templates to the folder (it never overwrites a file). */
export function initCommand(dir?: string): string {
  return `npx @unlayer/cli elements init${dir && dir !== "emails" ? ` --dir ${dir}` : ""}`;
}

/** What to do when the folder has no templates: the command that adds some, or how to write one. */
export function NoTemplates({ dir, compact = false }: { dir?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const command = initCommand(dir);
  return (
    <div className={compact ? "no-templates compact" : "no-templates"}>
      {compact ? <p>No templates yet.</p> : <h2>No templates in {dir ?? "this folder"} yet</h2>}
      <p className="muted">Add starter templates with:</p>
      <div className="command">
        <code>{command}</code>
        <button
          className="icon-button small"
          aria-label="Copy the command"
          title={copied ? "Copied" : "Copy the command"}
          onClick={async () => {
            if (await copyText(command)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          <CopyIcon />
        </button>
      </div>
      <p className="muted">
        Or add a <code>.tsx</code> file with an <code>export default</code> component that returns <code>&lt;Email&gt;</code>, <code>&lt;Page&gt;</code> or{" "}
        <code>&lt;Document&gt;</code>. It shows up here as soon as you save it.
      </p>
    </div>
  );
}
