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
const code = await main(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (text) => void process.stdout.write(text),
  stderr: (text) => void process.stderr.write(text),
});
process.stdout.write("", () => process.stderr.write("", () => exit(code)));
