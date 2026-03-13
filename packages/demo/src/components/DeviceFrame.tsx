import { useMemo } from "react";

interface DeviceFrameProps {
  html: string;
  device: "desktop" | "mobile";
  className?: string;
  /** Optional <head> content (style/script tags) from renderToHtmlParts */
  headContent?: string;
}

/**
 * Strip the outer React <div> wrapper from renderToHtml() output, then wrap
 * in a proper HTML document for the iframe.  renderToHtml produces:
 *   <div><body class="..." style="...">...</body></div>          (email/document)
 *   <div><div id="u_body_1" style="...">...</div></div>          (web)
 * Browsers can't handle nested <body> tags, so we extract the inner content.
 */
function wrapInDocument(rawHtml: string, isMobile: boolean, headContent?: string): string {
  let inner = rawHtml;

  // Strip outer <div>...</div> wrapper added by React Body component
  if (inner.startsWith("<div>") && inner.endsWith("</div>")) {
    inner = inner.slice(5, -6);
  } else if (inner.startsWith("<div ")) {
    const closeIdx = inner.indexOf(">");
    if (closeIdx !== -1) {
      inner = inner.slice(closeIdx + 1);
      if (inner.endsWith("</div>")) {
        inner = inner.slice(0, -6);
      }
    }
  }

  // If the inner content starts with <body, place it directly
  // Otherwise wrap in a <body>
  const hasBody = inner.trimStart().startsWith("<body");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${headContent || ""}
  <style>
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    /* Document mode: the exporter outputs a bare body+div with no background.
       Add a subtle page-like container so it doesn't look broken. */
    body > .u_body.content {
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 32px;
      background: #ffffff;
      min-height: 100vh;
      box-sizing: border-box;
    }
    /* Web mode: div-based layout, constrain width */
    body > .u_body:not(.content):not(.clean-body) {
      min-height: 100vh;
    }
    /* Mobile adjustments */
    ${isMobile ? `
    body > .u_body.content {
      padding: 24px 16px;
    }
    ` : ""}
    /* Prevent table overflow on mobile */
    table {
      max-width: 100%;
      word-break: break-word;
    }
    td {
      word-break: break-word;
    }
  </style>
</head>
${hasBody ? inner : `<body>${inner}</body>`}
</html>`;
}

export default function DeviceFrame({ html, device, className = "", headContent }: DeviceFrameProps) {
  const isDesktop = device === "desktop";
  const srcDoc = useMemo(() => wrapInDocument(html, !isDesktop, headContent), [html, isDesktop, headContent]);

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border border-border bg-surface-1 ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-2 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-2 sm:mx-8">
          <div className="bg-surface-0 rounded-md px-3 py-1 text-[10px] sm:text-[11px] text-text-tertiary font-mono truncate text-center max-w-[240px] mx-auto">
            preview.unlayer.com
          </div>
        </div>
        <div className="w-[36px] sm:w-[54px]" />
      </div>

      {/* Content area */}
      <div
        className={`flex justify-center overflow-auto transition-colors duration-200 ${
          isDesktop ? "bg-[#e5e5e5]" : "bg-[#1a1a1a] py-6"
        }`}
      >
        {!isDesktop && (
          <div className="flex flex-col items-center scale-[0.7] sm:scale-100 origin-top">
            {/* Phone frame */}
            <div className="relative w-[390px] rounded-[2.5rem] border-[8px] border-[#2a2a2a] bg-white overflow-hidden shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#2a2a2a] rounded-b-2xl z-10" />
              <div style={{ width: "374px", height: "660px", overflow: "hidden" }}>
                <iframe
                  srcDoc={srcDoc}
                  title="Email preview"
                  className="border-0"
                  sandbox="allow-same-origin"
                  style={{
                    width: "748px",
                    height: "1320px",
                    background: "#f5f5f7",
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {isDesktop && (
          <iframe
            srcDoc={srcDoc}
            title="Email preview"
            className="border-0 w-full h-[400px] sm:h-[550px] md:h-[650px] bg-white"
            /* no sandbox — needed for :hover CSS to work in srcdoc iframes */
          />
        )}
      </div>
    </div>
  );
}
