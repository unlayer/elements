#!/usr/bin/env node
/**
 * The `unlayer-migrate` command. It checks the Node.js version before anything
 * else loads, in code any version runs (no imports, no newer syntax or APIs):
 * the CLI needs module hooks and array methods older versions lack, which
 * would otherwise fail every template with a cryptic error. Then start.ts runs.
 * Only `--version` comes first: it says which version this is on any Node.js.
 */

var minimum = [20, 6];
var version = String(process.versions.node);
var parts = version.split(".").map(Number);
var asked = process.argv.slice(2);
if (asked.length === 1 && (asked[0] === "--version" || asked[0] === "-v")) {
  // Which version this is, on any Node.js: read from its package.json (an import of node:fs only, which any runs).
  import("node:fs").then(function (fs) {
    process.stdout.write(JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version + "\n");
  });
} else if (parts[0] < minimum[0] || (parts[0] === minimum[0] && parts[1] < minimum[1])) {
  process.stderr.write("@unlayer/migrate needs Node.js " + minimum.join(".") + " or later (you have " + version + ").\n");
  process.exitCode = 1;
} else {
  import("./start.js");
}
