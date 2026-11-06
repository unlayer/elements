import { getCollection } from "astro:content";
import { docHref, docsNav, site } from "./site";

/** The docs in sidebar order, for llms.txt and llms-full.txt. */
export async function docsInOrder() {
  const docs = await getCollection("docs");
  const byId = new Map(docs.map((d) => [d.id === "index" ? "" : d.id, d]));
  return docsNav.flatMap((g) => g.items.map((i) => ({ group: g.title, slug: i.slug, entry: byId.get(i.slug) }))).filter((d) => d.entry);
}

export async function referenceInOrder() {
  return (await getCollection("reference")).filter((e) => e.id !== "overview").sort((a, b) => a.data.order - b.data.order);
}

export const header = `# ${site.name}

> ${site.description}

Install: \`${site.install}\`. Import components from \`${site.pkg}\`. A template has one root (Email, Page, Document or Canvas); styles go in style={{ }}; space between blocks is the parent's gap (no margins); render() returns { html, text, diagnostics }; validate() checks without rendering; outline() prints the laid-out template as text.
`;

export const abs = (slug: string) => new URL(docHref(slug), site.url).href;
