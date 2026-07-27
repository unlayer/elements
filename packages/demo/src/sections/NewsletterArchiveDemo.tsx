import { useMemo } from "react";
import { renderToHtmlParts } from "@unlayer/react-elements";
import { newsletterTemplate, type NewsletterOutput } from "../templates/NewsletterDigest";
import SectionHeader from "../components/SectionHeader";
import DeviceFrame from "../components/DeviceFrame";
import CodeBlock from "../components/CodeBlock";

const snippet = `// One tree, two outputs — only the wrapper changes.
function newsletterTemplate(output: "email" | "web") {
  const Wrapper = output === "web" ? Page : Email;
  return (
    <Wrapper backgroundColor="#f9f9f4" contentWidth="560px">
      {/* ...masthead, featured article, article list, footer... */}
    </Wrapper>
  );
}

// Send this:
const email = renderToHtml(newsletterTemplate("email")); // tables, Outlook-safe
// Publish this at /archive/issue-47:
const page = renderToHtml(newsletterTemplate("web"));    // div + flexbox`;

const outputs: { id: NewsletterOutput; wrapper: string; label: string; blurb: string }[] = [
  {
    id: "email",
    wrapper: "Email",
    label: "In the inbox",
    blurb: "Nested tables with inlined styles — what Outlook and Gmail need.",
  },
  {
    id: "web",
    wrapper: "Page",
    label: "In the browser",
    blurb: "Semantic divs and flexbox — the archive page you link from “View in browser”.",
  },
];

export default function NewsletterArchiveDemo() {
  const rendered = useMemo(
    () =>
      outputs.map((output) => {
        try {
          const { head, body } = renderToHtmlParts(newsletterTemplate(output.id), {
            mode: output.id,
          });
          return { ...output, head, body };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return { ...output, head: "", body: `<!-- Render error: ${message} -->` };
        }
      }),
    []
  );

  return (
    <section id="newsletter-archive" className="py-28 px-4 md:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,93,4,0.05),transparent_55%)]" />
      <div className="absolute inset-0 noise" />

      <div className="relative">
        <SectionHeader
          badge="Email → Web"
          title="Send the email, publish the archive"
          description="The Weekly Brief newsletter rendered twice from the exact same component tree. The rows, columns, and copy are identical — only the wrapper differs."
        />

        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rendered.map((output) => (
              <div key={output.id} className="flex flex-col gap-3">
                <div className="flex items-baseline gap-3 px-1">
                  <code className="text-sm font-mono font-semibold text-accent">
                    {`<${output.wrapper}>`}
                  </code>
                  <span className="text-sm font-medium text-text-primary">{output.label}</span>
                </div>
                <p className="text-xs text-text-tertiary px-1 leading-relaxed">{output.blurb}</p>
                <DeviceFrame html={output.body} device="desktop" headContent={output.head} />
              </div>
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
