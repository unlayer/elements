import { Highlight, themes } from "prism-react-renderer";
import { componentsMeta, groupOrder } from "../data/components-metadata";
import SectionHeader from "../components/SectionHeader";

const groupConfig: Record<string, { color: string; gradient: string; icon: JSX.Element }> = {
  Layout: {
    color: "#6366f1",
    gradient: "from-indigo-500/10 to-indigo-500/5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
      </svg>
    ),
  },
  Content: {
    color: "#22c55e",
    gradient: "from-green-500/10 to-green-500/5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  Interactive: {
    color: "#f59e0b",
    gradient: "from-amber-500/10 to-amber-500/5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
    ),
  },
  Media: {
    color: "#ec4899",
    gradient: "from-pink-500/10 to-pink-500/5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
  },
  Data: {
    color: "#06b6d4",
    gradient: "from-cyan-500/10 to-cyan-500/5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
      </svg>
    ),
  },
};

function MiniCode({ code }: { code: string }) {
  return (
    <Highlight theme={themes.nightOwl} code={code.trim()} language="tsx">
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className="overflow-x-auto rounded-lg bg-[#0a0a0f] p-3 border border-white/[0.04]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <code className="text-[11px] leading-[1.6]">
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

export default function ComponentGallery() {
  return (
    <section id="components" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Components"
          title="14 components, infinite possibilities"
          description="Everything you need to build emails, landing pages, and documents. Each component renders clean, semantic output across all modes."
        />

        <div className="max-w-6xl mx-auto">
          {groupOrder.map((group) => {
            const items = componentsMeta.filter((c) => c.group === group);
            const config = groupConfig[group];
            return (
              <div key={group} className="mb-14 last:mb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg border"
                    style={{
                      backgroundColor: `${config.color}10`,
                      borderColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">{group}</h3>
                  <span className="text-xs text-text-tertiary glass-card px-2.5 py-1 rounded-md">
                    {items.length} component{items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((comp) => (
                    <div
                      key={comp.name + comp.description}
                      className="glow-card rounded-xl border border-border bg-surface-1/80 p-5 transition-all duration-300 hover:border-border-light bento-card"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-text-primary font-mono">
                          <span className="text-text-tertiary">{"<"}</span>
                          <span style={{ color: config.color }}>{comp.name}</span>
                          <span className="text-text-tertiary">{" />"}</span>
                        </h4>
                      </div>
                      <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                        {comp.description}
                      </p>
                      <MiniCode code={comp.code} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
