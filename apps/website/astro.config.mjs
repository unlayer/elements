import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { hyperTheme } from "./src/lib/shiki-theme.mjs";

export default defineConfig({
  site: "https://hyperelements.dev",
  trailingSlash: "never",
  build: { format: "directory" },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: hyperTheme, wrap: false },
  },
});
