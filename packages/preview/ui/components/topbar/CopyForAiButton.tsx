import { useState } from "react";
import { SparkleIcon } from "../icons";
import { Tip } from "../Tip";

interface CopyForAiButtonProps {
  /** Copies a prompt with the template and its problems for an AI assistant; undefined until the template has rendered. */
  onCopy?(): Promise<boolean>;
}

/** Copies the template, its problems and its checks as one prompt to paste into an AI assistant. */
export function CopyForAiButton({ onCopy }: CopyForAiButtonProps) {
  const [status, setStatus] = useState<string>();
  const copy = async () => {
    setStatus("Checking…");
    const ok = await onCopy?.().catch(() => false);
    setStatus(ok ? "Copied" : "Couldn't copy");
    setTimeout(() => setStatus(undefined), 1400);
  };
  return (
    <Tip label="The template, its problems and checks, as a prompt for an AI assistant" align="end">
      <button
        className={`button copy-ai${status ? " has-status" : ""}`}
        aria-label={status ? `Copy for AI: ${status}` : "Copy for AI"}
        disabled={!onCopy || status === "Checking…"}
        onClick={copy}
      >
        <SparkleIcon />
        <span className="label">{status ?? "Copy for AI"}</span>
      </button>
    </Tip>
  );
}
