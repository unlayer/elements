interface DeviceFrameProps {
  /** The whole document, as render() gives it */
  html: string;
  device: "desktop" | "mobile";
  className?: string;
}

export default function DeviceFrame({ html, device, className = "" }: DeviceFrameProps) {
  const isDesktop = device === "desktop";

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
                  srcDoc={html}
                  title="Email preview"
                  className="border-0"
                  sandbox="allow-same-origin"
                  // A phone's own width, so a template's phone styles apply.
                  style={{
                    width: "374px",
                    height: "660px",
                    background: "#f5f5f7",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {isDesktop && (
          <iframe
            srcDoc={html}
            title="Email preview"
            className="border-0 w-full h-[400px] sm:h-[550px] md:h-[650px] bg-white"
            /* no sandbox — needed for :hover CSS to work in srcdoc iframes */
          />
        )}
      </div>
    </div>
  );
}
