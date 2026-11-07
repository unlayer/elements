/** Names and links in one place, so the rename is one edit. */
export const site = {
  name: "Hyper Elements",
  url: "https://hyperelements.dev",
  github: "https://github.com/hyper-elements/hyper-elements",
  npm: "https://www.npmjs.com/org/hyper-elements",
  pkg: "@hyper-elements/react",
  install: "npm i @hyper-elements/react",
  migrate: "npx @hyper-elements/migrate",
  skill: "npx skills add hyper-elements/hyper-elements",
  /** The engine's version line, shown in the header; links to the releases. */
  version: "0.3",
  releases: "https://github.com/hyper-elements/hyper-elements/releases",
  repo: "hyper-elements/hyper-elements",
  description:
    "The content engine for agents: React components your agent writes, rendered to emails, pages, PDFs and images, checked in every client, with the fix for what's wrong.",
};

export const mainNav = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
  { href: "/templates", label: "Templates" },
  { href: "/ai", label: "AI" },
  { href: "/migrate", label: "Migrate" },
];

export type DocLink = { slug: string; label: string };
export type DocGroup = { title: string; items: DocLink[] };

/** The docs sidebar. A slug is the path after /docs/ ("" is /docs). Component pages are added from the reference. */
export const docsNav: DocGroup[] = [
  {
    title: "Get started",
    items: [
      { slug: "", label: "Introduction" },
      { slug: "quickstart", label: "Quickstart" },
    ],
  },
  {
    title: "Core concepts",
    items: [
      { slug: "templates", label: "Templates and roots" },
      { slug: "layout", label: "Layout" },
      { slug: "styles", label: "Styles, phones and hover" },
      { slug: "rendering", label: "Rendering" },
      { slug: "diagnostics", label: "Diagnostics" },
      { slug: "custom-components", label: "Your own components" },
    ],
  },
  {
    title: "Outputs",
    items: [
      { slug: "outputs/email", label: "Email" },
      { slug: "outputs/page", label: "Web pages" },
      { slug: "outputs/pdf", label: "Documents and PDF" },
      { slug: "outputs/image", label: "Images" },
    ],
  },
  {
    title: "Guides",
    items: [
      { slug: "guides/sending", label: "Sending email" },
      { slug: "guides/nextjs", label: "Next.js" },
      { slug: "guides/ai-agents", label: "AI agents" },
      { slug: "benchmark", label: "Agent benchmark" },
      { slug: "guides/visual-editor", label: "Visual editing" },
    ],
  },
  {
    title: "Migrate",
    items: [
      { slug: "migrate/react-email", label: "From React Email" },
      { slug: "migrate/elements", label: "From older Elements" },
    ],
  },
];

/** Order of component groups in the sidebar and on /components. */
export const componentGroups = ["Roots", "Sections and layout", "Blocks", "Inline", "Parts", "Shapes", "Reference"];

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : "/docs");
