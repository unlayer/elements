import type { RenderMode, RenderResponse } from "../../api";
import type { LiveState } from "../../hooks/useLiveChanges";
import type { SectionSummary } from "../checks/summary";
import { ChecksButton } from "./ChecksButton";
import { CopyForAiButton } from "./CopyForAiButton";
import { DarkToggle, type DarkVariant } from "./DarkToggle";
import { DeviceToggle, type Device } from "./DeviceToggle";
import { TemplateTitle } from "./TemplateTitle";
import { ViewSwitch, type View } from "./ViewSwitch";

interface TopBarProps {
  templatePath?: string;
  result?: RenderResponse;
  mode?: RenderMode;
  live: LiveState;
  builtAt?: string;
  view: View;
  onView(view: View): void;
  device: Device;
  onDevice(device: Device): void;
  dark: boolean;
  onDarkToggle(): void;
  darkVariant: DarkVariant;
  onDarkVariant(variant: DarkVariant): void;
  checks: SectionSummary;
  drawerOpen: boolean;
  onDrawer(): void;
  onCopyForAi?(): Promise<boolean>;
}

/** The template's name, the view switch in the middle, and the preview's controls, the checks and Copy for AI on the right. */
export function TopBar(props: TopBarProps) {
  return (
    <header className="topbar">
      <TemplateTitle path={props.templatePath} result={props.result} mode={props.mode} live={props.live} builtAt={props.builtAt} />
      <ViewSwitch view={props.view} onView={props.onView} />
      <div className="topbar-end">
        {props.view === "preview" && (
          <>
            <DeviceToggle device={props.device} onDevice={props.onDevice} />
            <DarkToggle on={props.dark} onToggle={props.onDarkToggle} variant={props.darkVariant} onVariant={props.onDarkVariant} />
          </>
        )}
        <ChecksButton summary={props.checks} open={props.drawerOpen} onClick={props.onDrawer} />
        <CopyForAiButton onCopy={props.onCopyForAi} />
      </div>
    </header>
  );
}
