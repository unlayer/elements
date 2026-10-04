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
process.exitCode = await main(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (text) => void process.stdout.write(text),
  stderr: (text) => void process.stderr.write(text),
});
