import { defineConfig } from "tsup";

export default defineConfig({
  // dark-mode.js is the preview's dark mode simulation as a module on its own: `screenshot --dark` loads it into
  // the page it captures (nothing else imports it, so it stays one self-contained file).
  entry: { bin: "src/bin.ts", cli: "src/cli.ts", index: "src/index.ts", "dark-mode": "shared/darkMode.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  dts: { entry: "src/index.ts" },
  splitting: true,
  // The preview app builds into dist/ui after this: keep it out of tsup's clean.
  clean: ["!ui/**"],
  // Loaded at run time: Vite, Prettier, caniemail and Puppeteer from this package's
  // dependencies; Elements and React only ever from the project.
  external: ["vite", "prettier", "caniemail", "htmlparser2", "puppeteer-core", "react", "react-dom", "@unlayer/react-elements", "./cli.js"],
});
