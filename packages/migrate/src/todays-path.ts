/**
 * Where migrate's copy of Elements 0.2's components is (todays.ts): `dist/todays.js` next to the running CLI, or, run
 * from its sources in this repository, the react package's internal build it's made from.
 */
import { existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The specifier templates and the converter import today's components with. No package exports it: it's mapped. */
export const TODAYS = "@unlayer/react-elements/legacy";

/** The file it maps to, its real path, so that every importer gets one module. */
export function todaysPath(): string {
  for (const relative of ["./todays.js", "../../react/dist/index.js"]) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(path)) return realpathSync(path);
  }
  throw new Error(`@unlayer/migrate: its copy of today's components (dist/todays.js) is missing: build it (pnpm --filter @unlayer/migrate build)`);
}
