import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { UnlayerLogoMark } from "../components/UnlayerLogo";

const installCmd = "npm install @unlayer/react-elements";

export default function CTABanner() {
  const { copied, copy } = useCopyToClipboard();

  return (
    <section className="py-32 px-4 md:px-8 relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="absolute inset-0 bg-surface-0" />
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0 dots-grid opacity-30" />
      <div className="absolute inset-0 noise" />

      {/* Large glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.08] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full glass-card">
          <UnlayerLogoMark height={18} color="#a1a1aa" />
          <span className="text-xs font-medium text-text-secondary">Open Source & Free Forever</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold text-text-primary mb-6 tracking-tight leading-[1.1]">
          Start building{" "}
          <span className="shimmer-text">
            in minutes
          </span>
        </h2>

        <p className="text-lg text-text-secondary mb-12 max-w-xl mx-auto leading-relaxed">
          14+ components, 3 render modes, TypeScript-first. Everything you need for production-ready emails, pages, and documents.
        </p>

        {/* Install command */}
        <button
          onClick={() => copy(installCmd)}
          className="group inline-flex items-center gap-4 px-6 py-4 mb-10 rounded-xl
            glass-card hover:border-accent/30
            transition-all duration-300 cursor-pointer"
        >
          <code className="text-xs sm:text-sm md:text-base font-mono text-text-primary truncate">
            <span className="text-accent select-none">$ </span>
            {installCmd}
          </code>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200
            ${copied
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "bg-surface-2 text-text-tertiary group-hover:text-accent border border-border group-hover:border-accent/20"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </span>
        </button>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://elements.unlayer.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
          >
            Read the Docs
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="https://github.com/unlayer/elements"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl border border-border hover:border-border-light text-text-secondary hover:text-text-primary font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
