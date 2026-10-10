#!/usr/bin/env node
/**
 * The `unlayer-migrate` command. Module resolution is set up first (see
 * hooks.ts), then the CLI loads.
 */

import { statSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "./args";

/**
 * The folder of the first template given (of the original, for compare): the
 * converter's React, React Email and Elements come from there, as the
 * templates' own do. Run from a monorepo's root, an app's templates use the app's.
 */
function templatesFolder(argv: string[], cwd: string): string {
  try {
    const { positional } = parseArgs(argv);
    const first = positional[0] === "compare" ? positional[1] : positional[0];
    if (first === undefined) return cwd;
    const path = resolve(cwd, first);
    return statSync(path, { throwIfNoEntry: false })?.isDirectory() ? path : dirname(path);
  } catch {
    return cwd; // a usage error: the CLI says what's wrong
  }
}

const argv = process.argv.slice(2);
const project = templatesFolder(argv, process.cwd());
register("./hooks.js", import.meta.url, {
  data: { project: pathToFileURL(join(project, "noop.js")).href, self: import.meta.url },
});

const { main } = await import("./cli.js");
// Checking a template runs its code. One that calls process.exit would end the
// run with its code (a failed check reported as passing): it throws instead, and
// that template fails. The run exits when its output is written, so a timer a
// template starts can't keep it open.
const exit = process.exit;
process.exit = ((code?: number | string | null) => {
  throw new Error(`a template called process.exit(${code ?? ""})`);
}) as typeof process.exit;
// What a template's code throws later (from a timer, or a promise it doesn't
// wait for) is outside any check: the run still finishes and reports, then fails.
const thrown = new Set<string>();
const late = (error: unknown) => void thrown.add((error instanceof Error ? error.message : String(error)).split("\n")[0]);
process.on("uncaughtException", late);
process.on("unhandledRejection", late);
let code: number;
try {
  code = await main(argv, {
    cwd: process.cwd(),
    project,
    stdout: (text) => void process.stdout.write(text),
    stderr: (text) => void process.stderr.write(text),
  });
} catch (error) {
  // Not a template's failure (those are reported per file): the run itself
  // couldn't go on. It must not end as a pass that checked nothing.
  process.stderr.write(`✗ the run stopped: ${error instanceof Error ? error.message : String(error)}\n`);
  code = 2;
}
for (const text of thrown) process.stderr.write(`✗ a template's code threw outside a render: ${text}\n`);
if (thrown.size) code = 2;
process.stdout.write("", () => process.stderr.write("", () => exit(code)));
