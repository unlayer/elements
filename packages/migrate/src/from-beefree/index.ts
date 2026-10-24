/**
 * Beefree → Unlayer: a Beefree template (classic "full" JSON, versions 0.0.1 and 2.0.0) as an Unlayer design, which
 * `designToElements()` (`@unlayer/react-elements/codegen`) writes as Elements code.
 */
export { beefreeToDesign } from "./convert";
export { readBeefree } from "./read";
export { SCHEMA_VERSION } from "./design";
export {
  BEEFREE_VERSIONS,
  BeefreeFormatError,
  type BeefreeFallback,
  type BeefreePage,
  type BeefreeToDesignResult,
  type BeefreeVersion,
  type BeefreeWarning,
  type Design,
  type DesignColumn,
  type DesignContent,
  type DesignRow,
} from "./types";
