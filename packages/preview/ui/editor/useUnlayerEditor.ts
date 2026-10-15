import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { RenderMode } from "../api";
import { prepareDesign } from "./prepareDesign";
import { DISPLAY_MODE, loadUnlayer, type UnlayerEditor } from "./unlayerEmbed";

// How long the editor may take to say it's ready before the view says it didn't start.
const READY_TIMEOUT_MS = 45_000;

export type EditorState = "idle" | "loading" | "ready" | "error";

interface Options {
  /** The template's mode: the editor's display mode. */
  mode?: RenderMode;
  /** The design JSON to show. */
  design?: unknown;
  projectId?: number;
  /** Whether the editor is on screen: it starts, and takes new designs, only then. */
  active: boolean;
  /** The preview's address, for the design's /static/ files. */
  root: string;
}

let instances = 0;

/**
 * An Unlayer editor in `host` showing `design`, one way: each new design is
 * loaded into it, and nothing done in it comes back. It starts again when the
 * display mode changes, which an editor can't switch.
 */
export function useUnlayerEditor(host: RefObject<HTMLDivElement>, { mode, design, projectId, active, root }: Options) {
  const [state, setState] = useState<EditorState>("idle");
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const editor = useRef<UnlayerEditor>();
  const loaded = useRef<string>();

  // What the editor shows changes only while it's on screen.
  const [target, setTarget] = useState<{ mode: RenderMode; design?: unknown }>();
  useEffect(() => {
    if (active && mode) setTarget({ mode, design });
  }, [active, mode, design]);

  const targetMode = target?.mode;
  useEffect(() => {
    const container = host.current;
    if (!targetMode || !container) return;
    let cancelled = false;
    let instance: UnlayerEditor | undefined;
    const element = document.createElement("div");
    element.id = `unlayer-editor-${++instances}`;
    element.className = "unlayer-editor";
    container.replaceChildren(element);
    loaded.current = undefined;
    setState("loading");
    setError(undefined);
    const fail = (message: string) => {
      if (cancelled) return;
      setState("error");
      setError(message);
    };
    const timer = setTimeout(() => fail("The editor didn't start."), READY_TIMEOUT_MS);
    loadUnlayer().then(
      (unlayer) => {
        if (cancelled) return;
        instance = unlayer.createEditor({
          id: element.id,
          displayMode: DISPLAY_MODE[targetMode],
          version: "latest",
          ...(projectId ? { projectId } : {}),
        });
        editor.current = instance;
        instance.addEventListener("editor:ready", () => {
          if (cancelled) return;
          clearTimeout(timer);
          setState("ready");
        });
      },
      (reason: Error) => {
        clearTimeout(timer);
        fail(reason.message);
      }
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
      editor.current = undefined;
      try {
        instance?.destroy();
      } catch {
        // Already gone with its iframe.
      }
      element.remove();
    };
  }, [targetMode, projectId, attempt, host]);

  const targetDesign = target?.design;
  useEffect(() => {
    if (state !== "ready" || targetDesign === undefined || targetDesign === null) return;
    const json = JSON.stringify(targetDesign);
    if (json === loaded.current) return;
    let cancelled = false;
    void prepareDesign(targetDesign, root).then((prepared) => {
      if (cancelled || !editor.current) return;
      editor.current.loadDesign(prepared);
      loaded.current = json;
    });
    return () => {
      cancelled = true;
    };
  }, [state, targetDesign, root]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, error, retry };
}
