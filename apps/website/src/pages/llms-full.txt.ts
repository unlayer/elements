import type { APIRoute } from "astro";
import { abs, absoluteLinks, docsInOrder, header, referenceInOrder, referenceOverview } from "../lib/llms";

export const GET: APIRoute = async () => {
  const docs = await docsInOrder();
  const overview = await referenceOverview();
  const reference = await referenceInOrder();
  const parts = [header];
  for (const d of docs) parts.push(`---\n\n# ${d.entry!.data.title}\n\nSource: ${abs(d.slug)}\n\n${d.entry!.body?.trim()}\n`);
  parts.push(`---\n\n# Components reference\n\nSource: ${abs("components")}\n\n${overview?.body?.trim() ?? ""}\n`);
  for (const r of reference) parts.push(`## ${r.data.title}\n\nSource: ${abs(`components/${r.id}`)}\n\n${r.body?.trim()}\n`);
  return new Response(absoluteLinks(parts.join("\n")), { headers: { "content-type": "text/plain; charset=utf-8" } });
};
