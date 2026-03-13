/**
 * Exporter Resolution Utilities
 *
 * Types and helpers for working with exporters.
 * Components import their specific exporters directly from @unlayer-dev/exporters
 * for tree-shaking support.
 */

export type DisplayMode = "web" | "email" | "document";

export interface ExporterBundle {
  exporters: Record<string, Record<string, Function>>;
  heads: Record<string, any>;
  [key: string]: any;
}

/**
 * Resolve an exporter function from a bundle (for dynamic/advanced use)
 */
export function resolveExporter(
  bundle: ExporterBundle | any,
  type: string,
  mode: DisplayMode = "web"
): Function {
  if (!bundle?.exporters) {
    throw new Error(
      "Unlayer exporters not loaded. Check package installation."
    );
  }

  const renderer = bundle.exporters[type];
  if (!renderer) {
    const available = Object.keys(bundle.exporters || {}).join(", ");
    throw new Error(
      `Renderer '${type}' not found. Available renderers: ${available}`
    );
  }

  const exporter = renderer[mode] || renderer.web;
  if (!exporter) {
    const availableModes = Object.keys(renderer || {}).join(", ");
    throw new Error(
      `Mode '${mode}' not available for '${type}'. Available modes: ${availableModes}`
    );
  }

  return exporter;
}

/**
 * Resolve a head export from a bundle (for dynamic/advanced use)
 */
export function resolveHead(
  bundle: ExporterBundle | any,
  type: string
): any {
  if (!bundle?.heads) {
    throw new Error("Unlayer heads not loaded.");
  }

  const head = bundle.heads[type];
  if (!head) {
    const available = Object.keys(bundle.heads || {})
      .filter(k => bundle.heads[k])
      .join(", ");
    throw new Error(
      `Head export '${type}' not found. Available: ${available}`
    );
  }

  return head;
}
