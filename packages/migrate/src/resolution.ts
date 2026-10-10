/**
 * Where the packages that templates and the converter share come from. The
 * module hooks (hooks.ts) and CommonJS requires (cli.ts) follow the same order,
 * and the run checks it before loading anything (cli.ts).
 */

/** React and React DOM: the project's copy for every module, as one copy only shares hooks and context. */
const ONE_COPY = /^(react|react-dom)(\/.*)?$/;
/** React Email and Elements: a module's own copy first, as it loads them where it runs. */
const OWN_COPY = /^(@react-email\/[^/]+|react-email|@unlayer\/react-elements)(\/.*)?$/;

/** The project (the templates' folder), the importing module, or this CLI's own copy. */
export type Origin = "project" | "importer" | "self";

/**
 * Where to resolve `specifier` from, in order, or undefined when it resolves as
 * usual. The converter (`fromCli`) renders with the project's copies.
 */
export function resolutionOrder(specifier: string, fromCli: boolean): Origin[] | undefined {
  if (ONE_COPY.test(specifier) || (fromCli && OWN_COPY.test(specifier))) return ["project", "importer", "self"];
  if (OWN_COPY.test(specifier)) return ["importer", "project", "self"];
  return undefined;
}
