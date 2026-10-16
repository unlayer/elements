import type { RenderMode } from "./types";
import type { OnError } from "./render-error";

export interface HeadConfig {
  hasFeature?: (featureName: string) => boolean;
  getInitialValues?: (containerType: string) => Record<string, any>;
}

export interface UnlayerConfig {
  cdnBaseUrl: string;
  toSafeHtml?: (text: string, options?: any) => string;
  textDirection?: string;
  mergeTagState?: Record<string, any>;
  mode?: RenderMode;
  headConfig?: HeadConfig;
  /**
   * A part of the template that fails (a component that throws, a Row whose Columns don't fit its layout, an exporter
   * that fails): `"throw"` (the default) fails the render with a RenderError naming it and where it is; `"omit"` leaves
   * it out of the HTML, the plain text and the design alike, said with `console.error`; a function leaves it out and
   * is given the RenderError instead.
   */
  onError?: OnError;
}

export const DEFAULT_CONFIG: UnlayerConfig = {
  cdnBaseUrl: "https://cdn.tools.unlayer.com",
  mode: "web",
};
