/**
 * Shapes the Beefree converter works with: Beefree's classic ("full") template JSON as it reads it, the Unlayer
 * design it writes, and what it reports.
 *
 * There's no published schema for Beefree's full JSON: the closest is the TypeScript types in Beefree's npm package
 * (`src/types/bee.ts` in beefree-sdk-npm-official). These types are what real templates were seen to hold, kept loose
 * (`Record<string, any>`) where templates vary.
 */

/** The template versions this converter reads (`page.template.version`). */
export const BEEFREE_VERSIONS = ["0.0.1", "2.0.0"] as const;
export type BeefreeVersion = (typeof BEEFREE_VERSIONS)[number];

/** A kebab-case CSS style object (`{ "padding-top": "10px" }`), as Beefree stores styles. */
export type BeefreeStyle = Record<string, string | undefined>;

export interface BeefreeWebFont {
  /** The font stack (`"'Montserrat', 'Trebuchet MS', sans-serif"`). */
  fontFamily?: string;
  /** The family (`"Montserrat"`). */
  name?: string;
  /** The stylesheet that loads it (Google Fonts). */
  url?: string;
}

export interface BeefreeBody {
  /** `mailup-bee-page-properties`; `mailup-bee-page-proprerties` (sic) in 0.0.1 templates. */
  type?: string;
  container?: { style?: BeefreeStyle };
  content?: { style?: BeefreeStyle; computedStyle?: Record<string, any> };
  webFonts?: BeefreeWebFont[];
}

export interface BeefreeModule {
  /** `mailup-bee-newsletter-modules-<kind>`. */
  type?: string;
  uuid?: string;
  locked?: boolean;
  descriptor?: Record<string, any>;
  [key: string]: unknown;
}

export interface BeefreeColumn {
  /** Its share of a 12-column grid. */
  "grid-columns"?: number;
  style?: BeefreeStyle;
  mobileStyle?: BeefreeStyle;
  modules?: BeefreeModule[];
  uuid?: string;
}

export interface BeefreeRow {
  /** A layout label (`one-column-empty`, `row-2-columns-6-6`, …): not authoritative, the columns are. */
  type?: string;
  uuid?: string;
  locked?: boolean;
  synced?: boolean;
  empty?: boolean;
  name?: string;
  container?: { style?: BeefreeStyle; displayCondition?: Record<string, any> | null };
  content?: { style?: BeefreeStyle; computedStyle?: Record<string, any>; mobileStyle?: BeefreeStyle };
  columns?: BeefreeColumn[];
}

export interface BeefreePage {
  title?: string;
  description?: string;
  template?: { name?: string; type?: string; version?: unknown };
  head?: { meta?: Record<string, string | undefined> };
  body?: BeefreeBody;
  rows?: BeefreeRow[];
}

/** A design value object, as the editor stores it. */
export type Values = Record<string, unknown>;

export interface DesignContent {
  type: string;
  values: Values;
}

export interface DesignColumn {
  contents: DesignContent[];
  values: Values;
}

export interface DesignRow {
  cells: number[];
  columns: DesignColumn[];
  values: Values;
}

/** An Unlayer design: what the editor's `loadDesign()` opens and `renderToJson()` gives. */
export interface Design {
  counters: Record<string, number>;
  body: { rows: DesignRow[]; values: Values };
  schemaVersion: number;
}

/**
 * Something that didn't convert as it is. `reason` is stable (group by it); `message` is the sentence to show, which
 * starts with where it is (`Row 2, column 1, module 3 (image): …`).
 */
export interface BeefreeWarning {
  reason: string;
  /** `Row 2, column 1, module 3 (image)`, `Row 4`, `The body`; absent for the template as a whole. */
  where?: string;
  message: string;
}

/** A module kept as an HTML block: it renders as it did, but the editor opens it as HTML, not as the block it was. */
export interface BeefreeFallback {
  where: string;
  /** The Beefree module type (`icons`, `form`, `merge-content`, …). */
  module: string;
  reason: string;
}

export interface BeefreeToDesignResult {
  /** The Unlayer design, in the shape `renderToJson()` writes: `designToElements()` turns it into Elements code. */
  design: Design;
  warnings: BeefreeWarning[];
  /** Modules kept as HTML blocks (`fallbacks.length` of them). Beefree's own `html` modules aren't counted. */
  fallbacks: BeefreeFallback[];
  /** The template's `page.template.version`. */
  version: BeefreeVersion;
}

/** Input that isn't a Beefree template this converter reads (not JSON, another format, an unknown version). */
export class BeefreeFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BeefreeFormatError";
  }
}
