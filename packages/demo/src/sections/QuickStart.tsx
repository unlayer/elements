import { Highlight, themes } from "prism-react-renderer";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

const installCmd = "npm install @unlayer/react-elements";

const steps = [
  {
    num: "1",
    title: "Install",
    desc: "One dependency, zero config",
    code: `npm i @unlayer/react-elements`,
    lang: "bash",
  },
  {
    num: "2",
    title: "Build",
    desc: "Compose with JSX components",
    code: `<Body mode="email">
  <Row>
    <Column>
      <Heading>Hello</Heading>
      <Button>Click</Button>
    </Column>
  </Row>
</Body>`,
    lang: "tsx",
  },
  {
    num: "3",
    title: "Render",
    desc: "Get HTML, send anywhere",
    code: `const html = renderToHtml(
  <MyEmail />
);
// Send with any ESP`,
    lang: "tsx",
  },
];

function MiniCodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <Highlight theme={themes.nightOwl} code={code.trim()} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className="overflow-hidden rounded-lg bg-[#0a0a0f] p-4 border border-white/[0.04]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <code className="text-[12px] leading-[1.7]">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

export default function QuickStart() {
  const { copied, copy } = useCopyToClipboard();

  return (
    <section id="quick-start" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.06),transparent_60%)]" />
      <div className="absolute inset-0 noise" />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-medium text-accent">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get started in seconds
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary text-center mb-4 tracking-tight">
          Three steps to your first email
        </h2>
        <p className="text-lg text-text-secondary text-center mb-14 max-w-lg mx-auto">
          No config files, no build plugins. Just install, compose, and ship.
        </p>

        {/* Install command — hero-sized */}
        <div className="mb-16">
          <button
            onClick={() => copy(installCmd)}
            className="group w-full max-w-xl mx-auto flex items-center gap-4 px-6 py-4 rounded-xl
              glass-card hover:border-accent/30
              transition-all duration-300 cursor-pointer"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent flex-shrink-0 border border-accent/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <code className="flex-1 text-left text-xs sm:text-sm md:text-base font-mono text-text-primary tracking-tight truncate">
              <span className="text-accent select-none">$ </span>
              {installCmd}
            </code>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0
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
        </div>

        {/* Three steps with connecting line */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px">
            <div className="w-full h-full bg-border" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="h-full rounded-xl glass-card p-6 transition-all duration-300 hover:border-accent/20 bento-card">
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-3 text-text-secondary text-sm font-bold border border-border">
                      {step.num}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-primary block">{step.title}</span>
                      <span className="text-xs text-text-tertiary">{step.desc}</span>
                    </div>
                  </div>

                  {/* Code */}
                  <div className="mt-4">
                    <MiniCodeBlock code={step.code} lang={step.lang} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package manager hint */}
        <p className="text-center text-xs text-text-tertiary mt-10">
          Works with npm, yarn, pnpm, and bun. TypeScript types included.
        </p>
      </div>
    </section>
  );
}
