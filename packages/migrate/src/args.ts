/**
 * The command's arguments. Read by the CLI, and by bin.ts first, to know
 * where the templates are before anything else loads.
 */

export interface Args {
  positional: string[];
  option(name: string): string | undefined;
  flag(name: string): boolean;
}

const VALUE_OPTIONS = new Set(["out", "report", "from"]);
const FLAGS = new Set(["write", "design", "no-merge-tags", "force", "help"]);
const ALIASES: Record<string, string> = { h: "help", o: "out" };

export function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("-") || arg === "-") {
      positional.push(arg);
      continue;
    }
    const [rawName, inline] = arg.replace(/^--?/, "").split(/=(.*)/s, 2);
    const name = ALIASES[rawName] ?? rawName;
    if (VALUE_OPTIONS.has(name)) {
      const value = inline ?? argv[++i];
      if (value === undefined) throw new Error(`--${name} needs a value.`);
      // `--report --write`: the next flag isn't the value.
      if (inline === undefined && /^--?[a-z]/i.test(value)) throw new Error(`--${name} needs a value before ${value}.`);
      if (!value.trim()) throw new Error(`--${name} needs a non-empty value.`);
      values.set(name, value);
    } else if (FLAGS.has(name)) {
      // `--write=false` must not write: flags take no value.
      if (inline !== undefined) throw new Error(`--${name} takes no value.`);
      flags.add(name);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return { positional, option: (name) => values.get(name), flag: (name) => flags.has(name) };
}
