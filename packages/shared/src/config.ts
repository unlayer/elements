import type { RenderMode } from "./types";

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
}

export const DEFAULT_CONFIG: UnlayerConfig = {
  cdnBaseUrl: "https://cdn.tools.unlayer.com",
  mode: "web",
};
