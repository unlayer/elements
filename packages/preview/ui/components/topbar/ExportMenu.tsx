import { useCallback, useRef, useState, type ReactNode } from "react";
import type { RenderOk } from "../../api";
import { useDismiss } from "../../hooks/useDismiss";
import { copyText, downloadText, formatJson } from "../files";
import { ChevronDownIcon, CopyIcon, DownloadIcon, ExportIcon, SparkleIcon } from "../icons";
import { Tip } from "../Tip";

interface ExportMenuProps {
  templatePath?: string;
  /** The current render, when it succeeded. */
  result?: RenderOk;
  /** Copies a prompt with the template and its problems for an AI assistant; undefined before the first render. */
  onCopyForAi?(): Promise<boolean>;
}

interface Item {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  hint?: string;
  done: string;
  run(): unknown;
}

/** Download or copy what the template renders, or copy it with its checks for an AI assistant. */
export function ExportMenu({ templatePath, result, onCopyForAi }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>();
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const base = (templatePath?.split("/").pop() ?? "template").replace(/\.[^.]+$/, "");
  const json = result ? formatJson(result.json) : "";
  const items: Item[] = [
    { label: "Download HTML", icon: <DownloadIcon />, disabled: !result, done: "Downloaded", run: () => result && downloadText(`${base}.html`, result.html, "text/html") },
    { label: "Download plain text", icon: <DownloadIcon />, disabled: !result, done: "Downloaded", run: () => result && downloadText(`${base}.txt`, result.text) },
    {
      label: "Download design JSON",
      icon: <DownloadIcon />,
      disabled: !json,
      hint: result?.jsonError ? `No design JSON: ${result.jsonError}` : "Opens in the Unlayer builder with loadDesign()",
      done: "Downloaded",
      run: () => downloadText(`${base}.json`, json, "application/json"),
    },
    { label: "Copy HTML", icon: <CopyIcon />, disabled: !result, done: "Copied", run: () => result && copyText(result.html) },
    {
      label: "Copy for AI",
      icon: <SparkleIcon />,
      disabled: !onCopyForAi,
      hint: "The template, its problems and checks, as a prompt for an AI assistant",
      done: "Copied",
      run: async () => {
        setStatus("Checking…");
        const ok = await onCopyForAi?.();
        if (!ok) throw new Error("Couldn't copy");
      },
    },
  ];

  const act = async (item: Item) => {
    setOpen(false);
    try {
      await item.run();
      setStatus(item.done);
    } catch {
      setStatus("Couldn't copy");
    }
    setTimeout(() => setStatus(undefined), 1400);
  };

  return (
    <div className="menu" ref={ref}>
      <Tip label="Download or copy" align="end">
        <button className={`button${status ? " has-status" : ""}`} aria-haspopup="menu" aria-expanded={open} aria-label={status ? `Export: ${status}` : "Export"} onClick={() => setOpen(!open)}>
          <ExportIcon />
          <span className="label">{status ?? "Export"}</span>
          <ChevronDownIcon />
        </button>
      </Tip>
      {open && (
        <div className="popover menu-items" role="menu">
          {items.map((item) => (
            <button key={item.label} role="menuitem" disabled={item.disabled} title={item.hint} onClick={() => act(item)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
