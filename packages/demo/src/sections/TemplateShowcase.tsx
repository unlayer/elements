import { useState } from "react";
import { templates } from "../templates";
import { useRenderTemplate } from "../hooks/useRenderTemplate";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import DeviceFrame from "../components/DeviceFrame";
import CodeBlock from "../components/CodeBlock";
import CopyButton from "../components/CopyButton";

type ViewTab = "preview" | "code" | "html" | "plaintext";
type Device = "desktop" | "mobile";

const viewTabs = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
  { id: "html", label: "HTML" },
  { id: "plaintext", label: "Plain Text" },
];

const categoryLabels: Record<string, string> = {
  onboarding: "Onboarding",
  transactional: "Transactional",
  notification: "Notification",
  security: "Security",
};

export default function TemplateShowcase() {
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [activeTab, setActiveTab] = useState<ViewTab>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const { head, html, plainText, sourceCode } = useRenderTemplate(selectedId);

  const selected = templates.find((t) => t.id === selectedId)!;

  // Group templates by category
  const grouped = templates.reduce<Record<string, typeof templates>>(
    (acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    },
    {}
  );

  return (
    <section id="templates" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.04),transparent_50%)]" />
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Templates"
          title="Production-ready templates"
          description="Real-world templates built with Unlayer Elements. Switch render modes to see how the same code adapts."
        />

        <div className="max-w-[1400px] mx-auto">
          <div className="gradient-border">
            <div className="flex flex-col lg:flex-row gap-0 rounded-2xl border border-border bg-surface-1/80 overflow-hidden shadow-2xl shadow-black/30 backdrop-blur-sm">
              {/* --- Sidebar --- */}
              <aside className="lg:w-[280px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface-0/60">
                {/* Mobile: horizontal scrollable template list */}
                <div className="lg:hidden overflow-x-auto">
                  <div className="flex gap-2 p-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedId(t.id);
                          setActiveTab("preview");
                        }}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                          t.id === selectedId
                            ? "bg-accent/[0.08] text-text-primary border border-accent/15"
                            : "text-text-secondary hover:text-text-primary bg-surface-2/30 border border-transparent"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.colorAccent }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop: vertical sidebar list */}
                <div className="hidden lg:block p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4 px-2">
                    Templates
                  </h3>
                  <nav className="space-y-5">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary/60 mb-1.5 px-2">
                          {categoryLabels[category] ?? category}
                        </p>
                        <ul className="space-y-0.5">
                          {items.map((t) => (
                            <li key={t.id}>
                              <button
                                onClick={() => {
                                  setSelectedId(t.id);
                                  setActiveTab("preview");
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-3 group
                                  ${
                                    t.id === selectedId
                                      ? "bg-accent/[0.08] text-text-primary border border-accent/15"
                                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2/50 border border-transparent"
                                  }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${
                                    t.id === selectedId ? "scale-125" : "group-hover:scale-110"
                                  }`}
                                  style={{ backgroundColor: t.colorAccent }}
                                />
                                <span className="flex flex-col min-w-0">
                                  <span className="font-medium truncate">{t.name}</span>
                                  <span className="text-[11px] text-text-tertiary truncate">{t.inspiration}-inspired</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* --- Main content --- */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface-0/30">
                  <div className="flex items-center gap-3">
                    <TabBar
                      tabs={viewTabs}
                      activeTab={activeTab}
                      onTabChange={(id) => setActiveTab(id as ViewTab)}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {activeTab === "preview" && (
                      <div className="flex items-center gap-1 rounded-lg bg-surface-1 border border-border p-0.5">
                        <button
                          onClick={() => setDevice("desktop")}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            device === "desktop" ? "bg-surface-3 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                          }`}
                          title="Desktop view"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDevice("mobile")}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            device === "mobile" ? "bg-surface-3 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                          }`}
                          title="Mobile view"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 p-5 overflow-auto bg-surface-0/20">
                  {activeTab === "preview" && (
                    <DeviceFrame html={html} device={device} headContent={head} />
                  )}

                  {activeTab === "code" && (
                    <CodeBlock code={sourceCode} language="tsx" maxHeight="700px" />
                  )}

                  {activeTab === "html" && (
                    <div className="relative">
                      <div className="absolute top-3 right-3 z-10">
                        <CopyButton text={html} />
                      </div>
                      <CodeBlock code={html} language="html" showCopy={false} maxHeight="700px" />
                    </div>
                  )}

                  {activeTab === "plaintext" && (
                    <div className="relative">
                      <div className="absolute top-3 right-3 z-10">
                        <CopyButton text={plainText} />
                      </div>
                      <pre className="bg-[#0a0a0f] rounded-lg p-5 text-[13px] leading-[1.7] text-text-secondary overflow-auto max-h-[700px] font-mono whitespace-pre-wrap border border-white/[0.04]">
                        {plainText}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Bottom info bar */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 border-t border-border bg-surface-0/30 text-xs text-text-tertiary">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selected.colorAccent }}
                  />
                  <span className="font-medium text-text-secondary truncate">{selected.name}</span>
                  <span className="hidden sm:inline text-text-tertiary">&mdash;</span>
                  <span className="hidden sm:inline truncate">{selected.description}</span>
                  <span className="ml-auto text-[11px] text-text-tertiary hidden md:inline flex-shrink-0">
                    Rendering as <span className="text-accent font-medium">Email</span> mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
