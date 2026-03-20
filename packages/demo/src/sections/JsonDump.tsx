import { useState, useRef, useEffect, useCallback } from "react";
import { renderToJson } from "@unlayer/react-elements";
import { templates } from "../templates";

declare global {
  interface Window {
    unlayer: any;
  }
}

export default function JsonDump() {
  const [selected, setSelected] = useState(templates[0].id);
  const [copied, setCopied] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const template = templates.find((t) => t.id === selected)!;
  let design: any = null;
  let json: string;
  let error: string | null = null;

  try {
    design = renderToJson(template.component());
    json = JSON.stringify(design, null, 2);
  } catch (e: any) {
    json = "";
    error = e.message;
  }

  // Load Unlayer embed script
  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://editor.unlayer.com/embed.js";
    script.onload = () => {
      if (window.unlayer && editorRef.current) {
        window.unlayer.init({
          id: "unlayer-editor",
          displayMode: "email",
        });
        window.unlayer.addEventListener("editor:ready", () => {
          setEditorReady(true);
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadInEditor = useCallback(() => {
    if (!window.unlayer || !design) return;
    setLoadStatus("Loading...");
    try {
      window.unlayer.loadDesign(design);
      setLoadStatus("Design loaded successfully!");
      setTimeout(() => setLoadStatus(null), 3000);
    } catch (e: any) {
      setLoadStatus(`Error: ${e.message}`);
    }
  }, [design]);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-2 text-white">renderToJson Output</h1>
      <p className="text-zinc-400 mb-6">
        Select a template, then load it into the embedded editor or copy the JSON.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              selected === t.id
                ? "bg-blue-600 text-white font-semibold"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={loadInEditor}
          disabled={!!error || !editorReady}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {editorReady ? "Load in Editor" : "Editor loading..."}
        </button>
        <button
          onClick={copyToClipboard}
          disabled={!!error}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        {loadStatus && (
          <span className={`self-center text-sm ${loadStatus.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
            {loadStatus}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ height: "70vh" }}>
        {/* Editor */}
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div id="unlayer-editor" ref={editorRef} style={{ height: "100%" }} />
        </div>

        {/* JSON */}
        <div className="overflow-auto">
          {error ? (
            <pre className="bg-red-950 border border-red-800 p-4 rounded-lg text-red-400 text-sm h-full">
              {error}
            </pre>
          ) : (
            <pre className="bg-zinc-900 text-zinc-300 p-5 rounded-lg text-xs leading-relaxed border border-zinc-800 h-full overflow-auto">
              {json}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
