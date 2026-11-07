import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { hyperTheme } from "./src/lib/shiki-theme.mjs";

export default defineConfig({
  site: "https://hyperelements.dev",
  trailingSlash: "never",
  build: { format: "directory" },
  // The guide's old address, already on the live site.
  redirects: { "/docs/migrate/elements": "/docs/migrate/unlayer-elements" },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: hyperTheme, wrap: false },
  },
});
