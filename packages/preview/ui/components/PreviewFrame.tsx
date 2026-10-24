import { useCallback, useEffect, useRef, useState } from "react";
import { setDarkMode, type DarkMode } from "../../shared/darkMode";

// Widths a drag snaps to when it comes close: phones, a tablet, a laptop.
const SNAP_WIDTHS = [320, 375, 430, 768, 1024];
const SNAP = 12;
const MIN_WIDTH = 240;

interface PreviewFrameProps {
  html: string;
  /** 0 = the full width available. */
  width: number;
  dark: DarkMode;
  onWidthChange(width: number): void;
  /** A double-click on a handle: back to the device's width. */
  onResetWidth(): void;
}

export function PreviewFrame({ html, width, dark, onWidthChange, onResetWidth }: PreviewFrameProps) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const darkRef = useRef(dark);
  darkRef.current = dark;
  // The width while a handle is dragged, shown over the frame.
  const [dragging, setDragging] = useState<number>();

  const syncDark = useCallback(() => {
    const doc = iframe.current?.contentDocument;
    if (doc) setDarkMode(doc, darkRef.current);
  }, []);

  useEffect(syncDark, [dark, syncDark]);

  // Drag either edge to resize: the frame stays centered, so it grows by twice the drag.
  const startResize = (event: React.PointerEvent, side: 1 | -1) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const area = stage.current;
    const padding = area ? Number.parseFloat(getComputedStyle(area).paddingLeft) + Number.parseFloat(getComputedStyle(area).paddingRight) : 0;
    const available = area ? area.clientWidth - padding : 1200;
    const startWidth = width || frame.current?.clientWidth || available;
    // Over the iframe while dragging, so it doesn't take the pointer; only once it moves, so a double-click reaches the handle.
    let shield: HTMLDivElement | undefined;
    const move = (e: PointerEvent) => {
      if (!shield) {
        if (Math.abs(e.clientX - startX) < 3) return;
        shield = document.createElement("div");
        shield.className = "drag-shield";
        document.body.append(shield);
      }
      let next = Math.round(startWidth + (e.clientX - startX) * 2 * side);
      next = Math.max(MIN_WIDTH, Math.min(next, available));
      const snap = SNAP_WIDTHS.find((w) => Math.abs(w - next) <= SNAP);
      if (snap && snap <= available) next = snap;
      setDragging(next);
      onWidthChange(next >= available ? 0 : next);
    };
    const up = () => {
      shield?.remove();
      setDragging(undefined);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handle = (side: "left" | "right") => (
    <div
      className={`resize-handle ${side}`}
      onPointerDown={(e) => startResize(e, side === "left" ? -1 : 1)}
      onDoubleClick={onResetWidth}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the preview"
      title="Drag to resize · double-click to reset"
    />
  );

  return (
    <div className={`stage${dark !== "off" ? " stage-dark" : ""}`} ref={stage}>
      <div className="frame-wrap" ref={frame} style={{ width: width ? width : "100%" }}>
        {handle("left")}
        <iframe
          ref={iframe}
          className="frame"
          title="Template preview"
          srcDoc={html}
          // srcdoc pages share this app's origin: no scripts, forms or navigation of the app, but links can open new tabs.
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={syncDark}
        />
        {handle("right")}
        {dragging !== undefined && <div className="width-readout">{dragging} px</div>}
      </div>
    </div>
  );
}
