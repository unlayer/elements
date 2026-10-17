import type { ReactNode } from "react";

interface TipProps {
  /** What the control does. Give the control the same words as its aria-label. */
  label: ReactNode;
  /** Its keyboard shortcut. */
  kbd?: string;
  /** Which edge of the control the tooltip lines up with, so it stays on the screen. */
  align?: "center" | "start" | "end";
  children: ReactNode;
}

/** A tooltip under a control, on hover and keyboard focus. */
export function Tip({ label, kbd, align = "center", children }: TipProps) {
  return (
    <span className="tip-wrap">
      {children}
      <span className={`tip tip-${align}`} aria-hidden>
        {label}
        {kbd && <kbd>{kbd}</kbd>}
      </span>
    </span>
  );
}
