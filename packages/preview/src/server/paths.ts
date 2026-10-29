import path from "node:path";

/** A path as the user would type it: relative to `cwd` when it's inside, absolute otherwise. */
export function shown(file: string, cwd = process.cwd()): string {
  const relative = path.relative(cwd, file);
  return relative === "" ? "." : relative.startsWith("..") || path.isAbsolute(relative) ? file : relative;
}
