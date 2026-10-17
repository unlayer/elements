import type { ReactNode } from "react";
import { CloseIcon } from "../icons";
import { Tip } from "../Tip";

export type DrawerTab = "checks" | "props";

interface ChecksDrawerProps {
  tab: DrawerTab;
  onTab(tab: DrawerTab): void;
  onClose(): void;
  checks: ReactNode;
  props: ReactNode;
}

/** The drawer on the right: the template's checks, and the props it renders with. */
export function ChecksDrawer({ tab, onTab, onClose, checks, props }: ChecksDrawerProps) {
  const tabs: Array<{ id: DrawerTab; label: string }> = [
    { id: "checks", label: "Checks" },
    { id: "props", label: "Props" },
  ];
  return (
    <aside className="drawer" aria-label="Checks and props">
      <div className="drawer-head">
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" id={`drawer-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="drawer-panel" onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <Tip label="Close" kbd="." align="end">
          <button className="icon-button" onClick={onClose} aria-label="Close" aria-keyshortcuts=".">
            <CloseIcon />
          </button>
        </Tip>
      </div>
      <div className="drawer-body" id="drawer-panel" role="tabpanel" aria-labelledby={`drawer-tab-${tab}`}>
        {tab === "checks" ? checks : props}
      </div>
    </aside>
  );
}
