import { useCallback, useRef, useState } from "react";
import { useDismiss } from "../../hooks/useDismiss";
import { ChevronDownIcon, MoonIcon, SunIcon } from "../icons";
import { Tip } from "../Tip";

/** How an email client recolors an email for a reader in dark mode (see shared/darkMode.ts). */
export type DarkVariant = "full" | "partial";

const VARIANTS: Array<{ id: DarkVariant; label: string; clients: string }> = [
  { id: "full", label: "Every color", clients: "Gmail apps, Outlook.com, Outlook on Windows" },
  { id: "partial", label: "Light colors only", clients: "Apple Mail, Outlook on phones" },
];

interface DarkToggleProps {
  on: boolean;
  onToggle(): void;
  variant: DarkVariant;
  onVariant(variant: DarkVariant): void;
}

/** Emulated dark mode: on or off, and, behind the caret, which way clients do it. */
export function DarkToggle({ on, onToggle, variant, onVariant }: DarkToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const label = on ? "Dark mode: on" : "Dark mode: off";
  return (
    <div className="split" ref={ref}>
      <Tip label={on ? "Turn dark mode off" : "Show it in dark mode"} kbd="T">
        <button className={`icon-button${on ? " on" : ""}`} aria-pressed={on} aria-label={label} aria-keyshortcuts="t" onClick={onToggle}>
          {on ? <MoonIcon /> : <SunIcon />}
        </button>
      </Tip>
      <Tip label="How clients darken it">
        <button className="icon-button caret" aria-label="Dark mode options" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronDownIcon />
        </button>
      </Tip>
      {open && (
        <div className="popover" role="dialog" aria-label="Dark mode">
          <div className="popover-title">Dark mode recolors</div>
          <div role="radiogroup" aria-label="How clients darken it">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={variant === v.id}
                className="option"
                onClick={() => {
                  onVariant(v.id);
                  setOpen(false);
                }}
              >
                <span className="radio" aria-hidden />
                <span>
                  <span className="option-label">{v.label}</span>
                  <span className="option-hint">{v.clients}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
