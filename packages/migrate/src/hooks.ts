/**
 * Module resolution for the migration, registered with `module.register`
 * before anything else loads.
 *
 * React and React DOM come from the project being migrated (the folder of the
 * templates given) for every module, so templates and the converter share one
 * copy (a template's elements only render with the React that created them).
 * React Email and Elements come from the importing module's own location, as
 * where the template runs (an app in a monorepo has its own), and the
 * converter's from the project. A module that imports one its location doesn't
 * have, like @unlayer/react-elements before it's installed, gets the project's,
 * else this package's copy. Everything else resolves as usual.
 */

import { resolutionOrder } from "./resolution";

interface Data {
  /** A URL inside the project (the templates' folder), to resolve from. */
  project: string;
  /** A URL inside this package. */
  self: string;
}

type Context = { parentURL?: string; conditions?: string[] };
type Resolve = (specifier: string, context: Context) => Promise<{ url: string }>;

let data: Data | undefined;
/** This package's own code (the converter): its folder's URL. */
let cli: string | undefined;

export async function initialize(value: Data): Promise<void> {
  data = value;
  cli = new URL(".", value.self).href;
}

export async function resolve(specifier: string, context: Context, nextResolve: Resolve): Promise<{ url: string }> {
  const importer = context.parentURL;
  const order = data && resolutionOrder(specifier, !!importer && !!cli && importer.startsWith(cli));
  if (!data || !order) return nextResolve(specifier, context);
  const parents = { project: data.project, importer, self: data.self };
  let failure: unknown;
  for (const origin of order) {
    // nextResolve merges the context it's given into the shared one: keep the
    // importer and hand each attempt its own copy.
    try {
      return await nextResolve(specifier, { ...context, parentURL: parents[origin] });
    } catch (error) {
      failure ??= error;
    }
  }
  throw failure;
}
