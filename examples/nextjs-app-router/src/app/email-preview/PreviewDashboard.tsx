"use client";

import { useState } from "react";
import Link from "next/link";

interface PreviewDashboardProps {
  initialHtml: string;
  initialText: string;
  recipientName: string;
}

type Tab = "preview" | "raw" | "text";
type Viewport = "desktop" | "mobile";

export default function PreviewDashboard({
  initialHtml,
  initialText,
  recipientName,
}: PreviewDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    const textToCopy = activeTab === "raw" ? initialHtml : initialText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Top Navigation & Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0 }}>
          <Link href="/" style={{ color: "#71717a", fontSize: 13, textDecoration: "none" }}>
            ← back to home
          </Link>
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Welcome Email</h1>
            <p style={{ color: "#52525b", margin: 0, fontSize: 14 }}>
              Rendered on the server with <code>renderToHtml()</code> (
              {(initialHtml.length / 1024).toFixed(1)} KB)
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/email-preview/raw"
              target="_blank"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                fontSize: 14,
                color: "#18181b",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Open Raw HTML ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Viewport */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f4f4f5",
          padding: 8,
          borderRadius: 8,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Format Selector Tabs */}
        <div style={{ display: "flex", gap: 4 }} role="tablist" aria-label="Email preview formats">
          <button
            role="tab"
            aria-selected={activeTab === "preview"}
            onClick={() => setActiveTab("preview")}
            style={{
              padding: "6px 12px",
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === "preview" ? "#ffffff" : "transparent",
              color: activeTab === "preview" ? "#18181b" : "#71717a",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              boxShadow: activeTab === "preview" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
            }}
          >
            HTML Preview
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "raw"}
            onClick={() => setActiveTab("raw")}
            style={{
              padding: "6px 12px",
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === "raw" ? "#ffffff" : "transparent",
              color: activeTab === "raw" ? "#18181b" : "#71717a",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              boxShadow: activeTab === "raw" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
            }}
          >
            Raw HTML
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "text"}
            onClick={() => setActiveTab("text")}
            style={{
              padding: "6px 12px",
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === "text" ? "#ffffff" : "transparent",
              color: activeTab === "text" ? "#18181b" : "#71717a",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              boxShadow: activeTab === "text" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
            }}
          >
            Plain Text
          </button>
        </div>

        {/* Action Controls (Viewport/Copy) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {activeTab === "preview" && (
            <div
              style={{
                display: "flex",
                background: "#e4e4e7",
                padding: 2,
                borderRadius: 6,
              }}
              role="group"
              aria-label="Preview viewport width"
            >
              <button
                aria-label="Desktop preview"
                onClick={() => setViewport("desktop")}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: viewport === "desktop" ? "#ffffff" : "transparent",
                  color: viewport === "desktop" ? "#18181b" : "#71717a",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Desktop
              </button>
              <button
                aria-label="Mobile preview"
                onClick={() => setViewport("mobile")}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: viewport === "mobile" ? "#ffffff" : "transparent",
                  color: viewport === "mobile" ? "#18181b" : "#71717a",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Mobile
              </button>
            </div>
          )}

          {activeTab !== "preview" && (
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 500,
                background: "#18181b",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {copying ? "Copied!" : activeTab === "raw" ? "Copy HTML" : "Copy Plain Text"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          border: "1px solid #e4e4e7",
          borderRadius: 8,
          background: "#ffffff",
          minHeight: 600,
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
          overflow: "hidden",
        }}
      >
        {activeTab === "preview" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              background: "#f4f4f5",
              padding: viewport === "mobile" ? "20px 0" : 0,
              transition: "padding 0.2s ease",
            }}
          >
            <iframe
              srcDoc={initialHtml}
              title="Email HTML Preview"
              style={{
                width: viewport === "mobile" ? 375 : "100%",
                height: 720,
                border: "none",
                background: "#ffffff",
                boxShadow:
                  viewport === "mobile" ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        )}

        {activeTab === "raw" && (
          <pre
            style={{
              margin: 0,
              padding: 20,
              width: "100%",
              overflow: "auto",
              fontSize: 13,
              fontFamily: "monospace",
              background: "#18181b",
              color: "#f4f4f5",
              whiteSpace: "pre-wrap",
            }}
          >
            {initialHtml}
          </pre>
        )}

        {activeTab === "text" && (
          <pre
            style={{
              margin: 0,
              padding: 20,
              width: "100%",
              overflow: "auto",
              fontSize: 14,
              fontFamily: "monospace",
              background: "#fafafa",
              color: "#18181b",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
            }}
          >
            {initialText}
          </pre>
        )}
      </div>
    </main>
  );
}
