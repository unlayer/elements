/**
 * The folder a build is written to. Each build leaves a marker,
 * `.elements-preview-build.json`, listing the files it wrote. The next build
 * removes those files before it writes its own, so a deleted template's data
 * and the previous app's assets don't stay behind, and it leaves every other
 * file in the folder (a host's `_headers`, a `CNAME`). A build only writes
 * into a folder that's new, empty, or has the marker; it refuses one with
 * other files, rather than mixing into it.
 */

import { existsSync, statSync } from "node:fs";
import { lstat, readdir, readFile, rename, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UsageError } from "./errors.js";
import { inside } from "./http.js";
import { shown } from "./paths.js";

export const BUILD_MARKER = ".elements-preview-build.json";
const MARKER_VERSION = 1;
/** Where the marker is written first, so it's never left half-written. */
const MARKER_DRAFT = `${BUILD_MARKER}.tmp`;
/** Files that don't make a folder someone's: Finder's, and a marker an interrupted build left half-written. */
const SYSTEM_FILES = new Set([".DS_Store", MARKER_DRAFT]);

/** Every file in `dir` and its folders, relative to it with `/` separators. */
export async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => !entry.isDirectory()).map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"));
}

/**
 * The files the previous build in `outDir` wrote: none when the folder is new
 * or empty. A UsageError, before anything is removed, when the folder has
 * other files and no marker, or a marker this version can't read.
 */
export async function previousBuild(outDir: string): Promise<string[]> {
  if (!existsSync(outDir)) return [];
  if (!statSync(outDir).isDirectory()) throw new UsageError(`${shown(outDir)} is a file. Build to a folder: --outDir .elements-preview`);
  if (!existsSync(path.join(outDir, BUILD_MARKER))) {
    const own = (await readdir(outDir)).filter((name) => !SYSTEM_FILES.has(name));
    if (!own.length) return [];
    throw new UsageError(
      `${shown(outDir)} has files that aren't a preview build (or are a build from an earlier version of the preview), so the build won't write into it. Build to a new or empty folder (--outDir <folder>), or delete this one.`
    );
  }
  let files: unknown;
  try {
    const marker = JSON.parse(await readFile(path.join(outDir, BUILD_MARKER), "utf8"));
    if (marker?.version === MARKER_VERSION) files = marker.files;
  } catch {
    files = undefined;
  }
  if (!Array.isArray(files) || !files.every((file) => typeof file === "string" && inside(outDir, file))) {
    throw new UsageError(
      `${shown(outDir)} has a preview build marker (${BUILD_MARKER}) this version of the preview can't read, so the build won't remove anything in it. Build to a new or empty folder (--outDir <folder>), or delete this one.`
    );
  }
  return files;
}

/** Removes the previous build's `files` from `outDir` (each file or link itself, never a folder), then the folders they leave empty. */
export async function removeBuild(outDir: string, files: string[]): Promise<void> {
  const folders = new Set<string>();
  for (const relative of files) {
    const file = inside(outDir, relative);
    if (!file || file === path.join(outDir, BUILD_MARKER)) continue;
    const stat = await lstat(file).catch(() => undefined);
    if (!stat || stat.isDirectory()) continue;
    await rm(file, { force: true });
    for (let folder = path.dirname(file); folder.startsWith(outDir + path.sep); folder = path.dirname(folder)) folders.add(folder);
  }
  // Deepest first; a folder that still has files (someone else's) stays.
  for (const folder of [...folders].sort((a, b) => b.length - a.length)) await rmdir(folder).catch(() => undefined);
}

/** Writes the marker listing `files`, the build's. */
export async function writeBuildMarker(outDir: string, files: Iterable<string>): Promise<void> {
  const draft = path.join(outDir, MARKER_DRAFT);
  await writeFile(draft, `${JSON.stringify({ version: MARKER_VERSION, files: [...new Set(files)].sort() }, null, 2)}\n`);
  await rename(draft, path.join(outDir, BUILD_MARKER));
}
