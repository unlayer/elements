import { element, staticMarkup } from "./markup";

/**
 * The Html block's web and document HTML, as @unlayer/exporters' HtmlExporters write them with React (byte for
 * byte): its markup in a `<div>`, through the config's `toSafeHtml` where there's one.
 */
export function html(values: Record<string, any>, ...args: any[]): string {
  const { exporterConfig: config } = args[6] || {};
  return staticMarkup(element("div", { dangerouslySetInnerHTML: { __html: config?.toSafeHtml ? config.toSafeHtml(values.html) : values.html } }));
}
