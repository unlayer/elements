/**
 * Module resolution for the migration, registered with `module.register`
 * before anything else loads.
 *
 * The converter's own imports of React, React DOM, React Email and Unlayer
 * Elements go to the project being migrated when it has them, so templates
 * and the converter share one copy of each (a template's elements only
 * render with the React that created them). Everything else resolves as
 * usual; a template (or a migrated one) that imports something the project
 * doesn't have, like @unlayer/react-elements before it's installed, falls
 * back to this package's copy.
 */

interface Data {
  /** A URL inside the project (its folder), to resolve from. */
  project: string;
  /** A URL inside this package. */
  self: string;
}

type Context = { parentURL?: string; conditions?: string[] };
type Resolve = (specifier: string, context: Context) => Promise<{ url: string }>;

const SHARED = /^(react|react-dom|@react-email\/[^/]+|react-email|@unlayer\/react-elements)(\/.*)?$/;

let data: Data | undefined;
let packageRoot = "";

export async function initialize(value: Data): Promise<void> {
  data = value;
  packageRoot = new URL("..", value.self).href;
}

export async function resolve(specifier: string, context: Context, nextResolve: Resolve): Promise<{ url: string }> {
  if (!data || !SHARED.test(specifier)) return nextResolve(specifier, context);
  // nextResolve merges the context it's given into the shared one: keep the
  // importer and hand each attempt its own copy.
  const importer = context.parentURL;
  const fromConverter = importer?.startsWith(packageRoot) && !importer.includes("/node_modules/");
  const parents = fromConverter ? [data.project, importer] : [importer, data.project, data.self];
  const attempts: Context[] = parents.map((parentURL) => ({ ...context, parentURL }));
  let failure: unknown;
  for (const attempt of attempts) {
    try {
      return await nextResolve(specifier, attempt);
    } catch (error) {
      failure ??= error;
    }
  }
  throw failure;
}
