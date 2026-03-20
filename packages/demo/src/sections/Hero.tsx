import CodeBlock from "../components/CodeBlock";
import { UnlayerLogoMark } from "../components/UnlayerLogo";

const heroCode = `import { Email, Row, Column, Button, Heading } from "@unlayer/react-elements";
import { renderToHtml } from "@unlayer/react-elements";

function WelcomeEmail() {
  return (
    <Email contentWidth="560px" backgroundColor="#f4f4f5">
      <Row>
        <Column>
          <Heading text="Welcome to Acme!" headingType="h1" fontSize="26px" fontWeight={700} />
          <Button
            text="Get Started"
            backgroundColor="#6366f1"
            color="#ffffff"
            borderRadius="8px"
            padding="14px 28px"
          />
        </Column>
      </Row>
    </Email>
  );
}

const html = renderToHtml(<WelcomeEmail />);
// Ready to send via any ESP…`;

const stats = [
  { value: "14+", label: "Components", detail: "All you need" },
  { value: "3", label: "Render Modes", detail: "Email, Web, PDF" },
  { value: "0", label: "Config Files", detail: "Just works" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0 bg-surface-0" />
      <div className="absolute inset-0 aurora-bg" />

      {/* Dot grid pattern */}
      <div className="absolute inset-0 dots-grid opacity-40" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise" />

      {/* Large gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full glass-card">
              <UnlayerLogoMark height={18} color="#a1a1aa" />
              <span className="text-xs font-medium text-text-secondary">Open Source</span>
              <span className="w-px h-3 bg-border" />
              <span className="text-xs font-medium text-text-tertiary">MIT License</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-[-0.02em] text-text-primary mb-6 leading-[1.05]">
              Build emails{" "}
              <br className="hidden md:block" />
              <span className="shimmer-text">
                with React
              </span>
            </h1>

            <p className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed max-w-lg">
              Components that render to email-safe HTML, responsive web, or print-ready documents.{" "}
              <span className="text-text-primary font-medium">One API, three outputs.</span>
            </p>

            {/* Trust line */}
            <div className="flex items-center gap-2.5 mb-10 text-sm text-text-tertiary">
              <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>
                Powered by the rendering engine behind{" "}
                <a href="https://unlayer.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors font-medium">
                  Unlayer
                </a>
                , used by 100,000+ developers
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-10 mb-12">
              {stats.map((stat) => (
                <div key={stat.label} className="group">
                  <div className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-text-secondary">{stat.label}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">{stat.detail}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#templates"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
              >
                Explore Templates
                <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <a
                href="https://github.com/unlayer/elements"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-border hover:border-border-light text-text-secondary hover:text-text-primary font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Right: Code preview with floating email mockup */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Animated gradient glow behind card */}
              <div
                className="absolute -inset-6 rounded-2xl blur-3xl opacity-50"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1), rgba(236,72,153,0.05))",
                  animation: "pulse-glow 4s ease-in-out infinite",
                }}
              />

              {/* Code block */}
              <div className="relative gradient-border">
                <div className="relative rounded-2xl overflow-hidden">
                  <CodeBlock code={heroCode} language="tsx" maxHeight="480px" />
                </div>
              </div>

              {/* Floating mini email preview */}
              <div
                className="absolute -bottom-8 -left-12 w-[200px] rounded-xl border border-border bg-surface-1 shadow-2xl shadow-black/40 overflow-hidden"
                style={{ animation: "float 6s ease-in-out infinite" }}
              >
                <div className="bg-accent/10 px-4 py-3 border-b border-border">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Output</div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="h-2 w-24 rounded-full bg-surface-3" />
                  <div className="h-6 w-full rounded bg-accent/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-accent">Get Started</span>
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-surface-3" />
                  <div className="h-1.5 w-16 rounded-full bg-surface-3" />
                </div>
              </div>

              {/* Floating mode badge */}
              <div
                className="absolute -top-4 -right-4 px-3 py-2 rounded-lg glass-card shadow-xl shadow-black/20"
                style={{ animation: "float-delayed 5s ease-in-out infinite" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs font-medium text-text-secondary">3 modes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
