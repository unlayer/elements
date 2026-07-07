import type { RenderMode } from "./types";

export interface HeadConfig {
  hasFeature?: (featureName: string) => boolean;
  getInitialValues?: (containerType: string) => Record<string, any>;
}

export interface UnlayerConfig {
  cdnBaseUrl: string;
  toSafeHtml?: (text: string, options?: any) => string;
  textDirection?: "ltr" | "rtl";
  mergeTagState?: Record<string, any>;
  mode?: RenderMode;
  headConfig?: HeadConfig;
  /**
   * What to do when a component fails to render.
   * - `"throw"`: propagate the error — `renderToHtml`/`renderToHtmlParts`/
   *   `renderToPlainText` default to this so a server pipeline fails loudly
   *   instead of sending an incomplete document.
   * - `"render-fallback"`: log and render a visible error placeholder —
   *   the default when components are rendered directly (interactive apps,
   *   Storybook), where a partial page beats a crash.
   */
  onError?: "throw" | "render-fallback";
}

export const DEFAULT_CONFIG: UnlayerConfig = Object.freeze({
  cdnBaseUrl: "https://cdn.tools.unlayer.com",
  mode: "web",
});
