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
};

/** Images in examples point at https://hyperelements.dev/img/…; in a preview they load from this site, wherever it runs. */
export const previewHtml = (html: string) => html.replaceAll("https://hyperelements.dev/img/", "/img/");

export const templates = Object.values(data.templates) as Example[];
export const components = data.components as Record<string, Example>;
export const template = (slug: string) => (data.templates as Record<string, Example>)[slug];

// The engine's template gallery (packages/react/src/primitives/examples/gallery), in its order.
const order = ["oyen-launch", "tarn-shipped", "quarry-welcome", "pith-weekly", "saltworks-invitation", "keel-sign-in-code", "casa-albero-page", "pell-ashby-invoice", "slow-signals-card"];
templates.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

export const linesOf = (s: string) => s.split("\n").length;

/** One template (examples/showcase/_launch.tsx) with each root: the hero's four outputs. `file` is the real PNG or PDF. */
export const showcase = (data as any).showcase as Record<"email" | "page" | "document" | "canvas" | "responsive" | "receipt", Example & { file?: string }>;
