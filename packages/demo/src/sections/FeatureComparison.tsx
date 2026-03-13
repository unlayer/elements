import SectionHeader from "../components/SectionHeader";

const features = [
  {
    title: "Three Render Modes",
    description:
      "The same component tree renders to email-safe tables, responsive web divs, or print-optimized documents. Switch modes with a single prop.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    tag: "web | email | document",
  },
  {
    title: "Plain Text Generation",
    description:
      "Automatically generate a plain text version of any template. Accessible, spam-filter friendly, and required by most ESPs.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
    tag: "renderToPlainText()",
  },
  {
    title: "Semantic Props API",
    description:
      "No more inline style objects or raw HTML attributes. Configure components with clear, typed props like fontSize, padding, and borderRadius.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    tag: "TypeScript-first",
  },
  {
    title: "Built-in Column Layouts",
    description:
      "Pre-configured layout presets — one column, two equal, sidebar left/right, three columns, and more. No manual width math.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
      </svg>
    ),
    tag: "ColumnLayouts.*",
  },
  {
    title: "Battle-Tested Renderers",
    description:
      "Powered by the same rendering engine behind the Unlayer drag-and-drop editor, used by over 100,000 developers and designers worldwide.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    tag: "Production-proven",
  },
  {
    title: "Server-Side Ready",
    description:
      "Render HTML on the server with no browser dependencies. Perfect for API routes, background jobs, and serverless functions.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    tag: "No DOM required",
  },
];

export default function FeatureComparison() {
  return (
    <section id="features" className="py-28 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Why Unlayer Elements"
          title="Everything you need, nothing you don't"
          description="Purpose-built for teams that want full control over their email and document templates without fighting HTML tables."
        />

        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group glow-card rounded-xl border border-border bg-surface-1/80 p-6 transition-all duration-300 hover:border-border-light bento-card"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="inline-block text-[10px] font-mono font-medium px-2.5 py-1 rounded-md bg-surface-3 text-text-tertiary group-hover:text-accent group-hover:bg-accent/10 transition-colors duration-200">
                  {feature.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
