import { useCallback, useEffect, useRef, useState } from "react";
import { api, STATIC, type Meta, type RenderOk, type RenderResponse, type TemplateEntry } from "./api";
import { aiPrompt } from "./components/aiPrompt";
import { ChecksDrawer, type DrawerTab } from "./components/checks/ChecksDrawer";
import { ClientChecks } from "./components/checks/ClientChecks";
import { LinkChecks } from "./components/checks/LinkChecks";
import { RenderingChecks } from "./components/checks/RenderingChecks";
import { clientsSummary, combine, linksSummary, renderingSummary } from "./components/checks/summary";
import { CodeView, type CodeTab } from "./components/CodeView";
import { EditorView } from "./components/EditorView";
import { ErrorView } from "./components/ErrorView";
import { copyText } from "./components/files";
import { NoTemplates } from "./components/NoTemplates";
import { PreviewFrame } from "./components/PreviewFrame";
import { PropsEditor } from "./components/PropsEditor";
import { Sidebar } from "./components/Sidebar";
import type { DarkVariant } from "./components/topbar/DarkToggle";
import { DEVICE_WIDTH, type Device } from "./components/topbar/DeviceToggle";
import { TopBar } from "./components/topbar/TopBar";
import { VIEWS, type View } from "./components/topbar/ViewSwitch";
import { useCheck } from "./hooks/useCheck";
import { useLiveChanges } from "./hooks/useLiveChanges";
import { useSelectedTemplate } from "./hooks/useSelectedTemplate";
import { useShortcuts } from "./hooks/useShortcuts";
import { oneOf, useStoredState } from "./hooks/useStoredState";

export function App() {
  const [meta, setMeta] = useState<Meta>();
  const [templates, setTemplates] = useState<TemplateEntry[]>();
  const [selected, select] = useSelectedTemplate();
  // The last render, with the template it's of.
  const [lastRender, setLastRender] = useState<{ path: string; result: RenderResponse }>();
  const [rendering, setRendering] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  // Each template's last successful render: its props stay editable while the file doesn't compile.
  const [lastOk, setLastOk] = useState<Record<string, RenderOk>>({});
  const renderSeq = useRef(0);
  const [version, setVersion] = useState(0);

  const [view, setView] = useStoredState<View>("view", "preview", oneOf(["preview", "editor", "code"]));
  const [codeTab, setCodeTab] = useStoredState<CodeTab>("codeTab", "html", oneOf(["source", "html", "text", "json"]));
  const [device, setDevice] = useStoredState<Device>("device", "desktop", oneOf(["desktop", "phone"]));
  const [width, setWidth] = useStoredState<number>("frameWidth", 0, (v) => typeof v === "number" && v >= 0);
  const [dark, setDark] = useStoredState<boolean>("dark", false, (v) => typeof v === "boolean");
  const [darkVariant, setDarkVariant] = useStoredState<DarkVariant>("darkVariant", "full", oneOf(["full", "partial"]));
  // Closed on every load: the checks never open by themselves.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("checks");
  // The editor loads the first time its view opens, then stays loaded.
  const [editorOpened, setEditorOpened] = useState(view === "editor");
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => undefined);
    api.templates().then((r) => setTemplates(r.templates)).catch(() => setTemplates([]));
  }, []);

  // Open the first template when none is selected (or the selected one is gone).
  useEffect(() => {
    if (!templates?.length) return;
    if (!selected || !templates.some((t) => t.path === selected)) select(templates[0].path, true);
  }, [templates, selected, select]);

  const render = useCallback(async (path: string, props: unknown) => {
    const seq = ++renderSeq.current;
    setRendering(true);
    try {
      const next = await api.render(path, props);
      if (seq !== renderSeq.current) return;
      setLastRender({ path, result: next });
      if (next.ok) setLastOk((all) => ({ ...all, [path]: next }));
      setVersion((v) => v + 1);
    } catch (error) {
      if (seq !== renderSeq.current) return;
      setLastRender({ path, result: { ok: false, logs: [], durationMs: 0, error: { message: (error as Error).message, phase: "load" } } });
    } finally {
      if (seq === renderSeq.current) setRendering(false);
    }
  }, []);

  // Everything shown, checked, copied or downloaded is the selected template's own render. Right after another
  // template is selected, the last render is still the previous template's: until the new one comes, the views
  // say it's rendering and there's nothing to copy, download or check, rather than the previous template's
  // content under the new one's name.
  const result = lastRender?.path === selected ? lastRender?.result : undefined;

  const override = selected ? overrides[selected] : undefined;
  useEffect(() => {
    if (selected && templates?.some((t) => t.path === selected)) void render(selected, override);
  }, [selected, override, templates, render]);

  // Any file can change what a template renders (a shared component, a data file): a new template list renders
  // the selected template again (the effect above).
  const live = useLiveChanges((event) => setTemplates(event.templates));

  // The checks of each successful render run by themselves, for the Checks button's count.
  const checkKey = selected && result?.ok ? `${selected}|${version}` : undefined;
  const compat = useCheck(() => api.compat(selected!, override), checkKey, selected, true);
  const links = useCheck(() => api.links(selected!, override), checkKey, selected, true);

  const okResult = result?.ok ? result : undefined;
  const warnings = meta?.warnings ?? [];
  const rendered = renderingSummary(result, warnings);
  const checks = okResult ? combine([rendered, clientsSummary(compat.report), linksSummary(links.report)]) : rendered;

  const copyForAi = async (): Promise<boolean> => {
    if (!selected || !result) return false;
    const [compatReport, linksReport] = await Promise.all([compat.run(), links.run()]);
    return copyText(aiPrompt(selected, result, compatReport, linksReport));
  };

  const showView = useCallback(
    (next: View) => {
      if (next === "editor") setEditorOpened(true);
      setView(next);
    },
    [setView]
  );
  const showDevice = (next: Device) => {
    setDevice(next);
    setWidth(DEVICE_WIDTH[next]);
  };

  useShortcuts({
    "/": () => filterRef.current?.focus(),
    ...Object.fromEntries(VIEWS.map((v) => [v.key, () => showView(v.id)])),
    d: () => view === "preview" && showDevice(device === "desktop" ? "phone" : "desktop"),
    t: () => view === "preview" && setDark(!dark),
    ".": () => setDrawerOpen(!drawerOpen),
    ...(drawerOpen ? { Escape: () => setDrawerOpen(false) } : {}),
  });

  useEffect(() => {
    const name = selected?.split("/").pop()?.replace(/\.[^.]+$/, "");
    document.title = name ? `${name} · Elements preview` : "Elements preview";
  }, [selected]);

  const waiting = !result && (rendering || !templates);
  const failed = result && !result.ok ? result : undefined;

  return (
    <div className="app">
      <Sidebar templates={templates} selected={selected} dir={meta?.dir} onSelect={(path) => select(path)} filterRef={filterRef} />
      <main className="main">
        <TopBar
          templatePath={selected}
          result={result}
          mode={(okResult ?? (selected ? lastOk[selected] : undefined))?.mode}
          live={live}
          builtAt={meta?.builtAt}
          view={view}
          onView={showView}
          device={device}
          onDevice={showDevice}
          dark={dark}
          onDarkToggle={() => setDark(!dark)}
          darkVariant={darkVariant}
          onDarkVariant={(variant) => {
            setDarkVariant(variant);
            setDark(true);
          }}
          checks={checks}
          drawerOpen={drawerOpen}
          onDrawer={() => setDrawerOpen(!drawerOpen)}
          onCopyForAi={result ? copyForAi : undefined}
        />
        {warnings.length > 0 && (
          <div className="banner" role="status">
            {warnings.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
        )}
        <div className="workspace">
          <div className="content">
            {rendering && <div className="progress" aria-hidden />}
            {templates && templates.length === 0 ? (
              <NoTemplates dir={meta?.dir} />
            ) : waiting ? (
              // Shown only when it takes a moment, so a quick switch between templates doesn't flash it.
              <div className="empty muted rendering" role="status">
                <span className="spinner" aria-hidden /> Rendering…
              </div>
            ) : failed ? (
              <ErrorView error={failed.error} />
            ) : okResult && selected ? (
              view === "code" ? (
                <CodeView result={okResult} templatePath={selected} tab={codeTab} onTab={setCodeTab} />
              ) : view === "preview" ? (
                <PreviewFrame
                  html={okResult.html}
                  width={width}
                  dark={dark ? darkVariant : "off"}
                  onWidthChange={setWidth}
                  onResetWidth={() => setWidth(DEVICE_WIDTH[device])}
                />
              ) : null
            ) : null}
            {editorOpened && <EditorView result={okResult} projectId={meta?.projectId} active={view === "editor" && !failed && !!okResult} />}
          </div>
          {drawerOpen && (
            <ChecksDrawer
              tab={drawerTab}
              onTab={setDrawerTab}
              onClose={() => setDrawerOpen(false)}
              checks={
                <div className="checks">
                  <RenderingChecks result={result} warnings={warnings} />
                  {okResult && (
                    <>
                      <ClientChecks report={compat.report} stale={compat.stale} loading={compat.loading} error={compat.error} />
                      <LinkChecks
                        report={links.report}
                        stale={links.stale}
                        loading={links.loading}
                        error={links.error}
                        onRecheck={STATIC ? undefined : () => void links.run(true)}
                      />
                    </>
                  )}
                </div>
              }
              props={
                <PropsEditor
                  props={selected ? (overrides[selected] ?? lastOk[selected]?.props) : undefined}
                  previewProps={selected ? (lastOk[selected]?.previewProps ?? result?.previewProps) : undefined}
                  edited={selected !== undefined && overrides[selected] !== undefined}
                  rendered={selected !== undefined && lastOk[selected] !== undefined}
                  readOnly={STATIC}
                  onApply={(props) => selected && setOverrides((o) => ({ ...o, [selected]: props }))}
                  onReset={() =>
                    selected &&
                    setOverrides((o) => {
                      const next = { ...o };
                      delete next[selected];
                      return next;
                    })
                  }
                />
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}
