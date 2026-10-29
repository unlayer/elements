import { useEffect, useRef } from "react";

/** Whether a key press is someone typing: in a field, or with a modifier (the browser's own shortcuts). */
function typing(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return true;
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}

/** Single-key shortcuts for the whole page (`/`, `1`, `d`…), skipped while typing in a field. */
export function useShortcuts(keys: Record<string, () => void>): void {
  const current = useRef(keys);
  current.current = keys;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || typing(event)) return;
      const action = current.current[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
