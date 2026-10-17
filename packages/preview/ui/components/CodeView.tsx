import { useMemo, useState } from "react";
import type { RenderOk } from "../api";
import { copyText, downloadText, formatJson } from "./files";
import { CopyIcon, DownloadIcon } from "./icons";
import { Tip } from "./Tip";
import { highlight, sourceLanguage, type CodeLanguage } from "./highlight";

export type CodeTab = "source" | "html" | "text" | "json";

interface CodeViewProps {
  result: RenderOk;
  templatePath: string;
  tab: CodeTab;
  onTab(tab: CodeTab): void;
}

const TABS: Array<{ id: CodeTab; label: string }> = [
  { id: "source", label: "Source" },
  { id: "html", label: "HTML" },
  { id: "text", label: "Plain text" },
  { id: "json", label: "Design JSON" },
];

export function codeFor(result: RenderOk, tab: CodeTab): { text: string; ext: string; type: string; note?: string } {
  switch (tab) {
    case "source":
      return { text: result.source, ext: "", type: "text/plain" };
    case "html":
      return { text: result.html, ext: "html", type: "text/html" };
    case "text":
      return { text: result.text, ext: "txt", type: "text/plain", note: result.textError };
    case "json":
      return { text: formatJson(result.json), ext: "json", type: "application/json", note: result.jsonError };
  }
}

export function CodeView({ result, templatePath, tab, onTab }: CodeViewProps) {
  const [copied, setCopied] = useState(false);
  const code = codeFor(result, tab);
  const base = templatePath.split("/").pop() ?? "template";
  const filename = tab === "source" ? base : `${base.replace(/\.[^.]+$/, "")}.${code.ext}`;
  const lines = code.text.split("\n");
  const language: CodeLanguage = tab === "source" ? sourceLanguage(templatePath) : tab === "html" ? "html" : tab === "json" ? "json" : "text";
  const html = useMemo(() => highlight(code.text, language), [code.text, language]);

  return (
    <div className="code-view">
      <div className="code-bar">
        <div className="tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <Tip label={copied ? "Copied" : "Copy to the clipboard"} align="end">
          <button
            className="button"
            aria-label={copied ? "Copied" : "Copy"}
            onClick={async () => {
              if (await copyText(code.text)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }
            }}
          >
            <CopyIcon />
            <span className="label">{copied ? "Copied" : "Copy"}</span>
          </button>
        </Tip>
        <Tip label={`Download ${filename}`} align="end">
          <button className="button" aria-label="Download" onClick={() => downloadText(filename, code.text, code.type)}>
            <DownloadIcon />
            <span className="label">Download</span>
          </button>
        </Tip>
      </div>
      {code.note && <div className="code-note">{code.note}</div>}
      <div className="code">
        <pre className="code-gutter" aria-hidden>
          {lines.map((_, i) => i + 1).join("\n")}
        </pre>
        {/* Prism escapes the code; the markup is only its token spans. */}
        <pre className={`code-text language-${language}`}>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}
