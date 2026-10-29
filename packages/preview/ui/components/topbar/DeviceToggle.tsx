import { DesktopIcon, PhoneIcon } from "../icons";
import { Tip } from "../Tip";

export type Device = "desktop" | "phone";

/** The width each device starts at (0: all the width there is). */
export const DEVICE_WIDTH: Record<Device, number> = { desktop: 0, phone: 375 };

/** Desktop or phone width for the preview. */
export function DeviceToggle({ device, onDevice }: { device: Device; onDevice(device: Device): void }) {
  return (
    <div className="segmented icons" role="radiogroup" aria-label="Width">
      <Tip label="Desktop width" kbd="D">
        <button role="radio" aria-checked={device === "desktop"} aria-label="Desktop width" aria-keyshortcuts="d" onClick={() => onDevice("desktop")}>
          <DesktopIcon />
        </button>
      </Tip>
      <Tip label={`Phone width (${DEVICE_WIDTH.phone} px)`} kbd="D">
        <button role="radio" aria-checked={device === "phone"} aria-label="Phone width" aria-keyshortcuts="d" onClick={() => onDevice("phone")}>
          <PhoneIcon />
        </button>
      </Tip>
    </div>
  );
}
