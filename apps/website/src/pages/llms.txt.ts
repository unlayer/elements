import type { APIRoute } from "astro";
import { abs, docsInOrder, header, referenceInOrder } from "../lib/llms";
import { templates } from "../lib/examples";
import { site } from "../lib/site";

export const GET: APIRoute = async () => {
  const docs = await docsInOrder();
  const reference = await referenceInOrder();
  const groups = [...new Set(docs.map((d) => d.group))];
  const lines = [header];
  for (const g of groups) {
    lines.push(`## ${g}\n`);
    for (const d of docs.filter((x) => x.group === g)) lines.push(`- [${d.entry!.data.title}](${abs(d.slug)}): ${d.entry!.data.description}`);
    lines.push("");
  }
  lines.push("## Components\n", `- [Components](${abs("components")}): how every component takes its props and its style, and the full list`);
  for (const r of reference) lines.push(`- [${r.data.title}](${abs(`components/${r.id}`)}): ${r.data.summary}`);
  // Each template's page has its full source, rendered output and diagnostics.
  lines.push("", "## Templates\n");
  for (const t of templates) lines.push(`- [${t.title}](${site.url}/templates/${t.slug}): <${t.root}>. ${t.description}`);
  lines.push(
    "",
    "## Optional\n",
    `- [Everything in one file](${site.url}/llms-full.txt): every docs page and the full component reference`,
    `- [For AI agents](${site.url}/ai): how Hyper Elements is built for coding agents`,
    `- [Migrate from React Email](${site.url}/migrate): convert React Email templates in one command`,
    `- [Source](${site.github})`,
    "",
  );
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
};
