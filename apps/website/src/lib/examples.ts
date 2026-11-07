import data from "../generated/examples.json";

export type Diagnostic = { severity: string; code: string; message: string; path?: string };
export type Example = {
  slug: string;
  title: string;
  description: string;
  root?: string;
  group?: string;
  source: string;
  html: string;
  text: string;
  outline: string;
  diagnostics: Diagnostic[];
  /** A Document's PDF or a Canvas's PNG, as generate.mjs wrote it. */
  file?: string;
};

/** Images in examples point at https://hyperelements.dev/img/…; in a preview they load from this site, wherever it runs. */
export const previewHtml = (html: string) => html.replaceAll("https://hyperelements.dev/img/", "/img/");

export const templates = Object.values(data.templates) as Example[];
export const components = data.components as Record<string, Example>;
export const template = (slug: string) => (data.templates as Record<string, Example>)[slug];

// Outputs mixed, so no one kind leads: an email, an image, a document, a page, then around again.
const order = [
  "oyen-launch", "fernway-spring-sale", "pell-ashby-invoice", "casa-albero-page",
  "tarn-shipped", "crumb-club-thumbnail", "quarry-welcome", "slow-signals-card", "shipwright-ticket",
  "pith-weekly", "gridline-workshop-banner", "saltworks-invitation", "morning-pages-quote", "keel-sign-in-code",
];
templates.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

/** The width an example's thumbnail is drawn at: a Canvas at its own width (from its outline), other roots at a width that shows their layout. */
export const thumbWidth = (t: Example, widths: { page: number; document: number; email: number }) =>
  t.root === "Canvas" ? Number(t.outline.match(/^Canvas (\d+)px/)?.[1] ?? 1200) : t.root === "Page" ? widths.page : t.root === "Document" ? widths.document : widths.email;

export const linesOf = (s: string) => s.split("\n").length;

/** One template (examples/showcase/_launch.tsx) with each root: the hero's four outputs. `file` is the real PNG or PDF. */
export const showcase = (data as any).showcase as Record<"email" | "page" | "document" | "responsive", Example & { file?: string }>;
