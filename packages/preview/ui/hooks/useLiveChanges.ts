import { useEffect, useRef, useState } from "react";
import { STATIC, type TemplateEntry } from "../api";

export interface ChangeEvent {
  files: string[];
  templates: TemplateEntry[];
}

/**
 * - "connecting": the page just opened;
 * - "live": the preview updates as files are saved;
 * - "reconnecting": the connection to the server dropped (it's stopped, or restarting);
 * - "static": a static build, which nothing updates.
 */
export type LiveState = "connecting" | "live" | "reconnecting" | "static";

/** Live updates from the server. */
export function useLiveChanges(onChange: (event: ChangeEvent) => void): LiveState {
  const [state, setState] = useState<LiveState>(STATIC ? "static" : "connecting");
  const handler = useRef(onChange);
  handler.current = onChange;
  useEffect(() => {
    // A static build has no server to tell it about changes.
    if (STATIC) return;
    const source = new EventSource("/api/events");
    source.onopen = () => setState("live");
    source.onerror = () => setState("reconnecting");
    source.addEventListener("change", (event) => {
      try {
        handler.current(JSON.parse((event as MessageEvent).data));
      } catch {
        // A malformed event: the next one brings the current state.
      }
    });
    return () => source.close();
  }, []);
  return state;
}
