/**
 * Reading a Beefree template: its JSON text (a UTF-8 BOM, which `JSON.parse` rejects, is dropped), the wrapper it
 * comes in, and its version. Anything else (another Beefree format, an unknown version, a template missing its body or
 * rows) fails loudly with what it is, instead of being read as well as possible.
 */
import { BEEFREE_VERSIONS, BeefreeFormatError, type BeefreePage, type BeefreeVersion } from "./types";

export interface ReadTemplate {
  page: BeefreePage;
  version: BeefreeVersion;
  /** How the page was wrapped: `page`, `json_data.page` (the Template Catalog API) or `data.json.page`. */
  wrapper: "page" | "json_data.page" | "data.json.page";
}

/** The body types each version writes (0.0.1 misspells it; some 2.0.0 templates leave it out). */
const BODY_TYPES: Record<BeefreeVersion, ReadonlyArray<string | undefined>> = {
  "0.0.1": ["mailup-bee-page-proprerties", "mailup-bee-page-properties"],
  "2.0.0": ["mailup-bee-page-properties", undefined, "mailup-bee-newsletter-layout-fixed-width"],
};

const isObject = (value: unknown): value is Record<string, any> => typeof value === "object" && value !== null && !Array.isArray(value);

/** JSON text, without a leading BOM. Bytes are read as UTF-8. */
function parseJson(input: string | Uint8Array): unknown {
  const text = typeof input === "string" ? input : new TextDecoder("utf-8", { fatal: true }).decode(input);
  try {
    return JSON.parse(text.replace(/^﻿/, ""));
  } catch (cause) {
    throw new BeefreeFormatError(`Not a Beefree template: the file isn't valid JSON (${(cause as Error).message}).`);
  }
}

/** A JSON value that may itself be JSON text (the Template Catalog API returns `json_data` as either). */
function nested(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value.replace(/^﻿/, ""));
  } catch {
    return value;
  }
}

/** The page and how it was wrapped, or why the value isn't a full Beefree template. */
function unwrap(value: unknown): { page: unknown; wrapper: ReadTemplate["wrapper"] } {
  if (Array.isArray(value)) {
    throw new BeefreeFormatError("Not a Beefree template: it's a list (a rows collection, such as a custom rows file), not a template with a `page`.");
  }
  if (!isObject(value)) throw new BeefreeFormatError("Not a Beefree template: expected a JSON object with a `page`.");
  if ("page" in value) return { page: value.page, wrapper: "page" };
  const catalog = nested(value.json_data);
  if (isObject(catalog) && "page" in catalog) return { page: catalog.page, wrapper: "json_data.page" };
  const data = isObject(value.data) ? nested(value.data.json) : undefined;
  if (isObject(data) && "page" in data) return { page: data.page, wrapper: "data.json.page" };
  if (isObject(value.template) && (Array.isArray(value.template.rows) || typeof value.template.type === "string")) {
    throw new BeefreeFormatError(
      "Not a full Beefree template: it's Beefree's Simple Schema (`template.rows`). Convert it to full JSON first (Beefree's Content Services API, `/v1/conversion/simple-to-full-json`), or open and save it in Beefree."
    );
  }
  if (Array.isArray(value.columns)) throw new BeefreeFormatError("Not a Beefree template: it's a single row (`columns`), not a template with a `page`.");
  if ("layout" in value && "theme" in value) throw new BeefreeFormatError("Not a Beefree template: it's a popup's layout configuration, not its template.");
  throw new BeefreeFormatError("Not a Beefree template: no `page` (at the top, in `json_data` or in `data.json`).");
}

/**
 * The template's page and version. Throws a BeefreeFormatError for anything that isn't a full Beefree template of a
 * version this converter reads.
 */
export function readBeefree(input: string | Uint8Array | object): ReadTemplate {
  const value = typeof input === "string" || input instanceof Uint8Array ? parseJson(input) : input;
  const { page, wrapper } = unwrap(value);
  if (!isObject(page)) throw new BeefreeFormatError("Not a Beefree template: its `page` isn't an object.");

  const version = isObject(page.template) ? page.template.version : undefined;
  if (version === undefined) throw new BeefreeFormatError("Unknown Beefree template version: the template has no `page.template.version` (0.0.1 and 2.0.0 are supported).");
  if (!(BEEFREE_VERSIONS as readonly unknown[]).includes(version)) {
    throw new BeefreeFormatError(`Unknown Beefree template version ${JSON.stringify(version)}: only ${BEEFREE_VERSIONS.join(" and ")} are supported. Open and save it in Beefree, or report it with the file.`);
  }
  if (!isObject(page.body)) throw new BeefreeFormatError(`Not a Beefree ${version} template: \`page.body\` is missing.`);
  if (!Array.isArray(page.rows)) throw new BeefreeFormatError(`Not a Beefree ${version} template: \`page.rows\` is missing.`);
  return { page: page as BeefreePage, version: version as BeefreeVersion, wrapper };
}

/** Whether the body's type is one its version writes (anything else is reported, and read as the version's). */
export function knownBodyType(version: BeefreeVersion, type: unknown): boolean {
  return BODY_TYPES[version].includes(type as string | undefined);
}
