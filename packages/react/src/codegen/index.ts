/**
 * @unlayer/react-elements/codegen: an Unlayer design (the JSON the editor saves) as Elements code. Its own entry,
 * so the main one doesn't carry it; pure (no React rendering, no Node APIs), so it runs in a browser too.
 */
export { designToElements, type DesignToElementsOptions, type DesignToElementsResult, type DisplayMode } from "./design-to-elements";
export { formatElements } from "./format";
