import type { APIRoute } from "astro";
import { docsInOrder, referenceInOrder } from "../lib/llms";
import { docHref } from "../lib/site";

/** What the ⌘K search looks through: every docs page and its sections, and every component. */
export const GET: APIRoute = async () => {
  const docs = await docsInOrder();
  const reference = await referenceInOrder();
  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  const items: { title: string; sub: string; href: string }[] = [];
  for (const d of docs) {
    const e = d.entry!;
    items.push({ title: e.data.title, sub: `${d.group} · ${e.data.description}`, href: docHref(d.slug) });
    for (const m of (e.body ?? "").matchAll(/^##+ (.+)$/gm)) {
      const h = m[1].replace(/`/g, "");
      items.push({ title: h, sub: e.data.title, href: `${docHref(d.slug)}#${slugify(h)}` });
    }
  }
  for (const r of reference) items.push({ title: r.data.title, sub: `Component · ${r.data.summary}`, href: `/docs/components/${r.id}` });
  return new Response(JSON.stringify(items), { headers: { "content-type": "application/json" } });
};
