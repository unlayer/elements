/**
 * The browser `screenshot` drives: one already installed (Chrome, Chromium,
 * Edge or Brave), never a download. `--browser` or `CHROME_PATH` picks one;
 * otherwise the usual install locations are searched, per operating system.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { UsageError } from "./errors.js";

export interface BrowserCandidate {
  name: string;
  path: string;
}

export interface FoundBrowser extends BrowserCandidate {
  /** Where it came from. */
  from: "--browser" | "CHROME_PATH" | "detected";
}

export interface BrowserLookup {
  platform?: NodeJS.Platform;
  env?: Record<string, string | undefined>;
  /** Whether a file exists (tests pass their own). */
  exists?: (file: string) => boolean;
}

const LINUX_COMMANDS: BrowserCandidate[] = [
  { name: "Chrome", path: "google-chrome-stable" },
  { name: "Chrome", path: "google-chrome" },
  { name: "Chromium", path: "chromium" },
  { name: "Chromium", path: "chromium-browser" },
  { name: "Edge", path: "microsoft-edge-stable" },
  { name: "Edge", path: "microsoft-edge" },
  { name: "Brave", path: "brave-browser" },
  { name: "Brave", path: "brave" },
];

/** Where each browser is usually installed, most likely first. */
export function browserCandidates(platform: NodeJS.Platform, env: Record<string, string | undefined>): BrowserCandidate[] {
  if (platform === "darwin") {
    const apps: Array<[string, string]> = [
      ["Chrome", "Google Chrome.app/Contents/MacOS/Google Chrome"],
      ["Chromium", "Chromium.app/Contents/MacOS/Chromium"],
      ["Edge", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
      ["Brave", "Brave Browser.app/Contents/MacOS/Brave Browser"],
    ];
    const folders = ["/Applications", ...(env.HOME ? [path.posix.join(env.HOME, "Applications")] : [])];
    return apps.flatMap(([name, app]) => folders.map((folder) => ({ name, path: path.posix.join(folder, app) })));
  }
  if (platform === "win32") {
    const programFiles = env.PROGRAMFILES ?? env.ProgramFiles ?? "C:\\Program Files";
    const programFilesX86 = env["PROGRAMFILES(X86)"] ?? env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
    const local = env.LOCALAPPDATA;
    const under = (name: string, relative: string, roots: Array<string | undefined>) =>
      roots.filter((root): root is string => Boolean(root)).map((root) => ({ name, path: path.win32.join(root, relative) }));
    return [
      ...under("Chrome", "Google\\Chrome\\Application\\chrome.exe", [programFiles, programFilesX86, local]),
      ...under("Chromium", "Chromium\\Application\\chrome.exe", [local, programFiles]),
      ...under("Edge", "Microsoft\\Edge\\Application\\msedge.exe", [programFilesX86, programFiles]),
      ...under("Brave", "BraveSoftware\\Brave-Browser\\Application\\brave.exe", [programFiles, programFilesX86, local]),
    ];
  }
  // Linux and the other Unixes: the commands on PATH, then the usual places outside it.
  const dirs = (env.PATH ?? "").split(":").filter(Boolean);
  const onPath = LINUX_COMMANDS.flatMap(({ name, path: command }) => dirs.map((dir) => ({ name, path: path.posix.join(dir, command) })));
  return [...onPath, { name: "Chrome", path: "/opt/google/chrome/chrome" }, { name: "Chromium", path: "/snap/bin/chromium" }, { name: "Edge", path: "/opt/microsoft/msedge/msedge" }, { name: "Brave", path: "/opt/brave.com/brave/brave" }];
}

function notFound(): UsageError {
  const command = process.env.ELEMENTS_PREVIEW_COMMAND || "elements-preview";
  return new UsageError(
    [
      "Screenshots need Chrome, Chromium, Edge or Brave, and none was found. Install one (https://www.google.com/chrome/), or point to the one you have:",
      "",
      `  ${command} screenshot <template> --browser "/path/to/chrome"`,
      `  CHROME_PATH="/path/to/chrome" ${command} screenshot <template>`,
    ].join("\n")
  );
}

/** The browser to use: `explicit` (--browser), then CHROME_PATH, then the first one installed. Throws a UsageError saying how to get one. */
export function findBrowser(explicit: string | undefined, lookup: BrowserLookup = {}): FoundBrowser {
  const platform = lookup.platform ?? process.platform;
  const env = lookup.env ?? process.env;
  const exists = lookup.exists ?? existsSync;
  const given: Array<[string | undefined, FoundBrowser["from"]]> = [
    [explicit, "--browser"],
    [env.CHROME_PATH, "CHROME_PATH"],
  ];
  for (const [value, from] of given) {
    if (!value?.trim()) continue;
    const wanted = value.trim();
    // A macOS app bundle (/Applications/Chromium.app): its executable.
    const bundle = platform === "darwin" && /\.app\/?$/.test(wanted) ? path.posix.join(wanted, "Contents", "MacOS", path.posix.basename(wanted.replace(/\/$/, ""), ".app")) : undefined;
    // A command name (chromium): from PATH.
    const join = platform === "win32" ? path.win32.join : path.posix.join;
    const onPath = /[\\/]/.test(wanted) ? [] : (env.PATH ?? "").split(platform === "win32" ? ";" : ":").filter(Boolean).map((dir) => join(dir, wanted));
    const found = (bundle ? [bundle] : [wanted, ...onPath]).find((file) => exists(file));
    if (found) return { name: (platform === "win32" ? path.win32 : path.posix).basename(found), path: found, from };
    throw new UsageError(`There's no browser at ${wanted} (from ${from}). Give the path to Chrome, Chromium, Edge or Brave's executable.`);
  }
  const detected = browserCandidates(platform, env).find((candidate) => exists(candidate.path));
  if (!detected) throw notFound();
  return { ...detected, from: "detected" };
}
