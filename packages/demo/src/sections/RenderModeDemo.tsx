import { useState, useMemo } from "react";
import {
  renderToHtmlParts,
  Email,
  Page,
  Document,
  Row,
  Column,
  Heading,
  Paragraph,
  Button,
  Divider,
  ColumnLayouts,
} from "@unlayer/react-elements";
import SectionHeader from "../components/SectionHeader";
import DeviceFrame from "../components/DeviceFrame";

type Mode = "web" | "email" | "document";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

/** Compact notification template to showcase structural differences between modes */
function ModePreviewTemplate({ mode }: { mode: Mode }) {
  const Wrapper = mode === "email" ? Email : mode === "document" ? Document : Page;
  return (
    <Wrapper
      backgroundColor={mode === "document" ? "#ffffff" : "#f4f4f5"}
      textColor="#18181b"
      contentAlign="center"
      contentWidth="500px"
      fontFamily={sansFont}
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 40px">
        <Column>
          <Heading
            text="ACME"
            headingType="h4"
            fontSize="13px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1"
            letterSpacing="2px"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Accent bar */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#18181b" padding="0px">
        <Column>
          <Divider
            borderTopWidth="3px"
            borderTopColor="#18181b"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="36px 40px 0px 40px">
        <Column>
          <Heading
            text="Your monthly report is ready"
            headingType="h1"
            fontSize="22px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1.25"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Hi Alex, here's a summary of your workspace activity for February 2026."
            fontSize="14px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Stats — two columns */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Heading
            text="DEPLOYMENTS"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="142"
            headingType="h2"
            fontSize="28px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="+18% from January"
            fontSize="12px"
            color="#22c55e"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Heading
            text="UPTIME"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="99.98%"
            headingType="h2"
            fontSize="28px"
            fontWeight={700}
            color="#18181b"
            textAlign="left"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="0 incidents this month"
            fontSize="12px"
            color="#71717a"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="8px 40px 36px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Button
            text="View Full Report"
            buttonColors={{ backgroundColor: "#18181b", color: "#ffffff" }}
            padding="12px 24px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="16px 40px 24px 40px">
        <Column>
          <Paragraph
            html="Acme Inc · San Francisco, CA"
            fontSize="11px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Wrapper>
  );
}

const modes: { id: Mode; label: string; description: string; icon: string; tag: string }[] = [
  {
    id: "web",
    label: "Web",
    description: "Renders with div/flexbox for responsive web display",
    icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    tag: "div + flex",
  },
  {
    id: "email",
    label: "Email",
    description: "Renders with tables for Outlook, Gmail, Yahoo compatibility",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    tag: "table",
  },
  {
    id: "document",
    label: "Document",
    description: "Print-optimized rendering for PDF generation",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    tag: "print CSS",
  },
];

export default function RenderModeDemo() {
  const [activeMode, setActiveMode] = useState<Mode>("email");

  const html = useMemo(() => {
    try {
      const { head, body } = renderToHtmlParts(<ModePreviewTemplate mode={activeMode} />, { mode: activeMode });
      return body;
    } catch (e) {
      return `<!-- Render error: ${e instanceof Error ? e.message : String(e)} -->`;
    }
  }, [activeMode]);

  return (
    <section id="render-modes" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent_60%)]" />
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Render Modes"
          title="One template, three outputs"
          description="The same component tree renders differently depending on the target. Switch modes to see the HTML structure change."
        />

        <div className="max-w-5xl mx-auto">
          {/* Mode toggle cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`relative p-4 rounded-xl text-left transition-all duration-300 cursor-pointer bento-card ${
                  activeMode === mode.id
                    ? "glass-card border-accent/30 bg-accent/[0.06]"
                    : "glass-card hover:border-border-light"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1 sm:mb-2">
                  <svg
                    className={`w-4 h-4 ${activeMode === mode.id ? "text-accent" : "text-text-tertiary"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={mode.icon} />
                  </svg>
                  <span className={`text-sm font-semibold ${activeMode === mode.id ? "text-accent" : "text-text-primary"}`}>
                    {mode.label}
                  </span>
                  <span className={`sm:hidden inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded ml-auto ${
                    activeMode === mode.id
                      ? "bg-accent/10 text-accent"
                      : "bg-surface-3 text-text-tertiary"
                  }`}>
                    {mode.tag}
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-text-tertiary leading-relaxed">{mode.description}</p>
                <span className={`hidden sm:inline-block mt-2.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                  activeMode === mode.id
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-3 text-text-tertiary"
                }`}>
                  {mode.tag}
                </span>
                {activeMode === mode.id && (
                  <div className="absolute top-3 right-3 sm:block hidden">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Preview container with gradient border */}
          <div className="gradient-border">
            <div className="relative rounded-2xl overflow-hidden">
              <DeviceFrame html={html} device="desktop" />
            </div>
          </div>

          {/* Code hint */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-border" />
            <code className="text-sm font-mono text-text-tertiary glass-card px-4 py-2 rounded-lg">
              {'<'}
              <span className="text-accent font-semibold">{activeMode === "email" ? "Email" : activeMode === "document" ? "Document" : "Page"}</span>
              {'>'}
            </code>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
