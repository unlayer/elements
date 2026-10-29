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
  /**
   * The editor's merge tag state its Table exporter reads, not values for merge tags (Elements writes `{{name}}` as
   * it is, for an email service to fill in): `{ mergeTags, mergeTagGroup, mergeTagRule }`, `mergeTags` as
   * `unlayer.init({ mergeTags })` takes them. A Table whose values name the same group and rule has its rows between
   * the rule's `before` and `after`.
   */
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
  /**
   * What the `useId()`s of the template's components start with, as React's `identifierPrefix` (`em-` gives `«em-R1»`),
   * so an email or page placed in a page of yours keeps ids apart from the page's own: the render functions' option,
   * a root's `config` or an `<UnlayerProvider>`'s. (A template component around the root takes it from the render's
   * options or an `<UnlayerProvider>` around it: it's called before the root's `config` is read.)
   */
  idPrefix?: string;
}

export const DEFAULT_CONFIG: UnlayerConfig = {
  cdnBaseUrl: "https://cdn.tools.unlayer.com",
  mode: "web",
};
