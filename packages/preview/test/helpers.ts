import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE = fileURLToPath(new URL("./fixtures/basic/", import.meta.url));
const TMP = fileURLToPath(new URL("./.tmp/", import.meta.url));

/**
 * A copy of the fixture project the test can change. It's inside this package,
 * so its imports of React and Elements resolve to this package's dependencies.
 */
export async function fixtureCopy(name: string): Promise<{ root: string; emails: string; cleanup(): Promise<void> }> {
  const root = path.join(TMP, `${name}-${process.pid}-${Date.now()}`);
  await mkdir(TMP, { recursive: true });
  await cp(FIXTURE, root, { recursive: true });
  return { root, emails: path.join(root, "emails"), cleanup: () => rm(root, { recursive: true, force: true }) };
}
