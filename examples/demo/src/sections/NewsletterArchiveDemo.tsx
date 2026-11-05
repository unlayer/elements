import type { ReactElement } from "react";
import { useRender } from "../hooks/useRender";
import { newsletterTemplate, type NewsletterOutput } from "../templates/NewsletterDigest";
import SectionHeader from "../components/SectionHeader";
import DeviceFrame from "../components/DeviceFrame";
import CodeBlock from "../components/CodeBlock";

const snippet = `// One content, two outputs — only the root changes.
const Newsletter = () => (
  <>
    {/* ...masthead, featured article, article list, footer... */}
  </>
);

const style = { backgroundColor: "#f9f9f4" };

// Send this (tables, Outlook-safe):
const email = await render(
  <Email width={560} style={style}><Newsletter /></Email>
);
// Publish this at /archive/issue-47 (div + flexbox):
const page = await render(
  <Page width={560} style={style}><Newsletter /></Page>
);`;

const outputs: { id: NewsletterOutput; root: string; label: string; blurb: string; template: ReactElement }[] = [
  {
    id: "email",
    root: "Email",
    label: "In the inbox",
    blurb: "Nested tables with inlined styles — what Outlook and Gmail need.",
    template: newsletterTemplate("email"),
  },
  {
    id: "web",
    root: "Page",
    label: "In the browser",
    blurb: "Semantic divs and flexbox — the archive page you link from “View in browser”.",
    template: newsletterTemplate("web"),
  },
];

function OutputPreview({ output }: { output: (typeof outputs)[number] }) {
  const { html } = useRender(output.template);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3 px-1">
        <code className="text-sm font-mono font-semibold text-accent">
          {`<${output.root}>`}
        </code>
        <span className="text-sm font-medium text-text-primary">{output.label}</span>
      </div>
      <p className="text-xs text-text-tertiary px-1 leading-relaxed">{output.blurb}</p>
      <DeviceFrame html={html} device="desktop" />
    </div>
  );
}

export default function NewsletterArchiveDemo() {
  return (
    <section id="newsletter-archive" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,93,4,0.05),transparent_55%)]" />
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Email → Web"
          title="Send the email, publish the archive"
          description="The Weekly Brief newsletter rendered twice from the same content component. The rows, columns, and copy are identical — only the root differs."
        />

        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {outputs.map((output) => (
              <OutputPreview key={output.id} output={output} />
            ))}
          </div>

          <div className="mt-10 max-w-3xl mx-auto">
            <CodeBlock code={snippet} language="tsx" maxHeight="420px" />
            <p className="mt-4 text-sm text-text-tertiary leading-relaxed text-center">
              No second template to keep in sync. Swap <code className="text-accent font-mono">{"<Email>"}</code> for{" "}
              <code className="text-accent font-mono">{"<Page>"}</code> and the same content ships to both the inbox
              and the web — see the <span className="text-text-secondary">Newsletter Web Archive</span> entry above
              for the full source.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
