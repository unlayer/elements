/**
 * The Unlayer editor, from https://editor.unlayer.com/embed.js, as the
 * Elements Playground and react-email-editor load it. The script, and the
 * editor in the iframe it makes, come from the network: the rest of the
 * preview works without them.
 */

import type { RenderMode } from "../api";

export const EMBED_URL = "https://editor.unlayer.com/embed.js";

/** The editor's display mode for each Elements mode. */
export const DISPLAY_MODE: Record<RenderMode, string> = { email: "email", web: "web", document: "document" };

export interface UnlayerEditor {
  addEventListener(event: string, callback: (data?: unknown) => void): void;
  loadDesign(design: unknown): void;
  destroy(): void;
}

interface Unlayer {
  createEditor(options: Record<string, unknown>): UnlayerEditor;
}

let loading: Promise<Unlayer> | undefined;

function current(): Unlayer | undefined {
  const unlayer = (window as unknown as { unlayer?: Unlayer }).unlayer;
  return typeof unlayer?.createEditor === "function" ? unlayer : undefined;
}

/** Loads embed.js once; a failed load can be tried again. */
export function loadUnlayer(): Promise<Unlayer> {
  const ready = current();
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<Unlayer>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EMBED_URL;
    script.async = true;
    const failed = () => {
      script.remove();
      loading = undefined;
      reject(new Error(`Couldn't load ${EMBED_URL}`));
    };
    script.onload = () => {
      const unlayer = current();
      if (unlayer) resolve(unlayer);
      else failed();
    };
    script.onerror = failed;
    document.head.append(script);
  });
  return loading;
}
