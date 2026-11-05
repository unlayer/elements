/**
 * `--from elements`: templates written with Elements 0.2's components ("today's": @unlayer/react-elements before
 * 0.3.0) rewritten with the new ones (its main entry from 0.3.0), by the codemod. Nothing is written unless asked: one
 * template is printed, several are listed with what the codemod reported; --write replaces them, only where git can
 * give them back.
 */
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import type { Args } from "../args";
import { migrateElements } from "../convert";
import { todaysImports } from "./imports";

export interface LegacyIo {
  cwd: string;
  stdout(text: string): void;
  stderr(text: string): void;
}

/** What the command borrows from the CLI: its folder walk, its check of what git can restore, and its module resolution. */
export interface LegacyHelpers {
  walk(dir: string): Promise<string[]>;
  notRestorable(files: string[]): Promise<Array<{ file: string; why: string }>>;
  /** Where an import leads among the project's files, as the project's tsconfig (or Node) resolves it from a file. */
  resolver(file: string): Promise<(specifier: string, fromFile: string) => string | undefined>;
}

export async function migrateLegacy(paths: string[], args: Args, io: LegacyIo, helpers: LegacyHelpers): Promise<number> {
  for (const option of ["out", "design", "no-merge-tags", "strict", "force", "overwrite"]) {
    if (args.option(option) !== undefined || args.flag(option)) {
      io.stderr(`--${option} isn't for --from elements: it prints a template, or replaces templates with --write.\n`);
      return 1;
    }
  }
  const files: string[] = [];
  for (const given of paths) {
    const path = resolve(io.cwd, given);
    const info = await stat(path).catch(() => undefined);
    if (!info) {
      io.stderr(`${given}: no such file or folder.\n`);
      return 1;
    }
    files.push(...(info.isDirectory() ? await helpers.walk(path) : [path]));
  }
  const name = (file: string) => relative(io.cwd, file);
  // One resolution per folder: the project's tsconfig is the folder's.
  const resolvers = new Map<string, ReturnType<LegacyHelpers["resolver"]>>();
  const find = todaysImports(async (specifier, fromFile) => {
    const dir = dirname(fromFile);
    if (!resolvers.has(dir)) resolvers.set(dir, helpers.resolver(fromFile));
    return (await resolvers.get(dir)!)(specifier, fromFile);
  });
  const results: Array<{ file: string; code?: string; report: string[]; error?: string; stayed?: boolean; current?: boolean }> = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    try {
      // Templates are the modules that import today's components (by their imports, not a mention in a comment), from
      // today's package or through the project's modules that pass them on; a namespace of them passed on isn't followed.
      const found = await find(file, source);
      if (!found) continue;
      if (found.namespaces.length) {
        const how = found.namespaces.map((n) => `as ${n.name} from ${n.specifier} (${name(n.file)})`).join(", ");
        results.push({ file, report: [], error: `it imports today's components ${how}, a namespace of them, which the codemod doesn't follow: import them by name` });
        continue;
      }
      const { code, report, stayed, current } = await migrateElements(source, { typescript: !/\.[cm]?jsx?$/.test(file), through: found.through });
      // A module with none of today's JSX in it (a name passed on, today's other API) comes back as it was, not listed;
      // one already on the new components is listed as it is.
      if (code !== source || stayed || current) results.push({ file, code, report, stayed, current });
    } catch (error) {
      results.push({ file, report: [], error: (error as Error).message });
    }
  }
  if (!results.length) {
    io.stderr("No templates importing @unlayer/react-elements's components were found.\n");
    return 1;
  }
  const failed = results.filter((r) => r.error);
  for (const r of failed) io.stderr(`${name(r.file)}: couldn't be migrated: ${r.error}\n`);
  const current = results.filter((r) => r.current);
  const migrated = results.filter((r) => !r.error && !r.current);

  // One template, not written: the migrated template itself, on stdout (what the codemod reported, on stderr).
  if (!args.flag("write") && paths.length === 1 && files.length === 1 && migrated.length === 1) {
    io.stdout(migrated[0].code!);
    for (const line of migrated[0].report) io.stderr(`${name(migrated[0].file)}: ${line}\n`);
    await writeReport(args, io, migrated);
    return failed.length ? 2 : 0;
  }
  if (args.flag("write")) {
    const unsafe = args.flag("allow-dirty") ? [] : await helpers.notRestorable(migrated.map((r) => r.file));
    if (unsafe.length) {
      io.stderr(
        `--write replaces templates in place, and git couldn't restore these:\n${unsafe.map((u) => `  ${name(u.file)} (${u.why})`).join("\n")}\n` +
          "Commit them first (then git can undo the migration), or pass --allow-dirty.\n"
      );
      return 1;
    }
    for (const r of migrated) await writeFile(r.file, r.code!);
  }
  for (const r of current) io.stdout(`${name(r.file)}: already uses the new components: left as it is\n`);
  for (const r of migrated) {
    io.stdout(`${name(r.file)}: ${r.stayed ? "stays as it was" : args.flag("write") ? "migrated" : "would be migrated"}${r.report.length ? `, with ${r.report.length} note${r.report.length === 1 ? "" : "s"}` : ""}\n`);
    for (const line of r.report) io.stdout(`  - ${line}\n`);
  }
  if (!args.flag("write")) io.stdout("Nothing was written: pass --write to replace them (or one template to print it).\n");
  await writeReport(args, io, migrated);
  return failed.length ? 2 : 0;
}

/** --report: what the codemod reported for each template, as JSON for a .json file, else Markdown. */
async function writeReport(args: Args, io: LegacyIo, results: Array<{ file: string; report: string[] }>) {
  const path = args.option("report");
  if (!path) return;
  const files = results.map((r) => ({ file: relative(io.cwd, r.file), notes: r.report }));
  const text = path.endsWith(".json")
    ? `${JSON.stringify({ from: "elements", files }, null, 2)}\n`
    : `# Migration to the new components\n\n${files.map((f) => `## ${f.file}\n\n${f.notes.length ? f.notes.map((n) => `- ${n}`).join("\n") : "Nothing to note."}\n`).join("\n")}`;
  await writeFile(resolve(io.cwd, path), text);
}
