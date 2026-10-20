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

/**
 * Live updates from the server: `onChange` for each change, and `onReconnect`
 * when the connection comes back after it dropped (the server restarted, or
 * the computer slept), since what changed meanwhile came with no event.
 */
export function useLiveChanges(onChange: (event: ChangeEvent) => void, onReconnect?: () => void): LiveState {
  const [state, setState] = useState<LiveState>(STATIC ? "static" : "connecting");
  const handler = useRef(onChange);
  handler.current = onChange;
  const reconnected = useRef(onReconnect);
  reconnected.current = onReconnect;
  useEffect(() => {
    // A static build has no server to tell it about changes.
    if (STATIC) return;
    const source = new EventSource("/api/events");
    let dropped = false;
    source.onopen = () => {
      setState("live");
      if (dropped) reconnected.current?.();
      dropped = false;
    };
    source.onerror = () => {
      dropped = true;
      setState("reconnecting");
    };
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
