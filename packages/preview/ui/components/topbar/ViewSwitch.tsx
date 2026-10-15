import type { ReactNode } from "react";
import { CodeIcon, EditorIcon, EyeIcon } from "../icons";
import { Tip } from "../Tip";

export type View = "preview" | "editor" | "code";

export const VIEWS: Array<{ id: View; label: string; key: string; tip: string; icon: ReactNode }> = [
  { id: "preview", label: "Preview", key: "1", tip: "Preview", icon: <EyeIcon /> },
  { id: "editor", label: "Editor", key: "2", tip: "Open the design in the Unlayer editor", icon: <EditorIcon /> },
  { id: "code", label: "Code", key: "3", tip: "Source, HTML, plain text and design JSON", icon: <CodeIcon /> },
];

/** Preview · Editor · Code. */
export function ViewSwitch({ view, onView }: { view: View; onView(view: View): void }) {
  return (
    <div className="segmented view-switch" role="radiogroup" aria-label="View">
      {VIEWS.map((v) => (
        <Tip key={v.id} label={v.tip} kbd={v.key}>
          <button role="radio" aria-checked={view === v.id} aria-label={v.label} aria-keyshortcuts={v.key} onClick={() => onView(v.id)}>
            {v.icon}
            <span className="label">{v.label}</span>
          </button>
        </Tip>
      ))}
    </div>
  );
}
