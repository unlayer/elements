/**
 * The real Unlayer editor holding a template's design JSON, live and editable, as wide as there's room for: what every
 * story shows under its render.
 *
 * Storybook only, and the editor comes from the network: each loads as it nears the screen, so a Docs page opens only
 * those it's scrolled to. Automated runs get a placeholder instead, so they stay offline and stable.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { toDesign, type DisplayMode } from "../builder";
import type { Design } from "../builder/write";
import { Document, Page } from "../primitives/index";
import { forTheEditor } from "./editorDesign";
import { Reported, type Width } from "./Reported";

const EMBED = "https://editor.unlayer.com/embed.js";
/** The embed's default channel is behind: it can't read a Document's schema. */
const EDITOR_VERSION = "latest";
/** How long the editor has to show the design before its window says it couldn't. */
const SHOWN_WITHIN = 45_000;

/** The least the editor's window is wide, inside, with its tool panel open beside the design: narrower, it's drawn smaller. */
const EDITOR_WIDTHS: Record<DisplayMode, number> = { email: 1100, document: 1300, web: 1700 };

interface Editor {
  addEventListener(type: string, callback: () => void): void;
  loadDesign(design: Design): void;
  destroy?(): void;
}
interface Embed {
  createEditor(config: Record<string, unknown>): Editor;
}
declare global {
  interface Window {
    unlayer?: Embed;
  }
}

let embed: Promise<Embed> | undefined;
/** The editor's script, once for the page; a failed one is tried again the next time. */
const loadEmbed = () =>
  (embed ??= new Promise<Embed>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EMBED;
    script.async = true;
    script.onload = () => (window.unlayer ? resolve(window.unlayer) : reject(new Error("no editor in the script")));
    script.onerror = () => {
      script.remove();
      embed = undefined;
      reject(new Error("the script didn't load"));
    };
    document.head.append(script);
  }));

const say: CSSProperties = { font: "13px/1.5 system-ui, sans-serif", color: "#57606a", textAlign: "center", maxWidth: 340, margin: 0 };
const action: CSSProperties = { font: "600 13px system-ui, sans-serif", color: "#ffffff", background: "#24292f", border: 0, borderRadius: 6, padding: "9px 16px", cursor: "pointer" };

/** A message where the editor goes: a column in the window's middle. */
const Over = ({ children }: { children: ReactNode }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, background: "#f6f8fa" }}>{children}</div>
);

type Status = "waiting" | "loading" | "shown" | "failed";

/** The real editor, drawn at `scale` where there's less room than it needs, holding the design. */
function EditorWindow({ template, design, displayMode, device, width, height, scale }: {
  template: ReactElement;
  design: Design;
  displayMode: DisplayMode;
  device: "desktop" | "mobile";
  width: number;
  height: number;
  scale: number;
}) {
  const id = `editor-${useId().replace(/\W/g, "")}`;
  const box = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("waiting");
  // Each try at loading it: a try that fails leaves its window asking for another.
  const [attempt, setAttempt] = useState(0);
  const load = () => {
    setStatus("loading");
    setAttempt((count) => count + 1);
  };

  useEffect(() => {
    const element = box.current;
    if (attempt || !element) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && load(), { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [attempt]);

  useEffect(() => {
    if (!attempt) return;
    let editor: Editor | undefined;
    let left = false;
    const fail = () => !left && setStatus("failed");
    const timer = setTimeout(fail, SHOWN_WITHIN);
    Promise.all([loadEmbed(), forTheEditor(template, design, document.baseURI)]).then(([unlayer, copy]) => {
      if (left) return;
      const created = unlayer.createEditor({ id, version: EDITOR_VERSION, displayMode, fonts: copy.fonts, defaultDevice: device, appearance: { panels: { tools: { forceUncollapseOnSelect: true } } } });
      editor = created;
      created.addEventListener("editor:ready", () => created.loadDesign(copy.design));
      created.addEventListener("design:loaded", () => {
        clearTimeout(timer);
        if (!left) setStatus("shown");
      });
    }, fail);
    return () => {
      left = true;
      clearTimeout(timer);
      editor?.destroy?.();
      document.getElementById(id)?.replaceChildren();
    };
    // Once it's there it's the reader's to edit: only another try starts it again.
  }, [attempt]);

  return (
    <div ref={box} style={{ position: "relative", width: width * scale, height, overflow: "hidden", outline: "1px solid #d0d7de", background: "#f6f8fa" }}>
      <div id={id} style={{ width, height: height / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }} />
      {status !== "shown" && status !== "failed" && (
        <Over>
          <p style={say}>Loading the editor from editor.unlayer.com…</p>
        </Over>
      )}
      {status === "failed" && (
        <Over>
          <p style={{ ...say, color: "#9a3412" }}>The editor didn&rsquo;t load from editor.unlayer.com. The render beside it doesn&rsquo;t need it.</p>
          <button type="button" style={action} onClick={load}>
            Try again
          </button>
        </Over>
      )}
    </div>
  );
}

/** Where automated runs have the editor: no network, and the same every time. */
const Placeholder = () => (
  <div style={{ padding: "28px 24px", boxSizing: "border-box", outline: "1px solid #d0d7de", background: "#f6f8fa", display: "flex", justifyContent: "center" }}>
    <p style={say}>The real editor loads from editor.unlayer.com in a browser, and is left out of automated runs.</p>
  </div>
);

/** The builder's display mode for a template's root: a Page's is "web", a Document's "document", an Email's "email". */
export const modeOf = (template: ReactElement): DisplayMode => (template.type === Page ? "web" : template.type === Document ? "document" : "email");

export interface LiveEditorProps {
  template: ReactElement;
  width: Width;
  /** How tall its window is at most, where the screen has room. */
  tall?: number;
}

/** A template's design in the real editor, with what `toDesign` says the builder can't keep. */
export function LiveEditor({ template, width, tall = 680 }: LiveEditorProps) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  const [height, setHeight] = useState(tall);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      setRoom(element.clientWidth);
      setHeight(Math.max(560, Math.min(window.innerHeight - 40, tall)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [tall]);

  // Automated runs have no editor, so nothing of it is worked out for them.
  const made = useMemo(() => {
    if (navigator.webdriver) return undefined;
    return toDesign(template);
  }, [template]);

  const displayMode = modeOf(template);
  // A Document has no phones: its paper is its paper.
  const device = width === "phone" && displayMode !== "document" ? "mobile" : "desktop";
  const inner = Math.max(room, EDITOR_WIDTHS[displayMode]);

  return (
    <div ref={box} style={{ marginTop: 24, minWidth: 0 }}>
      {made && <Reported notes={made.report.map((text) => ({ severity: "info", text }))} summary="What toDesign says the builder can't keep" />}
      <figure style={{ margin: "16px 0 0" }}>
        <figcaption style={{ font: "600 13px system-ui, sans-serif", marginBottom: 8 }}>In the Unlayer editor, live: click anything to edit it</figcaption>
        {!made ? (
          <Placeholder />
        ) : room ? (
          <EditorWindow key={device} template={template} design={made.design} displayMode={displayMode} device={device} width={inner} height={height} scale={room / inner} />
        ) : null}
      </figure>
    </div>
  );
}
