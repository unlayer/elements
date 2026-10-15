#!/usr/bin/env node
/**
 * The `elements-preview` command. It checks the Node.js version first, in
 * code any version runs, because Vite fails with a cryptic import error on
 * older ones.
 */

var version = String(process.versions.node);
var parts = version.split(".").map(Number);
var supported = (parts[0] === 20 && parts[1] >= 19) || (parts[0] === 22 && parts[1] >= 12) || parts[0] > 22;
if (!supported) {
  process.stderr.write("@unlayer/elements-preview needs Node.js 20.19 or later, or 22.12 or later (you have " + version + ").\n");
  process.exitCode = 1;
} else {
  import("./cli.js").then(function (cli) {
    return cli.run(process.argv.slice(2));
  });
}
