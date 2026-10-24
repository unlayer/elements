import { useEffect, type RefObject } from "react";

/** Closes a menu or popover on a click outside `ref`, or Escape. */
export function useDismiss(ref: RefObject<HTMLElement>, open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
    };
    // A click in the preview or the editor iframe doesn't reach this page: leaving it counts as outside.
    const onBlur = () => close();
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [ref, open, close]);
}
