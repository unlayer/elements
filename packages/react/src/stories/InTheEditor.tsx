/**
 * A template as Elements draws it beside what comes back from the builder, and under them the real Unlayer editor
 * holding its design JSON, live and editable, as wide as there's room for.
 *
 * Storybook only, and the editor comes from the network: each loads as it nears the screen, so a Docs page opens only
 * those it's scrolled to. Automated runs get a placeholder instead, so they stay offline and stable.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import type { DisplayMode } from "../builder";
import type { Design } from "../builder/write";
import { forTheEditor } from "./editorDesign";
import { Frame, GAP, Reported, WIDTHS, type Note, type Width } from "./SideBySide";

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

export interface InTheEditorProps {
  template: ReactElement;
  /** What `toDesign` wrote, and what it says it couldn't keep. */
  design: Design;
  report: string[];
  displayMode: DisplayMode;
  /** The render of the template, and of what comes back from the builder. */
  written: string;
  back: string;
  notes: Note[];
  width: Width;
  /** The window's width in px, where it isn't an email client's for `width`. */
  size?: number;
}

/** The render and what comes back from the builder side by side, what they report under them, and the editor below, as wide as they are together. */
export function InTheEditor({ template, design, report, displayMode, written, back, notes, width, size }: InTheEditorProps) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  const [tall, setTall] = useState(760);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      setRoom(element.clientWidth);
      setTall(Math.max(640, Math.min(window.innerHeight - 40, 900)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // A Document has no phones: its paper is its paper.
  const device = width === "phone" && displayMode !== "document" ? "mobile" : "desktop";
  const page = size ?? WIDTHS[width];
  const scale = room ? Math.min(1, (room - GAP) / (page * 2)) : 1;
  const editor = Math.max(room, EDITOR_WIDTHS[displayMode]);
  const editorScale = room ? room / editor : 1;

  return (
    <div ref={box} style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        <Frame label="As written, in Elements" html={written} width={page} scale={scale} />
        <Frame label="Back from the builder" html={back} width={page} scale={scale} />
      </div>
      <div>
        <Reported notes={notes.filter((note) => note.severity !== "info")} summary="Warnings" open />
        <Reported notes={report.map((text) => ({ severity: "info", text }))} summary="What toDesign says the builder can't keep" />
        <Reported notes={notes.filter((note) => note.severity === "info")} summary="Notes: what some clients draw differently" />
      </div>
      <figure style={{ margin: 0 }}>
        <figcaption style={{ font: "600 13px system-ui, sans-serif", marginBottom: 8 }}>In the Unlayer editor, live: click anything to edit it</figcaption>
        {navigator.webdriver ? (
          <Placeholder />
        ) : room ? (
          <EditorWindow key={device} template={template} design={design} displayMode={displayMode} device={device} width={editor} height={tall} scale={editorScale} />
        ) : null}
      </figure>
    </div>
  );
}
