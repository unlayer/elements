/**
 * Where a root's config comes from, most specific first: a render function's options, the root's own `config` prop
 * (with its `textDirection` prop just under it), the nearest <UnlayerProvider>'s config, then DEFAULT_CONFIG. Merged
 * key by key: a key a layer leaves out, or sets to undefined, comes from the layer under it.
 *
 * The render functions, Body and renderToJson all work a root's config out here, so the HTML and the design agree.
 */
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";
import { textDirectionOf } from "../utils/create-component";

type Layer = Partial<UnlayerConfig> | false | null | undefined;

/** Config layers merged key by key over DEFAULT_CONFIG, each over the ones before it. */
export function layerConfig(...layers: Layer[]): UnlayerConfig {
  const out: Record<string, unknown> = {};
  for (const layer of [DEFAULT_CONFIG, ...layers]) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) if (value !== undefined) out[key] = value;
  }
  return out as unknown as UnlayerConfig;
}

/** The props of a root (Body, Email, Page, Document) its config reads. */
export interface RootConfigProps {
  config?: Partial<UnlayerConfig>;
  textDirection?: unknown;
  /** Its `values` escape hatch, which can hold its `textDirection`. */
  values?: unknown;
}

/**
 * A root's config: the render function's `options` over its `config` prop, over its `textDirection` prop (or
 * `values.textDirection`), over `provided` (the nearest <UnlayerProvider>'s), over DEFAULT_CONFIG.
 */
export function rootConfig(props: RootConfigProps | null | undefined, provided?: Partial<UnlayerConfig>, options?: Partial<UnlayerConfig>): UnlayerConfig {
  const direction = textDirectionOf(props?.textDirection ?? (props?.values as { textDirection?: unknown } | undefined)?.textDirection);
  return layerConfig(provided, direction && { textDirection: direction }, props?.config, options);
}
