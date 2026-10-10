#!/usr/bin/env node
/**
 * The `unlayer-migrate` command. Module resolution is set up first (see
 * hooks.ts), then the CLI loads.
 */

import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

register("./hooks.js", import.meta.url, {
  data: { project: pathToFileURL(join(process.cwd(), "noop.js")).href, self: import.meta.url },
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
let code = await main(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (text) => void process.stdout.write(text),
  stderr: (text) => void process.stderr.write(text),
});
for (const text of thrown) process.stderr.write(`✗ a template's code threw outside a render: ${text}\n`);
if (thrown.size) code = 2;
process.stdout.write("", () => process.stderr.write("", () => exit(code)));
